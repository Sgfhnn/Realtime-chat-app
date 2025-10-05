module.exports = {
  apps: [{
    name: 'chat-backend',
    script: './dist/main.js',
    instances: 4, // or 'max' to use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001,
    },
    // PM2 options
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }],
};
