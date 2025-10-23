// backend/src/models/Session.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * 🌹 REDVELVETLIVE — Session Model (PRO FINAL)
 * - Maneja sesiones JWT activas con expiración automática.
 * - ÍNDICES centralizados; sin `index: true` en campos.
 * - TTL en expiresAt configurado via índice.
 */
const SessionSchema = new Schema(
  {
    // 🧠 Usuario propietario de la sesión
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔐 Token JWT almacenado (cifrado parcial o completo)
    token: { type: String, required: true, unique: true },

    // 🕐 Fecha de expiración automática (TTL Index se define abajo)
    expiresAt: { type: Date, required: true },

    // 📱 Metadatos opcionales
    device:    { type: String, default: "unknown" },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },

    // 📊 Control
    createdAt: { type: Date, default: Date.now },
    revoked:   { type: Boolean, default: false },
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
// 📚 Índices centralizados (sin duplicados)
// =====================================================

// 🔹 userId → para búsquedas por usuario
SessionSchema.index({ userId: 1 });

// 🔹 expiresAt → TTL automático: elimina el doc al vencer
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 🔹 token ya es único por definición del campo

const Session =
  mongoose.models.Session || model("Session", SessionSchema);
export default Session;
