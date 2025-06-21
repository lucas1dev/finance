/**
 * Serviço para gerenciar configurações dinâmicas dos jobs cron.
 * Permite alterar expressões cron dos jobs via variáveis de ambiente ou API.
 * 
 * @module services/jobScheduler
 */

const cron = require('node-cron');
const { logger } = require('../utils/logger');
const jobTracking = require('./jobTracking');
const emailService = require('./emailService');

/**
 * Configurações padrão dos jobs cron.
 */
const DEFAULT_CRON_CONFIG = {
  payment_check: {
    expression: '0 */6 * * *', // A cada 6 horas
    description: 'Verificação de pagamentos vencidos e próximos do vencimento',
    enabled: true
  },
  general_reminders: {
    expression: '0 9 * * *', // Diariamente às 9h
    description: 'Lembretes gerais para usuários com financiamentos ativos',
    enabled: true
  },
  cleanup: {
    expression: '0 2 * * 0', // Semanalmente aos domingos às 2h
    description: 'Limpeza de notificações antigas',
    enabled: true
  },
  data_integrity: {
    expression: '0 3 * * *', // Diariamente às 3h
    description: 'Verificação de integridade dos dados',
    enabled: true
  }
};

/**
 * Configurações atuais dos jobs (pode ser alterada dinamicamente).
 */
let currentCronConfig = { ...DEFAULT_CRON_CONFIG };

/**
 * Jobs cron ativos.
 */
const activeJobs = new Map();

/**
 * Inicializa as configurações dos jobs a partir das variáveis de ambiente.
 */
function initializeCronConfig() {
  logger.info('Inicializando configurações de jobs cron...');

  // Carregar configurações das variáveis de ambiente
  Object.keys(DEFAULT_CRON_CONFIG).forEach(jobName => {
    const envExpression = process.env[`CRON_${jobName.toUpperCase()}`];
    const envEnabled = process.env[`CRON_${jobName.toUpperCase()}_ENABLED`];

    if (envExpression) {
      currentCronConfig[jobName].expression = envExpression;
      logger.info(`[CRON:${jobName}] Expressão carregada do ambiente: ${envExpression}`);
    }

    if (envEnabled !== undefined) {
      currentCronConfig[jobName].enabled = envEnabled.toLowerCase() === 'true';
      logger.info(`[CRON:${jobName}] Status carregado do ambiente: ${currentCronConfig[jobName].enabled}`);
    }
  });

  logger.info('Configurações de jobs cron inicializadas com sucesso.');
}

/**
 * Valida uma expressão cron.
 * @param {string} expression - Expressão cron a ser validada.
 * @returns {boolean} True se a expressão é válida.
 */
function validateCronExpression(expression) {
  try {
    return cron.validate(expression);
  } catch (error) {
    logger.error(`Expressão cron inválida: ${expression}`, error);
    return false;
  }
}

/**
 * Para um job específico.
 * @param {string} jobName - Nome do job.
 * @returns {boolean} True se o job foi parado com sucesso.
 */
function stopJob(jobName) {
  const job = activeJobs.get(jobName);
  if (job) {
    job.stop();
    activeJobs.delete(jobName);
    logger.info(`[CRON:${jobName}] Job parado com sucesso`);
    return true;
  }
  logger.warn(`[CRON:${jobName}] Job não encontrado para parar`);
  return false;
}

/**
 * Inicia um job específico.
 * @param {string} jobName - Nome do job.
 * @param {Function} jobFunction - Função do job.
 * @returns {boolean} True se o job foi iniciado com sucesso.
 */
function startJob(jobName, jobFunction) {
  const config = currentCronConfig[jobName];
  if (!config) {
    logger.error(`[CRON:${jobName}] Configuração não encontrada`);
    return false;
  }

  if (!config.enabled) {
    logger.info(`[CRON:${jobName}] Job desabilitado`);
    return false;
  }

  if (!validateCronExpression(config.expression)) {
    logger.error(`[CRON:${jobName}] Expressão cron inválida: ${config.expression}`);
    return false;
  }

  // Parar job existente se houver
  stopJob(jobName);

  // Iniciar novo job
  const job = cron.schedule(config.expression, async () => {
    logger.info(`[CRON:${jobName}] Executando job agendado...`);
    try {
      await jobFunction();
      logger.info(`[CRON:${jobName}] Job agendado concluído com sucesso`);
    } catch (error) {
      logger.error(`[CRON:${jobName}] Job agendado falhou:`, error);
      
      // Enviar alerta por email
      await emailService.sendJobFailureAlert(jobName, error, {
        scheduled: true,
        cronExpression: config.expression
      });
    }
  });

  activeJobs.set(jobName, job);
  logger.info(`[CRON:${jobName}] Job iniciado com expressão: ${config.expression}`);
  return true;
}

