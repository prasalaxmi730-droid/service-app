import bcrypt from "bcryptjs";
import { pool } from "./db.js";

export const initDB = async () => {
  const client = await pool.connect();

  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        username VARCHAR(120) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'technician',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS service_calls (
        id BIGSERIAL PRIMARY KEY,
        sap_call_id VARCHAR(100) UNIQUE,
        customer_name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        problem_description TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        assigned_technician VARCHAR(120),
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        scheduled_date DATE,
        sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        sync_attempts INTEGER NOT NULL DEFAULT 0,
        sync_error TEXT,
        last_synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
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
        last_synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_service_calls_sync_status ON service_calls(sync_status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_service_reports_sync_status ON service_reports(sync_status);
    `);

    // Trigger: once a service report is created, mark related call as COMPLETED
    await client.query(`
      CREATE OR REPLACE FUNCTION fn_complete_call_on_report()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE service_calls
        SET status = 'COMPLETED',
            sync_status = 'PENDING',
            updated_at = NOW()
        WHERE id = NEW.service_call_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_service_report_insert_complete_call ON service_reports;
    `);

    await client.query(`
      CREATE TRIGGER trg_service_report_insert_complete_call
      AFTER INSERT ON service_reports
      FOR EACH ROW
      EXECUTE FUNCTION fn_complete_call_on_report();
    `);

    // Seed default Users
    const defaultUsername = process.env.ADMIN_USERNAME || "technician";
    const defaultPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

    const existingUser = await client.query(
      "SELECT id FROM users WHERE username = $1",
      [defaultUsername]
    );

    if (existingUser.rows.length === 0) {
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      await client.query(
        "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
        [defaultUsername, passwordHash, "admin"]
      );
      console.log(`Created default user: ${defaultUsername}`);
    }

    const techExists = await client.query(
      "SELECT id FROM users WHERE username = $1",
      ["Ravi"]
    );

    if (techExists.rows.length === 0) {
      const techHash = await bcrypt.hash("Ravi@1234", 10);
      await client.query(
        "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
        ["Ravi", techHash, "technician"]
      );
    }

    // Ensure unique constraint exists on sap_call_id (may be missing if table was created in a prior failed run)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'service_calls_sap_call_id_key'
        ) THEN
          ALTER TABLE service_calls ADD CONSTRAINT service_calls_sap_call_id_key UNIQUE (sap_call_id);
        END IF;
      END $$;
    `);

    // Seed default Service Calls
    await client.query(`
      INSERT INTO service_calls
        (sap_call_id, customer_name, location, problem_description, status, assigned_technician, priority, scheduled_date, sync_status)
      SELECT 'SAP-2001', 'Delta Foods', 'Bengaluru', 'Cooling unit temperature spikes', 'PENDING', 'Ravi', 'HIGH', CURRENT_DATE, 'PENDING'
      WHERE NOT EXISTS (SELECT 1 FROM service_calls WHERE sap_call_id = 'SAP-2001');
    `);

    await client.query(`
      INSERT INTO service_calls
        (sap_call_id, customer_name, location, problem_description, status, assigned_technician, priority, scheduled_date, sync_status)
      SELECT 'SAP-2002', 'Metro Hospitals', 'Hyderabad', 'Generator auto-start failure', 'PENDING', 'Ravi', 'MEDIUM', CURRENT_DATE + INTERVAL '1 day', 'PENDING'
      WHERE NOT EXISTS (SELECT 1 FROM service_calls WHERE sap_call_id = 'SAP-2002');
    `);

    await client.query(`
      INSERT INTO service_calls
        (sap_call_id, customer_name, location, problem_description, status, assigned_technician, priority, scheduled_date, sync_status)
      SELECT 'SAP-2003', 'Skyline Textiles', 'Chennai', 'Compressor vibration above threshold', 'PENDING', 'Ravi', 'LOW', CURRENT_DATE + INTERVAL '2 days', 'PENDING'
      WHERE NOT EXISTS (SELECT 1 FROM service_calls WHERE sap_call_id = 'SAP-2003');
    `);
  } finally {
    client.release();
  }
};
