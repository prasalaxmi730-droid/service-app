import express from "express";
import { pool } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const status = req.query.status;

  const query = status
    ? {
        text: "SELECT * FROM service_calls WHERE status = $1 ORDER BY id DESC",
        values: [status],
      }
    : {
        text: "SELECT * FROM service_calls ORDER BY id DESC",
        values: [],
      };

  const result = await pool.query(query.text, query.values);
  return res.json(result.rows);
});

router.get("/:id", authMiddleware, async (req, res) => {
  const result = await pool.query("SELECT * FROM service_calls WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Service call not found" });
  }

  return res.json(result.rows[0]);
});

router.post("/", authMiddleware, async (req, res) => {
  const {
    sap_call_id,
    customer_name,
    location,
    problem_description,
    status,
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
     VALUES ($1,$2,$3,$4,COALESCE($5,'OPEN'),$6,COALESCE($7,'MEDIUM'),$8,'PENDING')
     RETURNING *`,
    [
      sap_call_id || null,
      customer_name,
      location || null,
      problem_description || null,
      status || null,
      assigned_technician || null,
      priority || null,
      scheduled_date || null,
    ]
  );

  return res.status(201).json(result.rows[0]);
});

export default router;
