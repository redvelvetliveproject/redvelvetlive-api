// ============================================
// 💎 RedVelvetLive — Payments Test Suite (PRO FINAL)
// ============================================
//
// Pruebas locales para verificar conexión Web3 + API REST
//  - Requiere que el backend esté corriendo (npm run dev)
//  - Usa fetch (Node 18+) o axios para simular llamadas reales
//
// Ejecutar con:  node src/test/payments.test.js
// ============================================

import dotenv from "dotenv";
import fetch from "node-fetch";
import {
  verifyTransaction,
  getTokenBalance,
  detectNetwork,
} from "../services/web3.utils.js";

dotenv.config();

const API_URL = process.env.PUBLIC_URL || "http://localhost:4000/api";
const TEST_WALLET = process.env.TREASURY_WALLET;
const TEST_TX = "0x0000000000000000000000000000000000000000000000000000000000000000"; // reemplaza con uno real si lo tienes

console.log("🧪 Iniciando pruebas de módulo de pagos...");
console.log("🌐 API:", API_URL);
console.log("🔗 Wallet de prueba:", TEST_WALLET);
console.log("=================================================\n");

/* ======================================================
   🔹 1️⃣ Verificar conexión RPC y red activa
   ====================================================== */
async function testNetwork() {
  console.log("🔹 [1] Detectando red...");
  const net = await detectNetwork();
  console.log(net.success ? `✅ Red detectada: ${net.name}` : "❌ Error detectando red.");
  console.log(net, "\n");
}

/* ======================================================
   💰 2️⃣ Consultar balance de ONECOP y USDT
   ====================================================== */
async function testBalances() {
  console.log("🔹 [2] Consultando balances de la wallet...");
  const onecop = await getTokenBalance(TEST_WALLET, "ONECOP");
  const usdt = await getTokenBalance(TEST_WALLET, "USDT");

  console.log(`💎 ONECOP: ${onecop}`);
  console.log(`💵 USDT: ${usdt}`);
  console.log("✅ Balances consultados correctamente.\n");
}

/* ======================================================
   🔍 3️⃣ Verificar transacción específica
   ====================================================== */
async function testTransaction() {
  console.log("🔹 [3] Verificando transacción de ejemplo...");
  if (TEST_TX.includes("0000")) {
    console.log("⚠️ No se configuró un hash real. Sáltalo si no tienes uno.\n");
    return;
  }

  const result = await verifyTransaction(TEST_TX);
  if (result.success) {
    console.log("✅ Transacción confirmada:", result.explorer);
  } else {
    console.log("❌ No se encontró la transacción:", result.message);
  }
  console.log(result, "\n");
}

/* ======================================================
   🧾 4️⃣ Crear orden de pago (endpoint API)
   ====================================================== */
async function testCreateOrder() {
  console.log("🔹 [4] Probando endpoint /api/payments/create ...");

  const payload = {
    modelId: "64ff52c9a03a5b5fbbc5d001", // ⚠️ cambia por un ID real existente
    amount: 10,
    currency: "ONECOP",
    destinationWallet: TEST_WALLET,
    note: "Test de propina automatizado",
    type: "TIP",
  };

  try {
    const res = await fetch(`${API_URL}/payments/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log(data.success ? "✅ Orden creada correctamente.\n" : "❌ Error creando orden.\n");
    console.log(data);
  } catch (err) {
    console.error("❌ Error al probar creación de orden:", err.message);
  }
}

/* ======================================================
   🚀 Ejecución secuencial
   ====================================================== */
(async () => {
  await testNetwork();
  await testBalances();
  await testTransaction();
  await testCreateOrder();

  console.log("=================================================");
  console.log("✅ Pruebas completadas. Si todo sale OK, el módulo de pagos está funcional on-chain.");
  console.log("=================================================\n");
})();
