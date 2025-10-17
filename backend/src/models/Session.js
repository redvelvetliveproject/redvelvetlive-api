// =============================================
// 🌹 REDVELVETLIVE — Session Model (PRO FINAL)
// =============================================
//
// 📋 Descripción:
//  Gestiona sesiones JWT activas, restablecimientos y expiración.
//  Totalmente compatible con autenticación de administrador, modelos o clientes.
//
// 🚀 Características:
//   ✅ Manejo seguro de tokens y expiración automática
//   ✅ Índices TTL (Time To Live) para limpieza automática en MongoDB
//   ✅ Sin duplicaciones de índices (warnings eliminados)
//   ✅ Compatible con esquema User (email, wallet, role)
// =============================================

import mongoose from "mongoose";

const { Schema, model } = mongoose;

const SessionSchema = new Schema(
  {
    // 🧠 Usuario propietario de la sesión
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🔐 Token JWT almacenado (cifrado parcial o completo)
    token: { type: String, required: true, unique: true },

    // 🕐 Fecha de expiración automática (TTL Index)
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // 🧹 MongoDB elimina automáticamente al vencer
    },

    // 📱 Metadatos opcionales
    device: { type: String, default: "unknown" },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },

    // 📊 Control
    createdAt: { type: Date, default: Date.now },
    revoked: { type: Boolean, default: false },
  },
  { versionKey: false }
);

// =====================================================
// 🧩 Middlewares
// =====================================================

// Antes de guardar, asegura que la fecha de expiración sea válida
SessionSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    // Por defecto, 24 horas
    const expirationHours = process.env.SESSION_EXPIRATION_HOURS || 24;
    this.expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
  }
  next();
});

// =====================================================
// 🧠 Métodos de instancia
// =====================================================
SessionSchema.methods.isExpired = function () {
  return this.expiresAt && this.expiresAt.getTime() < Date.now();
};

// =====================================================
// ✅ Índices optimizados (sin duplicados)
// =====================================================
// 🔹 userId → para búsquedas por usuario
// 🔹 token → único
// 🔹 expiresAt → TTL automático ya definido arriba

const Session =
  mongoose.models.Session || model("Session", SessionSchema);

export default Session;
