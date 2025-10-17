// =============================================
// 💌 REDVELVETLIVE — Configuración SMTP (PRO FINAL)
// =============================================
//
// 🚀 Características:
//   ✅ SMTP seguro compatible con Gmail o cualquier proveedor
//   ✅ Reutilizable por toda la API (notificaciones, soporte, pagos)
//   ✅ Integrado con variables de entorno del .env
//   ✅ Incluye función sendEmail lista para usar
//
// =============================================

import nodemailer from "nodemailer";

const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("❌ Configuración SMTP incompleta en el archivo .env");
  }

  // Transportador seguro (TLS/SSL)
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: true, // true = SSL
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"RedVelvetLive 💎" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 Email enviado a ${to} (${info.messageId})`);
    return info;
  } catch (error) {
    console.error("❌ Error enviando correo:", error.message);
    return null;
  }
};

export default { sendEmail };
