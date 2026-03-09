import express from "express";
import { poolPromise } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const serviceCallId = req.query.service_call_id;
  const isAdmin = req.user?.role === "admin";
  const technician = req.user?.username;

  const pool = await poolPromise;
  const request = pool.request();
  let queryText = "";

  if (isAdmin) {
    if (serviceCallId) {
      request.input("serviceCallId", serviceCallId);
      queryText = `SELECT sr.*, sc.customer_name, sc.sap_call_id
                 FROM service_reports sr
                 JOIN service_calls sc ON sc.id = sr.service_call_id
                 WHERE sr.service_call_id = @serviceCallId
                 ORDER BY sr.id DESC`;
    } else {
      queryText = `SELECT sr.*, sc.customer_name, sc.sap_call_id
                 FROM service_reports sr
                 JOIN service_calls sc ON sc.id = sr.service_call_id
                 ORDER BY sr.id DESC`;
    }
  } else {
    request.input("technician", technician);
    if (serviceCallId) {
      request.input("serviceCallId", serviceCallId);
      queryText = `SELECT sr.*, sc.customer_name, sc.sap_call_id
                 FROM service_reports sr
                 JOIN service_calls sc ON sc.id = sr.service_call_id
                 WHERE sr.service_call_id = @serviceCallId
                   AND (sc.assigned_technician = @technician OR sr.technician_name = @technician)
                 ORDER BY sr.id DESC`;
    } else {
      queryText = `SELECT sr.*, sc.customer_name, sc.sap_call_id
                 FROM service_reports sr
                 JOIN service_calls sc ON sc.id = sr.service_call_id
                 WHERE sc.assigned_technician = @technician OR sr.technician_name = @technician
                 ORDER BY sr.id DESC`;
    }
  }

  const result = await request.query(queryText);
  return res.json(result.recordset);
});

router.get("/:id", authMiddleware, async (req, res) => {
  const isAdmin = req.user?.role === "admin";
  
  const pool = await poolPromise;
  const result = await pool.request()
    .input("id", req.params.id)
    .query(`SELECT sr.*, sc.customer_name, sc.sap_call_id, sc.assigned_technician
     FROM service_reports sr
     JOIN service_calls sc ON sc.id = sr.service_call_id
     WHERE sr.id = @id`);

  if (result.recordset.length === 0) {
    return res.status(404).json({ error: "Service report not found" });
  }

  const report = result.recordset[0];
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
