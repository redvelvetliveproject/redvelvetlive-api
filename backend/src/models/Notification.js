// backend/src/models/Notification.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

/**
 * Notification (versión PRO)
 * - Sin `index: true` en campos; índices centralizados al final.
 * - Campos flexibles (title/body/data) para payloads variados.
 */
const NotificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true }, // sin index en campo
    type: { type: String, required: true },                         // 'payment' | 'tip' | 'system' | ...
    title: { type: String, trim: true, maxlength: 140 },
    body: { type: String, trim: true, maxlength: 2000 },
    data: { type: Schema.Types.Mixed }, // payload libre (ids, links, etc.)
    readAt: { type: Date },             // sin index en campo
  },
  { timestamps: true }
);

/* ===========================
   Índices centralizados
   =========================== */
/** Listados por usuario/tipo, orden reciente */
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

/** (Opcional) Si filtras por leídas/no leídas recientes, habilita uno de estos: */
// Solo por estado de lectura
// NotificationSchema.index({ readAt: 1 });
// Prioriza no leídas del usuario, luego recientes
// NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

/* Helpers */
NotificationSchema.methods.markAsRead = function () {
  this.readAt = new Date();
  return this.save();
};

const Notification =
  mongoose.models.Notification || model('Notification', NotificationSchema);

export default Notification;
