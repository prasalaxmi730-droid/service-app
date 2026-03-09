import express from "express";
import { poolPromise } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  fetchServiceCallsFromSAP,
  pushServiceReportToSAP,
} from "../services/sapService.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const maxRetries = Number(process.env.SYNC_MAX_RETRIES || 3);

  const summary = {
    pulledFromSAP: 0,
    upsertedServiceCalls: 0,
    pushedReports: 0,
    reportPushFailed: 0,
    skippedReports: 0,
  };

  const sapCalls = await fetchServiceCallsFromSAP();
  summary.pulledFromSAP = sapCalls.length;
  
  const pool = await poolPromise;

  for (const call of sapCalls) {
    const sapCallId = call.sap_call_id || call.sapCallId || call.id;
    const customerName = call.customer_name || call.customerName || "Unknown Customer";

    if (!sapCallId) {
      continue;
    }

    const request = pool.request();
    request.input("sap_call_id", String(sapCallId));
    request.input("customer_name", customerName);
    request.input("location", call.location || null);
    request.input("problem_description", call.problem_description || call.problemDescription || null);
    request.input("status", call.status || "PENDING");
    request.input("assigned_technician", call.assigned_technician || call.assignedTechnician || null);
    request.input("priority", call.priority || "MEDIUM");
    request.input("scheduled_date", call.scheduled_date || call.scheduledDate || null);

    await request.query(`
      MERGE INTO service_calls WITH (HOLDLOCK) AS target
      USING (SELECT @sap_call_id AS sap_call_id) AS source
      ON target.sap_call_id = source.sap_call_id
      WHEN MATCHED THEN
        UPDATE SET
          customer_name = @customer_name,
          location = @location,
          problem_description = @problem_description,
          status = @status,
          assigned_technician = @assigned_technician,
          priority = @priority,
          scheduled_date = @scheduled_date,
          sync_status = 'SYNCED',
          last_synced_at = CURRENT_TIMESTAMP,
          sync_error = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHEN NOT MATCHED THEN
        INSERT (sap_call_id, customer_name, location, problem_description, status, assigned_technician, priority, scheduled_date, sync_status, last_synced_at, sync_attempts, sync_error)
        VALUES (@sap_call_id, @customer_name, @location, @problem_description, @status, @assigned_technician, @priority, @scheduled_date, 'SYNCED', CURRENT_TIMESTAMP, 0, NULL);
    `);

    summary.upsertedServiceCalls += 1;
  }

  const pendingReports = await pool.request()
    .input("maxRetries", maxRetries)
    .query(`
      SELECT sr.*, sc.sap_call_id
      FROM service_reports sr
      JOIN service_calls sc ON sc.id = sr.service_call_id
      WHERE sr.sync_status IN ('PENDING', 'FAILED')
        AND sr.sync_attempts < @maxRetries
      ORDER BY sr.id ASC
    `);

  for (const report of pendingReports.recordset) {
    try {
      const result = await pushServiceReportToSAP(report);

      if (result?.skipped) {
        summary.skippedReports += 1;
        continue;
      }

      await pool.request()
        .input("id", report.id)
        .query(`
          UPDATE service_reports
          SET sync_status = 'SYNCED',
              sync_attempts = sync_attempts + 1,
              last_synced_at = CURRENT_TIMESTAMP,
              sync_error = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = @id
        `);

      summary.pushedReports += 1;
    } catch (error) {
      await pool.request()
        .input("id", report.id)
        .input("error", error.message || "Failed to sync report")
        .query(`
          UPDATE service_reports
          SET sync_status = 'FAILED',
              sync_attempts = sync_attempts + 1,
              sync_error = @error,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = @id
        `);

      summary.reportPushFailed += 1;
    }
  }

  return res.json({
    message: "SAP sync completed",
    summary,
  });
});

export default router;
