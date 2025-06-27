const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');

// Carrega variáveis de ambiente
require('dotenv').config();

// Carrega modelos
require('./models');

// Carrega documentação Swagger
let swaggerDocument;
try {
  swaggerDocument = YAML.load('./docs/openapi.yaml');
  console.log('✅ Documentação Swagger carregada com sucesso');
  console.log('📊 Endpoints encontrados:', Object.keys(swaggerDocument.paths || {}).length);
} catch (error) {
  console.warn('❌ Documentação Swagger não encontrada:', error.message);
}

const app = express();

// Configuração de segurança avançada
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compressão para melhor performance
app.use(compression({
  level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Middleware para parsing de JSON com limite configurável
app.use(express.json({ 
  limit: process.env.BODY_PARSER_LIMIT || '10mb' 
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.BODY_PARSER_LIMIT || '10mb' 
}));

// Configuração do CORS para produção
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000'
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Middleware de logging para produção
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`;
    
    if (process.env.NODE_ENV === 'production') {
      console.log(logMessage);
    } else {
      console.log(`\x1b[36m${logMessage}\x1b[0m`);
    }
  });
  next();
});

// Health check endpoint (sem rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Documentação da API (apenas em desenvolvimento ou se configurado)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_API_DOCS === 'true') {
  if (swaggerDocument) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Finance API Documentation'
    }));
  }
}

// Servir arquivos Markdown da pasta docs
app.use('/docs-md', express.static(path.join(__dirname, 'docs'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.md')) {
      res.setHeader('Content-Type', 'text/markdown');
    }
  }
}));

// Servir arquivos Markdown da pasta principal
app.use('/docs-root', express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.md')) {
      res.setHeader('Content-Type', 'text/markdown');
    }
  }
}));

// Importa middlewares de rate limiting inteligente
const { 
  createRateLimiter, 
  authRateLimiter, 
  criticalRateLimiter, 
  dashboardRateLimiter, 
  apiRateLimiter 
} = require('./middlewares/rateLimiter');

// Middleware de rate limiting inteligente global
const intelligentRateLimiter = createRateLimiter();

// Rotas da API com rate limiting específico
app.use('/api/auth', authRateLimiter, require('./routes/auth'));
app.use('/api/dashboard', dashboardRateLimiter, require('./routes/dashboard'));

// Rotas de operações críticas (transações, pagamentos, recebimentos)
app.use('/api/transactions', criticalRateLimiter, require('./routes/transactions'));
app.use('/api/payments', criticalRateLimiter, require('./routes/payments'));
app.use('/api/receivables', criticalRateLimiter, require('./routes/receivables'));
app.use('/api/payables', criticalRateLimiter, require('./routes/payableRoutes'));
app.use('/api/financing-payments', criticalRateLimiter, require('./routes/financingPayments'));

// Rotas da API com rate limiting padrão
app.use('/api/accounts', apiRateLimiter, require('./routes/accounts'));
app.use('/api/categories', apiRateLimiter, require('./routes/categories'));
app.use('/api/customers', apiRateLimiter, require('./routes/customers'));
app.use('/api/suppliers', apiRateLimiter, require('./routes/supplierRoutes'));
app.use('/api/fixed-accounts', apiRateLimiter, require('./routes/fixedAccounts'));
app.use('/api/investments', apiRateLimiter, require('./routes/investments'));
app.use('/api/investment-goals', apiRateLimiter, require('./routes/investmentGoals'));
app.use('/api/investment-contributions', apiRateLimiter, require('./routes/investmentContributions'));

// Rotas de Financiamentos
app.use('/api/creditors', apiRateLimiter, require('./routes/creditors'));
app.use('/api/financings', apiRateLimiter, require('./routes/financings'));

// Rotas de Notificações
app.use('/api/notifications', apiRateLimiter, require('./routes/notifications'));
app.use('/api/notifications/jobs', apiRateLimiter, require('./routes/notificationJobs'));

// Rotas de Auditoria
app.use('/api/audit', apiRateLimiter, require('./routes/audit'));

// Rotas de Integridade de Dados
app.use('/api/data-integrity', apiRateLimiter, require('./routes/dataIntegrity'));

// Rotas de Timeout de Jobs
app.use('/api/job-timeouts', apiRateLimiter, require('./routes/jobTimeouts'));

// Rotas de Configuração de Jobs
app.use('/api/job-scheduler', apiRateLimiter, require('./routes/jobScheduler'));

// Rotas de Painel Administrativo de Jobs
app.use('/api/job-admin', apiRateLimiter, require('./routes/jobAdmin'));

// Rotas de Permissões
app.use('/api/permissions', apiRateLimiter, require('./routes/permissions'));

// Rotas de Gerenciamento de Usuários (Administrativas)
app.use('/api/admin/users', apiRateLimiter, require('./routes/adminUsers'));

// Rotas de Configurações
app.use('/api/settings', apiRateLimiter, require('./routes/settings'));

// Rotas de Cache (Administrativas)
app.use('/api/cache', apiRateLimiter, require('./routes/cache'));

// Rotas de Jobs de Contas Fixas
app.use('/api/fixed-account-jobs', apiRateLimiter, require('./routes/fixedAccountJobs'));

// Rotas de Lançamentos de Contas Fixas
app.use('/api/fixed-account-transactions', apiRateLimiter, require('./routes/fixedAccountTransactions'));

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    message: `A rota ${req.originalUrl} não existe`,
    status: 404
  });
});

// Middleware de tratamento de erros
const { errorHandler } = require('./middlewares/errorMiddleware');
app.use(errorHandler);

// Função para inicializar serviços (apenas quando não estiver em teste)
async function initializeServices() {
  if (process.env.NODE_ENV === 'test') {
    return; // Não inicializa serviços durante testes
  }

  try {
    // Inicializar serviço de email
    const { initializeEmailService } = require('./services/emailService');
    await initializeEmailService();
    
    // Inicializar jobs de notificação
    const { initializeNotificationJobs } = require('./services/notificationJobs');
    initializeNotificationJobs();
    
    // Inicializar jobs de contas fixas
    const { initializeFixedAccountJobs } = require('./services/fixedAccountJobs');
    initializeFixedAccountJobs();
    
    // Inicializar serviço de cache
    const cacheService = require('./services/cacheService');
    await cacheService.connect();
    
    console.log('✅ Serviços inicializados com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar serviços:', error);
  }
}

// Inicializar serviços apenas se não estiver em teste
if (process.env.NODE_ENV !== 'test') {
  initializeServices();
}

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada não tratada:', reason);
  process.exit(1);
});

module.exports = app; 