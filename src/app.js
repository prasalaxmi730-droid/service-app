import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import serviceCallRoutes from "./routes/serviceCallRoutes.js";
import serviceReportRoutes from "./routes/serviceReportRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => {
  res.json({
    service: "Field Service Report API",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/service-calls", serviceCallRoutes);
app.use("/service-report", serviceReportRoutes);
app.use("/sync-sap", syncRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
