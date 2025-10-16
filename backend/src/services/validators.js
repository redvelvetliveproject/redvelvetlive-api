// ============================================
// 🧠 RedVelvetLive — Validators PRO FINAL INTEGRADO
// ============================================
//
// Funciones reutilizables para validar datos críticos
// en modelos, pagos, autenticación, SEO y contenido.
//
// Incluye:
//   ✅ Wallets BSC / ETH
//   ✅ ObjectId (MongoDB)
//   ✅ Montos numéricos positivos
//   ✅ Emails y URLs
//   ✅ Nombres y slugs SEO
//   ✅ Sanitización y formato de fechas
// ============================================

import mongoose from "mongoose";

/* ======================================================
   🔗 Validar dirección de wallet (BSC / ETH)
   ====================================================== */
export const validateWallet = (address) => {
  if (!address || typeof address !== "string") return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
};

/* ======================================================
   🧩 Validar ObjectId de MongoDB
   ====================================================== */
export const validateObjectId = (id) => {
  try {
    return mongoose.Types.ObjectId.isValid(id);
  } catch {
    return false;
  }
};

/* ======================================================
   💵 Validar monto numérico positivo
   ====================================================== */
export const validateAmount = (value) => {
  if (value === null || value === undefined) return false;
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

/* ======================================================
   ✉️ Validar email
   ====================================================== */
export const validateEmail = (email) => {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.toLowerCase());
};

/* ======================================================
   🌐 Validar URL (para redes sociales, imágenes o links)
   ====================================================== */
export const validateURL = (url) => {
  if (!url) return false;
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocolo opcional
      "((([a-zA-Z0-9\\-])+\\.)+[a-zA-Z]{2,})" + // dominio
      "(\\/[a-zA-Z0-9@:%_\\+.~#?&//=\\-]*)?$",
    "i"
  );
  return pattern.test(url.trim());
};

/* ======================================================
   🧩 Validar slug SEO (para modelos, posts, etc.)
   ====================================================== */
export const validateSlug = (slug) => {
  if (!slug) return false;
  const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // ej: valeria-gomez-23
  return regex.test(slug.trim());
};

/* ======================================================
   🧍‍♀️ Validar nombre o texto corto
   ====================================================== */
export const validateName = (name) => {
  if (!name) return false;
  return /^[a-zA-ZÀ-ÿ\s.'-]{2,50}$/.test(name.trim());
};

/* ======================================================
   🧼 Sanitizar texto HTML
   ====================================================== */
export const sanitizeText = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<[^>]*>?/gm, "").trim();
};

/* ======================================================
   🕒 Formatear fecha legible
   ====================================================== */
export const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ======================================================
   🧩 Exportación centralizada
   ====================================================== */
export default {
  validateWallet,
  validateObjectId,
  validateAmount,
  validateEmail,
  validateURL,
  validateSlug,
  validateName,
  sanitizeText,
  formatDate,
};
