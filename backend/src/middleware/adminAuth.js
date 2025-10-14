import jwt from "jsonwebtoken";

export default function adminAuth(req, res, next) {
  try {
    const token = req.cookies?.rvl_admin_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ success: false, message: "No autorizado." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin")
      return res.status(403).json({ success: false, message: "Acceso denegado." });

    req.admin = decoded;
    next();
  } catch (err) {
    console.error("Error adminAuth:", err);
    res.status(401).json({ success: false, message: "Token inválido o expirado." });
  }
}
