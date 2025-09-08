// backend/src/routes/cron.js
import { Router } from 'express';
import PaymentOrder from '../models/PaymentOrder.js';
import {
  getTxReceipt,
  getCurrentBlockNumber,
  findTransferToTreasury,
  getLogs,
  addrToTopic,
} from '../services/bsc.js';

const router = Router();

const MIN_CONF = parseInt(process.env.MIN_CONFIRMATIONS || '3', 10);
const LOOKBACK = parseInt(process.env.LOOKBACK_BLOCKS || '800', 10); // ~2–3 min aprox
const CRON_SECRET = process.env.CRON_SECRET || '';

const TRANSFER_SIG_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function isAuthorized(req) {
  if (!CRON_SECRET) return true; // si no seteaste secret, no exige auth
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const q = (req.query?.token || '').toString().trim();
  return bearer === CRON_SECRET || q === CRON_SECRET;
}

function assertCronAuth(req, res) {
  if (isAuthorized(req)) return true;
  res.status(401).json({ ok: false, error: 'unauthorized' });
  return false;
}

async function processPayments() {
  const start = Date.now();
  let scanned = 0;
  let updated = 0;

  const nowBlock = await getCurrentBlockNumber();
  const fromBlockDefault = Math.max(1, nowBlock - LOOKBACK);

  const pendings = await PaymentOrder.find({ status: 'pending' }).limit(200);

  for (const ord of pendings) {
    scanned++;

    // Si ya tenemos txHash: verificar receipt + confirmaciones
    if (ord.txHash) {
      const r = await getTxReceipt(ord.txHash);
      if (!r || r.status !== '0x1') continue;

      const txBlock = parseInt(r.blockNumber, 16);
      const conf = nowBlock - txBlock + 1;
      ord.seenConfirmations = conf;

      if (conf >= MIN_CONF) {
        const hit = findTransferToTreasury(r, ord.tokenContract, ord.treasury);
        if (hit && BigInt(hit.valueStr) >= BigInt(ord.amountWei)) {
          ord.status = 'paid';
          updated++;
        }
      }
      await ord.save();
      continue;
    }

    // Sin txHash: escanear logs Transfer hacia treasury
    const topics = [
      TRANSFER_SIG_TOPIC,
      ord.from ? addrToTopic(ord.from) : null,
      addrToTopic(ord.treasury),
    ];

    const logs = await getLogs({
      fromBlock: fromBlockDefault,
      toBlock: nowBlock,
      address: ord.tokenContract,
      topics,
    });

    if (!logs?.length) continue;

    // Elegir candidato válido por monto
    const candidate = logs
      .map((lg) => ({
        txHash: lg.transactionHash,
        blockNumber: parseInt(lg.blockNumber, 16),
        valueStr: lg.data && lg.data !== '0x' ? BigInt(lg.data).toString() : '0',
      }))
      .filter((x) => BigInt(x.valueStr) >= BigInt(ord.amountWei))
      .sort((a, b) => b.blockNumber - a.blockNumber)[0];

    if (!candidate) continue;

    const r = await getTxReceipt(candidate.txHash);
    if (!r || r.status !== '0x1') continue;

    const hit = findTransferToTreasury(r, ord.tokenContract, ord.treasury);
    if (!hit || BigInt(hit.valueStr) < BigInt(ord.amountWei)) continue;

    const conf = nowBlock - candidate.blockNumber + 1;
    ord.txHash = candidate.txHash;
    ord.txBlockNumber = candidate.blockNumber;
    ord.seenConfirmations = conf;

    if (conf >= MIN_CONF) {
      ord.status = 'paid';
      updated++;
    }
    await ord.save();
  }

  return {
    ok: true,
    scanned,
    updated,
    fromBlock: Math.max(1, nowBlock - LOOKBACK),
    toBlock: nowBlock,
    tookMs: Date.now() - start,
  };
}

// Health simple para probar que el cron endpoint está arriba
router.get('/health', (_req, res) => {
  res.json({ ok: true, cron: 'up', ts: new Date().toISOString() });
});

// Ruta principal para Vercel Cron
router.get('/check-payments', async (req, res) => {
  if (!assertCronAuth(req, res)) return;
  try {
    const result = await processPayments();
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'cron_failed' });
  }
});

// Alias por compatibilidad
router.get('/payments', async (req, res) => {
  if (!assertCronAuth(req, res)) return;
  try {
    const result = await processPayments();
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'cron_failed' });
  }
});

export default router;

