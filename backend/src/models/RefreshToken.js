// backend/src/models/RefreshToken.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

/**
 * Modelo para Refresh Tokens (rotación segura).
 * Guarda sólo hashes (nunca tokens en texto plano).
 */
const RefreshTokenSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true }, // hash(sha256)
    userAgent: { type: String, trim: true },
    ip: { type: String, trim: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// TTL index: elimina automáticamente al expirar
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Método de conveniencia
RefreshTokenSchema.methods.revoke = function () {
  this.revokedAt = new Date();
  return this.save();
};

const RefreshToken =
  mongoose.models.RefreshToken || model('RefreshToken', RefreshTokenSchema);
export default RefreshToken;