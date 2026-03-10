
import { poolPromise } from "./src/config/db.js";
import dotenv from "dotenv";
dotenv.config();

const checkDb = async () => {
  try {
    const pool = await poolPromise;
    
    console.log("--- Users ---");
    const users = await pool.request().query("SELECT id, username, role FROM users");
    console.table(users.recordset);

    console.log("\n--- Service Calls ---");
    const calls = await pool.request().query("SELECT id, customer_name, status, assigned_technician FROM service_calls");
    console.table(calls.recordset);

    console.log("\n--- Service Reports ---");
    const reports = await pool.request().query("SELECT id, service_call_id, technician_name FROM service_reports");
    console.table(reports.recordset);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDb();
