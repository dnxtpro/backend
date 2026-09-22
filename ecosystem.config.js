module.exports = {
  apps: [
    {
      name: "pipestats-backend",
      script: "app.js",
      cwd: "/var/www/pipestats.iafailal.app/backend",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development",
        PORT: 4002
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4002
      }
    }
  ]
};
