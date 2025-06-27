/**
 * Controller para gerenciamento de Cache
 * Endpoints para administração do cache Redis
 * @author Lucas Santos
 */

const cacheService = require('../services/cacheService');
const { logger } = require('../utils/logger');

/**
 * Obtém estatísticas do cache
 * GET /api/cache/stats
 */
const getCacheStats = async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    
    if (!stats) {
      return res.status(503).json({
        error: 'Cache service unavailable',
        message: 'Redis não está disponível'
      });
    }

    res.json({
      message: 'Estatísticas do cache obtidas com sucesso',
      stats: {
        connected: stats.connected,
        totalKeys: stats.totalKeys,
        uptime: stats.info.includes('uptime_in_seconds') ? 
          parseInt(stats.info.match(/uptime_in_seconds:(\d+)/)[1]) : null,
        memory: stats.info.includes('used_memory_human') ? 
          stats.info.match(/used_memory_human:([^\r\n]+)/)[1] : null,
        clients: stats.info.includes('connected_clients') ? 
          parseInt(stats.info.match(/connected_clients:(\d+)/)[1]) : null
      }
    });
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    res.status(500).json({
      error: 'Erro ao obter estatísticas do cache',
      message: error.message
    });
  }
};

/**
 * Health check do cache
 * GET /api/cache/health
 */
const getCacheHealth = async (req, res) => {
  try {
    const health = await cacheService.healthCheck();
    
    if (health.status === 'healthy') {
      res.json({
        message: 'Cache está saudável',
        status: health.status,
        details: health.message
      });
    } else {
      res.status(503).json({
        error: 'Cache não está saudável',
        status: health.status,
        details: health.message
      });
    }
  } catch (error) {
    logger.error('Error checking cache health:', error);
    res.status(500).json({
      error: 'Erro ao verificar saúde do cache',
      message: error.message
    });
  }
};

/**
 * Invalida cache específico
 * DELETE /api/cache/invalidate/:type/:key
 */
const invalidateCache = async (req, res) => {
  try {
    const { type, key } = req.params;
    
    if (!type || !key) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        message: 'Tipo e chave são obrigatórios'
      });
    }

    let success = false;
    let message = '';

    switch (type) {
      case 'user':
        success = await cacheService.invalidateUserCache(key);
        message = `Cache do usuário ${key} invalidado`;
        break;
      
      case 'query':
        success = await cacheService.invalidateQueryCache();
        message = 'Cache de queries invalidado';
        break;
      
      case 'calculation':
        success = await cacheService.invalidateCalculationCache();
        message = 'Cache de cálculos invalidado';
        break;
      
      case 'stats':
        success = await cacheService.delPattern(`stats:${key}`);
        message = `Cache de estatísticas ${key} invalidado`;
        break;
      
      case 'pattern':
        success = await cacheService.delPattern(key);
        message = `Cache com padrão ${key} invalidado`;
        break;
      
      default:
        return res.status(400).json({
          error: 'Tipo de cache inválido',
          message: 'Tipos válidos: user, query, calculation, stats, pattern'
        });
    }

    if (success) {
      res.json({
        message: 'Cache invalidado com sucesso',
        details: message
      });
    } else {
      res.status(500).json({
        error: 'Erro ao invalidar cache',
        message: 'Falha na operação de invalidação'
      });
    }
  } catch (error) {
    logger.error('Error invalidating cache:', error);
    res.status(500).json({
      error: 'Erro ao invalidar cache',
      message: error.message
    });
  }
};

/**
 * Remove chave específica do cache
 * DELETE /api/cache/keys/:key
 */
const deleteCacheKey = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({
        error: 'Chave obrigatória',
        message: 'Chave do cache é obrigatória'
      });
    }

    const success = await cacheService.del(key);
    
    if (success) {
      res.json({
        message: 'Chave removida do cache com sucesso',
        key: key
      });
    } else {
      res.status(500).json({
        error: 'Erro ao remover chave do cache',
        message: 'Falha na operação de remoção'
      });
    }
  } catch (error) {
    logger.error('Error deleting cache key:', error);
    res.status(500).json({
      error: 'Erro ao remover chave do cache',
      message: error.message
    });
  }
};

/**
 * Remove múltiplas chaves do cache
 * DELETE /api/cache/keys
 */
