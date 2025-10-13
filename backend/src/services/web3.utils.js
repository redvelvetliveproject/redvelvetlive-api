/**
 * 🪙 RedVelvetLive — web3.utils.js (PRO FINAL)
 * --------------------------------------------------------------
 * Funciones utilitarias para interacción con la blockchain BSC,
 * verificación de transacciones, balances y contratos (ONECOP/USDT).
 * Compatible con ethers.js v6.
 */

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

// 🧩 ABI mínima para operaciones ERC20
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

/* ======================================================
   🚀 Conexión al proveedor
   ====================================================== */
export const provider = new ethers.JsonRpcProvider(RPC_URL);

/* ======================================================
   🔹 Utilidades base
   ====================================================== */

/**
 * 🔍 Verifica si una transacción existe y fue confirmada
 * @param {string} txHash - Hash de transacción
 * @returns {Promise<{ success: boolean, receipt?: object }>}
 */
export async function verifyTransaction(txHash) {
  try {
    if (!txHash || !/^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
      return { success: false, message: "Hash inválido." };
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return { success: false, message: "Transacción no encontrada." };

    const success = receipt.status === 1;
    return {
      success,
      message: success ? "Transacción confirmada ✅" : "Transacción fallida ❌",
      receipt,
      explorer: `https://bscscan.com/tx/${txHash}`,
    };
  } catch (err) {
    console.error("Error verificando transacción:", err);
    return { success: false, message: "Error al consultar la red BSC." };
  }
}

/**
 * 💰 Obtiene el balance de un token ERC20 (ONECOP / USDT)
 * @param {string} wallet - Dirección a consultar
 * @param {"ONECOP"|"USDT"} token
 * @returns {Promise<number>} balance convertido a unidades humanas
 */
export async function getTokenBalance(wallet, token = "ONECOP") {
  try {
    const contractAddress =
      token === "USDT" ? USDT_CONTRACT : ONECOP_CONTRACT;

    const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    const balanceWei = await contract.balanceOf(wallet);

    return parseFloat(ethers.formatUnits(balanceWei, decimals));
  } catch (err) {
    console.error(`Error obteniendo balance ${token}:`, err);
    return 0;
  }
}

/**
 * 🪙 Obtiene información general de un token (nombre, símbolo, decimales)
 * @param {string} address - Dirección del contrato ERC20
 */
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
    console.error("Error obteniendo info de token:", err);
    return { name: "Desconocido", symbol: "???", decimals: 18 };
  }
}

/**
 * ⚖️ Convierte montos entre Wei y unidades legibles
 */
export const toWei = (amount, decimals = 18) =>
  ethers.parseUnits(String(amount), decimals);
export const fromWei = (amount, decimals = 18) =>
  parseFloat(ethers.formatUnits(amount, decimals));

/**
 * 🧮 Determina si estamos en Testnet o Mainnet
 */
export async function detectNetwork() {
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  const name = chainId === 56 ? "BSC Mainnet" : "BSC Testnet";
  return { chainId, name };
}

/**
 * 🧾 Envía transacción simple desde wallet del backend (opcional)
 */
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
    return {
      success: receipt.status === 1,
      txHash: tx.hash,
      explorer: `https://bscscan.com/tx/${tx.hash}`,
    };
  } catch (err) {
    console.error("❌ Error enviando transacción backend:", err);
    return { success: false, message: err.message };
  }
}

/**
 * 🧩 Función de auditoría general (verificación completa)
 */
export async function auditTransaction(txHash) {
  const result = await verifyTransaction(txHash);
  if (!result.success) return result;

  const { receipt } = result;
  const summary = {
    blockNumber: receipt.blockNumber,
    from: receipt.from,
    to: receipt.to,
    gasUsed: Number(receipt.gasUsed),
    timestamp: new Date().toISOString(),
    explorer: result.explorer,
  };
  return { ...result, summary };
}

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
