// =============================================
// 🌹 REDVELVETLIVE — ENTRYPOINT PRINCIPAL (PRO FINAL)
// =============================================
//
// Este archivo se usa como punto de entrada general.
// Si el entorno es producción, carga el servidor principal.
// Si es desarrollo, usa nodemon o dev.js.
//
// =============================================

import dotenv from "dotenv";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Detecta entorno
const env = process.env.NODE_ENV || "development";
console.log(`🚀 Iniciando RedVelvetLive API en modo: ${env}`);

// Comando base según entorno
const command =
  env === "production"
    ? `node ${path.join(__dirname, "backend/src/server.js")}`
    : `nodemon --watch backend/src --ext js,json --exec "node backend/src/server.js"`;

// Ejecuta comando
try {
  execSync(command, { stdio: "inherit" });
} catch (err) {
  console.error("❌ Error ejecutando el servidor:", err.message);
  process.exit(1);
}
