// ============================================
// 💎 RedVelvetLive — Payments Controller (PRO FINAL)
// ============================================
//
// Controlador principal del módulo financiero:
//   ✅ Registra y valida tips / retiros en blockchain
//   ✅ Audita transacciones on-chain (BSC, ONECOP, USDT)
//   ✅ Actualiza estados de órdenes (CONFIRMED / FAILED)
//   ✅ Consulta balances y sincroniza métricas de modelos
//
// 100% compatible con MongoDB + Web3.js + BSC Mainnet
// ============================================

import mongoose from "mongoose";
import PaymentOrder from "../models/PaymentOrder.js";
import ModelUser from "../models/ModelUser.js";
import {
  verifyTransaction,
  auditTransaction,
  getTokenBalance,
  fromWei,
} from "../services/web3.utils.js";
import {
  validateObjectId,
  validateWallet,
  validateAmount,
} from "../services/validators.js";

/* ======================================================
   🧾 1️⃣ Registrar nueva orden de pago (TIP / WITHDRAW)
   ====================================================== */
export async function createPayment(req, res) {
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

    // 🔒 Validaciones básicas
    if (!validateObjectId(modelId))
      return res
        .status(400)
        .json({ success: false, message: "ID de modelo inválido." });

    if (!validateAmount(amount))
      return res
        .status(400)
        .json({ success: false, message: "Monto inválido o vacío." });

    if (!validateWallet(destinationWallet))
      return res
        .status(400)
        .json({ success: false, message: "Wallet de destino inválida." });

    const model = await ModelUser.findById(modelId);
    if (!model)
      return res
        .status(404)
        .json({ success: false, message: "Modelo no encontrado." });

    // 🧾 Crear orden en MongoDB
    const order = new PaymentOrder({
      modelId,
      amount,
      currency: currency.toUpperCase(),
      destinationWallet: destinationWallet.toLowerCase(),
      txHash,
      type: type.toUpperCase(),
      metadata: { note, source: "frontend" },
      status: txHash ? "PROCESSING" : "PENDING",
      audit: { createdBy: req.user?.email || "frontend" },
    });

    await order.save();

    console.log(
      `🧾 Nueva orden registrada → ${order.type} ${amount} ${currency} para modelo ${model.name}`
    );

    return res.status(201).json({
      success: true,
      message: "Orden creada correctamente.",
      data: order.toPublicJSON(),
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("❌ Error al crear orden:", err);
    return res.status(500).json({
      success: false,
      message: "Error interno al registrar la orden.",
      error: err.message,
    });
  }
}

/* ======================================================
   🔗 2️⃣ Verificar transacción on-chain (por hash)
   ====================================================== */
export async function verifyPayment(req, res) {
  try {
    const { txHash, orderId } = req.body;

    if (!txHash)
      return res
        .status(400)
        .json({ success: false, message: "Hash de transacción requerido." });

    // ✅ Verificar en blockchain (BSC)
    const verification = await verifyTransaction(txHash);
    if (!verification?.success)
      return res.status(400).json({
        success: false,
        message: "Transacción no encontrada o inválida en BSC.",
      });

    // 🧩 Si se asocia una orden, actualizar estado
    if (orderId && validateObjectId(orderId)) {
      const order = await PaymentOrder.findById(orderId);
      if (order) {
        order.markAsConfirmed(txHash, "auto");
        order.status = "CONFIRMED";
        await order.save();

        // Actualiza métricas de modelo
        await syncModelMetrics(order.modelId);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Transacción confirmada y sincronizada correctamente.",
      data: verification,
      explorer: `${process.env.BLOCKCHAIN_EXPLORER || "https://bscscan.com"}/tx/${txHash}`,
    });
  } catch (err) {
    console.error("❌ Error verificando pago:", err);
    return res.status(500).json({
      success: false,
      message: "Error interno en la verificación.",
      error: err.message,
    });
  }
}

/* ======================================================
   🧮 3️⃣ Auditoría detallada de transacciones (GET)
   ====================================================== */
export async function auditPayment(req, res) {
  try {
    const { txHash } = req.params;

    if (!txHash)
      return res
        .status(400)
        .json({ success: false, message: "Hash de transacción requerido." });

    const result = await auditTransaction(txHash);

    if (!result?.success)
      return res
        .status(404)
        .json({ success: false, message: "Transacción no encontrada." });

    return res.status(200).json({
      success: true,
      message: "Auditoría completada correctamente.",
      data: result,
    });
  } catch (err) {
    console.error("❌ Error auditando transacción:", err);
    return res.status(500).json({
      success: false,
      message: "Error interno al auditar transacción.",
      error: err.message,
    });
  }
}

/* ======================================================
   💰 4️⃣ Consultar balance on-chain de una wallet
   ====================================================== */
export async function getBalance(req, res) {
  try {
    const { wallet } = req.params;

    if (!validateWallet(wallet))
      return res
        .status(400)
        .json({ success: false, message: "Dirección de wallet inválida." });

    const [onecopRaw, usdtRaw] = await Promise.all([
      getTokenBalance(wallet, "ONECOP"),
      getTokenBalance(wallet, "USDT"),
    ]);

    const balances = {
      ONECOP: fromWei(onecopRaw),
      USDT: fromWei(usdtRaw),
    };

    return res.status(200).json({
      success: true,
      wallet,
      balances,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("❌ Error obteniendo balance:", err);
    return res.status(500).json({
      success: false,
      message: "Error al obtener balances.",
      error: err.message,
    });
  }
}

/* ======================================================
   🪙 5️⃣ Sincronizar métricas de modelo (tips confirmados)
   ====================================================== */
export async function syncModelMetrics(modelId) {
  try {
    if (!validateObjectId(modelId)) return null;

    const confirmedTips = await PaymentOrder.aggregate([
      {
        $match: {
          modelId: new mongoose.Types.ObjectId(modelId),
          status: "CONFIRMED",
          type: "TIP",
        },
      },
      {
        $group: {
          _id: "$modelId",
          totalTips: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (!confirmedTips.length) return null;

    const { totalTips, count } = confirmedTips[0];

    await ModelUser.findByIdAndUpdate(modelId, {
      $inc: { "stats.tips": count },
      $set: { "stats.totalTipsAmount": totalTips },
    });

    console.log(
      `📊 Métricas actualizadas: ${count} tips → total ${totalTips} tokens (${modelId})`
    );

    return { totalTips, count };
  } catch (err) {
    console.error("❌ Error sincronizando métricas:", err);
    return null;
  }
}
