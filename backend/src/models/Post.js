// backend/src/models/Post.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

/**
 * Post (versión PRO)
 * - Sin index en campos; índices centralizados al final.
 * - Timestamps de Mongoose gestionan createdAt/updatedAt.
 * - Slug único.
 */
const PostSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true },
    summary: { type: String, trim: true, maxlength: 500 },
    tags: { type: [String], default: [] },
    author: { type: String, default: 'RedVelvetLive' },

    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Normalización ligera de tags y publishedAt
PostSchema.pre('save', function (next) {
  if (Array.isArray(this.tags)) {
    const clean = this.tags
      .filter(Boolean)
      .map((t) => String(t).trim().toLowerCase())
      .filter((t) => t.length > 0);
    this.tags = [...new Set(clean)];
  }
  if (this.isModified('published')) {
    if (this.published && !this.publishedAt) this.publishedAt = new Date();
    if (!this.published) this.publishedAt = null;
  }
  next();
});

/* ===========================
   Índices centralizados
   =========================== */

// Listados públicos: publicados primero, orden reciente
PostSchema.index({ published: 1, publishedAt: -1, createdAt: -1 });

// (Opcional) Si filtras por tag con frecuencia, descomenta este índice:
// PostSchema.index({ tags: 1 });

// (Opcional) Índice de texto para búsquedas en title/content/summary:
// PostSchema.index({ title: 'text', content: 'text', summary: 'text' });

const Post = mongoose.models.Post || model('Post', PostSchema);
export default Post;
