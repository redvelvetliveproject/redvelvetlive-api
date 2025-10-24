// backend/src/models/Stream.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const STREAM_STATUS = ['idle', 'live', 'ended', 'error'];

const StreamSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    name: { type: String, trim: true, maxlength: 140 },
    provider: { type: String, default: 'livepeer' },
    assetId: { type: String, trim: true, sparse: true },
    streamId: { type: String, trim: true, sparse: true },
    playbackId: { type: String, trim: true, sparse: true },
    status: { type: String, enum: STREAM_STATUS, default: 'idle' },
    isRecorded: { type: Boolean, default: false },
    viewersPeak: { type: Number, default: 0, min: 0 },
    durationSec: { type: Number, default: 0, min: 0 },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

/* =============================
   📚 Índices centralizados
   ============================= */
StreamSchema.index({ userId: 1, status: 1, createdAt: -1 });
StreamSchema.index({ provider: 1, status: 1, createdAt: -1 });
StreamSchema.index({ playbackId: 1 }, { sparse: true });
StreamSchema.index({ streamId: 1 }, { sparse: true });
StreamSchema.index({ assetId: 1 }, { sparse: true });
StreamSchema.index({ isRecorded: 1, createdAt: -1 });

/* =============================
   🧠 Métodos
   ============================= */
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
