import express from "express";
import multer from "multer";
import path from "path";
import { poolPromise } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { pushServiceReportToSAP } from "../services/sapService.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({ storage });

router.post("/", authMiddleware, upload.single("photo"), async (req, res) => {
  const {
    service_call_id,
    technician_name,
    visit_date,
    resolution_notes,
    signature_data,
  } = req.body;

  if (!service_call_id || !technician_name || !visit_date || !resolution_notes) {
    return res.status(400).json({
      error:
        "service_call_id, technician_name, visit_date and resolution_notes are required",
    });
  }

  const pool = await poolPromise;
  const callResult = await pool.request()
    .input("service_call_id", service_call_id)
    .query("SELECT id, sap_call_id, assigned_technician FROM service_calls WHERE id = @service_call_id");

  if (callResult.recordset.length === 0) {
    return res.status(404).json({ error: "Service call not found" });
  }

  const call = callResult.recordset[0];
  const isAdmin = req.user?.role === "admin";
  if (!isAdmin && call.assigned_technician && call.assigned_technician !== req.user.username) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const effectiveTechnicianName = isAdmin ? technician_name : req.user.username;

  const photoUrl = req.file ? `/uploads/${path.basename(req.file.path)}` : null;

  const request = pool.request();
  request.input("service_call_id", service_call_id);
  request.input("technician_name", effectiveTechnicianName);
  request.input("visit_date", visit_date);
  request.input("resolution_notes", resolution_notes);
  if (photoUrl) request.input("photo_url", photoUrl);
  if (signature_data) request.input("signature_data", signature_data);

  const reportResult = await request.query(`
    INSERT INTO service_reports
      (service_call_id, technician_name, visit_date, resolution_notes, photo_url, signature_data, sync_status)
    OUTPUT inserted.*
    VALUES 
      (@service_call_id, 
       @technician_name, 
       @visit_date, 
       @resolution_notes, 
       ${photoUrl ? "@photo_url" : "NULL"}, 
       ${signature_data ? "@signature_data" : "NULL"}, 
       'PENDING')
  `);

  const createdReport = reportResult.recordset[0];
  const sapPayload = {
    ...createdReport,
    sap_call_id: call.sap_call_id,
  };

  try {
    const sapResult = await pushServiceReportToSAP(sapPayload);

    if (sapResult?.skipped) {
      await pool.request()
        .input("id", createdReport.id)
        .input("error", sapResult.reason || "SAP not configured")
        .query(`
          UPDATE service_reports
          SET sync_status = 'PENDING',
              sync_error = @error,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = @id
        `);

      return res.status(201).json({
        ...createdReport,
        sync_status: "PENDING",
        sync_error: sapResult.reason || "SAP not configured",
      });
    }

    const syncedReport = await pool.request()
      .input("id", createdReport.id)
      .query(`
        UPDATE service_reports
        SET sync_status = 'SYNCED',
            sync_attempts = sync_attempts + 1,
            last_synced_at = CURRENT_TIMESTAMP,
            sync_error = NULL,
            updated_at = CURRENT_TIMESTAMP
        OUTPUT inserted.*
        WHERE id = @id
      `);

    await pool.request()
      .input("id", service_call_id)
      .query(`
        UPDATE service_calls
        SET sync_status = 'SYNCED',
            last_synced_at = CURRENT_TIMESTAMP,
            sync_error = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `);

    return res.status(201).json(syncedReport.recordset[0]);
  } catch (error) {
    await pool.request()
      .input("id", createdReport.id)
      .input("error", error.message || "Failed to sync report to SAP")
      .query(`
        UPDATE service_reports
        SET sync_status = 'FAILED',
            sync_attempts = sync_attempts + 1,
            sync_error = @error,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `);

    await pool.request()
      .input("id", service_call_id)
      .input("error", error.message || "Failed to sync report to SAP")
      .query(`
        UPDATE service_calls
        SET sync_status = 'FAILED',
            sync_error = @error,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `);

    return res.status(201).json({
      ...createdReport,
      sync_status: "FAILED",
      sync_error: error.message || "Failed to sync report to SAP",
    });
  }
});

export default router;
