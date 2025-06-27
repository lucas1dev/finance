/**
 * Serviço para tracking de execução dos jobs de notificação.
 * Permite rastrear início, fim, duração e resultados de cada execução.
 * 
 * @module services/jobTracking
 */

const { JobExecution } = require('../models');
const { logger } = require('../utils/logger');
const emailService = require('./emailService');

/**
 * Inicia o tracking de uma execução de job.
 * @param {string} jobName - Nome do job (payment_check, general_reminders, cleanup).
 * @returns {Promise<Object>} Registro de execução criado.
 * @example
 * const execution = await startJobTracking('payment_check');
 * // Retorna: { id: 1, jobName: 'payment_check', status: 'running', startedAt: '2024-01-15T10:00:00Z' }
 */
async function startJobTracking(jobName) {
  try {
    const execution = await JobExecution.create({
      jobName,
      status: 'running',
      startedAt: new Date(),
    });

    logger.info(`Job ${jobName} iniciado - ID: ${execution.id}`);
    return execution;
  } catch (error) {
    logger.error(`Erro ao iniciar tracking do job ${jobName}:`, error);
    throw error;
  }
}

/**
 * Finaliza o tracking de uma execução de job com sucesso.
 * @param {number} executionId - ID da execução.
 * @param {Object} results - Resultados da execução.
 * @param {number} results.notificationsCreated - Número de notificações criadas.
 * @param {number} results.notificationsUpdated - Número de notificações atualizadas.
 * @param {Object} results.metadata - Dados adicionais sobre a execução.
 * @returns {Promise<Object>} Registro de execução atualizado.
 * @example
 * await finishJobTracking(1, {
 *   notificationsCreated: 5,
 *   notificationsUpdated: 2,
 *   metadata: { usersProcessed: 10 }
 * });
 */
async function finishJobTracking(executionId, results = {}) {
  try {
    const execution = await JobExecution.findByPk(executionId);
    if (!execution) {
      throw new Error(`Execução ${executionId} não encontrada`);
    }

    const finishedAt = new Date();
    const duration = finishedAt.getTime() - execution.startedAt.getTime();

    await execution.update({
      status: 'success',
      finishedAt,
      duration,
      notificationsCreated: results.notificationsCreated || 0,
      notificationsUpdated: results.notificationsUpdated || 0,
      metadata: results.metadata || null,
    });

    logger.info(`Job ${execution.jobName} finalizado com sucesso - ID: ${executionId}, Duração: ${duration}ms`);
    return execution;
  } catch (error) {
    logger.error(`Erro ao finalizar tracking do job ${executionId}:`, error);
    throw error;
  }
}

/**
 * Registra erro em uma execução de job.
 * @param {number} executionId - ID da execução.
 * @param {Error} error - Erro ocorrido.
 * @returns {Promise<Object>} Registro de execução atualizado.
 * @example
 * try {
 *   // execução do job
 * } catch (error) {
 *   await failJobTracking(1, error);
 * }
 */
async function failJobTracking(executionId, error) {
  try {
    const execution = await JobExecution.findByPk(executionId);
    if (!execution) {
      throw new Error(`Execução ${executionId} não encontrada`);
    }

    const finishedAt = new Date();
    const duration = finishedAt.getTime() - execution.startedAt.getTime();

    await execution.update({
      status: 'error',
      finishedAt,
      duration,
      errorMessage: error.message,
      errorStack: error.stack,
    });

    logger.error(`Job ${execution.jobName} falhou - ID: ${executionId}, Erro: ${error.message}`);

    // Enviar alerta por email para administradores
    try {
      await emailService.sendJobFailureAlert(execution.jobName, error, {
        executionId,
        duration,
        startedAt: execution.startedAt,
        finishedAt
      });
    } catch (emailError) {
      logger.error('Erro ao enviar alerta por email:', emailError);
    }

    // Verificar se há múltiplas falhas consecutivas
    await checkConsecutiveFailures(execution.jobName);

    return execution;
  } catch (trackingError) {
    logger.error(`Erro ao registrar falha do job ${executionId}:`, trackingError);
    throw trackingError;
  }
}

/**
 * Verifica se há múltiplas falhas consecutivas e envia alerta se necessário.
 * @param {string} jobName - Nome do job.
 * @returns {Promise<void>}
 */
