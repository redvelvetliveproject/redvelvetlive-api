// ============================================
// 🔐 RedVelvetLive — Autenticación Administrativa (PRO FINAL+)
// ============================================
//
// Módulo de login seguro para el panel administrativo:
//   ✅ Login con ADMIN_EMAIL + ADMIN_SECRET_KEY (.env)
//   ✅ Token JWT con rol "admin" (vía cookie HTTP-only o Header Bearer)
//   ✅ Verificación de sesión /api/admin/verify
//   ✅ Cierre de sesión /api/admin/logout
//
// Seguridad optimizada con JWT + cookies seguras.
// Compatible con middleware adminAuth.js
// ============================================

import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// ==========================================================
// 🧠 Función auxiliar: generar token JWT
// ==========================================================
const generateAdminToken = (email) => {
  return jwt.sign(
    { role: "admin", email, issuedAt: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
};

// ==========================================================
// ✅ 1️⃣ Login administrativo (POST /api/admin/login)
// ==========================================================
router.post("/login", async (req, res) => {
  try {
    const { email, key } = req.body;

    if (!email || !key) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar email y clave de acceso.",
        timestamp: new Date(),
      });
    }

    // 🔐 Validación contra .env
    if (
      email !== process.env.ADMIN_EMAIL ||
      key !== process.env.ADMIN_SECRET_KEY
    ) {
      console.warn(`Intento fallido de acceso admin desde: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas.",
        timestamp: new Date(),
      });
    }

    // 🎟️ Generar token JWT
    const token = generateAdminToken(email);

    // 🍪 Enviar cookie segura
    res.cookie("rvl_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS en prod
      sameSite: "strict",
      maxAge: 12 * 60 * 60 * 1000, // 12h
    });

    res.status(200).json({
      success: true,
      message: "Acceso concedido al panel administrativo.",
      admin: { email },
      token,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("❌ Error en login admin:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al autenticar.",
      error: error.message,
      timestamp: new Date(),
    });
  }
});

// ==========================================================
// ✅ 2️⃣ Verificar sesión activa (GET /api/admin/verify)
// ==========================================================
router.get("/verify", async (req, res) => {
  try {
    const token =
      req.cookies?.rvl_admin_token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token no encontrado. Inicie sesión nuevamente.",
        timestamp: new Date(),
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "El token no tiene permisos administrativos.",
        timestamp: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: "Sesión administrativa válida.",
      admin: { email: decoded.email },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("❌ Error verificando sesión admin:", error.message);

    if (error.name === "TokenExpiredError") {
      res.clearCookie("rvl_admin_token");
      return res.status(401).json({
        success: false,
        message: "Sesión expirada. Por favor, vuelva a iniciar sesión.",
        timestamp: new Date(),
      });
    }

    res.status(401).json({
      success: false,
      message: "Token inválido o sesión no autorizada.",
      timestamp: new Date(),
    });
  }
});

// ==========================================================
// ✅ 3️⃣ Cerrar sesión (POST /api/admin/logout)
// ==========================================================
router.post("/logout", (req, res) => {
  try {
    res.clearCookie("rvl_admin_token");
    res.status(200).json({
      success: true,
      message: "Sesión administrativa cerrada correctamente.",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("❌ Error cerrando sesión admin:", error);
    res.status(500).json({
      success: false,
      message: "Error interno cerrando sesión.",
      error: error.message,
      timestamp: new Date(),
    });
  }
});

export default router;