/**
 * Serviço para implementar retry automático em jobs críticos.
 * Permite que jobs que falharam por erros transitórios sejam reexecutados automaticamente.
 * 
 * @module services/jobRetry
 */

const { logger } = require('../utils/logger');
const jobTracking = require('./jobTracking');

/**
 * Configurações de retry para diferentes tipos de jobs.
 */
const RETRY_CONFIG = {
  payment_check: {
    maxRetries: 3,
    delayMs: 5000, // 5 segundos
    backoffMultiplier: 2, // Dobra o delay a cada tentativa
  },
  general_reminders: {
    maxRetries: 2,
    delayMs: 3000, // 3 segundos
    backoffMultiplier: 1.5,
  },
  cleanup: {
    maxRetries: 1,
    delayMs: 10000, // 10 segundos
    backoffMultiplier: 1,
  },
};

/**
 * Verifica se um erro é transitório e pode ser retentado.
 * @param {Error} error - Erro que ocorreu.
 * @returns {boolean} True se o erro é transitório.
 */
function isTransientError(error) {
  const transientErrorMessages = [
    'timeout',
    'connection',
    'network',
    'database',
    'sequelize',
    'deadlock',
    'lock',
    'temporary',
    'service unavailable',
    'too many requests',
  ];

  const errorMessage = error.message.toLowerCase();
  const errorStack = error.stack ? error.stack.toLowerCase() : '';

  return transientErrorMessages.some(keyword => 
    errorMessage.includes(keyword) || errorStack.includes(keyword)
  );
}

/**
 * Calcula o delay para a próxima tentativa baseado no número da tentativa.
 * @param {string} jobName - Nome do job.
 * @param {number} attemptNumber - Número da tentativa (1-based).
 * @returns {number} Delay em milissegundos.
 */
function calculateRetryDelay(jobName, attemptNumber) {
  const config = RETRY_CONFIG[jobName] || RETRY_CONFIG.payment_check;
  return config.delayMs * Math.pow(config.backoffMultiplier, attemptNumber - 1);
}

/**
 * Executa um job com retry automático em caso de falha transitória.
 * @param {string} jobName - Nome do job.
 * @param {Function} jobFunction - Função do job a ser executada.
 * @param {Object} options - Opções adicionais.
 * @param {number} options.userId - ID do usuário (opcional).
 * @param {number} options.maxRetries - Número máximo de tentativas (sobrescreve configuração padrão).
 * @returns {Promise<void>}
 */
async function executeWithRetry(jobName, jobFunction, options = {}) {
  const { userId, maxRetries } = options;
  const config = RETRY_CONFIG[jobName] || RETRY_CONFIG.payment_check;
  const finalMaxRetries = maxRetries || config.maxRetries;
  
  let lastError = null;
  let attemptNumber = 1;

  while (attemptNumber <= finalMaxRetries) {
    try {
      logger.info(`[RETRY:${jobName}] Tentativa ${attemptNumber}/${finalMaxRetries}${userId ? ` para usuário ${userId}` : ''}`);
      
      await jobFunction(userId);
      
      if (attemptNumber > 1) {
        logger.info(`[RETRY:${jobName}] Sucesso na tentativa ${attemptNumber}`);
      }
      
      return; // Sucesso, sair do loop
      
    } catch (error) {
      lastError = error;
      
      logger.error(`[RETRY:${jobName}] Falha na tentativa ${attemptNumber}/${finalMaxRetries}: ${error.message}`, {
        error: error.stack,
        attemptNumber,
        userId,
      });

      // Verificar se é um erro transitório
      if (!isTransientError(error)) {
        logger.error(`[RETRY:${jobName}] Erro não é transitório, abortando retry`);
        break;
      }

      // Verificar se ainda há tentativas disponíveis
      if (attemptNumber >= finalMaxRetries) {
        logger.error(`[RETRY:${jobName}] Número máximo de tentativas atingido (${finalMaxRetries})`);
        break;
      }

      // Calcular delay para próxima tentativa
      const delay = calculateRetryDelay(jobName, attemptNumber);
      logger.info(`[RETRY:${jobName}] Aguardando ${delay}ms antes da próxima tentativa`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      attemptNumber++;
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  logger.error(`[RETRY:${jobName}] Todas as ${finalMaxRetries} tentativas falharam. Último erro: ${lastError.message}`, {
    error: lastError.stack,
    totalAttempts: finalMaxRetries,
    userId,
  });

  throw lastError;
}

/**
 * Wrapper para jobs que devem ser executados com retry.
 * @param {string} jobName - Nome do job.
 * @param {Function} jobFunction - Função do job.
 * @param {Object} options - Opções de retry.
 * @returns {Function} Função wrapper com retry.
 */
function withRetry(jobName, jobFunction, options = {}) {
  return async (userId = null) => {
    return executeWithRetry(jobName, jobFunction, { ...options, userId });
  };
}

module.exports = {
  executeWithRetry,
  withRetry,
  isTransientError,
  calculateRetryDelay,
  RETRY_CONFIG,
}; 