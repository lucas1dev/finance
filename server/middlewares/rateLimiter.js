const rateLimit = require("express-rate-limit");

// Dependências opcionais do Redis
let RedisStore = null;
let redis = null;

try {
  RedisStore = require('rate-limit-redis');
  redis = require('redis');
} catch (error) {
  console.warn('Redis não disponível, usando store em memória:', error.message);
}

/**
 * Configurações de rate limiting baseadas no fluxo da aplicação financeira
 */
const rateLimitConfigs = {
  // Rate limiting para autenticação (crítico - prevenir ataques)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas por 15 minutos
    message: {
      error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Não conta tentativas bem-sucedidas
    skipFailedRequests: false, // Conta tentativas falhadas
  },

  // Rate limiting para operações críticas (transações, pagamentos)
  critical: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 50, // 50 operações críticas por 5 minutos
    message: {
      error: 'Muitas operações críticas. Tente novamente em 5 minutos.',
      status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  },

  // Rate limiting para dashboard (carregamento de dados)
  dashboard: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 200, // 200 requisições por 5 minutos
    message: {
      error: 'Muitas requisições do dashboard. Tente novamente em 5 minutos.',
      status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  },

  // Rate limiting para operações de leitura (consultas)
  read: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 300, // 300 consultas por 5 minutos
    message: {
      error: 'Muitas consultas. Tente novamente em 5 minutos.',
      status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  },

  // Rate limiting para operações de escrita (CRUD)
  write: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 100, // 100 operações de escrita por 5 minutos
    message: {
      error: 'Muitas operações de escrita. Tente novamente em 5 minutos.',
      status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  },

  // Rate limiting para operações pesadas (import/export, relatórios)
  heavy: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 operações pesadas por 15 minutos
    message: {
      error: 'Muitas operações pesadas. Tente novamente em 15 minutos.',
      status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  },

  // Rate limiting para APIs administrativas
  admin: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 150, // 150 requisições por 5 minutos
    message: {
      error: 'Muitas requisições administrativas. Tente novamente em 5 minutos.',
      status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  },

  // Rate limiting padrão (moderado)
  default: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 200, // 200 requisições por 5 minutos
    message: {
      error: 'Muitas requisições. Tente novamente em 5 minutos.',
      status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  }
};

/**
 * Função para determinar o tipo de rota baseado no path e método HTTP
 * @param {string} path - Caminho da requisição
 * @param {string} method - Método HTTP
 * @returns {string} Tipo de rate limiting a ser aplicado
 */
function getRateLimitType(path, method) {
  // Rotas de autenticação
  if (path.startsWith('/api/auth')) {
    return 'auth';
  }

  // Rotas de dashboard
  if (path.startsWith('/api/dashboard')) {
    return 'dashboard';
  }

  // Rotas administrativas
  if (path.startsWith('/api/admin') || path.startsWith('/api/cache') || path.startsWith('/api/job-admin')) {
    return 'admin';
  }

  // Operações pesadas
  if (path.includes('/import') || path.includes('/export') || path.includes('/report') || 
      path.includes('/backup') || path.includes('/bulk')) {
    return 'heavy';
  }

  // Operações críticas (transações, pagamentos, recebimentos)
  if (path.includes('/transactions') || path.includes('/payments') || path.includes('/receivables') ||
      path.includes('/payables') || path.includes('/financing-payments')) {
    return 'critical';
  }

  // Operações de escrita (POST, PUT, DELETE)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return 'write';
  }

  // Operações de leitura (GET)
  if (method === 'GET') {
    return 'read';
  }

  // Rate limiting padrão
  return 'default';
}

/**
 * Função para gerar chave única baseada no usuário e contexto
 * @param {Object} req - Objeto de requisição
 * @param {string} rateLimitType - Tipo de rate limiting
 * @returns {string} Chave única para rate limiting
 */
