// PM2 Configuration for Production
module.exports = {
  apps: [{
    name: 'hospital-api',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_restarts: 10,
    min_uptime: '10s',
  }]
};
