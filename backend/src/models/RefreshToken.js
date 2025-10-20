// backend/src/models/RefreshToken.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

/**
 * RefreshToken (versión PRO)
 * - Guarda SOLO el hash del refresh token (tokenHash) — nunca el token en claro.
 * - Índices centralizados (nada de `index: true` en campos).
 * - TTL por expiresAt (expireAfterSeconds: 0) para borrar automáticamente al vencer.
 */
const RefreshTokenSchema = new Schema(
  {
    userId:     { type: Types.ObjectId, ref: 'User', required: true },
    tokenHash:  { type: String, required: true, unique: true }, // sha256(token)
    userAgent:  { type: String, trim: true },
    ip:         { type: String, trim: true },
    expiresAt:  { type: Date, required: true },                  // TTL via índice
    revokedAt:  { type: Date },                                   // null = activo
    meta:       { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

/* ===========================
   Índices centralizados
   =========================== */
// TTL exacto: elimina el doc cuando se alcance expiresAt
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Consultas comunes: tokens vigentes por usuario, ordenables por exp
RefreshTokenSchema.index(
  { userId: 1, expiresAt: 1 },
  { partialFilterExpression: { revokedAt: { $exists: false } } }
);

// Búsquedas y limpieza por usuario (incluye revocados)
RefreshTokenSchema.index({ userId: 1 });

// tokenHash ya es unique por definición del campo

/* ===========================
   Métodos de instancia
   =========================== */
RefreshTokenSchema.methods.revoke = function () {
  this.revokedAt = new Date();
  return this.save();
};

RefreshTokenSchema.methods.isActive = function () {
  return !this.revokedAt && this.expiresAt > new Date();
};

const RefreshToken =
  mongoose.models.RefreshToken || model('RefreshToken', RefreshTokenSchema);

export default RefreshToken;
