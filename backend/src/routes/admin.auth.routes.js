// ============================================
// 🔐 RedVelvetLive — Rutas de Autenticación Administrativa (PRO FINAL)
// ============================================
//
// Gestiona:
//   ✅ Login del administrador (email + clave .env)
//   ✅ Verificación del token JWT activo
//   ✅ Logout (borrado seguro de cookie)
//
// Usa los controladores:
//   - loginAdmin()
//   - verifyToken()
//   - logoutAdmin()
//
// Middleware:
//   - adminAuth.js → protege las rutas seguras
// ============================================

import express from "express";
import { loginAdmin, verifyToken, logoutAdmin } from "../controllers/admin.auth.controller.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// ============================================
// 🔑 1️⃣ LOGIN ADMINISTRATIVO
// ============================================
// POST /api/admin/login
// Entrada esperada: { email, key }
router.post("/login", loginAdmin);

// ============================================
// 🧩 2️⃣ VERIFICAR TOKEN ACTIVO
// ============================================
// GET /api/admin/verify
// Solo accesible si el token JWT es válido (via cookie o header)
router.get("/verify", adminAuth, verifyToken);

// ============================================
// 🚪 3️⃣ LOGOUT ADMINISTRATIVO
// ============================================
// POST /api/admin/logout
// Elimina cookie y finaliza sesión segura
router.post("/logout", logoutAdmin);

export default router;

