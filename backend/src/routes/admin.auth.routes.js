// ============================================
// 🔐 RedVelvetLive — Autenticación Administrativa (PRO FINAL)
// ============================================
//
// Módulo de login seguro para el panel administrativo:
//   ✅ Login con ADMIN_EMAIL + ADMIN_SECRET_KEY (.env)
//   ✅ Token JWT con rol "admin" (vía cookie HTTP-only)
//   ✅ Verificación de sesión /admin/verify
//   ✅ Cierre de sesión /admin/logout
//
// Compatible con el middleware adminAuth.js
// ============================================

import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

/* ==========================================================
   ✅ 1️⃣ Login administrativo (POST /api/admin/login)
   ========================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, key } = req.body;

    // Validar credenciales del .env
    if (
      email !== process.env.ADMIN_EMAIL ||
      key !== process.env.ADMIN_SECRET_KEY
    ) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas.",
      });
    }

    // Crear token con duración de 12h
    const token = jwt.sign(
      { role: "admin", email, issuedAt: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    // Guardar cookie HTTP-only
    res.cookie("rvl_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 12 * 60 * 60 * 1000, // 12 horas
    });

    res.status(200).json({
      success: true,
      message: "Acceso concedido.",
      admin: { email },
      token,
    });
  } catch (error) {
    console.error("❌ Error en login admin:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al autenticar.",
      error: error.message,
    });
  }
});

/* ==========================================================
   ✅ 2️⃣ Verificar sesión activa (GET /api/admin/verify)
   ========================================================== */
router.get("/verify", async (req, res) => {
  try {
    const token =
      req.cookies?.rvl_admin_token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No se encontró token.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Token sin permisos administrativos.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sesión válida.",
      admin: { email: decoded.email },
    });
  } catch (error) {
    console.error("❌ Error verificando sesión:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Sesión expirada.",
      });
    }

    res.status(401).json({
      success: false,
      message: "Token inválido.",
    });
  }
});

/* ==========================================================
   ✅ 3️⃣ Logout (POST /api/admin/logout)
   ========================================================== */
router.post("/logout", (req, res) => {
  try {
    res.clearCookie("rvl_admin_token");
    res.status(200).json({
      success: true,
      message: "Sesión cerrada correctamente.",
    });
  } catch (error) {
    console.error("❌ Error al cerrar sesión:", error);
    res.status(500).json({
      success: false,
      message: "Error interno cerrando sesión.",
    });
  }
});

export default router;
