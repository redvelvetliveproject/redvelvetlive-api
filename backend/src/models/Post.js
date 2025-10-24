// backend/src/models/RefreshToken.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const RefreshTokenSchema = new Schema(
  {
    userId:     { type: Types.ObjectId, ref: 'User', required: true },
    tokenHash:  { type: String, required: true, unique: true },
    userAgent:  { type: String, trim: true },
    ip:         { type: String, trim: true },
    expiresAt:  { type: Date, required: true },
    revokedAt:  { type: Date },
    meta:       { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

/* =============================
   📚 Índices centralizados
   ============================= */
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userId: 1 });

/* =============================
   🧠 Métodos de instancia
   ============================= */
RefreshTokenSchema.methods.revoke = function () {
  this.revokedAt = new Date();
  return this.save();
};

RefreshTokenSchema.methods.isActive = function () {
  return !this.revokedAt && this.expiresAt > new Date();
};

const RefreshToken = mongoose.models.RefreshToken || model('RefreshToken', RefreshTokenSchema);
export default RefreshToken;
