// backend/src/models/Tip.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const CURRENCIES = ['ONECOP', 'USDT'];

const TipSchema = new Schema(
  {
    fromUserId: { type: Types.ObjectId, ref: 'User', required: true, index: true }, // cliente
    toUserId:   { type: Types.ObjectId, ref: 'User', required: true, index: true }, // modelo
    amount:     { type: Number, required: true, min: 0.000001 },
    currency:   { type: String, enum: CURRENCIES, required: true, index: true },

    paymentId:  { type: Types.ObjectId, ref: 'Payment', index: true },
    txHash:     { type: String, trim: true, index: true, sparse: true },

    note: { type: String, trim: true, maxlength: 280 },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Índices útiles para analítica
TipSchema.index({ toUserId: 1, createdAt: -1 });
TipSchema.index({ fromUserId: 1, createdAt: -1 });

// JSON seguro
TipSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    fromUserId: this.fromUserId,
    toUserId: this.toUserId,
    amount: this.amount,
    currency: this.currency,
    note: this.note,
    createdAt: this.createdAt,
  };
};

const Tip = mongoose.models.Tip || model('Tip', TipSchema);
export default Tip;