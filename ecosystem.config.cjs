// ecosystem.config.cjs — RedVelvetLive (PRO, repo-safe / CommonJS)
module.exports = {
  apps: [
    {
      name: "redvelvetlive-api",
      script: "backend/src/server.js",
      cwd: ".",

      // ⚙️ Runtime
      instances: 1,                 // cambia a "max" y exec_mode: "cluster" si quieres escalar
      exec_mode: "fork",
      watch: false,
      node_args: "--max-old-space-size=512",

      // 🔐 Variables de entorno
      // Carga .env directamente desde /backend (no duplica secretos)
      env_file: "backend/.env",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 4000,
      },

      // 🧾 Logs
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      merge_logs: true,             // unifica logs si hay varias instancias
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      time: true,

      // 🛡️ Robustez en producción
      autorestart: true,
      min_uptime: "5s",
      max_restarts: 10,
      restart_delay: 3000,          // 3s entre reintentos
      kill_timeout: 5000,           // 5s para apagar limpio
      max_memory_restart: "512M",   // reinicia si excede memoria
    },
  ],
};
