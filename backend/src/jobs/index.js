// ============================================
// ⏱️ RedVelvetLive — Inicializador Global de Jobs (PRO FINAL)
// ============================================
//
// Carga y arranca automáticamente todos los cron jobs
// declarados en la carpeta /jobs, según la configuración .env
//
// Actualmente soporta:
//   ✅ Pagos automáticos (payments.cron.js)
//   🧩 Extensible para futuros jobs: email.cron.js, metrics.cron.js, etc.
// ============================================

import dotenv from "dotenv";
import { startPaymentsCron } from "./payments.cron.js";

dotenv.config();

/* ======================================================
   🚀 Función principal
   ====================================================== */
export function startAllCrons() {
  console.log("🧠 Iniciando Jobs de RedVelvetLive...");

  // Pagos automáticos
  try {
    startPaymentsCron();
  } catch (err) {
    console.error("❌ Error iniciando Payments Cron:", err);
  }

  // Futuras tareas automáticas (ejemplo):
  // try { startEmailCron(); } catch (e) { ... }
  // try { startMetricsCron(); } catch (e) { ... }

  console.log("✅ Cron jobs inicializados correctamente.");
}

/* ======================================================
   🧩 Ejecución automática (solo si se ejecuta directamente)
   ====================================================== */
if (process.argv[1].includes("jobs/index.js")) {
  startAllCrons();
}
