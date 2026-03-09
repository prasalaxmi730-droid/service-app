import express from "express";
import multer from "multer";
import path from "path";
import { pool } from "../config/db.js";
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

  const callResult = await pool.query(
    "SELECT id, sap_call_id, assigned_technician FROM service_calls WHERE id = $1",
    [service_call_id]
  );

  if (callResult.rows.length === 0) {
    return res.status(404).json({ error: "Service call not found" });
  }

  const call = callResult.rows[0];
  const isAdmin = req.user?.role === "admin";
  if (!isAdmin && call.assigned_technician && call.assigned_technician !== req.user.username) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const effectiveTechnicianName = isAdmin ? technician_name : req.user.username;

  const photoUrl = req.file ? `/uploads/${path.basename(req.file.path)}` : null;

  const reportResult = await pool.query(
    `INSERT INTO service_reports
      (service_call_id, technician_name, visit_date, resolution_notes, photo_url, signature_data, sync_status)
    VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
    RETURNING *`,
    [
      service_call_id,
      effectiveTechnicianName,
      visit_date,
      resolution_notes,
      photoUrl,
      signature_data || null,
    ]
  );

  const createdReport = reportResult.rows[0];
  const sapPayload = {
    ...createdReport,
    sap_call_id: call.sap_call_id,
  };

  try {
    const sapResult = await pushServiceReportToSAP(sapPayload);

    if (sapResult?.skipped) {
      await pool.query(
        `UPDATE service_reports
         SET sync_status = 'PENDING',
             sync_error = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [createdReport.id, sapResult.reason || "SAP not configured"]
      );

      return res.status(201).json({
        ...createdReport,
        sync_status: "PENDING",
        sync_error: sapResult.reason || "SAP not configured",
      });
    }

    const syncedReport = await pool.query(
      `UPDATE service_reports
       SET sync_status = 'SYNCED',
           sync_attempts = sync_attempts + 1,
           last_synced_at = NOW(),
           sync_error = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [createdReport.id]
    );

    await pool.query(
      `UPDATE service_calls
       SET sync_status = 'SYNCED',
           last_synced_at = NOW(),
           sync_error = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [service_call_id]
    );

    return res.status(201).json(syncedReport.rows[0]);
  } catch (error) {
    await pool.query(
      `UPDATE service_reports
       SET sync_status = 'FAILED',
           sync_attempts = sync_attempts + 1,
           sync_error = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [createdReport.id, error.message || "Failed to sync report to SAP"]
    );

    await pool.query(
      `UPDATE service_calls
       SET sync_status = 'FAILED',
           sync_error = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [service_call_id, error.message || "Failed to sync report to SAP"]
    );

    return res.status(201).json({
      ...createdReport,
      sync_status: "FAILED",
      sync_error: error.message || "Failed to sync report to SAP",
    });
  }
});

export default router;
