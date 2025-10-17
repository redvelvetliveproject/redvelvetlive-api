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
      env_file: "backend/.env",           // ← agrega esto
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 4000
      },
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      time: true
    }
  ]
}
