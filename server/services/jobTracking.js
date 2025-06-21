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
 * Obtém o histórico de execuções com paginação e filtros.
 * @param {Object} options - Opções de consulta.
 * @param {number} options.page - Página atual (padrão: 1).
 * @param {number} options.limit - Limite por página (padrão: 20).
 * @param {number} options.offset - Offset para paginação.
 * @param {string} options.jobType - Tipo de job para filtrar.
 * @returns {Promise<Object>} Histórico paginado.
 * @example
 * const history = await getJobHistory({ page: 1, limit: 10, jobType: 'payment_check' });
 */
async function getJobHistoryWithPagination(options = {}) {
  try {
    const { page = 1, limit = 20, offset = 0, jobType } = options;
    
    const whereClause = jobType ? { jobName: jobType } : {};
    
    const { count, rows } = await JobExecution.findAndCountAll({
      where: whereClause,
      order: [['startedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      history: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Erro ao buscar histórico paginado dos jobs:', error);
    throw error;
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