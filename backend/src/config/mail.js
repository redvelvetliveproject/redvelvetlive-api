// =============================================
// 🌹 REDVELVETLIVE — Conexión MongoDB (PRO FINAL)
// =============================================
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("❌ MONGO_URI no definido en .env");

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: false,
      maxPoolSize: 10,
    });

    console.log("✅ Conectado a MongoDB Atlas con éxito");
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error.message);
    setTimeout(connectDB, 5000);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB desconectado. Reintentando...");
  });
};

export default connectDB;

