// backend/src/models/Tip.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const CURRENCIES = ['ONECOP', 'USDT'];

const TipSchema = new Schema(
  {
    // 🔗 Relaciones
    fromUserId: { type: Types.ObjectId, ref: 'User', required: true }, // cliente
    toUserId:   { type: Types.ObjectId, ref: 'User', required: true }, // modelo
    paymentId:  { type: Types.ObjectId, ref: 'Payment' },

    // 💸 Datos del tip
    amount:   { type: Number, required: true, min: 0.000001 },
    currency: { type: String, enum: CURRENCIES, required: true },
    txHash:   { type: String, trim: true, sparse: true },

    // 📝 Extra
    note: { type: String, trim: true, maxlength: 280 },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

/* ======================================================
   📚 Índices centralizados (evita duplicaciones)
   ====================================================== */

// Listados y analítica principales
TipSchema.index({ toUserId: 1, createdAt: -1 });
TipSchema.index({ fromUserId: 1, createdAt: -1 });

// Reportes por moneda y tiempo
TipSchema.index({ currency: 1, createdAt: -1 });

// Vínculo con pagos y lookup directo
TipSchema.index({ paymentId: 1 });
TipSchema.index({ txHash: 1 }, { sparse: true });

/* ======================================================
   🔒 JSON seguro
   ====================================================== */
TipSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    fromUserId: this.fromUserId,
    toUserId: this.toUserId,
    paymentId: this.paymentId,
    amount: this.amount,
    currency: this.currency,
    txHash: this.txHash,
    note: this.note,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Tip = mongoose.models.Tip || model('Tip', TipSchema);
export default Tip;
