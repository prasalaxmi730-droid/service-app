-- Microsoft SQL Server schema

CREATE TABLE users (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  username VARCHAR(120) UNIQUE NOT NULL,
  password_hash NVARCHAR(MAX) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'technician',
  created_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX idx_service_calls_sync_status ON service_calls(sync_status);
CREATE INDEX idx_service_reports_sync_status ON service_reports(sync_status);
