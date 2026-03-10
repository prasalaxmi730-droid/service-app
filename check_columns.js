
import { poolPromise } from "./src/config/db.js";
import dotenv from "dotenv";
dotenv.config();

const check = async () => {
  try {
    const pool = await poolPromise;
    console.log("--- Service Calls Columns ---");
    const cols1 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'service_calls'");
    console.log(cols1.recordset.map(c => c.COLUMN_NAME).join(", "));

    console.log("\n--- Service Reports Columns ---");
    const cols2 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'service_reports'");
    console.log(cols2.recordset.map(c => c.COLUMN_NAME).join(", "));

    console.log("\n--- Query Test ---");
    const test = await pool.request().query("SELECT TOP 1 sr.id, sc.status FROM service_reports sr JOIN service_calls sc ON sc.id = sr.service_call_id");
    console.log(test.recordset);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
