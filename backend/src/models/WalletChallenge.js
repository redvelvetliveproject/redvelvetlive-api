// backend/src/models/WalletChallenge.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

/**
 * WalletChallenge (versión PRO)
 * Verifica control de una wallet mediante un desafío firmado.
 */
const WalletChallengeSchema = new Schema(
  {
    userId:   { type: Types.ObjectId, ref: 'User', required: true },
    walletId: { type: Types.ObjectId, ref: 'Wallet', required: true },

    address: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'],
    },

    // Mensaje exacto a firmar (ej.: nonce + timestamp)
    challenge: { type: String, required: true },

    // Firma opcional guardada para auditoría
    signature: { type: String, trim: true },

    // Estado (si ya se usó)
    used:     { type: Boolean, default: false },

    // Expiración absoluta; TTL lo gestiona el índice
    expiresAt: { type: Date, required: true },

    // Datos extra (UA, IP, etc.)
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

/* ===========================
   Índices centralizados
   =========================== */

// TTL exacto: elimina el doc cuando se alcance expiresAt
WalletChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Búsquedas por usuario/wallet y orden por fecha
WalletChallengeSchema.index({ userId: 1, walletId: 1, createdAt: -1 });

// Consultas por estado y fecha de expiración (para limpiar o listar pendientes)
WalletChallengeSchema.index({ used: 1, expiresAt: 1 });

// Búsqueda directa por address (para validaciones/lookups)
WalletChallengeSchema.index({ address: 1 });

// Regla de negocio: solo un reto “sin usar” por wallet simultáneamente
WalletChallengeSchema.index(
  { walletId: 1 },
  {
    unique: true,
    partialFilterExpression: { used: false },
  }
);

/* ===========================
   Métodos de instancia
   =========================== */
WalletChallengeSchema.methods.markUsed = function () {
  this.used = true;
  return this.save();
};

WalletChallengeSchema.methods.isExpired = function () {
  return this.expiresAt <= new Date();
};

const WalletChallenge =
  mongoose.models.WalletChallenge || model('WalletChallenge', WalletChallengeSchema);
export default WalletChallenge;
