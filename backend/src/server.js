// =============================================
// 🌹 REDVELVETLIVE — SERVIDOR BACKEND PRO FINAL
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

// 🧩 Rutas principales
import modelsPublicRoutes from "./routes/models.public.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";

// 🔐 Administración (auth + módulos internos)
import adminAuthRoutes from "./routes/admin.auth.routes.js";
import paymentsAdminRoutes from "./routes/payments.admin.routes.js";
import modelsAdminRoutes from "./routes/models.admin.routes.js";
import adminAuth from "./middleware/adminAuth.js";

// 🕒 Cron de pagos (verificación on-chain automática)
import { startPaymentsCron } from "./jobs/payments.cron.js";

// ⚙️ Configuración base
dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =========================
// 🧠 Middlewares globales
// =========================
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // 🔑 necesario para JWT por cookie
app.use(helmet({ crossOriginResourcePolicy: false })); // protección HTTP
app.use(compression()); // ⚙️ GZIP para optimizar tráfico
app.use(morgan("dev")); // 🧾 logs HTTP legibles

// =========================
// 🗄️ Conexión a MongoDB
// =========================
connectDB()
  .then(() => console.log("✅ MongoDB conectado correctamente"))
  .catch((err) => console.error("❌ Error conectando a MongoDB:", err));

// =========================
// 🌐 Rutas principales
// =========================

// 🩺 Health check (monitoreo y uptime)
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

// 👩‍💻 Modelos públicos (listado, perfil, streaming)
app.use("/api/models", modelsPublicRoutes);

// 💰 Pagos generales (tips, retiros, etc.)
app.use("/api/payments", paymentsRoutes);

// =========================
// 🔐 Administración protegida con JWT
// =========================

// 🧩 Login administrativo (devuelve token)
app.use("/api/admin", adminAuthRoutes);

// 💳 Administración de pagos
app.use("/api/admin/payments", adminAuth, paymentsAdminRoutes);

// 👩‍💼 Administración de modelos activos / embajadoras
app.use("/api/admin/models", adminAuth, modelsAdminRoutes);

// =========================
// 🖥️ Servir Panel Admin desde el backend
// =========================
// Permite acceder al panel visual en: http://localhost:4000/admin
const adminPath = path.join(__dirname, "../admin");
app.use("/admin", express.static(adminPath));
console.log(`🧩 Panel Admin servido desde: ${adminPath}`);

// =========================
// ⚠️ Manejador global de errores
// =========================
app.use((err, req, res, next) => {
  console.error("❌ Error interno del servidor:", err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
  });
});

// =========================
// 🚀 Inicialización del servidor
// =========================
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

// =========================
// 🔁 Cron de verificación automática de pagos
// =========================
if (process.env.CRON_ENABLED === "true") {
  startPaymentsCron();
  console.log("🕒 Cron de verificación de pagos iniciado automáticamente.");
} else {
  console.log("⏸️ Cron deshabilitado por configuración (.env).");
}

export default app;
