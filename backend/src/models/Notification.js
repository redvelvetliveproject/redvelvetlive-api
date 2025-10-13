// backend/src/models/Notification.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const NotificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, index: true }, // 'payment', 'tip', 'system', etc.
    title: { type: String, trim: true, maxlength: 140 },
    body: { type: String, trim: true, maxlength: 2000 },
    data: { type: Schema.Types.Mixed }, // payload libre
    readAt: { type: Date, index: true },
  },
  { timestamps: true }
);

// Index compuesto: primero no leídas, luego recientes
NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

// Método de conveniencia para marcar como leído
NotificationSchema.methods.markAsRead = function () {
  this.readAt = new Date();
  return this.save();
};

const Notification =
  mongoose.models.Notification || model('Notification', NotificationSchema);
export default Notification;