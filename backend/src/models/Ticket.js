// backend/src/models/Ticket.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const TICKET_STATUS  = ['open', 'pending', 'closed'];
const TICKET_CATEGORY = ['general', 'wallet', 'account', 'payments', 'abuse', 'dmca', 'other'];

const TicketSchema = new Schema(
  {
    // 🔗 Relación (opcional si el usuario no está logueado)
    userId: { type: Types.ObjectId, ref: 'User' },

    // 👤 Contacto
    name:  { type: String, trim: true, minlength: 2, maxlength: 120, required: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'],
    },

    // 🏷️ Clasificación
    category: { type: String, enum: TICKET_CATEGORY, default: 'general' },

    // 📨 Contenido
    message: { type: String, trim: true, minlength: 10, maxlength: 5000, required: true },

    // 📌 Gestión interna
    status:      { type: String, enum: TICKET_STATUS, default: 'open' },
    assignedTo:  { type: String, trim: true },
    internalNotes:{ type: String, trim: true },

    // 🧩 Metadatos (UA, lang, tz, ip, etc.)
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

/* ======================================================
   📚 Índices centralizados (evita duplicaciones)
   ====================================================== */

// Cola por estado y fecha (para backoffice)
TicketSchema.index({ status: 1, createdAt: -1 }, { name: 'by_status_createdAt' });

// Historial de soporte por usuario
TicketSchema.index({ userId: 1, createdAt: -1 }, { name: 'by_user_createdAt' });

// Reportes por categoría/estado
TicketSchema.index(
  { category: 1, status: 1, createdAt: -1 },
  { name: 'by_category_status_createdAt' }
);

// Búsqueda por email con orden temporal
TicketSchema.index({ email: 1, createdAt: -1 }, { name: 'by_email_createdAt' });

// Búsqueda de texto completo
TicketSchema.index(
  { message: 'text', internalNotes: 'text', name: 'text', email: 'text' },
  { name: 'text_search_ticket' }
);

/* ======================================================
   🧩 Métodos de conveniencia (opcional)
   ====================================================== */
TicketSchema.methods.close = function () {
  this.status = 'closed';
  return this.save();
};

TicketSchema.methods.assignTo = function (agentEmail) {
  this.assignedTo = agentEmail;
  if (this.status === 'open') this.status = 'pending';
  return this.save();
};

const Ticket = mongoose.models.Ticket || model('Ticket', TicketSchema);
export default Ticket;
