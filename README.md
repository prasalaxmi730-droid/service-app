# Field Service Report System

Enterprise-ready field service platform with SAP sync support.

## Tech Stack
- Backend: Node.js + Express
- Database: PostgreSQL (SAP HANA compatible table design)
- Mobile: React Native (Expo)

## Folder Structure

```
field-service-backend/
  src/
    app.js
    index.js
    config/
      db.js
      initDb.js
    middleware/
      authMiddleware.js
    routes/
      authRoutes.js
      serviceCallRoutes.js
      serviceReportRoutes.js
      syncRoutes.js
    services/
      sapService.js
  database/
    schema.sql
  uploads/
  mobile-app/
    App.js
    package.json
    src/
      config/env.js
      services/api.js
      screens/
        LoginScreen.js
        ServiceCallListScreen.js
        ServiceCallDetailScreen.js
        ServiceReportFormScreen.js
  .env.example
  Dockerfile
  .dockerignore
```

## Database Tables
- `service_calls`
- `service_reports`
- `users` (for JWT login)

Schema SQL: `database/schema.sql`

## Backend APIs

### Auth
- `POST /auth/login`
- `GET /auth/me`

### Required business APIs
- `GET /service-calls`
- `POST /service-report`
- `POST /sync-sap`

### Additional utility
- `GET /service-calls/:id`
- `POST /service-calls`

## SAP Integration Module
Implemented in `src/services/sapService.js`:
- `fetchServiceCallsFromSAP()`
- `pushServiceReportToSAP(report)`

`POST /sync-sap` does:
1. Pull service calls from SAP and upsert into local DB
2. Push pending/failed reports to SAP
3. Retry failed reports up to `SYNC_MAX_RETRIES`

## Sync Logic
Both tables include:
- `sync_status` (`PENDING` / `SYNCED` / `FAILED`)
- `sync_attempts`
- `sync_error`
- `last_synced_at`

## Security
JWT implemented:
- Login returns bearer token
- Protected routes require `Authorization: Bearer <token>`

## Environment Variables
Copy `.env.example` to `.env` and update values.

Required at minimum:
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

SAP config:
- `SAP_API_BASE_URL`
- `SAP_API_KEY` or `SAP_BEARER_TOKEN`
- `SAP_SERVICE_CALLS_ENDPOINT`
- `SAP_SERVICE_REPORT_ENDPOINT`
- `SYNC_MAX_RETRIES`

## Step-by-Step Run Guide

### 1. Backend
1. Install backend deps:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env
   ```
   (On Windows PowerShell: `Copy-Item .env.example .env`)
3. Start backend:
   ```bash
   npm run dev
   ```
4. Test health:
   - `GET http://localhost:5001/`

### 2. Login for first use
Default seeded user from env:
- Username: `technician`
- Password: `ChangeMe123!`

Change these in `.env` for production.

### 3. Mobile App
1. Move to mobile app folder:
   ```bash
   cd mobile-app
   ```
2. Install deps:
   ```bash
   npm install
   ```
3. Start Expo:
   ```bash
   npm start
   ```
4. Android emulator backend URL is set to `http://10.0.2.2:5001` in `mobile-app/src/config/env.js`.
   - For physical device, change this to your machine IP.

### 4. SAP Sync
Call:
- `POST /sync-sap`

Use a JWT token in Authorization header.

## Deployment Ready
- Dockerfile included for backend containerization.
- `.dockerignore` included.
- DB schema is versionable via `database/schema.sql`.

## Notes
- `POST /service-report` accepts `multipart/form-data` with fields:
  - `service_call_id`
  - `technician_name`
  - `visit_date`
  - `resolution_notes`
  - `signature_data`
  - `photo` (file)
