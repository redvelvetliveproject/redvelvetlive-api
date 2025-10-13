// backend/src/models/WalletChallenge.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

/**
 * WalletChallenge:
 * - Guarda un reto firmado (personal_sign) para verificar control de la wallet.
 * - Asociado a un usuario y una wallet concreta.
 * - Expira automáticamente según `expiresAt`.
 */
const WalletChallengeSchema = new Schema(
  {
    userId:   { type: Types.ObjectId, ref: 'User', required: true, index: true },
    walletId: { type: Types.ObjectId, ref: 'Wallet', required: true, index: true },

    address: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'],
    },

    challenge: { type: String, required: true }, // mensaje exacto que se firma
    used:      { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// Índices útiles
WalletChallengeSchema.index({ userId: 1, walletId: 1, used: 1 });
WalletChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // limpieza automática

// Helper para marcar como usada
WalletChallengeSchema.methods.markUsed = function () {
  this.used = true;
  return this.save();
};

const WalletChallenge =
  mongoose.models.WalletChallenge || model('WalletChallenge', WalletChallengeSchema);

export default WalletChallenge;