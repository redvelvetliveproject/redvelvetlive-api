/**
 * 🧠 RedVelvetLive — Validators PRO FINAL
 * ------------------------------------------------
 * Funciones reutilizables para validar datos críticos
 * en modelos, pagos, autenticación y contenido.
 */

import mongoose from "mongoose";

/* =====================================
   🔹 Validación de ObjectId (MongoDB)
   ===================================== */
export const validateObjectId = (id) => {
  try {
    return mongoose.Types.ObjectId.isValid(id);
  } catch {
    return false;
  }
};

/* =====================================
   🔹 Validación de direcciones BSC / ETH
   ===================================== */
export const validateWallet = (address) => {
  if (!address || typeof address !== "string") return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
};

/* =====================================
   🔹 Validación de email
   ===================================== */
export const validateEmail = (email) => {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.toLowerCase());
};

/* =====================================
   🔹 Validación de slug SEO (modelos, posts)
   ===================================== */
export const validateSlug = (slug) => {
  if (!slug) return false;
  const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // ejemplo: valeria-gomez-23
  return regex.test(slug.trim());
};

/* =====================================
   🔹 Validación de montos o números positivos
   ===================================== */
export const validateAmount = (value) => {
  if (value === null || value === undefined) return false;
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

/* =====================================
   🔹 Validación de URLs (para redes sociales)
   ===================================== */
export const validateURL = (url) => {
  if (!url) return false;
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocolo opcional
      "((([a-zA-Z0-9\\-])+\\.)+[a-zA-Z]{2,})" + // dominio
      "(\\/[a-zA-Z0-9@:%_\\+.~#?&//=\\-]*)?$",
    "i"
  );
  return pattern.test(url);
};

/* =====================================
   🔹 Validación general para nombre o texto
   ===================================== */
export const validateName = (name) => {
  if (!name) return false;
  return /^[a-zA-ZÀ-ÿ\s.'-]{2,50}$/.test(name.trim());
};

/* =====================================
   🧩 Exportación centralizada
   ===================================== */
export default {
  validateObjectId,
  validateWallet,
  validateEmail,
  validateSlug,
  validateAmount,
  validateURL,
  validateName,
};
