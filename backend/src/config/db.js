// =============================================
// 🌹 REDVELVETLIVE — Conexión MongoDB (PRO FINAL)
// =============================================
//
// 🚀 Características:
//   ✅ Conexión segura a MongoDB Atlas con reconexión automática
//   ✅ Limpio (sin warnings: useNewUrlParser, useUnifiedTopology, etc.)
//   ✅ Detección de errores críticos y logs legibles
//   ✅ Preparado para producción (PM2, Hostinger, Vercel)
//
// =============================================

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("❌ MONGO_URI no definido en .env");
    }

    // Conexión segura
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // ⏱️ Evita bloqueos largos
      autoIndex: false, // ⚙️ Desactiva auto-index en producción para mayor rendimiento
      maxPoolSize: 10, // 🔁 Hasta 10 conexiones simultáneas
    });

    console.log("✅ Conectado a MongoDB Atlas con éxito");
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error.message);
    // Espera 5s y reintenta (resiliencia)
    setTimeout(connectDB, 5000);
  }

  // Manejador global de desconexión
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB desconectado. Reintentando...");
  });
};

export default connectDB;


