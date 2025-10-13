/**
 * 💰 RedVelvetLive — Rutas de Pagos y Transacciones (PRO FINAL)
 * -----------------------------------------------------------------
 * Módulo unificado que combina endpoints REST + Web3:
 *  - Registro de tips, retiros y distribuciones.
 *  - Verificación blockchain (BSC, ONECOP, USDT).
 *  - Auditoría completa y consulta de balances.
 */

import express from "express";
import PaymentOrder from "../models/PaymentOrder.js";
import Model from "../models/Model.js";
import {
  createPayment,
  verifyPayment,
  auditPayment,
  getBalance,
} from "../controllers/payments.controller.js";
import { validateObjectId } from "../services/validators.js";

const router = express.Router();

/* ======================================================
   🪙 1️⃣ Crear nueva orden (controlador PRO)
   ====================================================== */
router.post("/create", createPayment);

/* ======================================================
   🔗 2️⃣ Verificar transacción blockchain (BSC)
   ====================================================== */
router.post("/verify", verifyPayment);

/* ======================================================
   🧾 3️⃣ Auditoría completa de hash
   ====================================================== */
router.get("/audit/:txHash", auditPayment);

/* ======================================================
   💰 4️⃣ Consultar balance on-chain de una wallet
   ====================================================== */
router.get("/balance/:wallet", getBalance);

/* ======================================================
   📋 5️⃣ Listar órdenes (paginado y filtrado)
   ====================================================== */
router.get("/", async (req, res) => {
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
    console.error("❌ Error al listar órdenes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las órdenes.",
      error: error.message,
    });
  }
});

/* ======================================================
   🔍 6️⃣ Consultar una orden específica
   ====================================================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res.status(400).json({
        success: false,
        message: "ID inválido.",
      });

    const order = await PaymentOrder.findById(id)
      .populate("modelId", "name wallet country")
      .lean();

    if (!order)
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada.",
      });

    order.txExplorer = order.txHash
      ? `https://bscscan.com/tx/${order.txHash}`
      : null;

    res.json({ success: true, order });
  } catch (error) {
    console.error("❌ Error al obtener orden:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al consultar la orden.",
      error: error.message,
    });
  }
});

/* ======================================================
   🔁 7️⃣ Actualizar estado o hash (uso interno / admin)
   ====================================================== */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, txHash, note } = req.body;

    if (!validateObjectId(id))
      return res.status(400).json({ success: false, message: "ID inválido." });

    const order = await PaymentOrder.findById(id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Orden no encontrada." });

    if (status) order.status = status.toUpperCase();
    if (txHash) {
      order.txHash = txHash;
      order.metadata.txExplorer = `https://bscscan.com/tx/${txHash}`;
    }
    if (note) order.metadata.note = note;
    order.updatedAt = new Date();

    await order.save();

    res.json({
      success: true,
      message: "Orden actualizada correctamente.",
      order,
    });
  } catch (error) {
    console.error("❌ Error al actualizar orden:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el estado.",
      error: error.message,
    });
  }
});

/* ======================================================
   👩‍💻 8️⃣ Listar órdenes de una modelo específica
   ====================================================== */
router.get("/model/:modelId", async (req, res) => {
  try {
    const { modelId } = req.params;
    if (!validateObjectId(modelId))
      return res
        .status(400)
        .json({ success: false, message: "ID de modelo inválido." });

    const orders = await PaymentOrder.find({ modelId })
      .sort({ createdAt: -1 })
      .populate("modelId", "name wallet country")
      .lean();

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Error al listar órdenes del modelo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al obtener las órdenes del modelo.",
      error: error.message,
    });
  }
});

export default router;