function generateKey(req, rateLimitType) {
  const userId = req.user?.id || 'anonymous';
  const userRole = req.user?.role || 'user';
  const ip = req.ip || req.connection.remoteAddress;
  
  // Para usuários admin, permitir mais requisições
  const roleMultiplier = userRole === 'admin' ? 'admin' : 'user';
  
  return `${ip}-${userId}-${roleMultiplier}-${rateLimitType}`;
}

/**
 * Middleware de rate limiting inteligente baseado no fluxo da aplicação
 */
function createRateLimiter() {
  // Verifica se Redis está disponível
  let store = null;

  if (RedisStore && redis && process.env.REDIS_URL) {
    try {
      const redisClient = redis.createClient({
        url: process.env.REDIS_URL
      });
      store = new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
      });
    } catch (error) {
      console.warn('Erro ao conectar com Redis, usando store em memória:', error.message);
    }
  }

  return (req, res, next) => {
    const rateLimitType = getRateLimitType(req.path, req.method);
    const config = rateLimitConfigs[rateLimitType];

    // Aplica configurações de ambiente se disponíveis
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || config.windowMs;
    const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || config.max;

    // Ajusta limites baseado no papel do usuário
    let adjustedMax = max;
    if (req.user?.role === 'admin') {
      adjustedMax = Math.floor(max * 2); // Admins têm o dobro de requisições
    }

    const limiter = rateLimit({
      ...config,
      windowMs,
      max: adjustedMax,
      store,
      keyGenerator: (req) => generateKey(req, rateLimitType),
      handler: (req, res) => {
        const retryAfter = Math.ceil(windowMs / 1000);
        res.status(429).json({
          success: false,
          error: config.message.error,
          status: config.message.status,
          retryAfter, // Tempo em segundos
          limitType: rateLimitType,
          windowMs: windowMs / 1000, // Janela em segundos
          max: adjustedMax
        });
      },
      // Headers informativos
      standardHeaders: true,
      legacyHeaders: false,
      // Callback para logging
      onLimitReached: (req, res) => {
        console.warn(`Rate limit atingido: ${req.ip} - ${req.user?.id || 'anonymous'} - ${rateLimitType}`);
      }
    });

    limiter(req, res, next);
  };
}

/**
 * Middleware de rate limiting específico para autenticação
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5, // 5 tentativas por 15 minutos
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${req.ip}-auth`,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      status: 429,
      retryAfter: 900 // 15 minutos em segundos
    });
  }
});

/**
 * Middleware de rate limiting para operações críticas
 */
const criticalRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: parseInt(process.env.CRITICAL_RATE_LIMIT_MAX) || 50, // 50 operações por 5 minutos
  message: {
    error: 'Muitas operações críticas. Tente novamente em 5 minutos.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => generateKey(req, 'critical'),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Muitas operações críticas. Tente novamente em 5 minutos.',
      status: 429,
      retryAfter: 300 // 5 minutos em segundos
    });
  }
});

/**
 * Middleware de rate limiting para dashboard
 */
const dashboardRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: parseInt(process.env.DASHBOARD_RATE_LIMIT_MAX) || 200, // 200 requisições por 5 minutos
  message: {
    error: 'Muitas requisições do dashboard. Tente novamente em 5 minutos.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => generateKey(req, 'dashboard'),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Muitas requisições do dashboard. Tente novamente em 5 minutos.',
      status: 429,
      retryAfter: 300 // 5 minutos em segundos
    });
  }
});

/**
 * Middleware de rate limiting para APIs gerais
 */
const apiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: parseInt(process.env.API_RATE_LIMIT_MAX) || 200, // 200 requisições por 5 minutos
  message: {
    error: 'Muitas requisições. Tente novamente em 5 minutos.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => generateKey(req, 'default'),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Muitas requisições. Tente novamente em 5 minutos.',
      status: 429,
      retryAfter: 300 // 5 minutos em segundos
    });
  }
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
  criticalRateLimiter,
  dashboardRateLimiter,
  apiRateLimiter,
  getRateLimitType,
  generateKey
};