const deleteMultipleCacheKeys = async (req, res) => {
  try {
    const { keys } = req.body;
    
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        error: 'Chaves obrigatórias',
        message: 'Array de chaves é obrigatório'
      });
    }

    const success = await cacheService.delMultiple(keys);
    
    if (success) {
      res.json({
        message: 'Chaves removidas do cache com sucesso',
        count: keys.length,
        keys: keys
      });
    } else {
      res.status(500).json({
        error: 'Erro ao remover chaves do cache',
        message: 'Falha na operação de remoção'
      });
    }
  } catch (error) {
    logger.error('Error deleting multiple cache keys:', error);
    res.status(500).json({
      error: 'Erro ao remover chaves do cache',
      message: error.message
    });
  }
};

/**
 * Define valor no cache
 * POST /api/cache/keys
 */
const setCacheKey = async (req, res) => {
  try {
    const { key, value, ttl } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios',
        message: 'Chave e valor são obrigatórios'
      });
    }

    const success = await cacheService.set(key, value, ttl);
    
    if (success) {
      res.json({
        message: 'Valor definido no cache com sucesso',
        key: key,
        ttl: ttl || cacheService.defaultTTL
      });
    } else {
      res.status(500).json({
        error: 'Erro ao definir valor no cache',
        message: 'Falha na operação de definição'
      });
    }
  } catch (error) {
    logger.error('Error setting cache key:', error);
    res.status(500).json({
      error: 'Erro ao definir valor no cache',
      message: error.message
    });
  }
};

/**
 * Obtém valor do cache
 * GET /api/cache/keys/:key
 */
const getCacheKey = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({
        error: 'Chave obrigatória',
        message: 'Chave do cache é obrigatória'
      });
    }

    const value = await cacheService.get(key);
    
    if (value !== null) {
      res.json({
        message: 'Valor obtido do cache com sucesso',
        key: key,
        value: value
      });
    } else {
      res.status(404).json({
        error: 'Chave não encontrada',
        message: 'Chave não existe no cache'
      });
    }
  } catch (error) {
    logger.error('Error getting cache key:', error);
    res.status(500).json({
      error: 'Erro ao obter valor do cache',
      message: error.message
    });
  }
};

/**
 * Verifica se chave existe no cache
 * HEAD /api/cache/keys/:key
 */
const checkCacheKey = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({
        error: 'Chave obrigatória',
        message: 'Chave do cache é obrigatória'
      });
    }

    const exists = await cacheService.exists(key);
    
    if (exists) {
      const ttl = await cacheService.ttl(key);
      res.json({
        message: 'Chave existe no cache',
        key: key,
        exists: true,
        ttl: ttl
      });
    } else {
      res.status(404).json({
        error: 'Chave não encontrada',
        message: 'Chave não existe no cache',
        key: key,
        exists: false
      });
    }
  } catch (error) {
    logger.error('Error checking cache key:', error);
    res.status(500).json({
      error: 'Erro ao verificar chave do cache',
      message: error.message
    });
  }
};

/**
 * Limpa todo o cache
 * DELETE /api/cache/flush
 */
const flushCache = async (req, res) => {
  try {
    const success = await cacheService.flushAll();
    
    if (success) {
      res.json({
        message: 'Cache limpo com sucesso',
        details: 'Todos os dados foram removidos do cache'
      });
    } else {
      res.status(500).json({
        error: 'Erro ao limpar cache',
        message: 'Falha na operação de limpeza'
      });
    }
  } catch (error) {
    logger.error('Error flushing cache:', error);
    res.status(500).json({
      error: 'Erro ao limpar cache',
      message: error.message
    });
  }
};

/**
 * Obtém informações detalhadas do cache
 * GET /api/cache/info
 */
