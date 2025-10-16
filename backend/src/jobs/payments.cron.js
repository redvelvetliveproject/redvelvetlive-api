// ============================================
// 💰 RedVelvetLive — Cron de Verificación de Pagos (PRO FINAL)
// ============================================
//
// Revisa periódicamente las órdenes PENDING/PROCESSING para:
//   ✅ Verificar en blockchain si están confirmadas o fallidas
//   ✅ Actualizar su estado y registro en MongoDB
//   ✅ Evitar sobrecarga con Jitter aleatorio y batch limitado
//
// Variables de entorno:
//   - CRON_ENABLED=true|false
//   - CRON_SCHEDULE="*/5 * * * *"   → cada 5 minutos (por defecto)
//   - CRON_BATCH_SIZE=50
//   - CRON_JITTER_MS=30000          → hasta 30s aleatorios
// ============================================

import cron from "node-cron";
import PaymentOrder from "../models/PaymentOrder.js";
import { verifyTransaction } from "../services/web3.utils.js";

const BATCH_SIZE = Number(process.env.CRON_BATCH_SIZE || 50);

/* ======================================================
   🔁 Procesa órdenes pendientes o en proceso
   ====================================================== */
async function processPendingOrders() {
  const query = { status: { $in: ["PENDING", "PROCESSING"] } };

  const orders = await PaymentOrder.find(query)
    .sort({ updatedAt: 1 }) // prioriza las más antiguas
    .limit(BATCH_SIZE)
    .lean();

  if (!orders.length) return { scanned: 0, updated: 0 };

  let updated = 0;

  for (const o of orders) {
    try {
      if (!o.txHash) continue; // no hay transacción aún

      const result = await verifyTransaction(o.txHash, o.currency);

      const update = {
        updatedAt: new Date(),
        "metadata.txExplorer": `https://bscscan.com/tx/${o.txHash}`,
      };

      if (result.success) {
        update.status = "CONFIRMED";
      } else if (result.finalized) {
        update.status = "FAILED";
        update["metadata.reason"] = result.reason || "on-chain revert/failed";
      } else {
        update.status = "PROCESSING";
      }

      await PaymentOrder.updateOne({ _id: o._id }, { $set: update });
      updated++;
    } catch (err) {
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

/* ======================================================
   ⏱️ Inicializa el cron programado
   ====================================================== */
export function startPaymentsCron() {
  if (String(process.env.CRON_ENABLED).toLowerCase() !== "true") {
    console.log("⏹️  Payments Cron deshabilitado (CRON_ENABLED != true).");
    return;
  }

  // ⚙️ Cron: cada 5 minutos por defecto
  const schedule = process.env.CRON_SCHEDULE || "*/5 * * * *";
  const jitter = Number(process.env.CRON_JITTER_MS || 30000);

  console.log(
    `⏱️  Iniciando Payments Cron con schedule "${schedule}" (jitter ≤ ${jitter}ms)`
  );

  // Evita ejecuciones simultáneas
  const startWithJitter = () => {
    setTimeout(() => {
      cron.schedule(schedule, async () => {
        const start = Date.now();
        try {
          const { scanned, updated } = await processPendingOrders();
          const ms = Date.now() - start;
          if (scanned || updated) {
            console.log(
              `🧾 Cron pagos: escaneadas ${scanned}, actualizadas ${updated} (${ms}ms)`
            );
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

