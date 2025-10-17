// ecosystem.config.js (repo-safe)
module.exports = {
  apps: [
    {
      name: "redvelvetlive-api",
      script: "backend/src/server.js",
      cwd: ".",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      node_args: "--max-old-space-size=512",
      env: {
        NODE_ENV: "production",
        // Si PORT no existe en .env, usa 4000
        PORT: process.env.PORT || 4000,
      },
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      time: true
    }
  ]
}
