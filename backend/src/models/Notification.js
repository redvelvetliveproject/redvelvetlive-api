// backend/src/models/Notification.js
import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

/**
 * Notification (versión PRO)
 * - Sin índices en campos; índices centralizados al final.
 * - Campos flexibles (title/body/data) para distintos tipos de notificación.
 */
const NotificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    title: { type: String, trim: true, maxlength: 140 },
    body: { type: String, trim: true, maxlength: 2000 },
    data: { type: Schema.Types.Mixed },
    readAt: { type: Date },
  },
  { timestamps: true }
);

/* ===========================
   Índices centralizados
   =========================== */
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

/**
 * Si necesitas filtrar por leídas/no leídas, puedes habilitar uno de estos:
 * - NotificationSchema.index({ readAt: 1 });
 * - NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
 */

/* Helper para marcar como leída */
NotificationSchema.methods.markAsRead = function () {
  this.readAt = new Date();
  return this.save();
};

const Notification =
  mongoose.models.Notification || model("Notification", NotificationSchema);
export default Notification;
