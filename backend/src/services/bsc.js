// backend/src/services/bsc.js
import fetch from 'node-fetch';

// ENV
const RPC_URL = process.env.BSC_RPC_URL;
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || '';
const MIN_CONFIRMATIONS = parseInt(process.env.MIN_CONFIRMATIONS || '3', 10);

function okUrl() {
  if (!RPC_URL) throw new Error('BSC_RPC_URL missing');
  return RPC_URL;
}

export function normalize(addr) {
  return (addr || '').toLowerCase();
}

export function toHex(n) {
  return '0x' + BigInt(n).toString(16);
}

export async function rpc(method, params = []) {
  const res = await fetch(okUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'rpc_error');
  return data.result;
}

export async function getCurrentBlockNumber() {
  const hex = await rpc('eth_blockNumber', []);
  return parseInt(hex, 16);
}

export async function getTxReceipt(txHash) {
  return await rpc('eth_getTransactionReceipt', [txHash]);
}

// ERC-20 Transfer signature topic
export const TRANSFER_SIG_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Busca en el receipt un evento Transfer hacia treasury del token esperado
export function findTransferToTreasury(receipt, tokenContract, treasury) {
  const addr = normalize(tokenContract);
  const toTopic = addrToTopic(treasury);
  for (const lg of receipt.logs || []) {
    if ((lg.address || '').toLowerCase() !== addr) continue;
    const topics = lg.topics || [];
    if (topics.length < 3) continue;
    if (normalize(topics[0]) !== normalize(TRANSFER_SIG_TOPIC)) continue;
    // topics[2] = to
    if (normalize(topics[2]) !== normalize(toTopic)) continue;

    const valueStr = (lg.data && lg.data !== '0x') ? BigInt(lg.data).toString() : '0';
    return { log: lg, valueStr };
  }
  return null;
}

// --- EXTRA: getLogs y helpers para escaneo automático ---
export async function getLogs({ fromBlock, toBlock, address, topics }) {
  return await rpc('eth_getLogs', [{
    fromBlock: toHex(fromBlock),
    toBlock: toHex(toBlock),
    address,
    topics
  }]);
}

// 32 bytes topic para una dirección (left-padded)
export function addrToTopic(addr) {
  const clean = normalize(addr).replace(/^0x/, '');
  return '0x' + '0'.repeat(64 - clean.length) + clean;
}
