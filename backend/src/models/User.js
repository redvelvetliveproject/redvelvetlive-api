// backend/src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import slugify from 'slugify';

const { Schema, model } = mongoose;

const ROLES = ['client', 'model', 'admin'];
const LOCALES = ['es', 'en'];
const STATUSES = ['active', 'inactive', 'banned'];

const PreferencesSchema = new Schema(
  {
    locale: { type: String, enum: LOCALES, default: 'es' },
    notifications: {
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

const SocialLinksSchema = new Schema(
  {
    instagram: String,
    twitter: String,
    onlyfans: String,
    website: String,
  },
  { _id: false }
);

const AvatarSchema = new Schema(
  {
    small: { type: String, default: '' },
    large: { type: String, default: '' },
  },
  { _id: false }
);

const GallerySchema = new Schema(
  {
    url: { type: String, required: true },
    caption: { type: String },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    // 👤 Identidad
    name: { type: String, trim: true, minlength: 2, maxlength: 120, required: true },

    // 🌐 Perfil SEO (unique crea su propio índice)
    slug: { type: String, unique: true },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'],
    },
    password: {
      type: String,
      select: false,
      minlength: 8,
    },
    wallet: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'],
    },

    // 🔐 Control (sin index en campos; se indexa al final)
    role: { type: String, enum: ROLES, default: 'client' },
    status: { type: String, enum: STATUSES, default: 'active' },

    // 🌍 Configuración
    locale: { type: String, enum: LOCALES, default: 'es' },
    country: { type: String, uppercase: true, maxlength: 2 }, // ISO-2
    preferences: { type: PreferencesSchema, default: undefined },

    // 📜 Perfil público
    bio: { type: String, maxlength: 300 },
    socialLinks: { type: SocialLinksSchema, default: {} },

    // 📸 Imagen
    avatar: { type: AvatarSchema, default: {} },
    gallery: { type: [GallerySchema], default: [] }, // 📁 Hasta 5 fotos públicas

    // 📊 Métricas
    stats: {
      followers: { type: Number, default: 0 },
      tips: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      streamingMinutes: { type: Number, default: 0 }, // ⏱️
    },
    popularity: { type: Number, default: 0 }, // Calculado automático

    // 🕐 Sesiones
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 🔐 Hash + slug + popularidad
UserSchema.pre('save', async function (next) {
  // Slug automático SEO-friendly
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(`rvl-${this.name}`, { lower: true, strict: true });
  }

  // Cálculo automático de popularidad
  const f = this.stats?.followers ?? 0;
  const t = this.stats?.tips ?? 0;
  this.popularity = f * 2 + t;

  // Hash de contraseña
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// Métodos
UserSchema.methods.comparePassword = async function (candidate = '') {
  return this.password ? bcrypt.compare(candidate, this.password) : false;
};

UserSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    email: this.email,
    wallet: this.wallet,
    role: this.role,
    status: this.status,
    locale: this.locale,
    country: this.country,
    bio: this.bio,
    socialLinks: this.socialLinks,
    avatar: this.avatar,
    gallery: this.gallery,
    stats: this.stats,
    popularity: this.popularity,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// =========================
// 📚 Índices centralizados
// =========================

// Búsqueda de perfiles
UserSchema.index({ name: 'text', slug: 'text' });

// Filtros comunes en listados/analytics
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ country: 1, locale: 1, popularity: -1 });

// Nota: email / wallet / slug ya son `unique` en el campo (no repetir aquí).

const User = mongoose.models.User || model('User', UserSchema);
export default User;
