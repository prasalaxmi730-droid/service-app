import express from "express";
import { pool } from "../config/db.js";
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

  for (const call of sapCalls) {
    const sapCallId = call.sap_call_id || call.sapCallId || call.id;
    const customerName = call.customer_name || call.customerName || "Unknown Customer";

    if (!sapCallId) {
      continue;
    }

    await pool.query(
      `INSERT INTO service_calls
        (sap_call_id, customer_name, location, problem_description, status, assigned_technician, priority, scheduled_date, sync_status, last_synced_at, sync_attempts, sync_error)
       VALUES ($1,$2,$3,$4,COALESCE($5,'OPEN'),$6,COALESCE($7,'MEDIUM'),$8,'SYNCED',CURRENT_TIMESTAMP,0,NULL)
       ON CONFLICT (sap_call_id)
       DO UPDATE SET
         customer_name = EXCLUDED.customer_name,
         location = EXCLUDED.location,
         problem_description = EXCLUDED.problem_description,
         status = EXCLUDED.status,
         assigned_technician = EXCLUDED.assigned_technician,
         priority = EXCLUDED.priority,
         scheduled_date = EXCLUDED.scheduled_date,
         sync_status = 'SYNCED',
         last_synced_at = CURRENT_TIMESTAMP,
         sync_error = NULL,
         updated_at = CURRENT_TIMESTAMP`,
      [
        String(sapCallId),
        customerName,
        call.location || null,
        call.problem_description || call.problemDescription || null,
        call.status || "OPEN",
        call.assigned_technician || call.assignedTechnician || null,
        call.priority || "MEDIUM",
        call.scheduled_date || call.scheduledDate || null,
      ]
    );

    summary.upsertedServiceCalls += 1;
  }

  const pendingReports = await pool.query(
    `SELECT sr.*, sc.sap_call_id
     FROM service_reports sr
     JOIN service_calls sc ON sc.id = sr.service_call_id
     WHERE sr.sync_status IN ('PENDING', 'FAILED')
       AND sr.sync_attempts < $1
     ORDER BY sr.id ASC`,
    [maxRetries]
  );

  for (const report of pendingReports.rows) {
    try {
      const result = await pushServiceReportToSAP(report);

      if (result?.skipped) {
        summary.skippedReports += 1;
        continue;
      }

      await pool.query(
        `UPDATE service_reports
         SET sync_status = 'SYNCED',
             sync_attempts = sync_attempts + 1,
             last_synced_at = CURRENT_TIMESTAMP,
             sync_error = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [report.id]
      );

      summary.pushedReports += 1;
    } catch (error) {
      await pool.query(
        `UPDATE service_reports
         SET sync_status = 'FAILED',
             sync_attempts = sync_attempts + 1,
             sync_error = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [report.id, error.message || "Failed to sync report"]
      );

      summary.reportPushFailed += 1;
    }
  }

  return res.json({
    message: "SAP sync completed",
    summary,
  });
});

export default router;
