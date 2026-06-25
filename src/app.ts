import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth";
import progressRoutes from "./routes/progress";
import certificationRoutes from "./routes/certifications";
import formRoutes from "./routes/forms";
import kpiRoutes from "./routes/kpi";
import powerbiRoutes from "./routes/powerbi";
import facultyKpiRoutes from "./routes/faculty-kpi";
import uploadRoutes from "./routes/upload";
import cronRoutes from "./routes/cron";

const app = express();

// Global middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/certifications", certificationRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/kpi", kpiRoutes);
app.use("/api/powerbi", powerbiRoutes);
app.use("/api/faculty-kpi", facultyKpiRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/cron", cronRoutes);

export default app;