const getCacheInfo = async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    
    if (!stats) {
      return res.status(503).json({
        error: 'Cache service unavailable',
        message: 'Redis não está disponível'
      });
    }

    // Parse Redis INFO
    const infoLines = stats.info.split('\r\n');
    const info = {};
    
    infoLines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          info[key] = value;
        }
      }
    });

    res.json({
      message: 'Informações detalhadas do cache obtidas com sucesso',
      info: {
        server: {
          redis_version: info.redis_version,
          redis_mode: info.redis_mode,
          os: info.os,
          arch_bits: info.arch_bits,
          multiplexing_api: info.multiplexing_api,
          gcc_version: info.gcc_version,
          process_id: info.process_id,
          run_id: info.run_id,
          tcp_port: info.tcp_port,
          uptime_in_seconds: info.uptime_in_seconds,
          uptime_in_days: info.uptime_in_days,
          hz: info.hz,
          lru_clock: info.lru_clock,
          executable: info.executable,
          config_file: info.config_file
        },
        clients: {
          connected_clients: info.connected_clients,
          client_recent_max_input_buffer: info.client_recent_max_input_buffer,
          client_recent_max_output_buffer: info.client_recent_max_output_buffer,
          blocked_clients: info.blocked_clients
        },
        memory: {
          used_memory: info.used_memory,
          used_memory_human: info.used_memory_human,
          used_memory_rss: info.used_memory_rss,
          used_memory_rss_human: info.used_memory_rss_human,
          used_memory_peak: info.used_memory_peak,
          used_memory_peak_human: info.used_memory_peak_human,
          used_memory_peak_perc: info.used_memory_peak_perc,
          used_memory_overhead: info.used_memory_overhead,
          used_memory_startup: info.used_memory_startup,
          used_memory_dataset: info.used_memory_dataset,
          used_memory_dataset_perc: info.used_memory_dataset_perc,
          total_system_memory: info.total_system_memory,
          total_system_memory_human: info.total_system_memory_human,
          used_memory_lua: info.used_memory_lua,
          used_memory_lua_human: info.used_memory_lua_human,
          maxmemory: info.maxmemory,
          maxmemory_human: info.maxmemory_human,
          maxmemory_policy: info.maxmemory_policy,
          mem_fragmentation_ratio: info.mem_fragmentation_ratio,
          mem_allocator: info.mem_allocator,
          active_defrag_running: info.active_defrag_running,
          lazyfree_pending_objects: info.lazyfree_pending_objects
        },
        stats: {
          total_connections_received: info.total_connections_received,
          total_commands_processed: info.total_commands_processed,
          instantaneous_ops_per_sec: info.instantaneous_ops_per_sec,
          total_net_input_bytes: info.total_net_input_bytes,
          total_net_output_bytes: info.total_net_output_bytes,
          instantaneous_input_kbps: info.instantaneous_input_kbps,
          instantaneous_output_kbps: info.instantaneous_output_kbps,
          rejected_connections: info.rejected_connections,
          sync_full: info.sync_full,
          sync_partial_ok: info.sync_partial_ok,
          sync_partial_err: info.sync_partial_err,
          expired_keys: info.expired_keys,
          expired_stale_perc: info.expired_stale_perc,
          expired_time_cap_reached_count: info.expired_time_cap_reached_count,
          evicted_keys: info.evicted_keys,
          keyspace_hits: info.keyspace_hits,
          keyspace_misses: info.keyspace_misses,
          pubsub_channels: info.pubsub_channels,
          pubsub_patterns: info.pubsub_patterns,
          latest_fork_usec: info.latest_fork_usec,
          migrate_cached_sockets: info.migrate_cached_sockets,
          slave_expires_tracked_keys: info.slave_expires_tracked_keys,
          active_defrag_hits: info.active_defrag_hits,
          active_defrag_misses: info.active_defrag_misses,
          active_defrag_key_hits: info.active_defrag_key_hits,
          active_defrag_key_misses: info.active_defrag_key_misses
        },
        replication: {
          role: info.role,
          connected_slaves: info.connected_slaves,
          master_replid: info.master_replid,
          master_replid2: info.master_replid2,
          master_repl_offset: info.master_repl_offset,
          second_repl_offset: info.second_repl_offset,
          repl_backlog_active: info.repl_backlog_active,
          repl_backlog_size: info.repl_backlog_size,
          repl_backlog_first_byte_offset: info.repl_backlog_first_byte_offset,
          repl_backlog_histlen: info.repl_backlog_histlen
        },
        cpu: {
          used_cpu_sys: info.used_cpu_sys,
          used_cpu_user: info.used_cpu_user,
          used_cpu_sys_children: info.used_cpu_sys_children,
          used_cpu_user_children: info.used_cpu_user_children
        },
        cluster: {
          cluster_enabled: info.cluster_enabled
        },
        keyspace: {
          totalKeys: stats.totalKeys
        }
      }
    });
  } catch (error) {
    logger.error('Error getting cache info:', error);
    res.status(500).json({
      error: 'Erro ao obter informações do cache',
      message: error.message
    });
  }
};

module.exports = {
  getCacheStats,
  getCacheHealth,
  invalidateCache,
  deleteCacheKey,
  deleteMultipleCacheKeys,
  setCacheKey,
  getCacheKey,
  checkCacheKey,
  flushCache,
  getCacheInfo
}; 