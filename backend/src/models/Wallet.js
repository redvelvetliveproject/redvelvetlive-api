// backend/src/models/Wallet.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const WalletSchema = new Schema(
  {
    userId:  { type: Types.ObjectId, ref: 'User', required: true },

    address: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'],
    },

    isPrimary:  { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    chainId: { type: Number, default: 56 }, // BSC mainnet
    meta:    { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

/* ======================================================
   📚 Índices centralizados (evita duplicaciones)
   ====================================================== */

// Una misma dirección solo puede pertenecer una vez al mismo usuario
WalletSchema.index({ userId: 1, address: 1 }, { unique: true, name: 'uniq_user_wallet' });

// Listados/consultas habituales
WalletSchema.index({ userId: 1, isPrimary: 1 },  { name: 'by_user_primary' });
WalletSchema.index({ userId: 1, isVerified: 1 }, { name: 'by_user_verified' });

// Búsqueda directa por address (útil para validaciones/lookups)
WalletSchema.index({ address: 1 }, { name: 'by_address' });

/* ======================================================
   🧩 Helpers
   ====================================================== */

// Marca esta wallet como primaria y desmarca las demás del usuario
WalletSchema.methods.setPrimary = async function () {
  await this.constructor.updateMany(
    { userId: this.userId, _id: { $ne: this._id } },
    { $set: { isPrimary: false } }
  );
  this.isPrimary = true;
  return this.save();
};

const Wallet = mongoose.models.Wallet || model('Wallet', WalletSchema);
export default Wallet;
