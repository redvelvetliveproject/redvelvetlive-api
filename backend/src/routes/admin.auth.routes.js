// ===========================================
// 🔐 REDVELVETLIVE — RUTA DE LOGIN ADMIN (PRO)
// ===========================================

import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * 🔑 POST /api/admin/login
 * Inicia sesión administrativa validando ADMIN_SECRET_KEY.
 * Devuelve un token JWT con duración configurable (.env -> SESSION_EXPIRATION_HOURS)
 */
router.post("/login", async (req, res) => {
  try {
    const { key } = req.body;

    if (!key)
      return res.status(400).json({
        success: false,
        message: "Falta la clave administrativa.",
      });

    // ✅ Validar clave maestra
    if (key !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({
        success: false,
        message: "Clave administrativa incorrecta.",
      });
    }

    // 🧠 Generar token JWT
    const expiresIn = (process.env.SESSION_EXPIRATION_HOURS || 24) * 3600; // en segundos
    const token = jwt.sign(
      { role: "admin", access: "panel" },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    // 🍪 Enviar cookie segura (HTTP-only) + token JSON
    res.cookie("rvl_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: expiresIn * 1000,
    });

    return res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      token,
      expiresIn,
    });
  } catch (err) {
    console.error("❌ Error en login admin:", err);
    res.status(500).json({
      success: false,
      message: "Error interno en el servidor",
    });
  }
});

export default router;
