const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Cria o diretório de logs se não existir
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configuração de formatos
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Configuração do logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'finance-server',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Log de erros
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Log combinado
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Log de requisições HTTP
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
  
  // Configurações de exceção
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // Configurações de rejeição
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Adiciona console transport apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Funções utilitárias para logging
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length') || 0
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });
  
  next();
};

const logError = (error, req = null) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code
  };
  
  if (req) {
    errorData.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      headers: req.headers
    };
  }
  
  logger.error('Application Error', errorData);
};

const logSecurity = (event, details) => {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

const logPerformance = (operation, duration, details = {}) => {
  logger.info('Performance', {
    operation,
    duration: `${duration}ms`,
    details
  });
};

const logDatabase = (operation, duration, details = {}) => {
  logger.info('Database', {
    operation,
    duration: `${duration}ms`,
    details
  });
};

// Middleware para logging de requisições
const requestLogger = (req, res, next) => {
  logRequest(req, res, next);
};

module.exports = {
  logger,
  logRequest,
  logError,
  logSecurity,
  logPerformance,
  logDatabase,
  requestLogger
}; 