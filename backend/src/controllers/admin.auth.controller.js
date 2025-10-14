// ============================================
// 🔐 RedVelvetLive — Controlador de Autenticación Admin (PRO)
// ============================================
//
// Gestiona:
//  - Login del administrador (clave maestra o credenciales .env)
//  - Verificación del token JWT activo
//  - Logout (borrado de cookie)
//
// Requiere variables .env:
//  - ADMIN_EMAIL
//  - ADMIN_SECRET_KEY
//  - JWT_SECRET
//  - SESSION_EXPIRATION_HOURS
// ============================================

import jwt from "jsonwebtoken";

/**
 * 🧠 Login del administrador
 * POST /api/admin/login
 */
export async function loginAdmin(req, res) {
  try {
    const { email, key } = req.body;

    // ✅ Validaciones básicas
    if (!email || !key) {
      return res.status(400).json({
        success: false,
        message: "Faltan credenciales: email y clave son requeridos.",
      });
    }

    // ✅ Comparar con las credenciales seguras del entorno
    if (
      email !== process.env.ADMIN_EMAIL ||
      key !== process.env.ADMIN_SECRET_KEY
    ) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas. Acceso denegado.",
      });
    }

    // 🧾 Generar token JWT
    const expiresIn =
      (Number(process.env.SESSION_EXPIRATION_HOURS) || 24) * 3600; // segundos
    const token = jwt.sign(
      {
        role: "admin",
        email,
        access: "panel",
        issuedAt: Date.now(),
      },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    // 🍪 Guardar cookie HTTP-only segura
    res.cookie("rvl_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: expiresIn * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      token,
      expiresIn,
      admin: {
        email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("❌ Error en loginAdmin:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al iniciar sesión.",
    });
  }
}

/**
 * 🧩 Verificación del token activo
 * GET /api/admin/verify
 */
export async function verifyToken(req, res) {
  try {
    // Este punto se alcanza solo si adminAuth() ya validó el token
    const admin = req.admin;

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "No hay sesión activa.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token válido.",
      admin,
    });
  } catch (error) {
    console.error("⚠️ Error en verifyToken:", error);
    res.status(500).json({
      success: false,
      message: "Error verificando el token.",
    });
  }
}

/**
 * 🚪 Logout administrativo
 * POST /api/admin/logout
 */
export async function logoutAdmin(req, res) {
  try {
    res.clearCookie("rvl_admin_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
    });

    return res.status(200).json({
      success: true,
      message: "Sesión administrativa cerrada correctamente.",
    });
  } catch (error) {
    console.error("⚠️ Error en logoutAdmin:", error);
    res.status(500).json({
      success: false,
      message: "Error cerrando sesión.",
    });
  }
}
