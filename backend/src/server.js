// =============================================
// 🌹 REDVELVETLIVE — SERVIDOR BACKEND PRO FINAL (v3.0)
// =============================================
//
// 🚀 Incluye:
//   ✅ MongoDB + Express + CORS + JWT + Helmet + GZIP
//   ✅ Rutas públicas (Modelos, Pagos, Healthcheck)
//   ✅ Rutas administrativas (Pagos, Modelos, Login Admin)
//   ✅ Cron automático modularizado (jobs/index.js)
//   ✅ Servidor estático del panel /admin
//   ✅ Seguridad endurecida (Helmet, CORS estricto, Cookies seguras)
//   ✅ Logs optimizados y autocorrección de errores
//
// 📁 Estructura esperada:
//   backend/
//    ├─ src/
//    │   ├─ routes/
//    │   │   ├─ models.public.routes.js
//    │   │   ├─ payments.routes.js
//    │   │   ├─ admin.auth.routes.js
//    │   │   ├─ payments.admin.routes.js
//    │   │   └─ models.admin.routes.js
//    │   ├─ middleware/
//    │   ├─ config/
//    │   ├─ jobs/
//    │   │   ├─ payments.cron.js
//    │   │   └─ index.js
//    │   ├─ models/
//    │   └─ services/
// =============================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

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

// ⚙️ Configuración base
dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      enabled: process.env.CRON_ENABLED === "true",
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
