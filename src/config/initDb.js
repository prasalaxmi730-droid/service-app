import bcrypt from "bcryptjs";
import { poolPromise } from "./db.js";

export const initDB = async () => {
  const pool = await poolPromise;

  // Create tables
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
    CREATE TABLE users (
      id BIGINT IDENTITY(1,1) PRIMARY KEY,
      username VARCHAR(120) UNIQUE NOT NULL,
      password_hash NVARCHAR(MAX) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'technician',
      created_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='service_calls' AND xtype='U')
    CREATE TABLE service_calls (
      id BIGINT IDENTITY(1,1) PRIMARY KEY,
      sap_call_id VARCHAR(100) UNIQUE,
      customer_name NVARCHAR(255) NOT NULL,
      location NVARCHAR(255),
      problem_description NVARCHAR(MAX),
      status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      assigned_technician VARCHAR(120),
      priority VARCHAR(20) DEFAULT 'MEDIUM',
      scheduled_date DATE,
      sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      sync_attempts INTEGER NOT NULL DEFAULT 0,
      sync_error NVARCHAR(MAX),
      last_synced_at DATETIME2,
      created_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='service_reports' AND xtype='U')
    CREATE TABLE service_reports (
      id BIGINT IDENTITY(1,1) PRIMARY KEY,
      service_call_id BIGINT NOT NULL CONSTRAINT FK_Report_ServiceCall FOREIGN KEY REFERENCES service_calls(id) ON DELETE CASCADE,
      technician_name VARCHAR(120) NOT NULL,
      visit_date DATE NOT NULL,
      resolution_notes NVARCHAR(MAX) NOT NULL,
      photo_url NVARCHAR(MAX),
      signature_data NVARCHAR(MAX),
      sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      sync_attempts INTEGER NOT NULL DEFAULT 0,
      sync_error NVARCHAR(MAX),
      last_synced_at DATETIME2,
      created_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Indexes
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_service_calls_sync_status' AND object_id = OBJECT_ID('service_calls'))
    BEGIN
        CREATE INDEX idx_service_calls_sync_status ON service_calls(sync_status);
    END
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_service_reports_sync_status' AND object_id = OBJECT_ID('service_reports'))
    BEGIN
        CREATE INDEX idx_service_reports_sync_status ON service_reports(sync_status);
    END
  `);

  // Trigger for automation: once a service report is created, mark related call as COMPLETED.
  await pool.request().query(`
    CREATE OR ALTER TRIGGER trg_service_report_insert_complete_call
    ON service_reports
    AFTER INSERT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        UPDATE sc
        SET 
            sc.status = 'COMPLETED',
            sc.sync_status = 'PENDING',
            sc.updated_at = CURRENT_TIMESTAMP
        FROM service_calls sc
        INNER JOIN inserted i ON sc.id = i.service_call_id;
    END;
  `);

  // Seed default Users
  const defaultUsername = process.env.ADMIN_USERNAME || "technician";
  const defaultPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  const existingUser = await pool.request()
    .input("username", defaultUsername)
    .query("SELECT id FROM users WHERE username = @username");

  if (existingUser.recordset.length === 0) {
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    await pool.request()
      .input("username", defaultUsername)
      .input("passwordHash", passwordHash)
      .input("role", "admin")
      .query("INSERT INTO users (username, password_hash, role) VALUES (@username, @passwordHash, @role)");
    console.log(`Created default user: ${defaultUsername}`);
  }

  const techExists = await pool.request()
    .input("username", "Ravi")
    .query("SELECT id FROM users WHERE username = @username");

  if (techExists.recordset.length === 0) {
    const techHash = await bcrypt.hash("Ravi@1234", 10);
    await pool.request()
      .input("username", "Ravi")
      .input("passwordHash", techHash)
      .input("role", "technician")
      .query("INSERT INTO users (username, password_hash, role) VALUES (@username, @passwordHash, @role)");
  }

  // Seed default Service Calls
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM service_calls WHERE sap_call_id = 'SAP-2001')
    BEGIN
      INSERT INTO service_calls
        (sap_call_id, customer_name, location, problem_description, status, assigned_technician, priority, scheduled_date, sync_status)
      VALUES 
        ('SAP-2001', 'Delta Foods', 'Bengaluru', 'Cooling unit temperature spikes', 'PENDING', 'Ravi', 'HIGH', CAST(GETDATE() AS DATE), 'PENDING')
    END

    IF NOT EXISTS (SELECT 1 FROM service_calls WHERE sap_call_id = 'SAP-2002')
    BEGIN
      INSERT INTO service_calls
        (sap_call_id, customer_name, location, problem_description, status, assigned_technician, priority, scheduled_date, sync_status)
      VALUES 
        ('SAP-2002', 'Metro Hospitals', 'Hyderabad', 'Generator auto-start failure', 'PENDING', 'Ravi', 'MEDIUM', CAST(DATEADD(day, 1, GETDATE()) AS DATE), 'PENDING')
    END

    IF NOT EXISTS (SELECT 1 FROM service_calls WHERE sap_call_id = 'SAP-2003')
    BEGIN
      INSERT INTO service_calls
        (sap_call_id, customer_name, location, problem_description, status, assigned_technician, priority, scheduled_date, sync_status)
      VALUES 
        ('SAP-2003', 'Skyline Textiles', 'Chennai', 'Compressor vibration above threshold', 'PENDING', 'Ravi', 'LOW', CAST(DATEADD(day, 2, GETDATE()) AS DATE), 'PENDING')
    END
  `);
};
