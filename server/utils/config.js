require('dotenv').config();
const path = require('path');

/**
 * Configurações do ambiente.
 * @type {Object}
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || '0.0.0.0'
  },
  
  database: {
    dialect: process.env.DB_DIALECT || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    database: process.env.DB_NAME || 'finance',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    logging: process.env.DB_LOGGING === 'true',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 5,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000
    }
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'test-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3001'],
    methods: process.env.CORS_METHODS ? process.env.CORS_METHODS.split(',') : ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS ? process.env.CORS_ALLOWED_HEADERS.split(',') : ['Content-Type', 'Authorization'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    maxAge: parseInt(process.env.CORS_MAX_AGE, 10) || 86400,
    exposedHeaders: process.env.CORS_EXPOSED_HEADERS ? process.env.CORS_EXPOSED_HEADERS.split(',') : ['X-Total-Count']
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'text',
    file: process.env.LOG_FILE || path.join(__dirname, '../logs/app.log')
  }
};

// Validação de configurações obrigatórias
if (!config.jwt.secret) {
  throw new Error('JWT_SECRET is required');
}

module.exports = config; 