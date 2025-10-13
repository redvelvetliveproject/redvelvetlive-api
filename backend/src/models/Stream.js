// backend/src/models/Stream.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const STREAM_STATUS = ['idle', 'live', 'ended', 'error'];

const StreamSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },

    // Datos Livepeer u otro proveedor
    name: { type: String, trim: true, maxlength: 140 },
    provider: { type: String, default: 'livepeer', index: true },

    // IDs del proveedor
    assetId: { type: String, trim: true, index: true, sparse: true },
    streamId: { type: String, trim: true, index: true, sparse: true },
    playbackId: { type: String, trim: true, index: true, sparse: true },

    // Estado
    status: { type: String, enum: STREAM_STATUS, default: 'idle', index: true },
    isRecorded: { type: Boolean, default: false },

    // Métricas
    viewersPeak: { type: Number, default: 0, min: 0 },
    durationSec: { type: Number, default: 0, min: 0 },

    // Metadata adicional
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Index para búsquedas rápidas
StreamSchema.index({ userId: 1, status: 1, createdAt: -1 });

// Métodos de conveniencia
StreamSchema.methods.start = function () {
  this.status = 'live';
  return this.save();
};

StreamSchema.methods.end = function () {
  this.status = 'ended';
  return this.save();
};

const Stream = mongoose.models.Stream || model('Stream', StreamSchema);
export default Stream;