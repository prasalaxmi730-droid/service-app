-- PostgreSQL schema (SAP HANA compatible naming and data types where practical)

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(120) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'technician',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX IF NOT EXISTS idx_service_calls_sync_status
  ON service_calls(sync_status);

CREATE INDEX IF NOT EXISTS idx_service_reports_sync_status
  ON service_reports(sync_status);
