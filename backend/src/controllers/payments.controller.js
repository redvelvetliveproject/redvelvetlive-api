/**
 * 💎 RedVelvetLive — Payments Controller (PRO FINAL)
 * -----------------------------------------------------------------
 * Controlador principal del módulo financiero:
 *  - Registra y valida tips en blockchain (ONECOP / USDT)
 *  - Audita transacciones reales en BSC
 *  - Actualiza el estado de las órdenes (CONFIRMED / FAILED)
 *  - Sincroniza balances y métricas de modelos
 */

import PaymentOrder from "../models/PaymentOrder.js";
import Model from "../models/Model.js";
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
   🧾 1. Registrar una nueva orden de pago
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

    if (!validateObjectId(modelId))
      return res.status(400).json({ success: false, message: "ID de modelo inválido." });

    if (!validateAmount(amount))
      return res.status(400).json({ success: false, message: "Monto inválido o vacío." });

    if (!validateWallet(destinationWallet))
      return res.status(400).json({ success: false, message: "Wallet de destino inválida." });

    const model = await Model.findById(modelId);
    if (!model)
      return res.status(404).json({ success: false, message: "Modelo no encontrado." });

    const order = new PaymentOrder({
      modelId,
      amount,
      currency,
      destinationWallet,
      txHash,
      type,
      metadata: { note },
      status: txHash ? "PROCESSING" : "PENDING",
      audit: { createdBy: req.user?.email || "frontend" },
    });

    await order.save();

    return res.status(201).json({
      success: true,
      message: "Orden creada correctamente.",
      order: order.toPublicJSON(),
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
   🧩 2. Verificar una transacción on-chain (por hash)
   ====================================================== */
export async function verifyPayment(req, res) {
  try {
    const { txHash, orderId } = req.body;

    if (!txHash) return res.status(400).json({ success: false, message: "Falta el hash de transacción." });

    // Verifica en la blockchain
    const verification = await verifyTransaction(txHash);
    if (!verification.success) return res.status(400).json(verification);

    // Si hay orderId, actualiza su estado
    if (orderId && validateObjectId(orderId)) {
      const order = await PaymentOrder.findById(orderId);
      if (order) {
        order.markAsConfirmed(txHash);
        order.status = "CONFIRMED";
        await order.save();
      }
    }

    return res.json({
      success: true,
      message: "Transacción confirmada y orden actualizada.",
      data: verification,
    });
  } catch (err) {
    console.error("Error verificando pago:", err);
    return res.status(500).json({ success: false, message: "Error interno en la verificación." });
  }
}

/* ======================================================
   🧮 3. Auditoría completa de transacciones
   ====================================================== */
export async function auditPayment(req, res) {
  try {
    const { txHash } = req.params;

    if (!txHash)
      return res.status(400).json({ success: false, message: "Falta el hash de transacción." });

    const result = await auditTransaction(txHash);

    return res.status(result.success ? 200 : 404).json(result);
  } catch (err) {
    console.error("Error auditando transacción:", err);
    return res.status(500).json({ success: false, message: "Error interno en auditoría." });
  }
}

/* ======================================================
   💰 4. Consultar balance on-chain de una modelo
   ====================================================== */
export async function getBalance(req, res) {
  try {
    const { wallet } = req.params;
    if (!validateWallet(wallet))
      return res.status(400).json({ success: false, message: "Wallet inválida." });

    const [onecop, usdt] = await Promise.all([
      getTokenBalance(wallet, "ONECOP"),
      getTokenBalance(wallet, "USDT"),
    ]);

    return res.json({
      success: true,
      wallet,
      balances: { ONECOP: onecop, USDT: usdt },
    });
  } catch (err) {
    console.error("Error obteniendo balance:", err);
    return res.status(500).json({ success: false, message: "Error al obtener balances." });
  }
}

/* ======================================================
   🪙 5. Sincronizar métricas (tips confirmados → modelo)
   ====================================================== */
export async function syncModelMetrics(modelId) {
  try {
    const confirmedTips = await PaymentOrder.aggregate([
      { $match: { modelId: new mongoose.Types.ObjectId(modelId), status: "CONFIRMED", type: "TIP" } },
      { $group: { _id: "$modelId", totalTips: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    if (!confirmedTips.length) return null;

    const { totalTips, count } = confirmedTips[0];
    await Model.findByIdAndUpdate(modelId, {
      $inc: { "stats.tips": count },
      $set: { "stats.totalTipsAmount": totalTips },
    });

    console.log(`✅ Métricas sincronizadas para modelo ${modelId}`);
    return { totalTips, count };
  } catch (err) {
    console.error("Error sincronizando métricas:", err);
    return null;
  }
}
