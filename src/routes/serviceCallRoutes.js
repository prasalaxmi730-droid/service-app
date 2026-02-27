import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM service_calls ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      sap_call_id,
      customer_name,
      location,
      problem_description,
      assigned_technician,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO service_calls 
      (sap_call_id, customer_name, location, problem_description, assigned_technician)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        sap_call_id,
        customer_name,
        location,
        problem_description,
        assigned_technician,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Insert failed" });
  }
});

export default router;
