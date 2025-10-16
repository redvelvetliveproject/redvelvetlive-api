// ============================================
// 🪙 RedVelvetLive — Web3 Utils (PRO FINAL INTEGRADO)
// ============================================
//
// Funciones utilitarias para interacción con la blockchain BSC,
// verificación de transacciones, balances y contratos (ONECOP / USDT).
// Totalmente compatible con ethers.js v6 y tu configuración .env.
//
// ============================================

import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

/* ======================================================
   ⚙️ CONFIGURACIÓN GLOBAL
   ====================================================== */
const RPC_URL = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";
const ONECOP_CONTRACT = process.env.ONECOP_CONTRACT;
const USDT_CONTRACT = process.env.USDT_CONTRACT;
const TREASURY_WALLET = process.env.TREASURY_WALLET;
const EXPLORER = process.env.BLOCKCHAIN_EXPLORER || "https://bscscan.com";

// 🧩 ABI mínima ERC20 para operaciones esenciales
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

/* ======================================================
   🚀 Conexión al proveedor RPC
   ====================================================== */
export const provider = new ethers.JsonRpcProvider(RPC_URL);

/* ======================================================
   🔍 Verificar transacción on-chain
   ====================================================== */
export async function verifyTransaction(txHash) {
  try {
    if (!txHash || !/^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
      return { success: false, message: "Hash de transacción inválido." };
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt)
      return { success: false, message: "Transacción no encontrada en la red." };

    const confirmed = receipt.status === 1;
    return {
      success: confirmed,
      message: confirmed
        ? "✅ Transacción confirmada en BSC"
        : "❌ Transacción fallida",
      receipt,
      explorer: `${EXPLORER}/tx/${txHash}`,
    };
  } catch (err) {
    console.error("❌ Error verificando transacción:", err);
    return { success: false, message: "Error al consultar la red BSC." };
  }
}

/* ======================================================
   💰 Obtener balance ERC20 (ONECOP / USDT)
   ====================================================== */
export async function getTokenBalance(wallet, token = "ONECOP") {
  try {
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet))
      throw new Error("Dirección de wallet inválida.");

    const contractAddress =
      token === "USDT" ? USDT_CONTRACT : ONECOP_CONTRACT;
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

    const [decimals, balanceWei] = await Promise.all([
      contract.decimals(),
      contract.balanceOf(wallet),
    ]);

    const balance = parseFloat(ethers.formatUnits(balanceWei, decimals));
    return balance;
  } catch (err) {
    console.error(`❌ Error obteniendo balance ${token}:`, err);
    return 0;
  }
}

/* ======================================================
   🧾 Obtener información del token
   ====================================================== */
export async function getTokenInfo(address) {
  try {
    const contract = new ethers.Contract(address, ERC20_ABI, provider);
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
    ]);
    return { name, symbol, decimals };
  } catch (err) {
    console.error("❌ Error obteniendo información del token:", err);
    return { name: "Desconocido", symbol: "???", decimals: 18 };
  }
}

/* ======================================================
   ⚖️ Conversión entre Wei y unidades legibles
   ====================================================== */
export const toWei = (amount, decimals = 18) =>
  ethers.parseUnits(String(amount), decimals);

export const fromWei = (amount, decimals = 18) =>
  parseFloat(ethers.formatUnits(amount, decimals));

/* ======================================================
   🌐 Detección de red (Mainnet / Testnet)
   ====================================================== */
export async function detectNetwork() {
  try {
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const name = chainId === 56 ? "BSC Mainnet" : "BSC Testnet";
    return { success: true, chainId, name };
  } catch (err) {
    console.error("❌ Error detectando red:", err);
    return { success: false, message: "Error detectando red RPC." };
  }
}

/* ======================================================
   💼 Transacción enviada desde wallet del backend
   ====================================================== */
export async function sendBackendTransaction(to, amount, token = "ONECOP") {
  try {
    if (!process.env.PRIVATE_KEY)
      throw new Error("No se ha configurado PRIVATE_KEY en .env");

    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress =
      token === "USDT" ? USDT_CONTRACT : ONECOP_CONTRACT;
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, signer);

    const decimals = await contract.decimals();
    const value = ethers.parseUnits(amount.toString(), decimals);

    const tx = await contract.transfer(to, value);
    const receipt = await tx.wait();

    const confirmed = receipt.status === 1;
    console.log(
      `📤 Transacción enviada desde backend → ${amount} ${token} a ${to}`
    );

    return {
      success: confirmed,
      txHash: tx.hash,
      explorer: `${EXPLORER}/tx/${tx.hash}`,
      message: confirmed ? "✅ Transacción confirmada" : "❌ Falló la transacción",
    };
  } catch (err) {
    console.error("❌ Error enviando transacción backend:", err);
    return { success: false, message: err.message };
  }
}

/* ======================================================
   🧩 Auditoría completa de transacciones
   ====================================================== */
export async function auditTransaction(txHash) {
  const base = await verifyTransaction(txHash);
  if (!base.success) return base;

  const { receipt } = base;
  const summary = {
    blockNumber: receipt.blockNumber,
    from: receipt.from,
    to: receipt.to,
    gasUsed: Number(receipt.gasUsed),
    cumulativeGasUsed: Number(receipt.cumulativeGasUsed || 0),
    timestamp: new Date().toISOString(),
    explorer: `${EXPLORER}/tx/${txHash}`,
  };

  return { ...base, summary };
}

/* ======================================================
   ✅ Exportación unificada
   ====================================================== */
export default {
  provider,
  verifyTransaction,
  getTokenBalance,
  getTokenInfo,
  toWei,
  fromWei,
  detectNetwork,
  sendBackendTransaction,
  auditTransaction,
};