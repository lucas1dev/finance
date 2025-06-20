const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// Configuração do rate limiting para produção
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite de requisições
  message: {
    error: 'Muitas requisições. Tente novamente mais tarde.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

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

// Health check endpoint
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

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/receivables', require('./routes/receivables'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/payables', require('./routes/payableRoutes'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/fixed-accounts', require('./routes/fixedAccounts'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/investment-goals', require('./routes/investmentGoals'));
app.use('/api/investment-contributions', require('./routes/investmentContributions'));

// Rotas de Financiamentos
app.use('/api/creditors', require('./routes/creditors'));
app.use('/api/financings', require('./routes/financings'));
app.use('/api/financing-payments', require('./routes/financingPayments'));

// Rotas de Notificações
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/notifications/jobs', require('./routes/notificationJobs'));

// Rotas de Auditoria
app.use('/api/audit', require('./routes/audit'));

// Rotas de Integridade de Dados
app.use('/api/data-integrity', require('./routes/dataIntegrity'));

// Rotas de Timeout de Jobs
app.use('/api/job-timeouts', require('./routes/jobTimeouts'));

// Rotas de Configuração de Jobs
app.use('/api/job-scheduler', require('./routes/jobScheduler'));

// Rotas de Painel Administrativo de Jobs
app.use('/api/job-admin', require('./routes/jobAdmin'));

// Rotas de Permissões
app.use('/api/permissions', require('./routes/permissions'));

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    message: `A rota ${req.originalUrl} não existe`,
    status: 404
  });
});

// Middleware de tratamento de erros
const { errorHandler } = require('./middlewares/errorMiddleware');
app.use(errorHandler);

// Inicializar serviços
async function initializeServices() {
  try {
    // Inicializar serviço de email
    // const emailService = require('./services/emailService');
    // await emailService.initializeEmailService();
    
    // Inicializar jobs de notificação
    // const { initializeNotificationJobs } = require('./services/notificationJobs');
    // initializeNotificationJobs();
    
    console.log('✅ Serviços inicializados com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar serviços:', error);
  }
}

// Inicializar serviços quando o app estiver pronto
// // initializeServices();

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