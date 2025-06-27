/**
 * Serviço de Cache Inteligente
 * Implementa cache Redis para otimização de performance
 * @author Lucas Santos
 */

const redis = require('redis');
const { logger } = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hora em segundos
    this.prefix = 'finance:';
  }

  /**
   * Inicializa a conexão com Redis
   */
  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.warn('Redis connection refused, retrying...');
            return Math.min(options.attempt * 100, 3000);
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            logger.error('Redis max retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis ready for commands');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.info('Redis connection ended');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Desconecta do Redis
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  /**
   * Gera chave de cache com prefixo
   */
  generateKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Define valor no cache
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key);
      const serializedValue = JSON.stringify(value);
      
      if (ttl > 0) {
        await this.client.setEx(cacheKey, ttl, serializedValue);
      } else {
        await this.client.set(cacheKey, serializedValue);
      }

      logger.debug(`Cache SET: ${cacheKey} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error('Cache SET error:', error);
      return false;
    }
  }

  /**
   * Obtém valor do cache
   */
  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const cacheKey = this.generateKey(key);
      const value = await this.client.get(cacheKey);
      
      if (value) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        return JSON.parse(value);
      }
      
      logger.debug(`Cache MISS: ${cacheKey}`);
      return null;
    } catch (error) {
      logger.error('Cache GET error:', error);
      return null;
    }
  }

  /**
   * Remove valor do cache
   */
  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key);
      await this.client.del(cacheKey);
      logger.debug(`Cache DEL: ${cacheKey}`);
      return true;
    } catch (error) {
      logger.error('Cache DEL error:', error);
      return false;
    }
  }

  /**
   * Remove múltiplas chaves do cache
   */
  async delMultiple(keys) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const cacheKeys = keys.map(key => this.generateKey(key));
      await this.client.del(cacheKeys);
      logger.debug(`Cache DEL MULTIPLE: ${cacheKeys.length} keys`);
      return true;
    } catch (error) {
      logger.error('Cache DEL MULTIPLE error:', error);
      return false;
    }
  }

  /**
   * Remove todas as chaves com padrão específico
   */
  async delPattern(pattern) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const cachePattern = this.generateKey(pattern);
      const keys = await this.client.keys(cachePattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.debug(`Cache DEL PATTERN: ${cachePattern} (${keys.length} keys)`);
      }
      
      return true;
    } catch (error) {
      logger.error('Cache DEL PATTERN error:', error);
      return false;
    }
  }

  /**
   * Verifica se chave existe no cache
   */
  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key);
      const result = await this.client.exists(cacheKey);
      return result === 1;
    } catch (error) {
      logger.error('Cache EXISTS error:', error);
      return false;
    }
  }

  /**
   * Define TTL para chave existente
   */
  async expire(key, ttl) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key);
      await this.client.expire(cacheKey, ttl);
      logger.debug(`Cache EXPIRE: ${cacheKey} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error('Cache EXPIRE error:', error);
      return false;
    }
  }

  /**
   * Obtém TTL restante da chave
   */
  async ttl(key) {
    if (!this.isConnected || !this.client) {
      return -1;
    }

    try {
      const cacheKey = this.generateKey(key);
      return await this.client.ttl(cacheKey);
    } catch (error) {
      logger.error('Cache TTL error:', error);
      return -1;
    }
  }

  /**
   * Incrementa valor numérico
   */
  async incr(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const cacheKey = this.generateKey(key);
      return await this.client.incr(cacheKey);
    } catch (error) {
      logger.error('Cache INCR error:', error);
      return null;
    }
  }

  /**
   * Decrementa valor numérico
   */
  async decr(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const cacheKey = this.generateKey(key);
      return await this.client.decr(cacheKey);
    } catch (error) {
      logger.error('Cache DECR error:', error);
      return null;
    }
  }

  /**
   * Cache com fallback para função
   */
  async getOrSet(key, fallbackFunction, ttl = this.defaultTTL) {
    try {
      // Tenta obter do cache primeiro
      let value = await this.get(key);
      
      if (value !== null) {
        return value;
      }

      // Se não está no cache, executa a função fallback
      value = await fallbackFunction();
      
      // Salva no cache
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }

      return value;
    } catch (error) {
      logger.error('Cache GET OR SET error:', error);
      // Em caso de erro, tenta executar a função fallback
      try {
        return await fallbackFunction();
      } catch (fallbackError) {
        logger.error('Fallback function error:', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Cache de estatísticas com invalidação automática
   */
  async getStats(key, fallbackFunction, ttl = 1800) { // 30 minutos para stats
    return this.getOrSet(`stats:${key}`, fallbackFunction, ttl);
  }

  /**
   * Cache de dados de usuário
   */
  async getUserData(userId, key, fallbackFunction, ttl = 3600) {
    return this.getOrSet(`user:${userId}:${key}`, fallbackFunction, ttl);
  }

  /**
   * Invalida cache de usuário específico
   */
  async invalidateUserCache(userId) {
    return this.delPattern(`user:${userId}:*`);
  }

  /**
   * Cache de queries complexas
   */
  async getQueryCache(queryHash, fallbackFunction, ttl = 1800) {
    return this.getOrSet(`query:${queryHash}`, fallbackFunction, ttl);
  }

  /**
   * Invalida cache de queries
   */
  async invalidateQueryCache() {
    return this.delPattern('query:*');
  }

  /**
   * Cache de cálculos complexos
   */
  async getCalculationCache(calculationHash, fallbackFunction, ttl = 3600) {
    return this.getOrSet(`calc:${calculationHash}`, fallbackFunction, ttl);
  }

  /**
   * Invalida cache de cálculos
   */
  async invalidateCalculationCache() {
    return this.delPattern('calc:*');
  }

  /**
   * Obtém estatísticas do cache
   */
  async getCacheStats() {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const info = await this.client.info();
      const keys = await this.client.keys(`${this.prefix}*`);
      
      return {
        connected: this.isConnected,
        totalKeys: keys.length,
        info: info
      };
    } catch (error) {
      logger.error('Cache STATS error:', error);
      return null;
    }
  }

  /**
   * Limpa todo o cache
   */
  async flushAll() {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushAll();
      logger.info('Cache FLUSH ALL executed');
      return true;
    } catch (error) {
      logger.error('Cache FLUSH ALL error:', error);
      return false;
    }
  }

  /**
   * Health check do cache
   */
  async healthCheck() {
    try {
      if (!this.isConnected || !this.client) {
        return { status: 'disconnected', message: 'Redis not connected' };
      }

      // Testa conexão com ping
      await this.client.ping();
      
      return { status: 'healthy', message: 'Redis connected and responding' };
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return { status: 'unhealthy', message: error.message };
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService; 