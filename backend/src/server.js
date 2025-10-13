// backend/src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/db.js";

// 🧩 Importar rutas
import modelsPublicRoutes from "./routes/models.public.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";

// ⚙️ Configuración inicial
dotenv.config();
const app = express();

// ✅ Middlewares globales
app.use(cors({
  origin: "*", // o especifica dominios permitidos ["https://redvelvetlive.com"]
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" })); // admite JSON grandes
app.use(helmet()); // seguridad HTTP básica
app.use(morgan("dev")); // logs en consola

// 🌐 Conexión a MongoDB
connectDB();

// ✅ Rutas base
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API RedVelvetLive funcionando correctamente 🚀",
    version: "1.0.0",
    timestamp: new Date(),
  });
});

// 🔗 Registrar rutas funcionales
app.use("/api/models", modelsPublicRoutes);
app.use("/api/payments", paymentsRoutes);

// 🧠 Manejador de errores global (seguro)
app.use((err, req, res, next) => {
  console.error("❌ Error interno:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
  });
});

// ⚡ Puerto dinámico (para producción en Vercel o VPS)
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API RedVelvetLive corriendo en puerto ${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
