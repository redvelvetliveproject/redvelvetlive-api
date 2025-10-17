// backend/src/models/Subscription.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const SUB_STATUS = ['active', 'past_due', 'canceled', 'expired'];

const SubscriptionSchema = new Schema(
  {
    // 🔗 Relación
    clientId: { type: Types.ObjectId, ref: 'User', required: true },
    modelId:  { type: Types.ObjectId, ref: 'User', required: true },

    // 💳 Plan
    period:   { type: String, enum: ['month'], default: 'month' },
    price:    { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },

    // 📌 Estado y vigencia
    status:              { type: String, enum: SUB_STATUS, default: 'active' },
    currentPeriodStart:  { type: Date, required: true },
    currentPeriodEnd:    { type: Date, required: true },

    // 🧩 Proveedor externo
    provider:   { type: String, trim: true },           // 'stripe' | 'onchain' | etc.
    externalId: { type: String, trim: true, sparse: true },

    // 📝 Metadatos
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

/* ======================================================
   📚 Índices centralizados (evita duplicaciones)
   ====================================================== */

// ✅ Regla de negocio: 1 suscripción ACTIVA por (clientId, modelId)
//    Se permite histórico con otros estados (canceled/expired/past_due).
SubscriptionSchema.index(
  { clientId: 1, modelId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' },
    name: 'uniq_active_client_model',
  }
);

// Listados del lado de la modelo (suscriptores)
SubscriptionSchema.index({ modelId: 1, status: 1, currentPeriodEnd: -1 }, { name: 'by_model_status_periodEnd' });

// Historial del cliente
SubscriptionSchema.index({ clientId: 1, createdAt: -1 }, { name: 'by_client_createdAt' });

// Cron de renovación / expiración (rápido por fecha)
SubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 }, { name: 'by_status_periodEnd' });

// Unicidad por proveedor externo (opcional pero recomendado)
SubscriptionSchema.index(
  { provider: 1, externalId: 1 },
  { unique: true, sparse: true, name: 'uniq_provider_externalId' }
);

/* ======================================================
   🧩 Helpers
   ====================================================== */

// Cancela la suscripción (deja histórico)
SubscriptionSchema.methods.cancel = function () {
  this.status = 'canceled';
  return this.save();
};

const Subscription = mongoose.models.Subscription || model('Subscription', SubscriptionSchema);
export default Subscription;
