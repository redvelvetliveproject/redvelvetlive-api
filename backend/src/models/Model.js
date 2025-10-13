// backend/src/models/Model.js
import mongoose from "mongoose";

const modelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    bio: { type: String, default: "" },
    wallet: { type: String, required: true, trim: true },

    // 🌍 Datos geográficos y de idioma
    country: { type: String, default: "Colombia" },
    locale: { type: String, default: "es" },

    // 🖼️ Imagen de perfil y galería
    avatar: {
      small: { type: String, default: "/assets/img/default-avatar.webp" },
      large: { type: String, default: "/assets/img/default-avatar.webp" },
    },
    gallery: [{ type: String }],

    // 🎥 Streaming
    playbackId: { type: String, default: "" }, // Livepeer ID
    isOnline: { type: Boolean, default: false },

    // 🌐 Redes sociales
    socialLinks: {
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true },
      onlyfans: { type: String, trim: true },
      website: { type: String, trim: true },
    },

    // 📊 Estadísticas y popularidad
    stats: {
      followers: { type: Number, default: 0 },
      tips: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
    },
    popularity: {
      type: Number,
      default: 0,
      index: true,
    },

    // 🔐 Control de cuenta
    verified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },

    // 📅 Fechas automáticas
  },
  { timestamps: true }
);

// 🧠 Pre-save hook: calcula popularidad automáticamente
modelSchema.pre("save", function (next) {
  const followers = this.stats.followers || 0;
  const tips = this.stats.tips || 0;
  const views = this.stats.views || 0;

  // Fórmula simple pero escalable
  this.popularity = followers * 1 + tips * 2 + views * 0.5;
  next();
});

export default mongoose.model("Model", modelSchema);