/**
 * Atualiza a configuração de um job.
 * @param {string} jobName - Nome do job.
 * @param {Object} config - Nova configuração.
 * @param {string} config.expression - Nova expressão cron.
 * @param {boolean} config.enabled - Se o job deve estar habilitado.
 * @param {string} config.description - Descrição do job.
 * @returns {boolean} True se a configuração foi atualizada com sucesso.
 */
function updateJobConfig(jobName, config) {
  if (!currentCronConfig[jobName]) {
    logger.error(`[CRON:${jobName}] Job não encontrado`);
    return false;
  }

  if (config.expression && !validateCronExpression(config.expression)) {
    logger.error(`[CRON:${jobName}] Expressão cron inválida: ${config.expression}`);
    return false;
  }

  // Atualizar configuração
  currentCronConfig[jobName] = {
    ...currentCronConfig[jobName],
    ...config
  };

  logger.info(`[CRON:${jobName}] Configuração atualizada:`, currentCronConfig[jobName]);
  return true;
}

/**
 * Obtém a configuração atual de um job.
 * @param {string} jobName - Nome do job.
 * @returns {Object|null} Configuração do job ou null se não encontrado.
 */
function getJobConfig(jobName) {
  return currentCronConfig[jobName] || null;
}

/**
 * Obtém todas as configurações de jobs.
 * @returns {Object} Todas as configurações.
 */
function getAllJobConfigs() {
  return { ...currentCronConfig };
}

/**
 * Obtém o status atual dos jobs.
 * @returns {Object} Status de cada job.
 */
function getJobsStatus() {
  const status = {};
  
  Object.keys(currentCronConfig).forEach(jobName => {
    const isActive = activeJobs.has(jobName);
    const config = currentCronConfig[jobName];
    
    status[jobName] = {
      enabled: config.enabled,
      active: isActive,
      expression: config.expression,
      description: config.description,
      nextRun: isActive ? getNextRunTime(config.expression) : null
    };
  });

  return status;
}

/**
 * Calcula a próxima execução de uma expressão cron.
 * @param {string} expression - Expressão cron.
 * @returns {Date|null} Data da próxima execução ou null se inválida.
 */
function getNextRunTime(expression) {
  try {
    const now = new Date();
    const nextRun = cron.getNextDate(expression, now);
    return nextRun;
  } catch (error) {
    logger.error(`Erro ao calcular próxima execução para: ${expression}`, error);
    return null;
  }
}

/**
 * Reinicia todos os jobs com as configurações atuais.
 * @param {Object} jobFunctions - Objeto com as funções dos jobs.
 * @returns {Object} Resultado do reinício de cada job.
 */
function restartAllJobs(jobFunctions) {
  const results = {};
  
  Object.keys(currentCronConfig).forEach(jobName => {
    const jobFunction = jobFunctions[jobName];
    if (jobFunction) {
      results[jobName] = startJob(jobName, jobFunction);
    } else {
      logger.warn(`[CRON:${jobName}] Função do job não fornecida`);
      results[jobName] = false;
    }
  });

  return results;
}

/**
 * Para todos os jobs ativos.
 */
function stopAllJobs() {
  Object.keys(currentCronConfig).forEach(jobName => {
    stopJob(jobName);
  });
  logger.info('Todos os jobs cron parados');
}

module.exports = {
  initializeCronConfig,
  validateCronExpression,
  startJob,
  stopJob,
  updateJobConfig,
  getJobConfig,
  getAllJobConfigs,
  getJobsStatus,
  getNextRunTime,
  restartAllJobs,
  stopAllJobs,
  DEFAULT_CRON_CONFIG,
  currentCronConfig
}; 