// backend/src/models/Wallet.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const WalletSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    address: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'],
    },
    isPrimary: { type: Boolean, default: false, index: true },
    isVerified: { type: Boolean, default: false, index: true },
    chainId: { type: Number, default: 56 }, // BSC mainnet
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

WalletSchema.index({ userId: 1, address: 1 }, { unique: true });

// Helper: marcar como primaria
WalletSchema.methods.setPrimary = async function () {
  await this.constructor.updateMany({ userId: this.userId }, { isPrimary: false });
  this.isPrimary = true;
  return this.save();
};

const Wallet = mongoose.models.Wallet || model('Wallet', WalletSchema);
export default Wallet;