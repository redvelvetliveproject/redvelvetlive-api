// =============================================
// 🌹 REDVELVETLIVE — SERVIDOR BACKEND PRO FINAL (v3.1)
// =============================================
//
// Cambios PRO:
//  - Carga forzada de .env desde backend/.env (independiente de PM2/cwd)
//  - Eliminado el dotenv.config() duplicado
//  - Resto igual a tu v3.0
// =============================================

// --- dotenv PRO: fuerza a usar backend/.env ---
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carga SIEMPRE el .env de /backend (independiente de PM2/cwd)
dotenv.config({ path: path.join(__dirname, "../.env") });

// =============================================
// Imports de la app
// =============================================
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";

// 🧩 Rutas principales (públicas)
import modelsPublicRoutes from "./routes/models.public.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";

// 🔐 Administración (auth + módulos internos)
import adminAuthRoutes from "./routes/admin.auth.routes.js";
import paymentsAdminRoutes from "./routes/payments.admin.routes.js";
import modelsAdminRoutes from "./routes/models.admin.routes.js";
import adminAuth from "./middleware/adminAuth.js";

// 🕒 Carga automática de cron jobs
import { startAllCrons } from "./jobs/index.js";

// ⚙️ App base
const app = express();

/* ======================================================
   🧠 MIDDLEWARES GLOBALES
   ====================================================== */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

/* ======================================================
   🗄️ CONEXIÓN A MONGODB
   ====================================================== */
connectDB()
  .then(() => console.log("✅ MongoDB conectado correctamente"))
  .catch((err) => console.error("❌ Error conectando a MongoDB:", err));

/* ======================================================
   🌐 RUTAS PRINCIPALES
   ====================================================== */

// 🩺 Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API RedVelvetLive funcionando correctamente 🚀",
    env: process.env.NODE_ENV,
    version: "1.0.0",
    timestamp: new Date(),
    cron: {
      enabled: String(process.env.CRON_ENABLED).toLowerCase() === "true",
      schedule: process.env.CRON_SCHEDULE || "*/5 * * * *",
    },
  });
});

// 👩‍💻 Modelos públicos
app.use("/api/models", modelsPublicRoutes);

// 💰 Pagos generales
app.use("/api/payments", paymentsRoutes);

/* ======================================================
   🔐 RUTAS ADMINISTRATIVAS (JWT + AUTH)
   ====================================================== */

// 🔑 Login administrativo
app.use("/api/admin", adminAuthRoutes);

// 💳 Administración de pagos
app.use("/api/admin/payments", adminAuth, paymentsAdminRoutes);

// 👩‍💼 Administración de modelos
app.use("/api/admin/models", adminAuth, modelsAdminRoutes);

/* ======================================================
   🖥️ SERVICIO DE PANEL ADMIN DESDE BACKEND
   ====================================================== */
const adminPath = path.join(__dirname, "../admin");
app.use("/admin", express.static(adminPath));
console.log(`🧩 Panel Admin servido desde: ${adminPath}`);

/* ======================================================
   ⚠️ MANEJADOR GLOBAL DE ERRORES
   ====================================================== */
app.use((err, req, res, next) => {
  console.error("❌ Error interno del servidor:", err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
  });
});

/* ======================================================
   🚀 INICIALIZACIÓN DEL SERVIDOR
   ====================================================== */
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 API RedVelvetLive corriendo en puerto ${PORT}`);
  console.log(
    `🩺 Health check: ${
      process.env.PUBLIC_URL || "http://localhost:" + PORT
    }/api/health`
  );
  console.log(`🌐 Entorno: ${process.env.NODE_ENV}`);
  console.log(
    `🔑 Panel Admin: ${
      process.env.PUBLIC_URL || "http://localhost:" + PORT
    }/admin`
  );
});

/* ======================================================
   🔁 INICIALIZADOR GLOBAL DE CRON JOBS
   ====================================================== */
if (String(process.env.CRON_ENABLED).toLowerCase() === "true") {
  startAllCrons();
} else {
  console.log("⏸️ Cron jobs deshabilitados (.env).");
}

export default app;


