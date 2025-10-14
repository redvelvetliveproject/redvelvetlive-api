// ============================================
// 🔐 RedVelvetLive — Controlador de Autenticación Admin (PRO FINAL)
// ============================================
//
// Gestiona:
//   ✅ Login del administrador (credenciales .env)
//   ✅ Verificación de token JWT activo
//   ✅ Logout seguro
//
// Requiere variables en .env:
//   - ADMIN_EMAIL
//   - ADMIN_SECRET_KEY
//   - JWT_SECRET
//   - SESSION_EXPIRATION_HOURS
// ============================================

import jwt from "jsonwebtoken";

// ==========================
// 🔑 1️⃣ LOGIN ADMINISTRATIVO
// ==========================
export async function loginAdmin(req, res) {
  try {
    const { email, key } = req.body;

    // ⚠️ Validaciones básicas
    if (!email || !key) {
      return res.status(400).json({
        success: false,
        message: "Faltan credenciales: email y clave son requeridos.",
      });
    }

    // 🧩 Comparar con las credenciales del entorno (.env)
    const validEmail = email.trim().toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
    const validKey = key === process.env.ADMIN_SECRET_KEY;

    if (!validEmail || !validKey) {
      console.warn(`🚫 Intento de login fallido: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas. Acceso denegado.",
      });
    }

    // 🧠 Generar token JWT
    const expiresIn = (Number(process.env.SESSION_EXPIRATION_HOURS) || 24) * 3600; // segundos
    const tokenPayload = {
      role: "admin",
      email,
      access: "panel",
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn });

    // 🍪 Configurar cookie HTTP-only segura
    res.cookie("rvl_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // solo HTTPS en producción
      sameSite: "None",
      maxAge: expiresIn * 1000, // milisegundos
    });

    console.log(`✅ Admin ${email} inició sesión correctamente.`);

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

// ==========================
// 🧩 2️⃣ VERIFICAR TOKEN ACTIVO
// ==========================
export async function verifyToken(req, res) {
  try {
    // Este punto solo se alcanza si adminAuth() validó el JWT
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

// ==========================
// 🚪 3️⃣ LOGOUT ADMINISTRATIVO
// ==========================
export async function logoutAdmin(req, res) {
  try {
    res.clearCookie("rvl_admin_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
    });

    console.log("👋 Sesión administrativa cerrada correctamente.");

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

