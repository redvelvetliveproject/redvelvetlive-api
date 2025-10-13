// ===============================================================
// 💼 REDVELVETLIVE — Rutas de Administración de Pagos (PRO FINAL)
// ===============================================================
// Requiere ADMIN_SECRET_KEY para ejecutarse (configurado en .env)
// Incluye:
//  - Forzar verificación manual del cron
//  - Consultar logs de auditoría
//  - Actualizar órdenes manualmente (status / notas / txHash)

import express from "express";
import PaymentOrder from "../models/PaymentOrder.js";
import { validateObjectId } from "../services/validators.js";
import { startPaymentsCron } from "../jobs/payments.cron.js";
import { verifyTransaction } from "../services/web3.utils.js";

const router = express.Router();

// 🔐 Middleware de seguridad: requiere ADMIN_SECRET_KEY
function requireAdminKey(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (!key || key !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Clave de administrador inválida.",
    });
  }
  next();
}

/* =====================================================
   1️⃣ Forzar verificación inmediata del cron
   ===================================================== */
router.post("/cron/run-once", requireAdminKey, async (req, res) => {
  try {
    const { processPendingOrders } = await import("../jobs/payments.cron.js");
    const result = await processPendingOrders();
    res.json({
      success: true,
      message: "Verificación de pagos ejecutada manualmente ✅",
      result,
    });
  } catch (err) {
    console.error("❌ Error al ejecutar cron manual:", err);
    res.status(500).json({
      success: false,
      message: "Error al ejecutar la verificación manual.",
      error: err.message,
    });
  }
});

/* =====================================================
   2️⃣ Actualizar orden manualmente (status / hash / nota)
   ===================================================== */
router.patch("/order/:id", requireAdminKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, txHash, note } = req.body;

    if (!validateObjectId(id))
      return res.status(400).json({ success: false, message: "ID inválido." });

    const order = await PaymentOrder.findById(id);
    if (!order)
      return res.status(404).json({ success: false, message: "Orden no encontrada." });

    if (status) order.status = status.toUpperCase();
    if (txHash) {
      order.txHash = txHash;
      order.metadata.txExplorer = `https://bscscan.com/tx/${txHash}`;
    }
    if (note) order.metadata.note = note;

    await order.save();
    res.json({ success: true, message: "Orden actualizada manualmente ✅", order });
  } catch (error) {
    console.error("❌ Error en actualización manual:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al actualizar orden.",
      error: error.message,
    });
  }
});

/* =====================================================
   3️⃣ Auditoría on-chain por hash (verificación directa)
   ===================================================== */
router.get("/audit/:txHash", requireAdminKey, async (req, res) => {
  try {
    const { txHash } = req.params;
    const result = await verifyTransaction(txHash);
    res.json({ success: true, txHash, result });
  } catch (error) {
    console.error("❌ Error en auditoría de hash:", error);
    res.status(500).json({
      success: false,
      message: "Error al auditar la transacción.",
      error: error.message,
    });
  }
});

/* =====================================================
   4️⃣ Listar últimas 100 órdenes para revisión rápida
   ===================================================== */
router.get("/orders/recent", requireAdminKey, async (req, res) => {
  try {
    const orders = await PaymentOrder.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("modelId", "name wallet country")
      .lean();

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error("❌ Error listando órdenes recientes:", error);
    res.status(500).json({
      success: false,
      message: "Error al listar órdenes recientes.",
      error: error.message,
    });
  }
});

export default router;
