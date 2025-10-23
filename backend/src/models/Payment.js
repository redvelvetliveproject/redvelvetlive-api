// backend/src/models/Payment.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const CURRENCIES = ['ONECOP', 'USDT'];
const STATUSES = ['pending', 'confirmed', 'failed', 'refunded', 'canceled'];

const PaymentSchema = new Schema(
  {
    fromUserId: { type: Types.ObjectId, ref: 'User', required: true },
    toUserId:   { type: Types.ObjectId, ref: 'User', required: true },
    amount:     { type: Number, required: true, min: 0.000001 },
    currency:   { type: String, enum: CURRENCIES, required: true },
    usdEstimated: { type: Number, min: 0 },
    txHash:     { type: String, trim: true },
    chainId:    { type: Number },
    intentId:   { type: String, trim: true },
    status:     { type: String, enum: STATUSES, default: 'pending' },
    note:       { type: String, trim: true, maxlength: 500 },
    meta:       { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

/* ================================
   📚 Índices centralizados (solo)
   ================================ */
PaymentSchema.index({ toUserId: 1, status: 1, createdAt: -1 });
PaymentSchema.index({ fromUserId: 1, createdAt: -1 });
PaymentSchema.index({ currency: 1, createdAt: -1 });
PaymentSchema.index({ txHash: 1 },   { sparse: true });
PaymentSchema.index({ intentId: 1 }, { unique: true, sparse: true });

/* ================================
   🧩 Métodos convenientes
   ================================ */
PaymentSchema.methods.markConfirmed = function () {
  this.status = 'confirmed';
  return this.save();
};

PaymentSchema.methods.markFailed = function () {
  this.status = 'failed';
  return this.save();
};

const Payment = mongoose.models.Payment || model('Payment', PaymentSchema);
export default Payment;
