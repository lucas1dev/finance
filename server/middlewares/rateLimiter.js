const rateLimit = require('express-rate-limit');

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
 * Configurações de rate limiting diferenciadas por tipo de rota
 */
const rateLimitConfigs = {
  // Rate limiting para autenticação (mais restritivo)
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
  },

  // Rate limiting para APIs de dados (moderado)
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300, // 300 requisições por 15 minutos
    message: {
      error: 'Muitas requisições. Tente novamente mais tarde.',
      status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  },

  // Rate limiting para dashboard (mais permissivo)
  dashboard: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // 500 requisições por 15 minutos
    message: {
      error: 'Muitas requisições do dashboard. Tente novamente mais tarde.',
      status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  },

  // Rate limiting para uploads e operações pesadas (restritivo)
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 uploads por 15 minutos
    message: {
      error: 'Muitos uploads. Tente novamente mais tarde.',
      status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  },

  // Rate limiting padrão (moderado)
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // 200 requisições por 15 minutos
    message: {
      error: 'Muitas requisições. Tente novamente mais tarde.',
      status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  }
};

/**
 * Função para determinar o tipo de rota baseado no path
 * @param {string} path - Caminho da requisição
 * @returns {string} Tipo de rate limiting a ser aplicado
 */
function getRateLimitType(path) {
  // Rotas de autenticação
  if (path.startsWith('/api/auth')) {
    return 'auth';
  }

  // Rotas de dashboard (mais permissivas)
  if (path.startsWith('/api/dashboard')) {
    return 'dashboard';
  }

  // Rotas de upload ou operações pesadas
  if (path.includes('/upload') || path.includes('/import') || path.includes('/export')) {
    return 'upload';
  }

  // Rotas de API padrão
  if (path.startsWith('/api/')) {
    return 'api';
  }

  // Rate limiting padrão para outras rotas
  return 'default';
}

/**
 * Middleware de rate limiting inteligente
 * Aplica diferentes limites baseado no tipo de rota
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
    const rateLimitType = getRateLimitType(req.path);
    const config = rateLimitConfigs[rateLimitType];

    // Aplica configurações de ambiente se disponíveis
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || config.windowMs;
    const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || config.max;

    const limiter = rateLimit({
      ...config,
      windowMs,
      max,
      store,
      keyGenerator: (req) => {
        // Usa IP + user ID se disponível para melhor identificação
        const userId = req.user?.id || 'anonymous';
        return `${req.ip}-${userId}-${rateLimitType}`;
      },
      handler: (req, res) => {
        res.status(429).json({
          error: config.message.error,
          status: config.message.status,
          retryAfter: Math.ceil(windowMs / 1000), // Tempo em segundos
          limitType: rateLimitType
        });
      }
    });

    limiter(req, res, next);
  };
}

/**
 * Middleware de rate limiting específico para rotas de dashboard
 * Permite mais requisições para carregamento de dados
 */
const dashboardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.DASHBOARD_RATE_LIMIT_MAX) || 500, // 500 requisições por 15 minutos
  message: {
    error: 'Muitas requisições do dashboard. Tente novamente mais tarde.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    return `${req.ip}-${userId}-dashboard`;
  }
});

/**
 * Middleware de rate limiting para APIs de dados
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.API_RATE_LIMIT_MAX) || 300, // 300 requisições por 15 minutos
  message: {
    error: 'Muitas requisições. Tente novamente mais tarde.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    return `${req.ip}-${userId}-api`;
  }
});

/**
 * Middleware de rate limiting para autenticação
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
  skipSuccessfulRequests: true, // Não conta tentativas bem-sucedidas
  keyGenerator: (req) => {
    return `${req.ip}-auth`;
  }
});

module.exports = {
  createRateLimiter,
  dashboardRateLimiter,
  apiRateLimiter,
  authRateLimiter,
  getRateLimitType
}; 