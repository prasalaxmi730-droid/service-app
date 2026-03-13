import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { query } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const uploadsDir = path.resolve("uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    return cb(null, true);
  },
});

router.post("/", authMiddleware, upload.single("photo"), async (req, res) => {
  const {
    service_call_id,
    technician_name,
    visit_date,
    resolution_notes,
    signature_data,
  } = req.body;

  const normalizedTechnicianName = technician_name?.trim();
  const normalizedVisitDate = visit_date?.trim();
  const normalizedResolutionNotes = resolution_notes?.trim();
  const normalizedSignatureData = signature_data?.trim() || null;

  if (!service_call_id || !normalizedTechnicianName || !normalizedVisitDate || !normalizedResolutionNotes) {
    return res.status(400).json({
      error:
        "service_call_id, technician_name, visit_date and resolution_notes are required",
    });
  }

  if (!req.file) {
    return res.status(400).json({ error: "photo is required" });
  }

  if (!normalizedSignatureData) {
    return res.status(400).json({ error: "signature_data is required" });
  }

  const callResult = await query(
    `
      SELECT id, sap_call_id, assigned_technician, status
      FROM service_calls
      WHERE id = $1
    `,
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

  if (call.status === "COMPLETED") {
    return res.status(409).json({
      error: "This service call is already completed and already moved to reports.",
    });
  }

  const effectiveTechnicianName = isAdmin ? normalizedTechnicianName : req.user.username;
  const photoUrl = `/uploads/${path.basename(req.file.path)}`;

  const reportResult = await query(
    `
      INSERT INTO service_reports (
        service_call_id,
        technician_name,
        visit_date,
        resolution_notes,
        photo_url,
        signature_data,
        sync_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
      RETURNING *
    `,
    [
      service_call_id,
      effectiveTechnicianName,
      normalizedVisitDate,
      normalizedResolutionNotes,
      photoUrl,
      normalizedSignatureData,
    ]
  );

  await query(
    `
      UPDATE service_calls
      SET status = 'COMPLETED',
          sync_status = 'PENDING',
          sync_attempts = 0,
          sync_error = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [service_call_id]
  );

  return res.status(201).json(reportResult.rows[0]);
});

export default router;
