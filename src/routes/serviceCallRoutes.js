import express from "express";
import { pool } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const status = req.query.status;
  const isAdmin = req.user?.role === "admin";
  const technician = req.user?.username;

  let queryText = "";
  let params = [];

  if (isAdmin) {
    if (status) {
      queryText = "SELECT * FROM service_calls WHERE status = $1 ORDER BY id DESC";
      params = [status];
    } else {
      queryText = "SELECT * FROM service_calls ORDER BY id DESC";
    }
  } else {
    if (status) {
      queryText = "SELECT * FROM service_calls WHERE assigned_technician = $1 AND status = $2 ORDER BY id DESC";
      params = [technician, status];
    } else {
      queryText = "SELECT * FROM service_calls WHERE assigned_technician = $1 ORDER BY id DESC";
      params = [technician];
    }
  }

  const result = await pool.query(queryText, params);
  return res.json(result.rows);
});

router.get("/:id", authMiddleware, async (req, res) => {
  const isAdmin = req.user?.role === "admin";
  const result = await pool.query(
    "SELECT * FROM service_calls WHERE id = $1",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Service call not found" });
  }

  const serviceCall = result.rows[0];
  if (!isAdmin && serviceCall.assigned_technician !== req.user.username) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return res.json(serviceCall);
});

router.post("/", authMiddleware, requireRole("admin"), async (req, res) => {
  const {
    sap_call_id,
    customer_name,
    location,
    problem_description,
    assigned_technician,
    priority,
    scheduled_date,
  } = req.body;

  if (!customer_name) {
    return res.status(400).json({ error: "customer_name is required" });
  }

  const result = await pool.query(
    `INSERT INTO service_calls
      (sap_call_id, customer_name, location, problem_description, status, assigned_technician, priority, scheduled_date, sync_status)
    VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, 'PENDING')
    RETURNING *`,
    [
      sap_call_id || null,
      customer_name,
      location || null,
      problem_description || null,
      assigned_technician || null,
      priority || "MEDIUM",
      scheduled_date || null,
    ]
  );

  return res.status(201).json(result.rows[0]);
});

export default router;
