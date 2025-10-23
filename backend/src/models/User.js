// backend/src/models/ModelUser.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

// ============================================================
// 🧩 Esquema base de ModelUser (para modelos/performers)
// ============================================================
const modelUserSchema = new Schema(
  {
    // 👤 Información general
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true },
    country: { type: String, trim: true, default: "Desconocido" },
    age: { type: Number, min: 18, max: 80 },
    bio: { type: String, trim: true, maxlength: 500 },

    // 🪙 Wallet y blockchain
    wallet: { type: String, required: true, trim: true, lowercase: true },
    network: { type: String, default: "BSC" },

    // 🧭 Estado general
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "BANNED"], default: "INACTIVE" },

    // 🌟 Roles especiales
    featured: { type: Boolean, default: false },
    ambassador: { type: Boolean, default: false },

    // 📸 Contenido y estadísticas
    avatarUrl: String,
    bannerUrl: String,
    totalEarnings: { type: Number, default: 0, min: 0 },
    followers: { type: Number, default: 0, min: 0 },
    liveStatus: { type: String, enum: ["OFFLINE", "ONLINE", "VOICE_ONLY"], default: "OFFLINE" },

    // 🕒 Metadatos y seguridad
    metadata: {
      lastLogin: Date,
      lastStream: Date,
      notes: String,
    },

    // 🔐 Campos internos
    passwordHash: { type: String, select: false },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "ModelUser" },
  },
  {
    timestamps: true, // createdAt y updatedAt automáticos
    versionKey: false,
  }
);

// ============================================================
// 🧠 Índices centralizados y optimizaciones
// ============================================================

// Búsqueda de texto por nombre, país o wallet
modelUserSchema.index({ name: "text", country: "text", wallet: "text" });

// Índices individuales para email y wallet
modelUserSchema.index({ email: 1 });
modelUserSchema.index({ wallet: 1 });

// Índice compuesto para filtros por estado y roles especiales
modelUserSchema.index({ status: 1, featured: 1, ambassador: 1 });

// ============================================================
// ⚙️ Métodos personalizados
// ============================================================
modelUserSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    country: this.country,
    wallet: this.wallet,
    status: this.status,
    featured: this.featured,
    ambassador: this.ambassador,
    avatarUrl: this.avatarUrl,
    bannerUrl: this.bannerUrl,
    liveStatus: this.liveStatus,
    totalEarnings: this.totalEarnings,
  };
};

modelUserSchema.methods.toggleFeature = async function (featured) {
  this.featured = featured;
  this.updatedAt = new Date();
  await this.save();
  return this;
};

modelUserSchema.methods.toggleAmbassador = async function (ambassador) {
  this.ambassador = ambassador;
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// ============================================================
// 🧾 Exportación
// ============================================================
const ModelUser = mongoose.models.ModelUser || model("ModelUser", modelUserSchema);
export default ModelUser;
