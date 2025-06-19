module.exports = {
  apps: [{
    name: 'finance-server',
    script: 'server.js',
    instances: 1, // Usar apenas 1 instância para desenvolvimento local
    exec_mode: 'fork', // Usar fork mode para desenvolvimento
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    // Configurações de monitoramento
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    
    // Configurações de log
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Configurações de restart
    autorestart: true,
    restart_delay: 4000,
    
    // Configurações de health check
    health_check_grace_period: 3000,
    
    // Configurações de performance
    node_args: '--max-old-space-size=1024',
    
    // Configurações de ambiente
    cwd: './',
    interpreter: 'node',
    
    // Configurações de monitoramento
    merge_logs: true,
    time: true
  }],
  
  // Configurações de deploy (para servidor Linux)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/finance.git',
      path: '/var/www/finance',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}; 