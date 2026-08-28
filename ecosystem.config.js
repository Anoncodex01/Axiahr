module.exports = {
  apps: [{
    name: 'axia-nextjs',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/axia-nextjs',
    instances: 1, // Single instance (fork mode) - Next.js handles concurrency efficiently
    exec_mode: 'fork', // Fork mode recommended for Next.js
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/root/.pm2/logs/axia-nextjs-error.log',
    out_file: '/root/.pm2/logs/axia-nextjs-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    // Next.js handles multiple requests efficiently in a single process
    // Fork mode is recommended for Next.js applications
  }]
};

