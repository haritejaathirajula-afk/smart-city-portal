/**
 * PM2 Process Management Configuration for Smart City Service Portal
 * 
 * Usage:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 reload ecosystem.config.cjs
 *   pm2 logs smart-city-portal
 */

module.exports = {
  apps: [
    {
      name: 'smart-city-portal',
      script: './server/src/server.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      listen_timeout: 8000,
      kill_timeout: 5000,
    },
  ],
};

