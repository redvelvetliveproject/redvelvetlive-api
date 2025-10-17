// backend/src/models/Payment.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const CURRENCIES = ['ONECOP', 'USDT'];
const STATUSES = ['pending', 'confirmed', 'failed', 'refunded', 'canceled'];

const PaymentSchema = new Schema(
  {
    // 🔗 Relaciones
    fromUserId: { type: Types.ObjectId, ref: 'User', required: true },
    toUserId:   { type: Types.ObjectId, ref: 'User', required: true },

    // 💵 Valores
    amount:       { type: Number, required: true, min: 0.000001 },
    currency:     { type: String, enum: CURRENCIES, required: true },
    usdEstimated: { type: Number, min: 0 },

    // ⛓️ On-chain / gateways
    txHash:   { type: String, trim: true, sparse: true },     // no unique por si hay reintentos/reorgs
    chainId:  { type: Number },
    intentId: { type: String, trim: true, sparse: true },     // unique más abajo (centralizado)

    // 📌 Estado
    status: { type: String, enum: STATUSES, default: 'pending' },

    // 📝 Metadatos
    note: { type: String, trim: true, maxlength: 500 },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

/* ======================================================
   📚 Índices centralizados (evita duplicaciones)
   ====================================================== */

// Flujos típicos (pagos recibidos por modelo con filtro por estado/fecha)
PaymentSchema.index({ toUserId: 1, status: 1, createdAt: -1 });

// Historial por cliente
PaymentSchema.index({ fromUserId: 1, createdAt: -1 });

// Reportes por moneda y tiempo
PaymentSchema.index({ currency: 1, createdAt: -1 });

// Búsquedas directas
PaymentSchema.index({ txHash: 1 },   { unique: false, sparse: true });
// Evita duplicados de intentId (útil para idempotencia de gateways externos)
PaymentSchema.index({ intentId: 1 }, { unique: true,  sparse: true });

/* ======================================================
   🧩 Métodos de conveniencia
   ====================================================== */
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
