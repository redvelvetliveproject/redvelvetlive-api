// backend/src/models/Model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const modelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
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
    popularity: { type: Number, default: 0 }, // índice centralizado abajo

    // 🔐 Control de cuenta
    verified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 🧠 Pre-save hook: calcula popularidad automáticamente
modelSchema.pre("save", function (next) {
  const followers = this.stats?.followers ?? 0;
  const tips = this.stats?.tips ?? 0;
  const views = this.stats?.views ?? 0;
  this.popularity = followers * 1 + tips * 2 + views * 0.5;
  next();
});

// Índices centralizados
modelSchema.index({ popularity: -1 }); // ordena por popularidad descendente

const Model = mongoose.models.Model || model("Model", modelSchema);
export default Model;
