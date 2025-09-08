// backend/src/models/PaymentOrder.js
import mongoose from 'mongoose';

const PaymentOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, index: true, unique: true },
    token: { type: String, enum: ['USDT', 'ONECOP'], required: true },
    tokenContract: { type: String, required: true },
    treasury: { type: String, required: true },
    amountWei: { type: String, required: true }, // string decimal (wei)
    from: { type: String }, // opcional (si pides dirección del pagador)
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending', index: true },

    // on-chain data
    txHash: { type: String },
    txBlockNumber: { type: Number },
    seenConfirmations: { type: Number, default: 0 },

    // metadatos
    meta: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.models.PaymentOrder || mongoose.model('PaymentOrder', PaymentOrderSchema);
