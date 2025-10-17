// =============================================
// 💌 REDVELVETLIVE — Configuración SMTP (PRO FINAL)
// =============================================
import nodemailer from "nodemailer";

const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("❌ Configuración SMTP incompleta en .env");
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
};

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"RedVelvetLive 💎" <${process.env.SMTP_USER}>`,
      to, subject, text, html,
    });
    console.log(`📨 Email enviado a ${to} (${info.messageId})`);
    return info;
  } catch (error) {
    console.error("❌ Error enviando correo:", error.message);
    return null;
  }
};

export default { sendEmail };
