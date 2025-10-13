// backend/src/models/Payment.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const CURRENCIES = ['ONECOP', 'USDT'];
const STATUSES = ['pending', 'confirmed', 'failed', 'refunded', 'canceled'];

const PaymentSchema = new Schema(
  {
    fromUserId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    toUserId: { type: Types.ObjectId, ref: 'User', required: true, index: true },

    amount: { type: Number, required: true, min: 0.000001 },
    currency: { type: String, enum: CURRENCIES, required: true, index: true },
    usdEstimated: { type: Number, min: 0 },

    txHash: { type: String, trim: true, index: true, sparse: true },
    chainId: { type: Number },
    intentId: { type: String, trim: true, index: true, sparse: true },

    status: { type: String, enum: STATUSES, default: 'pending', index: true },

    note: { type: String, trim: true, maxlength: 500 },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Evita duplicados de intentId (útil para gateways externos)
PaymentSchema.index({ intentId: 1 }, { unique: true, sparse: true });

// Métodos de conveniencia
PaymentSchema.methods.markConfirmed = function () {
  this.status = 'confirmed';
  return this.save();
};

PaymentSchema.methods.markFailed = function () {
  this.status = 'failed';
  return this.save();
};

const Payment =
  mongoose.models.Payment || model('Payment', PaymentSchema);
export default Payment;