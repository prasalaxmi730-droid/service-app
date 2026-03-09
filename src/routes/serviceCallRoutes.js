import express from "express";
import { poolPromise } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const status = req.query.status;
  const isAdmin = req.user?.role === "admin";
  const technician = req.user?.username;

  const pool = await poolPromise;
  const request = pool.request();
  let queryText = "";

  if (isAdmin) {
    if (status) {
      request.input("status", status);
      queryText = "SELECT * FROM service_calls WHERE status = @status ORDER BY id DESC";
    } else {
      queryText = "SELECT * FROM service_calls ORDER BY id DESC";
    }
  } else {
    request.input("technician", technician);
    if (status) {
      request.input("status", status);
      queryText = "SELECT * FROM service_calls WHERE assigned_technician = @technician AND status = @status ORDER BY id DESC";
    } else {
      queryText = "SELECT * FROM service_calls WHERE assigned_technician = @technician ORDER BY id DESC";
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
    .query("SELECT * FROM service_calls WHERE id = @id");

  if (result.recordset.length === 0) {
    return res.status(404).json({ error: "Service call not found" });
  }

  const serviceCall = result.recordset[0];
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

  const pool = await poolPromise;
  const request = pool.request();
  
  if (sap_call_id) request.input("sap_call_id", sap_call_id);
  request.input("customer_name", customer_name);
  if (location) request.input("location", location);
  if (problem_description) request.input("problem_description", problem_description);
  if (assigned_technician) request.input("assigned_technician", assigned_technician);
  request.input("priority", priority || "MEDIUM");
  if (scheduled_date) request.input("scheduled_date", scheduled_date);

  const result = await request.query(`
    INSERT INTO service_calls
      (sap_call_id, customer_name, location, problem_description, status, assigned_technician, priority, scheduled_date, sync_status)
    OUTPUT inserted.*
    VALUES 
      (${sap_call_id ? "@sap_call_id" : "NULL"}, 
       @customer_name, 
       ${location ? "@location" : "NULL"}, 
       ${problem_description ? "@problem_description" : "NULL"}, 
       'PENDING', 
       ${assigned_technician ? "@assigned_technician" : "NULL"}, 
       @priority, 
       ${scheduled_date ? "@scheduled_date" : "NULL"}, 
       'PENDING')
  `);

  return res.status(201).json(result.recordset[0]);
});

export default router;
