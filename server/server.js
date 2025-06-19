require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Middleware de parsing JSON (redundante, mas mantido para compatibilidade)
app.use(express.json());

// Middleware de tratamento de erros (redundante, mas mantido para compatibilidade)
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
    status: err.status || 500
  });
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err);
  console.error('Stack trace:', err.stack);
  
  // Em produção, podemos querer notificar um serviço de monitoramento
  if (process.env.NODE_ENV === 'production') {
    // Aqui você pode adicionar notificação para serviços como Sentry, LogRocket, etc.
    console.error('Erro crítico em produção - notificar equipe de desenvolvimento');
  }
  
  process.exit(1);
});

// Tratamento de promises rejeitadas não tratadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada não tratada:', reason);
  console.error('Promise:', promise);
  
  if (process.env.NODE_ENV === 'production') {
    console.error('Promise rejeitada em produção - notificar equipe de desenvolvimento');
  }
  
  process.exit(1);
});

// Configuração do servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('🔒 Modo de produção ativado');
    console.log('📝 Logs detalhados habilitados');
  }
});

// Configurações de timeout para produção
if (process.env.NODE_ENV === 'production') {
  server.timeout = 30000; // 30 segundos
  server.keepAliveTimeout = 65000; // 65 segundos
  server.headersTimeout = 66000; // 66 segundos
}

// Tratamento de erros do servidor
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ A porta ${PORT} já está em uso. Tente usar outra porta.`);
    console.error(`💡 Sugestões:`);
    console.error(`   - Verifique se há outro processo rodando na porta ${PORT}`);
    console.error(`   - Use: lsof -ti:${PORT} | xargs kill -9`);
    console.error(`   - Ou altere a porta no arquivo .env`);
    process.exit(1);
  } else if (err.code === 'EACCES') {
    console.error(`❌ Permissão negada para a porta ${PORT}`);
    console.error(`💡 Tente usar uma porta acima de 1024 ou execute com sudo`);
    process.exit(1);
  } else {
    console.error('❌ Erro ao iniciar o servidor:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM. Iniciando graceful shutdown...');
  server.close(() => {
    console.log('✅ Servidor fechado com sucesso');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT. Iniciando graceful shutdown...');
  server.close(() => {
    console.log('✅ Servidor fechado com sucesso');
    process.exit(0);
  });
});

module.exports = server; 