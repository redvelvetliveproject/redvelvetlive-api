// backend/src/models/Subscription.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const SUB_STATUS = ['active', 'past_due', 'canceled', 'expired'];

const SubscriptionSchema = new Schema(
  {
    clientId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    modelId: { type: Types.ObjectId, ref: 'User', required: true, index: true },

    period: { type: String, enum: ['month'], default: 'month' },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },

    status: { type: String, enum: SUB_STATUS, default: 'active', index: true },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },

    provider: { type: String, trim: true }, // ej: 'stripe' | 'onchain'
    externalId: { type: String, trim: true, index: true, sparse: true },

    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Un cliente no puede tener más de una subscripción activa a la misma modelo
SubscriptionSchema.index({ clientId: 1, modelId: 1 }, { unique: true });

// Helpers para renovar o cancelar
SubscriptionSchema.methods.cancel = function () {
  this.status = 'canceled';
  return this.save();
};

const Subscription =
  mongoose.models.Subscription || model('Subscription', SubscriptionSchema);
export default Subscription;