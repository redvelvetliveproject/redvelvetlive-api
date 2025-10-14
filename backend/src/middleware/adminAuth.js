// ============================================
// 🔒 RedVelvetLive — Middleware de Autenticación Admin (PRO)
// ============================================
//
// Protege las rutas administrativas verificando tokens JWT válidos.
// Los tokens pueden recibirse por cookie (rvl_admin_token) o por header Authorization.
//
// Flujo:
// 1. Login genera token JWT (admin.auth.routes.js)
// 2. Este middleware valida el token en cada request
// 3. Si es válido → next()
// 4. Si no, responde con 401 o 403 según el caso
// ============================================

import jwt from "jsonwebtoken";

/**
 * Middleware de autenticación para rutas /api/admin/*
 */
export default function adminAuth(req, res, next) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("⚠️ JWT_SECRET no definido en el entorno (.env)");
      return res.status(500).json({
        success: false,
        message: "Configuración del servidor incompleta (JWT_SECRET faltante)",
      });
    }

    // 🔍 Obtener token desde cookie o header
    const cookieToken = req.cookies?.rvl_admin_token;
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const token = cookieToken || bearerToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Acceso no autorizado: falta token.",
      });
    }

    // ✅ Verificar token JWT
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        console.warn("❌ Token inválido o expirado:", err.message);
        return res.status(403).json({
          success: false,
          message:
            err.name === "TokenExpiredError"
              ? "Sesión expirada. Inicia sesión nuevamente."
              : "Token inválido o manipulado.",
        });
      }

      // 🧠 Verificar rol administrativo
      if (decoded.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos administrativos.",
        });
      }

      // 🔁 Guardar datos del token en la request
      req.admin = decoded;
      next();
    });
  } catch (error) {
    console.error("⚠️ Error en middleware adminAuth:", error);
    res.status(500).json({
      success: false,
      message: "Error interno en autenticación.",
    });
  }
}
