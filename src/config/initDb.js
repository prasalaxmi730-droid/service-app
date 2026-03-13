import bcrypt from "bcryptjs";
import { query } from "./db.js";

export const initDB = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username VARCHAR(120) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'technician',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(
    "CREATE INDEX IF NOT EXISTS idx_service_calls_sync_status ON service_calls(sync_status)"
  );
  await query(
    "CREATE INDEX IF NOT EXISTS idx_service_reports_sync_status ON service_reports(sync_status)"
  );

  const defaultUsername = process.env.ADMIN_USERNAME || "technician";
  const defaultPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  const existingUser = await query("SELECT id FROM users WHERE username = $1", [defaultUsername]);
  if (existingUser.rows.length === 0) {
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    await query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
      [defaultUsername, passwordHash, "admin"]
    );
    console.log(`Created default user: ${defaultUsername}`);
  }

  const techExists = await query("SELECT id FROM users WHERE username = $1", ["Ravi"]);
  if (techExists.rows.length === 0) {
    const techHash = await bcrypt.hash("Ravi@1234", 10);
    await query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
      ["Ravi", techHash, "technician"]
    );
  }

  const seedCalls = [
    ["SAP-2001", "Delta Foods", "Bengaluru", "Cooling unit temperature spikes", "technician", "HIGH", 0],
    ["SAP-2002", "Metro Hospitals", "Hyderabad", "Generator auto-start failure", "technician", "MEDIUM", 1],
    ["SAP-2003", "Skyline Textiles", "Chennai", "Compressor vibration above threshold", "technician", "LOW", 2],
    ["SAP-3001", "Green Valley Resorts", "Mysuru", "Solar panel cleaning and inverter check", "technician", "LOW", 3],
    ["SAP-3002", "Blue Chip IT Solutions", "Electronic City", "Server room AC leakage repair", "technician", "HIGH", 0],
    ["SAP-3003", "Evergreen Apartment", "Whitefield", "Lift motor lubrication and wire inspection", "technician", "MEDIUM", 1],
    ["SAP-3004", "Sunrise Healthcare", "Jayanagar", "Backup UPS battery replacement", "technician", "HIGH", 0],
  ];

  for (const [
    sapCallId,
    customerName,
    location,
    problemDescription,
    assignedTechnician,
    priority,
    scheduledOffsetDays,
  ] of seedCalls) {
    await query(
      `
        INSERT INTO service_calls (
          sap_call_id,
          customer_name,
          location,
          problem_description,
          status,
          assigned_technician,
          priority,
          scheduled_date,
          sync_status
        )
        VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, CURRENT_DATE + $7, 'PENDING')
        ON CONFLICT (sap_call_id) DO NOTHING
      `,
      [
        sapCallId,
        customerName,
        location,
        problemDescription,
        assignedTechnician,
        priority,
        scheduledOffsetDays,
      ]
    );
  }

  await query(
    `
      INSERT INTO service_calls (
        customer_name,
        location,
        problem_description,
        status,
        assigned_technician,
        priority,
        scheduled_date,
        sync_status
      )
      SELECT $1, $2, $3, 'PENDING', $4, 'MEDIUM', CURRENT_DATE, 'PENDING'
      WHERE NOT EXISTS (
        SELECT 1 FROM service_calls WHERE customer_name = $1
      )
    `,
    ["Prasa Test Customer", "Main Office", "Maintenance Check", "technician"]
  );
};
