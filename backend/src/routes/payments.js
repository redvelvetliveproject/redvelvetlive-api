// backend/src/routes/payments.js
import { Router } from 'express';
import crypto from 'crypto';
import PaymentOrder from '../models/PaymentOrder.js';
import {
  getTxReceipt,
  getCurrentBlockNumber,
  findTransferToTreasury,
  normalize,
} from '../services/bsc.js';

const router = Router();

const ONECOP_CONTRACT = (process.env.ONECOP_CONTRACT || '').toLowerCase();
const USDT_CONTRACT   = (process.env.USDT_BSC_CONTRACT || '').toLowerCase();
const TREASURY        = (process.env.TREASURY_WALLET || '').toLowerCase();
const MIN_CONF        = parseInt(process.env.MIN_CONFIRMATIONS || '3', 10);

function toWei(decimals18Amount) {
  // Esperamos amount en string decimal (con 18), el front debería convertir según token
  // Para simplificar: amount llega como wei en string desde el front
  return decimals18Amount;
}

// Crea una orden
router.post('/create', async (req, res) => {
  try {
    const { token, amountWei, from } = req.body || {};
    if (!token || !amountWei) {
      return res.status(400).json({ ok: false, error: 'token_and_amount_required' });
    }

    const t = token.toUpperCase();
    const tokenContract = t === 'USDT' ? USDT_CONTRACT : t === 'ONECOP' ? ONECOP_CONTRACT : null;
    if (!tokenContract) return res.status(400).json({ ok: false, error: 'unsupported_token' });

    const orderId = crypto.randomUUID();
    const ord = await PaymentOrder.create({
      orderId,
      token: t,
      tokenContract,
      treasury: TREASURY,
      amountWei: String(amountWei),
      from: from?.toLowerCase(),
      status: 'pending',
    });

    return res.json({
      ok: true,
      orderId,
      token: ord.token,
      tokenContract,
      treasury: TREASURY,
      amountWei: ord.amountWei,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'create_failed' });
  }
});

// El usuario te pega su txHash para acelerar
router.post('/submit-tx', async (req, res) => {
  try {
    const { orderId, txHash } = req.body || {};
    if (!orderId || !txHash) return res.status(400).json({ ok: false, error: 'orderId_txHash_required' });

    const ord = await PaymentOrder.findOne({ orderId });
    if (!ord) return res.status(404).json({ ok: false, error: 'order_not_found' });
    if (ord.status === 'paid') return res.json({ ok: true, status: 'paid' });

    const r = await getTxReceipt(txHash);
    if (!r || r.status !== '0x1') return res.json({ ok: true, status: ord.status });

    const nowBlock = await getCurrentBlockNumber();
    const txBlock = parseInt(r.blockNumber, 16);
    const conf = nowBlock - txBlock + 1;

    const hit = findTransferToTreasury(r, ord.tokenContract, ord.treasury);
    if (hit && BigInt(hit.valueStr) >= BigInt(ord.amountWei)) {
      ord.txHash = txHash;
      ord.txBlockNumber = txBlock;
      ord.seenConfirmations = conf;
      if (conf >= MIN_CONF) ord.status = 'paid';
      await ord.save();
    }

    return res.json({ ok: true, status: ord.status, confirmations: ord.seenConfirmations || 0 });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'submit_failed' });
  }
});

// Consultar estado
router.get('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const ord = await PaymentOrder.findOne({ orderId }).lean();
    if (!ord) return res.status(404).json({ ok: false, error: 'order_not_found' });
    return res.json({
      ok: true,
      status: ord.status,
      confirmations: ord.seenConfirmations || 0,
      txHash: ord.txHash || null,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'status_failed' });
  }
});

export default router;
