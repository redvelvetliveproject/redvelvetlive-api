// ============================================
// 🔐 RedVelvetLive — Rutas de Autenticación Admin (PRO FINAL)
// ============================================
//
// Controla el acceso administrativo al panel y las rutas protegidas.
//
// Incluye:
//   ✅ /api/admin/login    → login con ADMIN_EMAIL + ADMIN_SECRET_KEY
//   ✅ /api/admin/verify   → verifica token JWT activo
//   ✅ /api/admin/logout   → cierra sesión (borra cookie)
//
// Requiere:
//   - controllers/admin.auth.controller.js
//   - middleware/adminAuth.js
// ============================================

import express from "express";
import {
  loginAdmin,
  verifyToken,
  logoutAdmin,
} from "../controllers/admin.auth.controller.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// ============================================
// 🧩 Rutas Públicas (sin token)
// ============================================

/**
 * 🔑 POST /api/admin/login
 * Inicia sesión administrativa
 * Requiere body: { email, key }
 */
router.post("/login", loginAdmin);

// ============================================
// 🔒 Rutas Protegidas (requieren token JWT válido)
// ============================================

/**
 * ✅ GET /api/admin/verify
 * Verifica que el token JWT actual sea válido.
 * Usa middleware adminAuth.
 */
router.get("/verify", adminAuth, verifyToken);

/**
 * 🚪 POST /api/admin/logout
 * Cierra sesión y elimina cookie del navegador.
 */
router.post("/logout", adminAuth, logoutAdmin);

export default router;
