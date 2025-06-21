/**
 * Serviço para gerenciar timeouts configuráveis em jobs.
 * Permite abortar jobs que excedem um tempo limite configurável.
 * 
 * @module services/jobTimeout
 */

const { logger } = require('../utils/logger');
const jobTracking = require('./jobTracking');
const emailService = require('./emailService');

/**
 * Configurações de timeout para diferentes tipos de jobs (em minutos).
 */
const TIMEOUT_CONFIG = {
  payment_check: {
    timeoutMinutes: parseInt(process.env.JOB_TIMEOUT_PAYMENT_CHECK) || 10,
    description: 'Verificação de pagamentos'
  },
  general_reminders: {
    timeoutMinutes: parseInt(process.env.JOB_TIMEOUT_GENERAL_REMINDERS) || 5,
    description: 'Lembretes gerais'
  },
  cleanup: {
    timeoutMinutes: parseInt(process.env.JOB_TIMEOUT_CLEANUP) || 15,
    description: 'Limpeza de notificações'
  },
  data_integrity: {
    timeoutMinutes: parseInt(process.env.JOB_TIMEOUT_DATA_INTEGRITY) || 30,
    description: 'Verificação de integridade de dados'
  },
  default: {
    timeoutMinutes: parseInt(process.env.JOB_TIMEOUT_DEFAULT) || 10,
    description: 'Job padrão'
  }
};

/**
 * Cria um timeout para um job específico.
 * @param {string} jobName - Nome do job.
 * @param {number} executionId - ID da execução do job.
 * @returns {Promise<number>} ID do timeout.
 */
function createJobTimeout(jobName, executionId) {
  const config = TIMEOUT_CONFIG[jobName] || TIMEOUT_CONFIG.default;
  const timeoutMs = config.timeoutMinutes * 60 * 1000;

  logger.info(`[TIMEOUT:${jobName}] Configurando timeout de ${config.timeoutMinutes} minutos para execução ${executionId}`);

  const timeoutId = setTimeout(async () => {
    try {
      logger.warn(`[TIMEOUT:${jobName}] Timeout atingido após ${config.timeoutMinutes} minutos para execução ${executionId}`);
      
      // Registrar timeout no tracking
      const timeoutError = new Error(`Job ${jobName} foi abortado por timeout após ${config.timeoutMinutes} minutos`);
      timeoutError.name = 'JobTimeoutError';
      
      await jobTracking.failJobTracking(executionId, timeoutError);
      
      // Enviar alerta por email
      await emailService.sendJobFailureAlert(jobName, timeoutError, {
        executionId,
        timeoutMinutes: config.timeoutMinutes,
        description: config.description
      });
      
    } catch (error) {
      logger.error(`[TIMEOUT:${jobName}] Erro ao processar timeout da execução ${executionId}:`, error);
    }
  }, timeoutMs);

  return timeoutId;
}

/**
 * Cancela um timeout de job.
 * @param {number} timeoutId - ID do timeout a ser cancelado.
 * @param {string} jobName - Nome do job (para logs).
 * @param {number} executionId - ID da execução (para logs).
 */
function cancelJobTimeout(timeoutId, jobName, executionId) {
  if (timeoutId) {
    clearTimeout(timeoutId);
    logger.info(`[TIMEOUT:${jobName}] Timeout cancelado para execução ${executionId}`);
  }
}

/**
 * Wrapper para executar um job com timeout configurável.
 * @param {string} jobName - Nome do job.
 * @param {Function} jobFunction - Função do job a ser executada.
 * @param {Object} options - Opções adicionais.
 * @param {number} options.userId - ID do usuário (opcional).
 * @returns {Promise<void>}
 */
async function executeWithTimeout(jobName, jobFunction, options = {}) {
  const { userId } = options;
  let executionId = null;
  let timeoutId = null;
  const startTime = Date.now();

  try {
    // Iniciar tracking
    const execution = await jobTracking.startJobTracking(jobName);
    executionId = execution.id;

    // Configurar timeout
    timeoutId = createJobTimeout(jobName, executionId);

    logger.info(`[TIMEOUT:${jobName}] Iniciando execução com timeout${userId ? ` para usuário ${userId}` : ''}`);

    // Executar o job
    const result = await jobFunction(userId);

    const duration = Date.now() - startTime;

    // Cancelar timeout (job concluído com sucesso)
    cancelJobTimeout(timeoutId, jobName, executionId);

    // Finalizar tracking com sucesso
    await jobTracking.finishJobTracking(executionId, {
      notificationsCreated: 0, // Será atualizado pelo job
      notificationsUpdated: 0,
      metadata: { 
        duration,
        timeoutMinutes: TIMEOUT_CONFIG[jobName]?.timeoutMinutes || TIMEOUT_CONFIG.default.timeoutMinutes
      }
    });

    logger.info(`[TIMEOUT:${jobName}] Job concluído com sucesso em ${duration}ms`);

    return result;



  } catch (error) {
    const duration = Date.now() - startTime;

    // Cancelar timeout
    cancelJobTimeout(timeoutId, jobName, executionId);

    // Registrar falha no tracking
    if (executionId) {
      await jobTracking.failJobTracking(executionId, error);
    }

    logger.error(`[TIMEOUT:${jobName}] Job falhou após ${duration}ms: ${error.message}`, {
      error: error.stack,
      userId,
      duration
    });

    throw error;
  }
}

/**
 * Obtém a configuração de timeout para um job.
 * @param {string} jobName - Nome do job.
 * @returns {Object} Configuração de timeout.
 */
function getTimeoutConfig(jobName) {
  return TIMEOUT_CONFIG[jobName] || TIMEOUT_CONFIG.default;
}

/**
 * Obtém todas as configurações de timeout.
 * @returns {Object} Todas as configurações.
 */
function getAllTimeoutConfigs() {
  return TIMEOUT_CONFIG;
}

/**
 * Atualiza a configuração de timeout para um job (apenas em memória).
 * @param {string} jobName - Nome do job.
 * @param {number} timeoutMinutes - Timeout em minutos.
 * @param {string} description - Descrição do job.
 */
function updateTimeoutConfig(jobName, timeoutMinutes, description = null) {
  if (!TIMEOUT_CONFIG[jobName]) {
    TIMEOUT_CONFIG[jobName] = { ...TIMEOUT_CONFIG.default };
  }

  TIMEOUT_CONFIG[jobName].timeoutMinutes = timeoutMinutes;
  if (description) {
    TIMEOUT_CONFIG[jobName].description = description;
  }

  logger.info(`[TIMEOUT:${jobName}] Configuração atualizada: ${timeoutMinutes} minutos`);
}

module.exports = {
  createJobTimeout,
  cancelJobTimeout,
  executeWithTimeout,
  getTimeoutConfig,
  getAllTimeoutConfigs,
  updateTimeoutConfig,
  TIMEOUT_CONFIG
}; 