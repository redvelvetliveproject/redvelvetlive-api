// backend/src/models/Stream.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const STREAM_STATUS = ['idle', 'live', 'ended', 'error'];

const StreamSchema = new Schema(
  {
    // 🔗 Relación
    userId: { type: Types.ObjectId, ref: 'User', required: true },

    // 🎥 Datos del proveedor (Livepeer u otros)
    name: { type: String, trim: true, maxlength: 140 },
    provider: { type: String, default: 'livepeer' },

    // 🆔 IDs del proveedor (pueden ser nulos → índices sparse)
    assetId:    { type: String, trim: true, sparse: true },
    streamId:   { type: String, trim: true, sparse: true },
    playbackId: { type: String, trim: true, sparse: true },

    // 📌 Estado
    status: { type: String, enum: STREAM_STATUS, default: 'idle' },
    isRecorded: { type: Boolean, default: false },

    // 📊 Métricas
    viewersPeak: { type: Number, default: 0, min: 0 },
    durationSec: { type: Number, default: 0, min: 0 },

    // 📝 Metadata adicional
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

/* ======================================================
   📚 Índices centralizados (evita duplicaciones)
   ====================================================== */

// Listados típicos por usuario/estado/fecha
StreamSchema.index({ userId: 1, status: 1, createdAt: -1 });

// Filtrado por proveedor + estado (monitoring/backoffice)
StreamSchema.index({ provider: 1, status: 1, createdAt: -1 });

// Búsquedas directas por IDs del proveedor
StreamSchema.index({ playbackId: 1 }, { sparse: true });
StreamSchema.index({ streamId: 1 },  { sparse: true });
StreamSchema.index({ assetId: 1 },   { sparse: true });

// VOD / grabaciones recientes
StreamSchema.index({ isRecorded: 1, createdAt: -1 });

/* ======================================================
   🧩 Métodos de conveniencia
   ====================================================== */
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
