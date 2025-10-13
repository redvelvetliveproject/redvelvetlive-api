// backend/src/models/Post.js
import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // búsqueda rápida por slug
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true },
    summary: { type: String, trim: true, maxlength: 500 },
    tags: { type: [String], default: [], index: true },
    author: { type: String, default: 'RedVelvetLive' },

    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Middleware: actualizar `updatedAt` en cada save
PostSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
export default Post;