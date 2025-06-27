/**
 * Testes unitários para o CacheService
 * @author Lucas Santos
 */

let cacheService;
let mockRedisClient;

// Mock do Redis
jest.mock('redis', () => ({
  createClient: jest.fn()
}));

// Mock do logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('CacheService', () => {
  beforeEach(() => {
    jest.resetModules();
    
    // Mock do cliente Redis
    mockRedisClient = {
      connect: jest.fn(),
      quit: jest.fn(),
      on: jest.fn(),
      setEx: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      incr: jest.fn(),
      decr: jest.fn(),
      info: jest.fn(),
      ping: jest.fn(),
      flushAll: jest.fn()
    };

    const redis = require('redis');
    redis.createClient.mockReturnValue(mockRedisClient);

    cacheService = require('../../services/cacheService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect to Redis successfully', async () => {
      mockRedisClient.connect.mockResolvedValue();
      // Simula o evento 'connect' disparando o callback
      mockRedisClient.on.mockImplementation((event, cb) => {
        if (event === 'connect') cb();
        return mockRedisClient;
      });

      await cacheService.connect();

      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(cacheService.isConnected).toBe(true);
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockRedisClient.connect.mockRejectedValue(error);

      await cacheService.connect();

      expect(cacheService.isConnected).toBe(false);
    });

    it('should set up event handlers', async () => {
      mockRedisClient.connect.mockResolvedValue();

      await cacheService.connect();

      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('end', expect.any(Function));
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Redis when connected', async () => {
      cacheService.isConnected = true;
      cacheService.client = mockRedisClient;
      mockRedisClient.quit.mockResolvedValue();

      await cacheService.disconnect();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(cacheService.isConnected).toBe(false);
    });

    it('should not disconnect when not connected', async () => {
      cacheService.isConnected = false;

      await cacheService.disconnect();

      expect(mockRedisClient.quit).not.toHaveBeenCalled();
    });
  });

  describe('generateKey', () => {
    it('should generate key with prefix', () => {
      const key = 'test-key';
      const result = cacheService.generateKey(key);

      expect(result).toBe('finance:test-key');
    });
  });

  describe('set', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = mockRedisClient;
    });

    it('should set value with TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 3600;

      mockRedisClient.setEx.mockResolvedValue();

      const result = await cacheService.set(key, value, ttl);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'finance:test-key',
        ttl,
        JSON.stringify(value)
      );
      expect(result).toBe(true);
    });

    it('should set value without TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test' };

      mockRedisClient.set.mockResolvedValue();

      const result = await cacheService.set(key, value, 0);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'finance:test-key',
        JSON.stringify(value)
      );
      expect(result).toBe(true);
    });

    it('should return false when not connected', async () => {
      cacheService.isConnected = false;

      const result = await cacheService.set('test-key', 'value');

      expect(result).toBe(false);
    });

    it('should handle errors', async () => {
      const error = new Error('Redis error');
      mockRedisClient.setEx.mockRejectedValue(error);

      const result = await cacheService.set('test-key', 'value');

      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = mockRedisClient;
    });

    it('should get value successfully', async () => {
      const key = 'test-key';
      const value = { data: 'test' };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(value));

      const result = await cacheService.get(key);

      expect(mockRedisClient.get).toHaveBeenCalledWith('finance:test-key');
      expect(result).toEqual(value);
    });

    it('should return null when key not found', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cacheService.get('test-key');

      expect(result).toBe(null);
    });

    it('should return null when not connected', async () => {
      cacheService.isConnected = false;

      const result = await cacheService.get('test-key');

      expect(result).toBe(null);
    });

    it('should handle errors', async () => {
      const error = new Error('Redis error');
      mockRedisClient.get.mockRejectedValue(error);

      const result = await cacheService.get('test-key');

      expect(result).toBe(null);
    });
  });

  describe('del', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = mockRedisClient;
    });

    it('should delete key successfully', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await cacheService.del('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('finance:test-key');
      expect(result).toBe(true);
    });

    it('should return false when not connected', async () => {
      cacheService.isConnected = false;

      const result = await cacheService.del('test-key');

      expect(result).toBe(false);
    });
  });

  describe('delMultiple', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = mockRedisClient;
    });

    it('should delete multiple keys successfully', async () => {
      const keys = ['key1', 'key2', 'key3'];
      mockRedisClient.del.mockResolvedValue(3);

      const result = await cacheService.delMultiple(keys);

      expect(mockRedisClient.del).toHaveBeenCalledWith([
        'finance:key1',
        'finance:key2',
        'finance:key3'
      ]);
      expect(result).toBe(true);
    });
  });

  describe('delPattern', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = mockRedisClient;
    });

    it('should delete keys by pattern successfully', async () => {
      const pattern = 'user:*';
      const keys = ['finance:user:1', 'finance:user:2'];
      
      mockRedisClient.keys.mockResolvedValue(keys);
      mockRedisClient.del.mockResolvedValue(2);

      const result = await cacheService.delPattern(pattern);

      expect(mockRedisClient.keys).toHaveBeenCalledWith('finance:user:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(keys);
      expect(result).toBe(true);
    });

    it('should handle empty pattern result', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const result = await cacheService.delPattern('empty:*');

      expect(result).toBe(true);
    });
  });

  describe('exists', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = mockRedisClient;
    });

    it('should return true when key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await cacheService.exists('test-key');

      expect(mockRedisClient.exists).toHaveBeenCalledWith('finance:test-key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await cacheService.exists('test-key');

      expect(result).toBe(false);
    });
  });

  describe('getOrSet', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = mockRedisClient;
    });

    it('should return cached value when exists', async () => {
      const key = 'test-key';
      const cachedValue = { data: 'cached' };
      const fallbackFunction = jest.fn();

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedValue));

      const result = await cacheService.getOrSet(key, fallbackFunction);

      expect(result).toEqual(cachedValue);
      expect(fallbackFunction).not.toHaveBeenCalled();
    });

    it('should call fallback function and cache result when not cached', async () => {
      const key = 'test-key';
      const fallbackValue = { data: 'from-fallback' };
      const fallbackFunction = jest.fn().mockResolvedValue(fallbackValue);

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue();

      const result = await cacheService.getOrSet(key, fallbackFunction);

      expect(result).toEqual(fallbackValue);
      expect(fallbackFunction).toHaveBeenCalled();
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'finance:test-key',
        cacheService.defaultTTL,
        JSON.stringify(fallbackValue)
      );
    });

    it('should handle fallback function errors', async () => {
      const key = 'test-key';
      const fallbackError = new Error('Fallback error');
      const fallbackFunction = jest.fn().mockRejectedValue(fallbackError);

      mockRedisClient.get.mockResolvedValue(null);

      await expect(cacheService.getOrSet(key, fallbackFunction))
        .rejects.toThrow('Fallback error');
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = mockRedisClient;
    });

    it('should return cache statistics', async () => {
      const mockInfo = 'redis_version:6.0.0\r\nuptime_in_seconds:3600\r\nused_memory_human:1.0M\r\nconnected_clients:5\r\n';
      const keys = ['finance:key1', 'finance:key2'];

      mockRedisClient.info.mockResolvedValue(mockInfo);
      mockRedisClient.keys.mockResolvedValue(keys);

      const result = await cacheService.getCacheStats();

      expect(result).toEqual({
        connected: true,
        totalKeys: 2,
        info: mockInfo
      });
    });

    it('should return null when not connected', async () => {
      cacheService.isConnected = false;

      const result = await cacheService.getCacheStats();

      expect(result).toBe(null);
    });
  });

  describe('healthCheck', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = mockRedisClient;
    });

    it('should return healthy status when connected', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await cacheService.healthCheck();

      expect(result).toEqual({
        status: 'healthy',
        message: 'Redis connected and responding'
      });
    });

    it('should return disconnected status when not connected', async () => {
      cacheService.isConnected = false;

      const result = await cacheService.healthCheck();

      expect(result).toEqual({
        status: 'disconnected',
        message: 'Redis not connected'
      });
    });

    it('should return unhealthy status when ping fails', async () => {
      const error = new Error('Ping failed');
      mockRedisClient.ping.mockRejectedValue(error);

      const result = await cacheService.healthCheck();

      expect(result).toEqual({
        status: 'unhealthy',
        message: 'Ping failed'
      });
    });
  });

  describe('flushAll', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = mockRedisClient;
    });

    it('should flush all cache successfully', async () => {
      mockRedisClient.flushAll.mockResolvedValue();

      const result = await cacheService.flushAll();

      expect(mockRedisClient.flushAll).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('specialized methods', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = mockRedisClient;
    });

    it('should handle getStats method', async () => {
      const fallbackFunction = jest.fn().mockResolvedValue({ total: 100 });
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue();

      const result = await cacheService.getStats('dashboard', fallbackFunction);

      expect(result).toEqual({ total: 100 });
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'finance:stats:dashboard',
        1800,
        JSON.stringify({ total: 100 })
      );
    });

    it('should handle getUserData method', async () => {
      const fallbackFunction = jest.fn().mockResolvedValue({ name: 'John' });
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue();

      const result = await cacheService.getUserData(1, 'profile', fallbackFunction);

      expect(result).toEqual({ name: 'John' });
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'finance:user:1:profile',
        3600,
        JSON.stringify({ name: 'John' })
      );
    });

    it('should handle invalidateUserCache method', async () => {
      const keys = ['finance:user:1:profile', 'finance:user:1:settings'];
      mockRedisClient.keys.mockResolvedValue(keys);
      mockRedisClient.del.mockResolvedValue(2);

      const result = await cacheService.invalidateUserCache(1);

      expect(mockRedisClient.keys).toHaveBeenCalledWith('finance:user:1:*');
      expect(result).toBe(true);
    });
  });
}); 