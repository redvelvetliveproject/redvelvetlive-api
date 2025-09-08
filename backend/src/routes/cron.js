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
const LOOKBACK = parseInt(process.env.LOOKBACK_BLOCKS || '800', 10); // ~2–3 min
const CRON_SECRET = process.env.CRON_SECRET || '';

const TRANSFER_SIG_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function assertCronAuth(req, res) {
  if (!CRON_SECRET) return true;
  const provided = req.query?.token || '';
  if (provided !== CRON_SECRET) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return false;
  }
  return true;
}

router.get('/payments', async (req, res) => {
  if (!assertCronAuth(req, res)) return;

  const start = Date.now();
  let scanned = 0, updated = 0;

  try {
    const nowBlock = await getCurrentBlockNumber();
    const fromBlockDefault = Math.max(1, nowBlock - LOOKBACK);

    const pendings = await PaymentOrder.find({ status: 'pending' }).limit(200);
    for (const ord of pendings) {
      scanned++;

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

      // Sin txHash: escanear logs de Transfer hacia treasury
      const topics = [TRANSFER_SIG_TOPIC, ord.from ? addrToTopic(ord.from) : null, addrToTopic(ord.treasury)];
      const logs = await getLogs({
        fromBlock: fromBlockDefault,
        toBlock: nowBlock,
        address: ord.tokenContract,
        topics,
      });

      if (!logs?.length) continue;

      // Elige candidato válido por amount
      const candidate = logs
        .map(lg => ({
          txHash: lg.transactionHash,
          blockNumber: parseInt(lg.blockNumber, 16),
          valueStr: (lg.data && lg.data !== '0x') ? BigInt(lg.data).toString() : '0'
        }))
        .filter(x => BigInt(x.valueStr) >= BigInt(ord.amountWei))
        .sort((a,b) => b.blockNumber - a.blockNumber)[0];

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

    res.json({ ok: true, scanned, updated, tookMs: Date.now() - start, fromBlock: fromBlockDefault, toBlock: nowBlock });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'cron_failed' });
  }
});

export default router;
