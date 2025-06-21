/**
 * Controller para painel administrativo de jobs.
 * Permite controle avançado de jobs: pausar, retomar, executar manualmente, visualizar detalhes.
 * 
 * @module controllers/jobAdminController
 */

const jobScheduler = require('../services/jobScheduler');
const jobTracking = require('../services/jobTracking');
const notificationJobs = require('../services/notificationJobs');
const { logger } = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Obtém o painel administrativo completo de jobs.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Painel administrativo com status, configurações e histórico.
 * @example
 * // GET /api/job-admin/dashboard
 * // Retorno: { status: {...}, configs: {...}, recentExecutions: {...} }
 */
async function getAdminDashboard(req, res) {
  try {
    // Obter status atual dos jobs
    const jobsStatus = jobScheduler.getJobsStatus();
    
    // Obter configurações dos jobs
    const jobsConfigs = jobScheduler.getAllJobConfigs();
    
    // Obter execuções recentes (últimas 10)
    const recentExecutions = await jobTracking.getRecentExecutions(10);
    
    // Obter estatísticas gerais
    const stats = await jobTracking.getJobStatistics();
    
    logger.info('[JOB_ADMIN] Dashboard administrativo obtido com sucesso');
    
    return successResponse(res, 200, 'Dashboard administrativo obtido com sucesso', {
      jobsStatus,
      jobsConfigs,
      recentExecutions,
      stats,
      totalJobs: Object.keys(jobsStatus).length,
      activeJobs: Object.values(jobsStatus).filter(job => job.active).length
    });
  } catch (error) {
    logger.error('[JOB_ADMIN] Erro ao obter dashboard administrativo:', error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Pausa um job específico.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.jobName - Nome do job.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da operação.
 * @example
 * // POST /api/job-admin/jobs/payment_check/pause
 * // Retorno: { success: true, message: "Job pausado com sucesso" }
 */
async function pauseJob(req, res) {
  try {
    const { jobName } = req.params;
    
    // Verificar se o job existe
    const config = jobScheduler.getJobConfig(jobName);
    if (!config) {
      return errorResponse(res, 404, `Job '${jobName}' não encontrado`);
    }
    
    // Pausar o job (desabilitar)
    const success = jobScheduler.updateJobConfig(jobName, { enabled: false });
    if (!success) {
      return errorResponse(res, 500, `Erro ao pausar job '${jobName}'`);
    }
    
    // Parar a execução atual se estiver rodando
    jobScheduler.stopJob(jobName);
    
    logger.info(`[JOB_ADMIN] Job '${jobName}' pausado com sucesso`);
    
    return successResponse(res, 200, `Job '${jobName}' pausado com sucesso`, {
      jobName,
      status: 'paused'
    });
  } catch (error) {
    logger.error(`[JOB_ADMIN] Erro ao pausar job '${req.params.jobName}':`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Retoma um job pausado.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.jobName - Nome do job.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da operação.
 * @example
 * // POST /api/job-admin/jobs/payment_check/resume
 * // Retorno: { success: true, message: "Job retomado com sucesso" }
 */
async function resumeJob(req, res) {
  try {
    const { jobName } = req.params;
    
    // Verificar se o job existe
    const config = jobScheduler.getJobConfig(jobName);
    if (!config) {
      return errorResponse(res, 404, `Job '${jobName}' não encontrado`);
    }
    
    // Retomar o job (habilitar)
    const success = jobScheduler.updateJobConfig(jobName, { enabled: true });
    if (!success) {
      return errorResponse(res, 500, `Erro ao retomar job '${jobName}'`);
    }
    
    // Reiniciar o job com a função correspondente
    const jobFunctions = {
      payment_check: notificationJobs.createPaymentDueNotifications,
      general_reminders: notificationJobs.createGeneralReminders,
      cleanup: notificationJobs.cleanupOldNotifications,
      data_integrity: async () => {
        const dataIntegrityService = require('../services/dataIntegrityService');
        await dataIntegrityService.runIntegrityCheck({
          autoFix: true,
          sendAlert: true
        });
      }
    };
    
    const jobFunction = jobFunctions[jobName];
    if (jobFunction) {
      jobScheduler.startJob(jobName, jobFunction);
    }
    
    logger.info(`[JOB_ADMIN] Job '${jobName}' retomado com sucesso`);
    
    return successResponse(res, 200, `Job '${jobName}' retomado com sucesso`, {
      jobName,
      status: 'resumed'
    });
  } catch (error) {
    logger.error(`[JOB_ADMIN] Erro ao retomar job '${req.params.jobName}':`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Executa um job manualmente.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.jobName - Nome do job.
 * @param {Object} req.body - Parâmetros da execução.
 * @param {number} req.body.userId - ID do usuário (opcional).
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da execução.
 * @example
 * // POST /api/job-admin/jobs/payment_check/execute
 * // Body: { "userId": 123 }
 * // Retorno: { success: true, message: "Job executado com sucesso" }
 */
async function executeJobManually(req, res) {
  try {
    const { jobName } = req.params;
    const { userId } = req.body;
    
    // Verificar se o job existe
    const config = jobScheduler.getJobConfig(jobName);
    if (!config) {
      return errorResponse(res, 404, `Job '${jobName}' não encontrado`);
    }
    
    // Mapear funções dos jobs
    const jobFunctions = {
      payment_check: () => notificationJobs.createPaymentDueNotifications(userId),
      general_reminders: () => notificationJobs.createGeneralReminders(userId),
      cleanup: () => notificationJobs.cleanupOldNotifications(),
      data_integrity: async () => {
        const dataIntegrityService = require('../services/dataIntegrityService');
        await dataIntegrityService.runIntegrityCheck({
          autoFix: true,
          sendAlert: true
        });
      }
    };
    
    const jobFunction = jobFunctions[jobName];
    if (!jobFunction) {
      return errorResponse(res, 400, `Job '${jobName}' não suporta execução manual`);
    }
    
    // Executar o job
    await jobFunction();
    
    logger.info(`[JOB_ADMIN] Job '${jobName}' executado manualmente com sucesso${userId ? ` para usuário ${userId}` : ''}`);
    
    return successResponse(res, 200, `Job '${jobName}' executado manualmente com sucesso`, {
      jobName,
      userId,
      executedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[JOB_ADMIN] Erro ao executar job '${req.params.jobName}' manualmente:`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Obtém detalhes de uma execução específica de job.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.executionId - ID da execução.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Detalhes da execução.
 * @example
 * // GET /api/job-admin/executions/123
 * // Retorno: { execution: {...}, logs: [...], metadata: {...} }
 */
async function getExecutionDetails(req, res) {
  try {
    const { executionId } = req.params;
    
    // Obter detalhes da execução
    const execution = await jobTracking.getExecutionById(executionId);
    if (!execution) {
      return errorResponse(res, 404, `Execução ${executionId} não encontrada`);
    }
    
    // Obter logs relacionados (se houver)
    const logs = await jobTracking.getExecutionLogs(executionId);
    
    logger.info(`[JOB_ADMIN] Detalhes da execução ${executionId} obtidos com sucesso`);
    
    return successResponse(res, 200, 'Detalhes da execução obtidos com sucesso', {
      execution,
      logs,
      metadata: {
        duration: execution.duration,
        status: execution.status,
        createdAt: execution.created_at,
        updatedAt: execution.updated_at
      }
    });
  } catch (error) {
    logger.error(`[JOB_ADMIN] Erro ao obter detalhes da execução ${req.params.executionId}:`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Reprocessa notificações de um usuário específico.
 * @param {Object} req - Objeto de requisição Express.
 * @param {number} req.params.userId - ID do usuário.
 * @param {Object} req.body - Configurações do reprocessamento.
 * @param {string} req.body.jobType - Tipo de job (payment_check, general_reminders).
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado do reprocessamento.
 * @example
 * // POST /api/job-admin/users/123/reprocess
 * // Body: { "jobType": "payment_check" }
 * // Retorno: { success: true, message: "Notificações reprocessadas com sucesso" }
 */
async function reprocessUserNotifications(req, res) {
  try {
    const { userId } = req.params;
    const { jobType } = req.body;
    
    if (!userId || !jobType) {
      return errorResponse(res, 400, 'userId e jobType são obrigatórios');
    }
    
    // Validar tipo de job
    const validJobTypes = ['payment_check', 'general_reminders'];
    if (!validJobTypes.includes(jobType)) {
      return errorResponse(res, 400, `Tipo de job inválido. Tipos válidos: ${validJobTypes.join(', ')}`);
    }
    
    // Executar o job específico para o usuário
    let result;
    switch (jobType) {
      case 'payment_check':
        await notificationJobs.createPaymentDueNotifications(userId);
        result = 'Verificação de pagamentos reprocessada';
        break;
      case 'general_reminders':
        await notificationJobs.createGeneralReminders(userId);
        result = 'Lembretes gerais reprocessados';
        break;
      default:
        return errorResponse(res, 400, 'Tipo de job não suportado para reprocessamento');
    }
    
    logger.info(`[JOB_ADMIN] Notificações reprocessadas para usuário ${userId}, job: ${jobType}`);
    
    return successResponse(res, 200, `${result} para o usuário ${userId}`, {
      userId,
      jobType,
      reprocessedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[JOB_ADMIN] Erro ao reprocessar notificações para usuário ${req.params.userId}:`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Obtém estatísticas detalhadas de um job específico.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.jobName - Nome do job.
 * @param {Object} req.query - Parâmetros de consulta.
 * @param {string} req.query.period - Período (day, week, month).
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Estatísticas detalhadas.
 * @example
 * // GET /api/job-admin/jobs/payment_check/stats?period=week
 * // Retorno: { stats: {...}, trends: [...], performance: {...} }
 */
async function getJobDetailedStats(req, res) {
  try {
    const { jobName } = req.params;
    const { period = 'week' } = req.query;
    
    // Verificar se o job existe
    const config = jobScheduler.getJobConfig(jobName);
    if (!config) {
      return errorResponse(res, 404, `Job '${jobName}' não encontrado`);
    }
    
    // Obter estatísticas detalhadas
    const stats = await jobTracking.getJobDetailedStatistics(jobName, period);
    
    logger.info(`[JOB_ADMIN] Estatísticas detalhadas do job '${jobName}' obtidas com sucesso`);
    
    return successResponse(res, 200, 'Estatísticas detalhadas obtidas com sucesso', {
      jobName,
      period,
      stats
    });
  } catch (error) {
    logger.error(`[JOB_ADMIN] Erro ao obter estatísticas do job '${req.params.jobName}':`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

module.exports = {
  getAdminDashboard,
  pauseJob,
  resumeJob,
  executeJobManually,
  getExecutionDetails,
  reprocessUserNotifications,
  getJobDetailedStats
}; 