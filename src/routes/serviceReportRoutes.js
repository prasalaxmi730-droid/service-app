import express from "express";
import multer from "multer";
import path from "path";
import { pool } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

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

  const callResult = await pool.query("SELECT id FROM service_calls WHERE id = $1", [
    service_call_id,
  ]);
  if (callResult.rowCount === 0) {
    return res.status(404).json({ error: "Service call not found" });
  }

  const photoUrl = req.file ? `/uploads/${path.basename(req.file.path)}` : null;

  const reportResult = await pool.query(
    `INSERT INTO service_reports
      (service_call_id, technician_name, visit_date, resolution_notes, photo_url, signature_data, sync_status)
     VALUES ($1,$2,$3,$4,$5,$6,'PENDING')
     RETURNING *`,
    [
      service_call_id,
      technician_name,
      visit_date,
      resolution_notes,
      photoUrl,
      signature_data || null,
    ]
  );

  await pool.query(
    `UPDATE service_calls
     SET status = 'COMPLETED', sync_status = 'PENDING', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [service_call_id]
  );

  return res.status(201).json(reportResult.rows[0]);
});

export default router;
