/**
 * Controller para gerenciar configurações de timeout de jobs.
 * Permite visualizar e atualizar configurações de timeout para diferentes tipos de jobs.
 * 
 * @module controllers/jobTimeoutController
 */

const { logger } = require('../utils/logger');
const { getAllTimeoutConfigs, getTimeoutConfig, updateTimeoutConfig } = require('../services/jobTimeout');
const { AppError } = require('../utils/errors');

/**
 * Obtém todas as configurações de timeout de jobs.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Configurações de timeout em formato JSON.
 * @throws {Error} Se houver erro ao obter configurações.
 * @example
 * // GET /api/job-timeouts
 * // Retorno: { "payment_check": { "timeoutMinutes": 10, "description": "..." }, ... }
 */
async function getAllTimeoutConfigurations(req, res) {
  try {
    logger.info('[TIMEOUT] Obtendo todas as configurações de timeout');

    const configs = getAllTimeoutConfigs();
    
    res.json({
      success: true,
      data: configs,
      message: 'Configurações de timeout obtidas com sucesso'
    });
  } catch (error) {
    logger.error('[TIMEOUT] Erro ao obter configurações de timeout:', error);
    throw new AppError('Erro ao obter configurações de timeout', 500);
  }
}

/**
 * Obtém a configuração de timeout para um job específico.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.jobName - Nome do job.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Configuração de timeout em formato JSON.
 * @throws {Error} Se o job não for encontrado ou houver erro.
 * @example
 * // GET /api/job-timeouts/payment_check
 * // Retorno: { "timeoutMinutes": 10, "description": "Verificação de pagamentos" }
 */
async function getTimeoutConfiguration(req, res) {
  try {
    const { jobName } = req.params;

    if (!jobName) {
      throw new AppError('Nome do job é obrigatório', 400);
    }

    logger.info(`[TIMEOUT] Obtendo configuração de timeout para job: ${jobName}`);

    const config = getTimeoutConfig(jobName);
    
    res.json({
      success: true,
      data: {
        jobName,
        ...config
      },
      message: `Configuração de timeout para ${jobName} obtida com sucesso`
    });
  } catch (error) {
    logger.error(`[TIMEOUT] Erro ao obter configuração de timeout para ${req.params.jobName}:`, error);
    throw error;
  }
}

/**
 * Atualiza a configuração de timeout para um job específico.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.jobName - Nome do job.
 * @param {Object} req.body - Dados da configuração.
 * @param {number} req.body.timeoutMinutes - Timeout em minutos.
 * @param {string} req.body.description - Descrição do job (opcional).
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Configuração atualizada em formato JSON.
 * @throws {Error} Se os dados forem inválidos ou houver erro.
 * @example
 * // PUT /api/job-timeouts/payment_check
 * // Body: { "timeoutMinutes": 15, "description": "Verificação de pagamentos atualizada" }
 * // Retorno: { "timeoutMinutes": 15, "description": "..." }
 */
async function updateTimeoutConfiguration(req, res) {
  try {
    const { jobName } = req.params;
    const { timeoutMinutes, description } = req.body;

    if (!jobName) {
      throw new AppError('Nome do job é obrigatório', 400);
    }

    if (!timeoutMinutes || typeof timeoutMinutes !== 'number' || timeoutMinutes <= 0) {
      throw new AppError('Timeout em minutos deve ser um número positivo', 400);
    }

    if (timeoutMinutes > 1440) { // 24 horas
      throw new AppError('Timeout não pode exceder 24 horas (1440 minutos)', 400);
    }

    logger.info(`[TIMEOUT] Atualizando configuração de timeout para ${jobName}: ${timeoutMinutes} minutos`);

    updateTimeoutConfig(jobName, timeoutMinutes, description);
    
    const updatedConfig = getTimeoutConfig(jobName);
    
    res.json({
      success: true,
      data: {
        jobName,
        ...updatedConfig
      },
      message: `Configuração de timeout para ${jobName} atualizada com sucesso`
    });
  } catch (error) {
    logger.error(`[TIMEOUT] Erro ao atualizar configuração de timeout para ${req.params.jobName}:`, error);
    throw error;
  }
}

/**
 * Reseta a configuração de timeout para um job para o valor padrão.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.jobName - Nome do job.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Configuração resetada em formato JSON.
 * @throws {Error} Se o job não for encontrado ou houver erro.
 * @example
 * // DELETE /api/job-timeouts/payment_check
 * // Retorno: { "timeoutMinutes": 10, "description": "Verificação de pagamentos" }
 */
async function resetTimeoutConfiguration(req, res) {
  try {
    const { jobName } = req.params;

    if (!jobName) {
      throw new AppError('Nome do job é obrigatório', 400);
    }

    logger.info(`[TIMEOUT] Resetando configuração de timeout para job: ${jobName}`);

    // Recarregar configuração padrão
    const defaultConfig = getTimeoutConfig('default');
    updateTimeoutConfig(jobName, defaultConfig.timeoutMinutes, defaultConfig.description);
    
    const resetConfig = getTimeoutConfig(jobName);
    
    res.json({
      success: true,
      data: {
        jobName,
        ...resetConfig
      },
      message: `Configuração de timeout para ${jobName} resetada para o valor padrão`
    });
  } catch (error) {
    logger.error(`[TIMEOUT] Erro ao resetar configuração de timeout para ${req.params.jobName}:`, error);
    throw error;
  }
}

/**
 * Obtém estatísticas de uso dos timeouts.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Estatísticas em formato JSON.
 * @throws {Error} Se houver erro ao obter estatísticas.
 * @example
 * // GET /api/job-timeouts/stats
 * // Retorno: { "totalJobs": 4, "averageTimeout": 10, "jobs": [...] }
 */
async function getTimeoutStats(req, res) {
  try {
    logger.info('[TIMEOUT] Obtendo estatísticas de timeout');

    const configs = getAllTimeoutConfigs();
    const jobs = Object.keys(configs).filter(key => key !== 'default');
    
    const totalJobs = jobs.length;
    const averageTimeout = jobs.reduce((sum, jobName) => {
      return sum + configs[jobName].timeoutMinutes;
    }, 0) / totalJobs;

    const stats = {
      totalJobs,
      averageTimeout: Math.round(averageTimeout * 100) / 100,
      jobs: jobs.map(jobName => ({
        name: jobName,
        timeoutMinutes: configs[jobName].timeoutMinutes,
        description: configs[jobName].description
      }))
    };
    
    res.json({
      success: true,
      data: stats,
      message: 'Estatísticas de timeout obtidas com sucesso'
    });
  } catch (error) {
    logger.error('[TIMEOUT] Erro ao obter estatísticas de timeout:', error);
    throw new AppError('Erro ao obter estatísticas de timeout', 500);
  }
}

module.exports = {
  getAllTimeoutConfigurations,
  getTimeoutConfiguration,
  updateTimeoutConfiguration,
  resetTimeoutConfiguration,
  getTimeoutStats
}; 