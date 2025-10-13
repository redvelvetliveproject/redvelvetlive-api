// backend/src/jobs/payments.cron.js
import cron from "node-cron";
import PaymentOrder from "../models/PaymentOrder.js";
import { verifyTransaction } from "../services/web3.utils.js";

/**
 * 🧠 Estrategia:
 * - Busca órdenes PENDING/PROCESSING
 * - Si tienen txHash: verifica on-chain
 * - Si confirmado: marca CONFIRMED y agrega explorer
 * - Si finalizado y falló: marca FAILED
 * - Si aún no final, lo deja en PROCESSING
 */

const BATCH_SIZE = Number(process.env.CRON_BATCH_SIZE || 50);

async function processPendingOrders() {
  const query = { status: { $in: ["PENDING", "PROCESSING"] } };

  const orders = await PaymentOrder.find(query)
    .sort({ updatedAt: 1 }) // prioriza las más antiguas
    .limit(BATCH_SIZE)
    .lean();

  if (!orders.length) return { scanned: 0, updated: 0 };

  let updated = 0;

  // Procesa de forma secuencial para no estresar el RPC
  for (const o of orders) {
    try {
      // Si no hay txHash aún (ej: flujo custodio o pendiente de UI), lo saltamos
      if (!o.txHash) continue;

      const result = await verifyTransaction(o.txHash, o.currency);

      // verifyTransaction retorna algo tipo:
      // { success: boolean, finalized: boolean, reason?: string, confirmations?: number }
      const update = {
        updatedAt: new Date(),
        "metadata.txExplorer": `https://bscscan.com/tx/${o.txHash}`,
      };

      if (result.success) {
        update.status = "CONFIRMED";
      } else if (result.finalized) {
        // Finalizado en cadena pero no exitoso (revert/failed)
        update.status = "FAILED";
        update["metadata.reason"] = result.reason || "on-chain revert/failed";
      } else {
        // Aún sin finalizar: lo dejamos en PROCESSING
        update.status = "PROCESSING";
      }

      await PaymentOrder.updateOne({ _id: o._id }, { $set: update });
      updated++;
    } catch (err) {
      // No frenamos todo el lote por un error puntual
      await PaymentOrder.updateOne(
        { _id: o._id },
        {
          $set: {
            status: "PROCESSING",
            updatedAt: new Date(),
            "metadata.lastError": err.message,
          },
        }
      );
    }
  }

  return { scanned: orders.length, updated };
}

/**
 * Inicia el cron si está habilitado.
 * Variables:
 *  - CRON_ENABLED=true|false
 *  - CRON_SCHEDULE (expresión cron) → por defecto: */5 * * * *
 *  - CRON_BATCH_SIZE (por defecto 50)
 *  - CRON_JITTER_MS (por defecto 30000) para evitar thundering herd
 */
export function startPaymentsCron() {
  if (String(process.env.CRON_ENABLED).toLowerCase() !== "true") {
    console.log("⏹️  Payments Cron deshabilitado (CRON_ENABLED != true).");
    return;
  }

  const schedule = process.env.CRON_SCHEDULE || "*/5 * * * *"; // cada 5 minutos
  const jitter = Number(process.env.CRON_JITTER_MS || 30000); // hasta 30s aleatorios

  console.log(`⏱️  Iniciando Payments Cron con schedule: "${schedule}" (jitter ≤ ${jitter}ms)`);

  // Jitter inicial para no pegar todas las instancias a la vez
  const startWithJitter = () => {
    setTimeout(() => {
      cron.schedule(schedule, async () => {
        const start = Date.now();
        try {
          const { scanned, updated } = await processPendingOrders();
          const ms = Date.now() - start;
          if (scanned || updated) {
            console.log(`🧾 Cron pagos: escaneadas ${scanned}, actualizadas ${updated} (${ms}ms)`);
          }
        } catch (e) {
          console.error("❌ Error en Payments Cron:", e);
        }
      });
      console.log("✅ Payments Cron programado.");
    }, Math.floor(Math.random() * jitter));
  };

  startWithJitter();
}
