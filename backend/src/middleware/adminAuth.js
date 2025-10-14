// =============================================
// 🛡️ REDVELVETLIVE — Middleware Autenticación JWT Admin
// =============================================

import jwt from "jsonwebtoken";

export default function adminAuth(req, res, next) {
  try {
    // Prioridad: Authorization > Cookie
    const token =
      req.headers.authorization?.split(" ")[1] ||
      req.cookies?.rvl_admin_token;

    if (!token)
      return res.status(401).json({
        success: false,
        message: "No autorizado. Falta token.",
      });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.role !== "admin")
      return res.status(403).json({
        success: false,
        message: "Acceso denegado.",
      });

    req.admin = decoded;
    next();
  } catch (err) {
    console.error("Error en autenticación admin:", err);
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado.",
    });
  }
}
