// ============================================
// 🔐 RedVelvetLive — Middleware de Autenticación Admin (PRO FINAL)
// ============================================
//
// Este middleware protege las rutas /api/admin/*
// Validando el token JWT emitido al hacer login.
//
// Soporta:
//   ✅ Token por cookie HTTP-only ("rvl_admin_token")
//   ✅ Token en Header "Authorization: Bearer <token>"
// ============================================

import jwt from "jsonwebtoken";

export default function adminAuth(req, res, next) {
  try {
    // 🔍 Obtener token (cookie o header)
    const cookieToken = req.cookies?.rvl_admin_token;
    const headerToken = req.headers.authorization?.split(" ")[1];
    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No se encontró token de autenticación.",
      });
    }

    // 🧩 Verificar validez del token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Token inválido o sin permisos.",
      });
    }

    // ✅ Token válido → adjuntar datos del admin al request
    req.admin = decoded;
    next();
  } catch (error) {
    console.error("❌ Error en adminAuth:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "La sesión ha expirado. Inicia sesión nuevamente.",
      });
    }

    res.status(401).json({
      success: false,
      message: "Autenticación administrativa inválida.",
    });
  }
}

