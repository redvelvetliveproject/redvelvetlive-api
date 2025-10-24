// backend/src/models/Post.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const PostSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
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

// Normalización de tags y fechas
PostSchema.pre('save', function (next) {
  if (Array.isArray(this.tags)) {
    this.tags = [...new Set(
      this.tags
        .filter(Boolean)
        .map(t => String(t).trim().toLowerCase())
        .filter(t => t.length > 0)
    )];
  }
  if (this.isModified('published')) {
    this.publishedAt = this.published ? new Date() : null;
  }
  next();
});

/* =============================
   📚 Índices centralizados
   ============================= */
PostSchema.index({ published: 1, publishedAt: -1, createdAt: -1 });
// PostSchema.index({ tags: 1 }); // opcional si filtras por tag
// PostSchema.index({ title: 'text', content: 'text', summary: 'text' }); // búsqueda textual

const Post = mongoose.models.Post || model('Post', PostSchema);
export default Post;
