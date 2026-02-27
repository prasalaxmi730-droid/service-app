import { pool } from "./db.js";

export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_calls (
        id SERIAL PRIMARY KEY,
        sap_call_id VARCHAR(50),
        customer_name TEXT,
        location TEXT,
        problem_description TEXT,
        status TEXT DEFAULT 'OPEN',
        assigned_technician TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_reports (
        id SERIAL PRIMARY KEY,
        service_call_id INT REFERENCES service_calls(id),
        technician_name TEXT,
        visit_date DATE,
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Tables created ✅");
  } catch (err) {
    console.log(err);
  }
};
