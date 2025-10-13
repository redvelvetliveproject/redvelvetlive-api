// backend/src/routes/payments.routes.js
import express from "express";
import PaymentOrder from "../models/PaymentOrder.js";
import { Model } from "../models/Model.js";
import { validateObjectId } from "../services/validators.js";

const router = express.Router();

/**
 * 💰 /api/payments
 * Controlador general de órdenes de pago (tips, retiros, distribuciones)
 * Totalmente compatible con BSC y ONECOP.
 */

// ✅ 1. Crear nueva orden de pago (tip, retiro, etc.)
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

    if (!modelId || !amount || !destinationWallet)
      return res
        .status(400)
        .json({ success: false, message: "Datos incompletos." });

    if (!validateObjectId(modelId))
      return res
        .status(400)
        .json({ success: false, message: "ID de modelo inválido." });

    // 🧩 Verificar si el modelo existe
    const model = await Model.findById(modelId);
    if (!model)
      return res
        .status(404)
        .json({ success: false, message: "Modelo no encontrado." });

    // 💾 Crear registro de orden
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
      message: "Orden de pago registrada con éxito.",
      order,
    });
  } catch (error) {
    console.error("Error al crear orden:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
      error: error.message,
    });
  }
});

// ✅ 2. Listar todas las órdenes (para administración)
router.get("/", async (req, res) => {
  try {
    const { status, type, currency, limit = 50, skip = 0 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (currency) query.currency = currency;

    const orders = await PaymentOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate("modelId", "name wallet country");

    const total = await PaymentOrder.countDocuments(query);

    res.json({
      success: true,
      total,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error al listar órdenes:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
      error: error.message,
    });
  }
});

// ✅ 3. Consultar una orden específica
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id))
      return res.status(400).json({ success: false, message: "ID inválido." });

    const order = await PaymentOrder.findById(id).populate(
      "modelId",
      "name wallet"
    );
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Orden no encontrada." });

    res.json({ success: true, order });
  } catch (error) {
    console.error("Error al obtener orden:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
      error: error.message,
    });
  }
});

// ✅ 4. Actualizar estado (solo admin o backend seguro)
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

    if (status) order.status = status;
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
    console.error("Error al actualizar estado:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
      error: error.message,
    });
  }
});

// ✅ 5. Listar órdenes de una modelo específica
router.get("/model/:modelId", async (req, res) => {
  try {
    const { modelId } = req.params;
    if (!validateObjectId(modelId))
      return res
        .status(400)
        .json({ success: false, message: "ID de modelo inválido." });

    const orders = await PaymentOrder.find({ modelId })
      .sort({ createdAt: -1 })
      .populate("modelId", "name wallet country");

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error al listar órdenes por modelo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
      error: error.message,
    });
  }
});

export default router;