// =============================================
// 🌹 REDVELVETLIVE — SERVIDOR BACKEND PRO FINAL
// =============================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import connectDB from "./config/db.js";

// 🧩 Rutas principales
import modelsPublicRoutes from "./routes/models.public.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import paymentsAdminRoutes from "./routes/payments.admin.routes.js"; // ✅ nueva ruta admin

// 🕒 Cron de pagos (verificación on-chain automática)
import { startPaymentsCron } from "./jobs/payments.cron.js";

// ⚙️ Configuración base
dotenv.config();
const app = express();

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
app.use(helmet({ crossOriginResourcePolicy: false })); // Seguridad HTTP
app.use(compression()); // 🔧 GZIP para mejorar rendimiento
app.use(morgan("dev")); // Logs de peticiones HTTP

// =========================
// 🗄️ Conexión a MongoDB
// =========================
connectDB()
  .then(() => console.log("✅ MongoDB conectado correctamente"))
  .catch((err) => console.error("❌ Error conectando a MongoDB:", err));

// =========================
// 🌐 Rutas principales
// =========================

// 🩺 Health check (para monitoreo y uptime)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API RedVelvetLive funcionando correctamente 🚀",
    env: process.env.NODE_ENV,
    version: "1.0.0",
    timestamp: new Date(),
  });
});

// 👩‍💻 Modelos públicos (listado, perfil, live)
app.use("/api/models", modelsPublicRoutes);

// 💰 Pagos y trazabilidad blockchain (usuarios / tips)
app.use("/api/payments", paymentsRoutes);

// 🛠️ Panel administrativo de pagos (rutas seguras con clave)
app.use("/api/admin/payments", paymentsAdminRoutes); // ✅ nueva ruta

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
// 🚀 Servidor activo
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
});

// =========================
// 🔁 CRON de verificación automática de pagos
// =========================
startPaymentsCron();

export default app;


