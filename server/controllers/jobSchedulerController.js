/**
 * Controller para gerenciar configurações dinâmicas dos jobs cron.
 * Permite visualizar, atualizar e controlar jobs via API.
 * 
 * @module controllers/jobSchedulerController
 */

const jobScheduler = require('../services/jobScheduler');
const { logger } = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Obtém todas as configurações de jobs cron.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Lista de configurações de jobs.
 * @example
 * // GET /api/job-scheduler/configs
 * // Retorno: { payment_check: {...}, general_reminders: {...}, ... }
 */
async function getAllJobConfigs(req, res) {
  try {
    const configs = jobScheduler.getAllJobConfigs();
    
    logger.info('[JOB_SCHEDULER] Configurações de jobs obtidas com sucesso');
    
    return successResponse(res, 200, 'Configurações de jobs obtidas com sucesso', {
      configs,
      totalJobs: Object.keys(configs).length
    });
  } catch (error) {
    logger.error('[JOB_SCHEDULER] Erro ao obter configurações de jobs:', error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Obtém a configuração de um job específico.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.jobName - Nome do job.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Configuração do job.
 * @example
 * // GET /api/job-scheduler/configs/payment_check
 * // Retorno: { expression: "a cada 6 horas", enabled: true, description: "..." }
 */
async function getJobConfig(req, res) {
  try {
    const { jobName } = req.params;
    const config = jobScheduler.getJobConfig(jobName);
    
    if (!config) {
      return errorResponse(res, 404, `Job '${jobName}' não encontrado`);
    }
    
    logger.info(`[JOB_SCHEDULER] Configuração do job '${jobName}' obtida com sucesso`);
    
    return successResponse(res, 200, `Configuração do job '${jobName}' obtida com sucesso`, {
      jobName,
      config
    });
  } catch (error) {
    logger.error(`[JOB_SCHEDULER] Erro ao obter configuração do job '${req.params.jobName}':`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Atualiza a configuração de um job.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.jobName - Nome do job.
 * @param {Object} req.body - Nova configuração.
 * @param {string} req.body.expression - Nova expressão cron (opcional).
 * @param {boolean} req.body.enabled - Se o job deve estar habilitado (opcional).
 * @param {string} req.body.description - Nova descrição (opcional).
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da atualização.
 * @example
 * // PUT /api/job-scheduler/configs/payment_check
 * // Body: { "expression": "a cada 4 horas", "enabled": true }
 * // Retorno: { success: true, message: "Configuração atualizada com sucesso" }
 */
async function updateJobConfig(req, res) {
  try {
    const { jobName } = req.params;
    const { expression, enabled, description } = req.body;
    
    // Validar se pelo menos um campo foi fornecido
    if (!expression && enabled === undefined && !description) {
      return errorResponse(res, 400, 'Pelo menos um campo deve ser fornecido (expression, enabled, description)');
    }
    
    // Validar expressão cron se fornecida
    if (expression && !jobScheduler.validateCronExpression(expression)) {
      return errorResponse(res, 400, 'Expressão cron inválida');
    }
    
    const success = jobScheduler.updateJobConfig(jobName, {
      ...(expression && { expression }),
      ...(enabled !== undefined && { enabled }),
      ...(description && { description })
    });
    
    if (!success) {
      return errorResponse(res, 404, `Job '${jobName}' não encontrado`);
    }
    
    const updatedConfig = jobScheduler.getJobConfig(jobName);
    
    logger.info(`[JOB_SCHEDULER] Configuração do job '${jobName}' atualizada com sucesso`);
    
    return successResponse(res, 200, `Configuração do job '${jobName}' atualizada com sucesso`, {
      jobName,
      config: updatedConfig
    });
  } catch (error) {
    logger.error(`[JOB_SCHEDULER] Erro ao atualizar configuração do job '${req.params.jobName}':`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Obtém o status atual de todos os jobs.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Status de todos os jobs.
 * @example
 * // GET /api/job-scheduler/status
 * // Retorno: { payment_check: { enabled: true, active: true, nextRun: "..." }, ... }
 */
async function getJobsStatus(req, res) {
  try {
    const status = jobScheduler.getJobsStatus();
    
    logger.info('[JOB_SCHEDULER] Status dos jobs obtido com sucesso');
    
    return successResponse(res, 200, 'Status dos jobs obtido com sucesso', {
      status,
      totalJobs: Object.keys(status).length,
      activeJobs: Object.values(status).filter(job => job.active).length
    });
  } catch (error) {
    logger.error('[JOB_SCHEDULER] Erro ao obter status dos jobs:', error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Obtém o status de um job específico.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.jobName - Nome do job.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Status do job.
 * @example
 * // GET /api/job-scheduler/status/payment_check
 * // Retorno: { enabled: true, active: true, nextRun: "2024-01-01T06:00:00Z" }
 */
async function getJobStatus(req, res) {
  try {
    const { jobName } = req.params;
    const status = jobScheduler.getJobStatus(jobName);
    
    if (!status) {
      return errorResponse(res, 404, `Job '${jobName}' não encontrado`);
    }
    
    logger.info(`[JOB_SCHEDULER] Status do job '${jobName}' obtido com sucesso`);
    
    return successResponse(res, 200, `Status do job '${jobName}' obtido com sucesso`, {
      jobName,
      status
    });
  } catch (error) {
    logger.error(`[JOB_SCHEDULER] Erro ao obter status do job '${req.params.jobName}':`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Para um job específico.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.jobName - Nome do job.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da operação.
 * @example
 * // POST /api/job-scheduler/jobs/payment_check/stop
 * // Retorno: { success: true, message: "Job parado com sucesso" }
 */
async function stopJob(req, res) {
  try {
    const { jobName } = req.params;
    const success = jobScheduler.stopJob(jobName);
    
    if (!success) {
      return errorResponse(res, 404, `Job '${jobName}' não encontrado ou já parado`);
    }
    
    logger.info(`[JOB_SCHEDULER] Job '${jobName}' parado com sucesso`);
    
    return successResponse(res, 200, `Job '${jobName}' parado com sucesso`);
  } catch (error) {
    logger.error(`[JOB_SCHEDULER] Erro ao parar job '${req.params.jobName}':`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Para todos os jobs ativos.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da operação.
 * @example
 * // POST /api/job-scheduler/jobs/stop-all
 * // Retorno: { success: true, message: "Todos os jobs parados com sucesso" }
 */
async function stopAllJobs(req, res) {
  try {
    jobScheduler.stopAllJobs();
    
    logger.info('[JOB_SCHEDULER] Todos os jobs parados com sucesso');
    
    return successResponse(res, 200, 'Todos os jobs parados com sucesso');
  } catch (error) {
    logger.error('[JOB_SCHEDULER] Erro ao parar todos os jobs:', error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Habilita um job.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.jobName - Nome do job.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da operação.
 * @example
 * // POST /api/job-scheduler/configs/payment_check/enable
 * // Retorno: { success: true, message: "Job habilitado com sucesso" }
 */
async function enableJob(req, res) {
  try {
    const { jobName } = req.params;
    const success = jobScheduler.updateJobConfig(jobName, { enabled: true });
    
    if (!success) {
      return errorResponse(res, 404, `Job '${jobName}' não encontrado`);
    }
    
    logger.info(`[JOB_SCHEDULER] Job '${jobName}' habilitado com sucesso`);
    
    return successResponse(res, 200, `Job '${jobName}' habilitado com sucesso`);
  } catch (error) {
    logger.error(`[JOB_SCHEDULER] Erro ao habilitar job '${req.params.jobName}':`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Desabilita um job.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.jobName - Nome do job.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da operação.
 * @example
 * // POST /api/job-scheduler/configs/payment_check/disable
 * // Retorno: { success: true, message: "Job desabilitado com sucesso" }
 */
async function disableJob(req, res) {
  try {
    const { jobName } = req.params;
    const success = jobScheduler.updateJobConfig(jobName, { enabled: false });
    
    if (!success) {
      return errorResponse(res, 404, `Job '${jobName}' não encontrado`);
    }
    
    logger.info(`[JOB_SCHEDULER] Job '${jobName}' desabilitado com sucesso`);
    
    return successResponse(res, 200, `Job '${jobName}' desabilitado com sucesso`);
  } catch (error) {
    logger.error(`[JOB_SCHEDULER] Erro ao desabilitar job '${req.params.jobName}':`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Valida uma expressão cron.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.body.expression - Expressão cron a ser validada.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da validação.
 * @example
 * // POST /api/job-scheduler/validate-cron
 * // Body: { "expression": "a cada 6 horas" }
 * // Retorno: { valid: true, message: "Expressão cron válida" }
 */
async function validateCronExpression(req, res) {
  try {
    const { expression } = req.body;
    
    if (!expression) {
      return errorResponse(res, 400, 'Expressão cron é obrigatória');
    }
    
    const isValid = jobScheduler.validateCronExpression(expression);
    
    logger.info(`[JOB_SCHEDULER] Expressão cron validada: ${expression} - ${isValid ? 'válida' : 'inválida'}`);
    
    return successResponse(res, 200, `Expressão cron ${isValid ? 'válida' : 'inválida'}`, {
      expression,
      valid: isValid
    });
  } catch (error) {
    logger.error('[JOB_SCHEDULER] Erro ao validar expressão cron:', error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Obtém informações sobre expressões cron comuns.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Exemplos de expressões cron.
 * @example
 * // GET /api/job-scheduler/cron-examples
 * // Retorno: { examples: [{ expression: "a cada 6 horas", description: "A cada 6 horas" }, ...] }
 */
async function getCronExamples(req, res) {
  try {
    const examples = [
      {
        expression: '0 */6 * * *',
        description: 'A cada 6 horas',
        explanation: 'Executa a cada 6 horas (00:00, 06:00, 12:00, 18:00)'
      },
      {
        expression: '0 9 * * *',
        description: 'Diariamente às 9h',
        explanation: 'Executa todos os dias às 9:00 da manhã'
      },
      {
        expression: '0 2 * * 0',
        description: 'Semanalmente aos domingos às 2h',
        explanation: 'Executa todo domingo às 2:00 da manhã'
      },
      {
        expression: '0 3 * * *',
        description: 'Diariamente às 3h',
        explanation: 'Executa todos os dias às 3:00 da manhã'
      },
      {
        expression: '*/15 * * * *',
        description: 'A cada 15 minutos',
        explanation: 'Executa a cada 15 minutos'
      },
      {
        expression: '0 0 1 * *',
        description: 'Mensalmente no dia 1',
        explanation: 'Executa no primeiro dia de cada mês à meia-noite'
      },
      {
        expression: '0 12 * * 1-5',
        description: 'Dias úteis ao meio-dia',
        explanation: 'Executa de segunda a sexta às 12:00'
      }
    ];
    
    logger.info('[JOB_SCHEDULER] Exemplos de expressões cron obtidos com sucesso');
    
    return successResponse(res, 200, 'Exemplos de expressões cron obtidos com sucesso', {
      examples,
      totalExamples: examples.length
    });
  } catch (error) {
    logger.error('[JOB_SCHEDULER] Erro ao obter exemplos de expressões cron:', error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

module.exports = {
  getAllJobConfigs,
  getJobConfig,
  updateJobConfig,
  getJobsStatus,
  getJobStatus,
  stopJob,
  stopAllJobs,
  enableJob,
  disableJob,
  validateCronExpression,
  getCronExamples
}; 