// backend/src/models/Ticket.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const TICKET_STATUS = ['open', 'pending', 'closed'];
const TICKET_CATEGORY = [
  'general',
  'wallet',
  'account',
  'payments',
  'abuse',
  'dmca',
  'other',
];

const TicketSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', index: true },

    name: { type: String, trim: true, minlength: 2, maxlength: 120, required: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'],
    },

    category: { type: String, enum: TICKET_CATEGORY, default: 'general', index: true },
    message: { type: String, trim: true, minlength: 10, maxlength: 5000, required: true },

    status: { type: String, enum: TICKET_STATUS, default: 'open', index: true },
    assignedTo: { type: String, trim: true }, // correo/usuario interno
    internalNotes: { type: String, trim: true },

    meta: { type: Schema.Types.Mixed }, // datos como UA, lang, tz
  },
  { timestamps: true }
);

// Búsqueda por texto para backoffice
TicketSchema.index({
  message: 'text',
  internalNotes: 'text',
  name: 'text',
  email: 'text',
});

const Ticket = mongoose.models.Ticket || model('Ticket', TicketSchema);
export default Ticket;