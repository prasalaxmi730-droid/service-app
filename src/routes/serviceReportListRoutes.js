import express from "express";
import { pool } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const serviceCallId = req.query.service_call_id;
  const isAdmin = req.user?.role === "admin";
  const technician = req.user?.username;

  let query;
  if (isAdmin) {
    query = serviceCallId
      ? {
          text: `SELECT sr.*, sc.customer_name, sc.sap_call_id
                 FROM service_reports sr
                 JOIN service_calls sc ON sc.id = sr.service_call_id
                 WHERE sr.service_call_id = $1
                 ORDER BY sr.id DESC`,
          values: [serviceCallId],
        }
      : {
          text: `SELECT sr.*, sc.customer_name, sc.sap_call_id
                 FROM service_reports sr
                 JOIN service_calls sc ON sc.id = sr.service_call_id
                 ORDER BY sr.id DESC`,
          values: [],
        };
  } else {
    query = serviceCallId
      ? {
          text: `SELECT sr.*, sc.customer_name, sc.sap_call_id
                 FROM service_reports sr
                 JOIN service_calls sc ON sc.id = sr.service_call_id
                 WHERE sr.service_call_id = $1
                   AND (sc.assigned_technician = $2 OR sr.technician_name = $2)
                 ORDER BY sr.id DESC`,
          values: [serviceCallId, technician],
        }
      : {
          text: `SELECT sr.*, sc.customer_name, sc.sap_call_id
                 FROM service_reports sr
                 JOIN service_calls sc ON sc.id = sr.service_call_id
                 WHERE sc.assigned_technician = $1 OR sr.technician_name = $1
                 ORDER BY sr.id DESC`,
          values: [technician],
        };
  }

  const result = await pool.query(query.text, query.values);
  return res.json(result.rows);
});

router.get("/:id", authMiddleware, async (req, res) => {
  const isAdmin = req.user?.role === "admin";
  const result = await pool.query(
    `SELECT sr.*, sc.customer_name, sc.sap_call_id, sc.assigned_technician
     FROM service_reports sr
     JOIN service_calls sc ON sc.id = sr.service_call_id
     WHERE sr.id = $1`,
    [req.params.id]
  );

  if (result.rowCount === 0) {
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
