// ===========================================
// 🌹 REDVELVETLIVE — CONEXIÓN MONGODB PRO FINAL
// ===========================================

import mongoose from "mongoose";
import colors from "colors/safe.js";

let isConnected = false;

/**
 * 🔗 Conecta a MongoDB Atlas de forma segura y resiliente.
 * Incluye reconexión automática, logs estilizados y manejo de errores.
 */
export default async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.log(colors.yellow("⚠️  MONGO_URI no definida en .env — conexión omitida."));
    return;
  }

  // Evita reconexiones múltiples
  if (isConnected) {
    console.log(colors.green("🧠 MongoDB ya está conectado (reutilizando instancia)."));
    return;
  }

  try {
    mongoose.set("strictQuery", false);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
    });

    isConnected = true;

    const db = mongoose.connection;
    const { name, host } = db;
    console.log(
      colors.green.bold(`✅ Conectado a MongoDB Atlas: ${name} @ ${host}`)
    );

    // 🔁 Listeners para reconexión y errores
    db.on("error", (err) => {
      console.error(colors.red(`❌ Error en MongoDB: ${err.message}`));
    });

    db.on("disconnected", () => {
      console.warn(colors.yellow("⚠️  MongoDB desconectado. Intentando reconectar..."));
      isConnected = false;
      setTimeout(connectDB, 5000);
    });

    db.on("reconnected", () => {
      console.log(colors.cyan("🔄 Reconexion exitosa con MongoDB Atlas."));
      isConnected = true;
    });

  } catch (error) {
    console.error(colors.red.bold(`❌ Error al conectar a MongoDB: ${error.message}`));
    process.exit(1);
  }
}

