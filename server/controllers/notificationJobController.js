/**
 * Controller para gerenciamento de jobs de notificação
 * Permite visualizar histórico, estatísticas e executar jobs manualmente
 */
const jobTracking = require('../services/jobTracking');
const notificationJobs = require('../services/notificationJobs');
const { logger } = require('../utils/logger');

/**
 * Obtém o histórico de execuções dos jobs com paginação e filtros avançados
 */
async function getJobHistory(req, res) {
  try {
    const { 
      page, 
      limit, 
      jobType,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      minDuration,
      maxDuration,
      minNotifications,
      hasError
    } = req.query;

    // Validar parâmetros de entrada
    const validationErrors = [];
    
    if (page && (isNaN(page) || parseInt(page) < 1)) {
      validationErrors.push('Página deve ser um número positivo');
    }
    
    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
      validationErrors.push('Limite deve ser um número entre 1 e 100');
    }
    
    if (status && !['success', 'error', 'running'].includes(status)) {
      validationErrors.push('Status deve ser: success, error ou running');
    }
    
    if (sortBy && !['startedAt', 'finishedAt', 'duration', 'notificationsCreated', 'notificationsUpdated', 'status'].includes(sortBy)) {
      validationErrors.push('Campo de ordenação inválido');
    }
    
    if (sortOrder && !['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
      validationErrors.push('Ordem de classificação deve ser: ASC ou DESC');
    }
    
    if (minDuration && (isNaN(minDuration) || parseInt(minDuration) < 0)) {
      validationErrors.push('Duração mínima deve ser um número positivo');
    }
    
    if (maxDuration && (isNaN(maxDuration) || parseInt(maxDuration) < 0)) {
      validationErrors.push('Duração máxima deve ser um número positivo');
    }
    
    if (minNotifications && (isNaN(minNotifications) || parseInt(minNotifications) < 0)) {
      validationErrors.push('Número mínimo de notificações deve ser um número positivo');
    }
    
    if (hasError && !['true', 'false'].includes(hasError)) {
      validationErrors.push('hasError deve ser: true ou false');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Parâmetros inválidos',
        errors: validationErrors
      });
    }

    const result = await jobTracking.getJobHistoryWithPagination({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      jobType,
      status,
      startDate,
      endDate,
      sortBy: sortBy || 'startedAt',
      sortOrder: sortOrder ? sortOrder.toUpperCase() : 'DESC',
      minDuration: minDuration ? parseInt(minDuration) : undefined,
      maxDuration: maxDuration ? parseInt(maxDuration) : undefined,
      minNotifications: minNotifications ? parseInt(minNotifications) : undefined,
      hasError: hasError === 'true'
    });

    // Log da consulta
    logger.info(`[JOB_HISTORY] Consulta de histórico com filtros`, {
      adminUserId: req.userId,
      filters: {
        jobType,
        status,
        startDate,
        endDate,
        sortBy: result.filters.applied.sortBy,
        sortOrder: result.filters.applied.sortOrder,
        minDuration,
        maxDuration,
        minNotifications,
        hasError: hasError === 'true'
      },
      results: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit
      }
    });

    res.json({ 
      status: 'success', 
      data: result,
      message: `Histórico recuperado com sucesso. ${result.pagination.total} execuções encontradas.`
    });
  } catch (error) {
    logger.error('Erro ao buscar histórico dos jobs:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Obtém estatísticas gerais dos jobs
 */
async function getJobStats(req, res) {
  try {
    const stats = await jobTracking.getJobStats();
    res.json({ status: 'success', data: stats });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas dos jobs:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Obtém estatísticas detalhadas por período
 */
async function getDetailedStats(req, res) {
  try {
    const { period = '30d' } = req.query;
    const stats = await jobTracking.getDetailedStats(period);
    res.json({ status: 'success', data: stats });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas detalhadas dos jobs:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Obtém as últimas execuções dos jobs
 */
async function getLastExecutions(req, res) {
  try {
    const { limit = 5 } = req.query;
    const lastExecutions = await jobTracking.getLastExecutions(parseInt(limit));
    res.json({ status: 'success', data: { lastExecutions } });
  } catch (error) {
    logger.error('Erro ao buscar últimas execuções dos jobs:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Executa manualmente o job de verificação de pagamentos
 */
async function runPaymentCheckJob(req, res) {
  try {
    const { userId } = req.body;
    logger.info(`Executando job de verificação de pagamentos manualmente${userId ? ` para usuário ${userId}` : ' para todos os usuários'}`);
    notificationJobs.createPaymentDueNotifications(userId).catch(error => {
      logger.error('Erro na execução assíncrona do job de verificação de pagamentos:', error);
    });
    res.json({ status: 'success', message: 'Job de verificação de pagamentos iniciado com sucesso', data: { userId: userId || 'all' } });
  } catch (error) {
    logger.error('Erro ao executar job de verificação de pagamentos:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Executa manualmente o job de lembretes gerais
 */
async function runGeneralRemindersJob(req, res) {
  try {
    const { userId } = req.body;
    logger.info(`Executando job de lembretes gerais manualmente${userId ? ` para usuário ${userId}` : ' para todos os usuários'}`);
    notificationJobs.createGeneralReminders(userId).catch(error => {
      logger.error('Erro na execução assíncrona do job de lembretes gerais:', error);
    });
    res.json({ status: 'success', message: 'Job de lembretes gerais iniciado com sucesso', data: { userId: userId || 'all' } });
  } catch (error) {
    logger.error('Erro ao executar job de lembretes gerais:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Executa manualmente o job de limpeza de notificações
 */
async function runCleanupJob(req, res) {
  try {
    logger.info('Executando job de limpeza de notificações manualmente');
    notificationJobs.cleanupOldNotifications().catch(error => {
      logger.error('Erro na execução assíncrona do job de limpeza:', error);
    });
    res.json({ status: 'success', message: 'Job de limpeza de notificações iniciado com sucesso' });
  } catch (error) {
    logger.error('Erro ao executar job de limpeza:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Executa todos os jobs de notificação
 */
async function runAllJobs(req, res) {
  try {
    const { userId } = req.body;
    logger.info(`Executando todos os jobs de notificação manualmente${userId ? ` para usuário ${userId}` : ' para todos os usuários'}`);
    notificationJobs.runAllNotificationJobs(userId).catch(error => {
      logger.error('Erro na execução assíncrona de todos os jobs:', error);
    });
    res.json({ status: 'success', message: 'Todos os jobs de notificação iniciados com sucesso', data: { userId: userId || 'all' } });
  } catch (error) {
    logger.error('Erro ao executar todos os jobs:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Testa o envio de email de alerta
 */
async function testEmailAlert(req, res) {
  try {
    const emailService = require('../services/emailService');
    
    const testError = new Error('Erro de teste para verificar sistema de alertas');
    testError.stack = 'Error: Erro de teste\n    at testEmailAlert (/app/controllers/notificationJobController.js:150:25)\n    at processTicksAndRejections (node:internal/process/task_queues:95:7)';
    
    const result = await emailService.sendJobFailureAlert('test_job', testError, {
      executionId: 999,
      duration: 1500,
      startedAt: new Date(),
      finishedAt: new Date()
    });
    
    if (result) {
      res.json({ 
        status: 'success', 
        message: 'Email de teste enviado com sucesso',
        data: { 
          jobName: 'test_job',
          emailSent: true,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        message: 'Falha ao enviar email de teste',
        data: { 
          jobName: 'test_job',
          emailSent: false,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    logger.error('Erro ao testar envio de email:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}

/**
 * Obtém detalhes de uma execução específica de job
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.executionId - ID da execução do job.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Detalhes da execução do job.
 * @example
 * // GET /api/notifications/jobs/execution/123
 * // Retorno: { execution: {...}, logs: [...], metadata: {...} }
 */
async function getJobExecutionDetails(req, res) {
  try {
    const { executionId } = req.params;
    const { JobExecution } = require('../models');
    const { NotFoundError } = require('../utils/errors');

    // Validar se o ID é um número válido
    if (!executionId || isNaN(parseInt(executionId))) {
      return res.status(400).json({
        status: 'error',
        message: 'ID de execução inválido'
      });
    }

    // Buscar a execução do job
    const execution = await JobExecution.findByPk(executionId);

    if (!execution) {
      return res.status(404).json({
        status: 'error',
        message: 'Execução de job não encontrada'
      });
    }

    // Preparar dados de resposta
    const executionDetails = {
      id: execution.id,
      jobName: execution.jobName,
      status: execution.status,
      startedAt: execution.startedAt,
      finishedAt: execution.finishedAt,
      duration: execution.duration,
      notificationsCreated: execution.notificationsCreated,
      notificationsUpdated: execution.notificationsUpdated,
      errorMessage: execution.errorMessage,
      errorStack: execution.errorStack,
      metadata: execution.metadata,
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt
    };

    // Calcular estatísticas adicionais
    const additionalStats = {
      isRunning: execution.status === 'running',
      hasError: execution.status === 'error',
      durationFormatted: execution.duration ? `${execution.duration}ms` : null,
      timeSinceStart: execution.startedAt ? 
        `${Math.floor((Date.now() - new Date(execution.startedAt).getTime()) / 1000)}s atrás` : null,
      totalNotifications: execution.notificationsCreated + execution.notificationsUpdated
    };

    // Buscar execuções relacionadas (mesmo job, últimas 5)
    const relatedExecutions = await JobExecution.findAll({
      where: {
        jobName: execution.jobName,
        id: { [require('sequelize').Op.ne]: execution.id }
      },
      order: [['startedAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'status', 'startedAt', 'duration', 'notificationsCreated', 'errorMessage']
    });

    // Preparar resposta completa
    const response = {
      execution: executionDetails,
      stats: additionalStats,
      relatedExecutions: relatedExecutions.map(rel => ({
        id: rel.id,
        status: rel.status,
        startedAt: rel.startedAt,
        duration: rel.duration,
        notificationsCreated: rel.notificationsCreated,
        hasError: rel.status === 'error',
        errorMessage: rel.errorMessage
      })),
      analysis: {
        successRate: execution.status === 'success' ? 100 : 0,
        performance: execution.duration ? 
          (execution.duration < 1000 ? 'excellent' : 
           execution.duration < 5000 ? 'good' : 
           execution.duration < 10000 ? 'fair' : 'poor') : 'unknown',
        impact: execution.notificationsCreated > 0 ? 'high' : 'low'
      }
    };

    // Log da consulta
    logger.info(`[JOB_DETAILS] Consulta de detalhes da execução ${executionId}`, {
      executionId,
      jobName: execution.jobName,
      status: execution.status,
      adminUserId: req.userId
    });

    res.json({
      status: 'success',
      data: response,
      message: `Detalhes da execução ${executionId} recuperados com sucesso`
    });

  } catch (error) {
    logger.error('Erro ao buscar detalhes da execução do job:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  getJobHistory,
  getJobStats,
  getDetailedStats,
  getLastExecutions,
  runPaymentCheckJob,
  runGeneralRemindersJob,
  runCleanupJob,
  runAllJobs,
  testEmailAlert,
  getJobExecutionDetails
}; 