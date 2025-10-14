// ============================================
// 🔐 RedVelvetLive — Middleware de Autenticación Admin (PRO FINAL)
// ============================================
//
// Protege todas las rutas /api/admin/*
//
// Soporta:
//   ✅ Token JWT por cookie HTTP-only ("rvl_admin_token")
//   ✅ Token en Header "Authorization: Bearer <token>"
//   ✅ Prevención de tokens falsos o expirados
//   ✅ Registro del intento fallido (para auditoría)
// ============================================

import jwt from "jsonwebtoken";

export default function adminAuth(req, res, next) {
  try {
    // 🔍 Obtener token (cookie o header)
    const cookieToken = req.cookies?.rvl_admin_token;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No se encontró token de autenticación.",
      });
    }

    // 🧩 Verificar validez del token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🚫 Validar estructura y permisos
    if (!decoded || decoded.role !== "admin") {
      console.warn("⚠️ Token inválido detectado:", decoded);
      return res.status(403).json({
        success: false,
        message: "Token inválido o sin permisos suficientes.",
      });
    }

    // ✅ Token válido → adjuntar información al request
    req.admin = {
      email: decoded.email,
      role: decoded.role,
      issuedAt: new Date(decoded.issuedAt).toISOString(),
    };

    // 🔍 Para auditoría opcional (visible en logs)
    if (process.env.ENABLE_REQUEST_LOGS === "true") {
      console.log(
        `🔐 Admin autorizado: ${req.admin.email} → ${req.method} ${req.originalUrl}`
      );
    }

    next();
  } catch (error) {
    console.error("❌ Error en adminAuth:", error.message);

    // ⏰ Token expirado
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "La sesión ha expirado. Inicia sesión nuevamente.",
      });
    }

    // ❌ Token manipulado o inválido
    res.status(401).json({
      success: false,
      message: "Token administrativo inválido o no autorizado.",
    });
  }
}


