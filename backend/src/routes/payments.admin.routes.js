// ============================================
// 💰 RedVelvetLive — Rutas Administrativas de Pagos (PRO FINAL)
// ============================================
//
// Controla todas las funciones del panel admin:
//   ✅ Listar órdenes con filtros
//   ✅ Ejecutar manualmente el cron de verificación on-chain
//   ✅ Auditar una transacción específica
//   ✅ Actualizar estado manualmente
//
// Protegidas por middleware adminAuth.js
// ============================================

import express from "express";
import PaymentOrder from "../models/PaymentOrder.js";
import { validateObjectId } from "../services/validators.js";
import { verifyTransaction, auditTransaction } from "../services/web3.utils.js";
import { runPaymentsCronJob } from "../jobs/payments.cron.js";

const router = express.Router();

/* ==========================================================
   ✅ 1. Listar órdenes (GET /api/admin/payments/orders)
   ========================================================== */
router.get("/orders", async (req, res) => {
  try {
    const { status, type, currency, limit = 50, skip = 0 } = req.query;
    const query = {};

    if (status) query.status = status.toUpperCase();
    if (type) query.type = type.toUpperCase();
    if (currency) query.currency = currency.toUpperCase();

    const [orders, total] = await Promise.all([
      PaymentOrder.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .populate("modelId", "name wallet country")
        .lean(),
      PaymentOrder.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Error en /admin/payments/orders:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al listar órdenes.",
    });
  }
});

/* ==========================================================
   ✅ 2. Ejecutar manualmente el cron (POST /cron/run)
   ========================================================== */
router.post("/cron/run", async (req, res) => {
  try {
    const result = await runPaymentsCronJob();
    res.json({
      success: true,
      message: "Cron ejecutado correctamente.",
      result,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("❌ Error ejecutando cron manual:", error);
    res.status(500).json({
      success: false,
      message: "Error ejecutando el cron manual.",
    });
  }
});

/* ==========================================================
   ✅ 3. Auditar una transacción (GET /audit/:txHash)
   ========================================================== */
router.get("/audit/:txHash", async (req, res) => {
  try {
    const { txHash } = req.params;
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash))
      return res.status(400).json({
        success: false,
        message: "Hash de transacción inválido.",
      });

    const audit = await auditTransaction(txHash);

    res.json({
      success: true,
      audit,
    });
  } catch (error) {
    console.error("❌ Error en /audit:", error);
    res.status(500).json({
      success: false,
      message: "Error interno auditando la transacción.",
    });
  }
});

/* ==========================================================
   ✅ 4. Actualizar estado de una orden (PATCH /orders/:id/status)
   ========================================================== */
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!validateObjectId(id))
      return res.status(400).json({
        success: false,
        message: "ID de orden inválido.",
      });

    const order = await PaymentOrder.findById(id);
    if (!order)
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada.",
      });

    if (status) order.status = status.toUpperCase();
    if (note) order.metadata.note = note;
    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: "Orden actualizada correctamente.",
      order,
    });
  } catch (error) {
    console.error("❌ Error actualizando orden:", error);
    res.status(500).json({
      success: false,
      message: "Error interno actualizando la orden.",
    });
  }
});

export default router;