async function checkConsecutiveFailures(jobName) {
  try {
    // Buscar as últimas 5 execuções do job
    const recentExecutions = await JobExecution.findAll({
      where: { jobName },
      order: [['startedAt', 'DESC']],
      limit: 5,
    });

    if (recentExecutions.length < 3) {
      return; // Precisa de pelo menos 3 execuções para considerar falhas consecutivas
    }

    // Verificar se as últimas execuções foram falhas
    const consecutiveFailures = recentExecutions.filter(exec => exec.status === 'error');
    
    if (consecutiveFailures.length >= 3) {
      const recentErrors = consecutiveFailures.map(exec => exec.errorMessage);
      
      logger.warn(`Detectadas ${consecutiveFailures.length} falhas consecutivas no job ${jobName}`);
      
      // Enviar alerta para múltiplas falhas consecutivas
      try {
        await emailService.sendConsecutiveFailureAlert(jobName, consecutiveFailures.length, recentErrors);
      } catch (emailError) {
        logger.error('Erro ao enviar alerta de falhas consecutivas:', emailError);
      }
    }
  } catch (error) {
    logger.error(`Erro ao verificar falhas consecutivas do job ${jobName}:`, error);
  }
}

/**
 * Obtém o histórico de execuções de um job específico.
 * @param {string} jobName - Nome do job.
 * @param {number} limit - Limite de registros (padrão: 10).
 * @returns {Promise<Array>} Lista de execuções.
 * @example
 * const history = await getJobHistory('payment_check', 5);
 * // Retorna: [{ id: 1, status: 'success', duration: 1500, ... }]
 */
async function getJobHistory(jobName, limit = 10) {
  try {
    const executions = await JobExecution.findAll({
      where: { jobName },
      order: [['startedAt', 'DESC']],
      limit,
    });

    return executions;
  } catch (error) {
    logger.error(`Erro ao buscar histórico do job ${jobName}:`, error);
    throw error;
  }
}

/**
 * Obtém o histórico de execuções com paginação e filtros avançados.
 * @param {Object} options - Opções de consulta.
 * @param {number} options.page - Página atual (padrão: 1).
 * @param {number} options.limit - Limite por página (padrão: 20).
 * @param {number} options.offset - Offset para paginação.
 * @param {string} options.jobType - Tipo de job para filtrar.
 * @param {string} options.status - Status para filtrar (success, error, running).
 * @param {string} options.startDate - Data de início para filtrar (YYYY-MM-DD).
 * @param {string} options.endDate - Data de fim para filtrar (YYYY-MM-DD).
 * @param {string} options.sortBy - Campo para ordenação (startedAt, duration, notificationsCreated).
 * @param {string} options.sortOrder - Ordem de classificação (ASC, DESC).
 * @param {number} options.minDuration - Duração mínima em ms.
 * @param {number} options.maxDuration - Duração máxima em ms.
 * @param {number} options.minNotifications - Número mínimo de notificações criadas.
 * @param {boolean} options.hasError - Filtrar apenas execuções com erro.
 * @returns {Promise<Object>} Histórico paginado com filtros.
 * @example
 * const history = await getJobHistoryWithPagination({ 
 *   page: 1, 
 *   limit: 10, 
 *   jobType: 'payment_check',
 *   status: 'success',
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 *   sortBy: 'duration',
 *   sortOrder: 'DESC'
 * });
 */
