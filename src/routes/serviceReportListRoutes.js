import express from "express";
import { query } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const serviceCallId = req.query.service_call_id;
  const isAdmin = req.user?.role === "admin";
  const technician = req.user?.username;

  let result;

  if (isAdmin) {
    result = serviceCallId
      ? await query(
          `
            SELECT
              sr.id,
              sr.service_call_id,
              sr.technician_name,
              sr.visit_date,
              sr.resolution_notes,
              sr.sync_status,
              sr.photo_url,
              sr.signature_data,
              sc.customer_name,
              sc.sap_call_id,
              sc.status AS status
            FROM service_reports sr
            JOIN service_calls sc ON sc.id = sr.service_call_id
            WHERE sr.service_call_id = $1
              AND sc.status = 'COMPLETED'
            ORDER BY sr.id DESC
          `,
          [serviceCallId]
        )
      : await query(`
          SELECT
            sr.id,
            sr.service_call_id,
            sr.technician_name,
            sr.visit_date,
            sr.resolution_notes,
            sr.sync_status,
            sr.photo_url,
            sr.signature_data,
            sc.customer_name,
            sc.sap_call_id,
            sc.status AS status
          FROM service_reports sr
          JOIN service_calls sc ON sc.id = sr.service_call_id
          WHERE sc.status = 'COMPLETED'
          ORDER BY sr.id DESC
        `);
  } else {
    result = serviceCallId
      ? await query(
          `
            SELECT
              sr.id,
              sr.service_call_id,
              sr.technician_name,
              sr.visit_date,
              sr.resolution_notes,
              sr.sync_status,
              sr.photo_url,
              sr.signature_data,
              sc.customer_name,
              sc.sap_call_id,
              sc.status AS status
            FROM service_reports sr
            JOIN service_calls sc ON sc.id = sr.service_call_id
            WHERE sr.service_call_id = $1
              AND (sc.assigned_technician = $2 OR sr.technician_name = $2)
              AND sc.status = 'COMPLETED'
            ORDER BY sr.id DESC
          `,
          [serviceCallId, technician]
        )
      : await query(
          `
            SELECT
              sr.id,
              sr.service_call_id,
              sr.technician_name,
              sr.visit_date,
              sr.resolution_notes,
              sr.sync_status,
              sr.photo_url,
              sr.signature_data,
              sc.customer_name,
              sc.sap_call_id,
              sc.status AS status
            FROM service_reports sr
            JOIN service_calls sc ON sc.id = sr.service_call_id
            WHERE (sc.assigned_technician = $1 OR sr.technician_name = $1)
              AND sc.status = 'COMPLETED'
            ORDER BY sr.id DESC
          `,
          [technician]
        );
  }

  return res.json(result.rows);
});

router.get("/:id", authMiddleware, async (req, res) => {
  const isAdmin = req.user?.role === "admin";
  const result = await query(
    `
      SELECT sr.*, sc.customer_name, sc.sap_call_id, sc.assigned_technician
      FROM service_reports sr
      JOIN service_calls sc ON sc.id = sr.service_call_id
      WHERE sr.id = $1
    `,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Service report not found" });
  }

  const report = result.rows[0];
  if (
    !isAdmin &&
    report.assigned_technician !== req.user.username &&
    report.technician_name !== req.user.username
  ) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return res.json(report);
});

export default router;
