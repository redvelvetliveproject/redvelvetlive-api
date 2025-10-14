import jwt from "jsonwebtoken";

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_SECRET_KEY)
      return res.status(401).json({ success: false, message: "Credenciales inválidas." });

    const token = jwt.sign(
      { role: "admin", email },
      process.env.JWT_SECRET,
      { expiresIn: `${process.env.SESSION_EXPIRATION_HOURS || 24}h` }
    );

    res.cookie("rvl_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * (process.env.SESSION_EXPIRATION_HOURS || 24),
    });

    res.json({ success: true, message: "Inicio de sesión exitoso.", token });
  } catch (err) {
    console.error("Error en loginAdmin:", err);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

export const verifyToken = (req, res) => {
  res.json({ success: true, admin: req.admin });
};

export const logoutAdmin = (req, res) => {
  res.clearCookie("rvl_admin_token");
  res.json({ success: true, message: "Sesión cerrada." });
};