async function getJobHistoryWithPagination(options = {}) {
  try {
    const { 
      page = 1, 
      limit = 20, 
      offset = 0, 
      jobType,
      status,
      startDate,
      endDate,
      sortBy = 'startedAt',
      sortOrder = 'DESC',
      minDuration,
      maxDuration,
      minNotifications,
      hasError
    } = options;
    
    // Construir cláusula WHERE
    const whereClause = {};
    
    if (jobType) {
      whereClause.jobName = jobType;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (hasError) {
      whereClause.status = 'error';
    }
    
    // Filtros de data
    if (startDate || endDate) {
      whereClause.startedAt = {};
      if (startDate) {
        whereClause.startedAt[JobExecution.sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.startedAt[JobExecution.sequelize.Op.lte] = new Date(endDate + ' 23:59:59');
      }
    }
    
    // Filtros de duração
    if (minDuration || maxDuration) {
      whereClause.duration = {};
      if (minDuration) {
        whereClause.duration[JobExecution.sequelize.Op.gte] = parseInt(minDuration);
      }
      if (maxDuration) {
        whereClause.duration[JobExecution.sequelize.Op.lte] = parseInt(maxDuration);
      }
    }
    
    // Filtro de notificações mínimas
    if (minNotifications) {
      whereClause.notificationsCreated = {
        [JobExecution.sequelize.Op.gte]: parseInt(minNotifications)
      };
    }
    
    // Validar e configurar ordenação
    const validSortFields = ['startedAt', 'finishedAt', 'duration', 'notificationsCreated', 'notificationsUpdated', 'status'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'startedAt';
    const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // Executar consulta
    const { count, rows } = await JobExecution.findAndCountAll({
      where: whereClause,
      order: [[finalSortBy, finalSortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id',
        'jobName',
        'status',
        'startedAt',
        'finishedAt',
        'duration',
        'notificationsCreated',
        'notificationsUpdated',
        'errorMessage',
        'metadata',
        'createdAt',
        'updatedAt'
      ]
    });

    // Calcular estatísticas dos resultados filtrados
    const stats = await calculateFilteredStats(whereClause);

    return {
      history: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNextPage: parseInt(page) < Math.ceil(count / limit),
        hasPrevPage: parseInt(page) > 1,
        nextPage: parseInt(page) < Math.ceil(count / limit) ? parseInt(page) + 1 : null,
        prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null
      },
      filters: {
        applied: {
          jobType,
          status,
          startDate,
          endDate,
          sortBy: finalSortBy,
          sortOrder: finalSortOrder,
          minDuration,
          maxDuration,
          minNotifications,
          hasError
        },
        available: {
          jobTypes: await getAvailableJobTypes(),
          dateRange: await getAvailableDateRange()
        }
      },
      stats
    };
  } catch (error) {
    logger.error('Erro ao buscar histórico paginado dos jobs:', error);
    throw error;
  }
}

/**
 * Calcula estatísticas dos resultados filtrados.
 * @param {Object} whereClause - Cláusula WHERE aplicada.
 * @returns {Promise<Object>} Estatísticas dos resultados.
 */
async function calculateFilteredStats(whereClause) {
  try {
    const [totalCount, successCount, errorCount, runningCount, avgDuration] = await Promise.all([
      JobExecution.count({ where: whereClause }),
      JobExecution.count({ where: { ...whereClause, status: 'success' } }),
      JobExecution.count({ where: { ...whereClause, status: 'error' } }),
      JobExecution.count({ where: { ...whereClause, status: 'running' } }),
      JobExecution.findOne({
        where: { ...whereClause, status: 'success' },
        attributes: [[JobExecution.sequelize.fn('AVG', JobExecution.sequelize.col('duration')), 'avgDuration']]
      })
    ]);

    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
    const avgDurationValue = avgDuration ? Math.round(avgDuration.getDataValue('avgDuration') || 0) : 0;

    return {
      totalCount,
      successCount,
      errorCount,
      runningCount,
      successRate: Math.round(successRate * 100) / 100,
      avgDuration: avgDurationValue,
      distribution: {
        success: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0,
        error: totalCount > 0 ? Math.round((errorCount / totalCount) * 100) : 0,
        running: totalCount > 0 ? Math.round((runningCount / totalCount) * 100) : 0
      }
    };
  } catch (error) {
    logger.error('Erro ao calcular estatísticas filtradas:', error);
    return {
      totalCount: 0,
      successCount: 0,
      errorCount: 0,
      runningCount: 0,
      successRate: 0,
      avgDuration: 0,
      distribution: { success: 0, error: 0, running: 0 }
    };
  }
}

/**
 * Obtém os tipos de jobs disponíveis.
 * @returns {Promise<Array>} Lista de tipos de jobs.
 */
async function getAvailableJobTypes() {
  try {
    const jobTypes = await JobExecution.findAll({
      attributes: [
        [JobExecution.sequelize.fn('DISTINCT', JobExecution.sequelize.col('jobName')), 'jobName']
      ],
      raw: true
    });
    
    return jobTypes.map(jt => jt.jobName).sort();
  } catch (error) {
    logger.error('Erro ao buscar tipos de jobs disponíveis:', error);
    return [];
  }
}

/**
 * Obtém o range de datas disponível.
 * @returns {Promise<Object>} Range de datas.
 */
async function getAvailableDateRange() {
  try {
    const [minDate, maxDate] = await Promise.all([
      JobExecution.findOne({
        attributes: [[JobExecution.sequelize.fn('MIN', JobExecution.sequelize.col('startedAt')), 'minDate']],
        raw: true
      }),
      JobExecution.findOne({
        attributes: [[JobExecution.sequelize.fn('MAX', JobExecution.sequelize.col('startedAt')), 'maxDate']],
        raw: true
      })
    ]);

    return {
      minDate: minDate?.minDate || new Date(),
      maxDate: maxDate?.maxDate || new Date()
    };
  } catch (error) {
    logger.error('Erro ao buscar range de datas disponível:', error);
    return {
      minDate: new Date(),
      maxDate: new Date()
    };
  }
}

/**
 * Obtém estatísticas de execução dos jobs.
 * @returns {Promise<Object>} Estatísticas dos jobs.
 * @example
 * const stats = await getJobStats();
 * // Retorna: { totalExecutions: 100, successRate: 0.95, avgDuration: 1200 }
 */
async function getJobStats() {
  try {
    const [totalExecutions, successExecutions, errorExecutions] = await Promise.all([
      JobExecution.count(),
      JobExecution.count({ where: { status: 'success' } }),
      JobExecution.count({ where: { status: 'error' } }),
    ]);

    const successRate = totalExecutions > 0 ? (successExecutions / totalExecutions) : 0;

    // Duração média das execuções bem-sucedidas
    const avgDurationResult = await JobExecution.findOne({
      where: { status: 'success' },
      attributes: [[JobExecution.sequelize.fn('AVG', JobExecution.sequelize.col('duration')), 'avgDuration']],
    });

    const avgDuration = avgDurationResult ? Math.round(avgDurationResult.getDataValue('avgDuration') || 0) : 0;

    return {
      totalExecutions,
      successExecutions,
      errorExecutions,
      successRate: Math.round(successRate * 100) / 100,
      avgDuration,
    };
  } catch (error) {
    logger.error('Erro ao buscar estatísticas dos jobs:', error);
    throw error;
  }
}

/**
 * Obtém estatísticas detalhadas dos jobs por período.
 * @param {string} period - Período para análise (7d, 30d, 90d).
 * @returns {Promise<Object>} Estatísticas detalhadas.
 * @example
 * const stats = await getDetailedStats('30d');
 */
async function getDetailedStats(period = '30d') {
  try {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalExecutions, successExecutions, errorExecutions, avgDurationResult] = await Promise.all([
      JobExecution.count({
        where: {
          startedAt: {
            [JobExecution.sequelize.Op.gte]: startDate,
          },
        },
      }),
      JobExecution.count({
        where: {
          status: 'success',
          startedAt: {
            [JobExecution.sequelize.Op.gte]: startDate,
          },
        },
      }),
      JobExecution.count({
        where: {
          status: 'error',
          startedAt: {
            [JobExecution.sequelize.Op.gte]: startDate,
          },
        },
      }),
      JobExecution.findOne({
        where: {
          status: 'success',
          startedAt: {
            [JobExecution.sequelize.Op.gte]: startDate,
          },
        },
        attributes: [[JobExecution.sequelize.fn('AVG', JobExecution.sequelize.col('duration')), 'avgDuration']],
      }),
    ]);

    const successRate = totalExecutions > 0 ? (successExecutions / totalExecutions) : 0;
    const avgDuration = avgDurationResult ? Math.round(avgDurationResult.getDataValue('avgDuration') || 0) : 0;

    // Estatísticas por tipo de job
    const jobStats = await JobExecution.findAll({
      where: {
        startedAt: {
          [JobExecution.sequelize.Op.gte]: startDate,
        },
      },
      attributes: [
        'jobName',
        [JobExecution.sequelize.fn('COUNT', JobExecution.sequelize.col('id')), 'totalExecutions'],
        [JobExecution.sequelize.fn('SUM', JobExecution.sequelize.literal('CASE WHEN status = "success" THEN 1 ELSE 0 END')), 'successExecutions'],
        [JobExecution.sequelize.fn('AVG', JobExecution.sequelize.col('duration')), 'avgDuration'],
      ],
      group: ['jobName'],
    });

    return {
      period,
      totalExecutions,
      successExecutions,
      errorExecutions,
      successRate: Math.round(successRate * 100) / 100,
      avgDuration,
      jobStats: jobStats.map(stat => ({
        jobName: stat.jobName,
        totalExecutions: parseInt(stat.getDataValue('totalExecutions')),
        successExecutions: parseInt(stat.getDataValue('successExecutions')),
        avgDuration: Math.round(stat.getDataValue('avgDuration') || 0),
      })),
    };
  } catch (error) {
    logger.error('Erro ao buscar estatísticas detalhadas dos jobs:', error);
    throw error;
  }
}

/**
 * Obtém a última execução de cada job.
 * @returns {Promise<Object>} Última execução de cada job.
 * @example
 * const lastExecutions = await getLastExecutions();
 * // Retorna: { payment_check: { id: 1, status: 'success', startedAt: '...' } }
 */
async function getLastExecutions() {
  try {
    const jobs = ['payment_check', 'general_reminders', 'cleanup'];
    const lastExecutions = {};

    for (const jobName of jobs) {
      const lastExecution = await JobExecution.findOne({
        where: { jobName },
        order: [['startedAt', 'DESC']],
      });

      if (lastExecution) {
        lastExecutions[jobName] = {
          id: lastExecution.id,
          status: lastExecution.status,
          startedAt: lastExecution.startedAt,
          finishedAt: lastExecution.finishedAt,
          duration: lastExecution.duration,
          notificationsCreated: lastExecution.notificationsCreated,
          notificationsUpdated: lastExecution.notificationsUpdated,
        };
      }
    }

    return lastExecutions;
  } catch (error) {
    logger.error('Erro ao buscar últimas execuções:', error);
    throw error;
  }
}

module.exports = {
  startJobTracking,
  finishJobTracking,
  failJobTracking,
  getJobHistory,
  getJobHistoryWithPagination,
  getJobStats,
  getDetailedStats,
  getLastExecutions,
}; 