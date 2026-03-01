import bcrypt from "bcryptjs";
import { pool } from "./db.js";

export const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username VARCHAR(120) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'technician',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_calls (
      id BIGSERIAL PRIMARY KEY,
      sap_call_id VARCHAR(100) UNIQUE,
      customer_name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      problem_description TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
      assigned_technician VARCHAR(120),
      priority VARCHAR(20) DEFAULT 'MEDIUM',
      scheduled_date DATE,
      sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      sync_attempts INTEGER NOT NULL DEFAULT 0,
      sync_error TEXT,
      last_synced_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_reports (
      id BIGSERIAL PRIMARY KEY,
      service_call_id BIGINT NOT NULL REFERENCES service_calls(id) ON DELETE CASCADE,
      technician_name VARCHAR(120) NOT NULL,
      visit_date DATE NOT NULL,
      resolution_notes TEXT NOT NULL,
      photo_url TEXT,
      signature_data TEXT,
      sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      sync_attempts INTEGER NOT NULL DEFAULT 0,
      sync_error TEXT,
      last_synced_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Backward-compatible migrations for already-existing deployments.
  await pool.query(
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'technician';"
  );

  await pool.query(
    "ALTER TABLE service_calls ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';"
  );
  await pool.query(
    "ALTER TABLE service_calls ADD COLUMN IF NOT EXISTS sync_attempts INTEGER NOT NULL DEFAULT 0;"
  );
  await pool.query(
    "ALTER TABLE service_calls ADD COLUMN IF NOT EXISTS sync_error TEXT;"
  );
  await pool.query(
    "ALTER TABLE service_calls ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;"
  );
  await pool.query(
    "ALTER TABLE service_calls ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM';"
  );
  await pool.query(
    "ALTER TABLE service_calls ADD COLUMN IF NOT EXISTS scheduled_date DATE;"
  );
  await pool.query(
    "ALTER TABLE service_calls ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;"
  );

  await pool.query(
    "ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS photo_url TEXT;"
  );
  await pool.query(
    "ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS signature_data TEXT;"
  );
  await pool.query(
    "ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';"
  );
  await pool.query(
    "ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS sync_attempts INTEGER NOT NULL DEFAULT 0;"
  );
  await pool.query(
    "ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS sync_error TEXT;"
  );
  await pool.query(
    "ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;"
  );
  await pool.query(
    "ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;"
  );

  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_service_calls_sync_status ON service_calls(sync_status);"
  );
  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_service_reports_sync_status ON service_reports(sync_status);"
  );

  const defaultUsername = process.env.ADMIN_USERNAME || "technician";
  const defaultPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  const existingUser = await pool.query(
    "SELECT id FROM users WHERE username = $1",
    [defaultUsername]
  );

  if (existingUser.rowCount === 0) {
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
      [defaultUsername, passwordHash, "admin"]
    );
    console.log(`Created default user: ${defaultUsername}`);
  }
};
