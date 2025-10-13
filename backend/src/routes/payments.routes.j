/**
 * 💰 RedVelvetLive — Rutas de Pagos y Transacciones (PRO FINAL)
 * ---------------------------------------------------------------
 * Módulo para registrar, consultar y auditar tips, retiros y distribuciones.
 * Soporta ONECOP y USDT sobre Binance Smart Chain (Mainnet / Testnet).
 */

import express from "express";
import PaymentOrder from "../models/PaymentOrder.js";
import Model from "../models/Model.js";
import { validateObjectId } from "../services/validators.js";

const router = express.Router();

/* ================================
   1️⃣ Crear nueva orden de pago
   ================================ */
router.post("/create", async (req, res) => {
  try {
    const {
      modelId,
      amount,
      currency = "ONECOP",
      destinationWallet,
      txHash = "",
      type = "TIP",
      note = "",
    } = req.body;

    // 🧩 Validaciones iniciales
    if (!modelId || !amount || !destinationWallet)
      return res.status(400).json({
        success: false,
        message: "Faltan datos obligatorios: modelId, amount o destinationWallet.",
      });

    if (!validateObjectId(modelId))
      return res.status(400).json({
        success: false,
        message: "ID de modelo inválido.",
      });

    if (!/^0x[a-fA-F0-9]{40}$/.test(destinationWallet))
      return res.status(400).json({
        success: false,
        message: "Dirección de wallet inválida.",
      });

    // 🧠 Verificar existencia del modelo
    const model = await Model.findById(modelId).select("name wallet country");
    if (!model)
      return res.status(404).json({
        success: false,
        message: "Modelo no encontrado.",
      });

    // 💾 Crear la orden en base de datos
    const order = new PaymentOrder({
      modelId,
      amount,
      currency,
      destinationWallet,
      txHash,
      type,
      metadata: { note },
      status: txHash ? "CONFIRMED" : "PENDING",
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "Orden de pago creada exitosamente.",
      order,
    });
  } catch (error) {
    console.error("❌ Error al crear orden:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al registrar la orden.",
      error: error.message,
    });
  }
});

/* ================================
   2️⃣ Listar todas las órdenes
   ================================ */
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

/* ================================
   3️⃣ Consultar una orden específica
   ================================ */
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

    // 🔗 Genera enlace de auditoría
    const explorerBase = "https://bscscan.com/tx/";
    order.txExplorer = order.txHash ? `${explorerBase}${order.txHash}` : null;

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("❌ Error al obtener orden:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al consultar la orden.",
      error: error.message,
    });
  }
});

/* ================================
   4️⃣ Actualizar estado o hash (admin)
   ================================ */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, txHash, note } = req.body;

    if (!validateObjectId(id))
      return res.status(400).json({
        success: false,
        message: "ID inválido.",
      });

    const order = await PaymentOrder.findById(id);
    if (!order)
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada.",
      });

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

/* ================================
   5️⃣ Listar órdenes de una modelo
   ================================ */
router.get("/model/:modelId", async (req, res) => {
  try {
    const { modelId } = req.params;
    if (!validateObjectId(modelId))
      return res.status(400).json({
        success: false,
        message: "ID de modelo inválido.",
      });

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
