/**
 * Controller para gerenciar validações de integridade de dados.
 * Permite executar verificações de integridade e obter relatórios.
 * 
 * @module controllers/dataIntegrityController
 */

const { logger } = require('../utils/logger');
const dataIntegrityService = require('../services/dataIntegrityService');
const { AppError } = require('../utils/errors');

/**
 * Executa verificação completa de integridade dos dados.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} req.body - Parâmetros da verificação.
 * @param {boolean} req.body.autoFix - Se deve aplicar correções automáticas (padrão: true).
 * @param {boolean} req.body.sendAlert - Se deve enviar alertas por email (padrão: true).
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Relatório de integridade em formato JSON.
 * @throws {Error} Se houver erro durante a verificação.
 * @example
 * // POST /api/data-integrity/check
 * // Body: { "autoFix": true, "sendAlert": true }
 * // Retorno: { "timestamp": "...", "totalIssues": 5, "issues": [...] }
 */
async function runIntegrityCheck(req, res) {
  try {
    const { autoFix = true, sendAlert = true } = req.body;

    logger.info('[INTEGRITY] Iniciando verificação de integridade solicitada via API');

    const report = await dataIntegrityService.runIntegrityCheck({
      autoFix: Boolean(autoFix),
      sendAlert: Boolean(sendAlert)
    });

    res.json({
      success: true,
      data: report,
      message: `Verificação concluída. ${report.totalIssues} problemas encontrados, ${report.autoFixed} corrigidos automaticamente.`
    });
  } catch (error) {
    logger.error('[INTEGRITY] Erro ao executar verificação de integridade:', error);
    throw new AppError('Erro ao executar verificação de integridade', 500);
  }
}

/**
 * Obtém estatísticas de integridade dos dados.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Estatísticas em formato JSON.
 * @throws {Error} Se houver erro ao obter estatísticas.
 * @example
 * // GET /api/data-integrity/stats
 * // Retorno: { "notifications": {...}, "transactions": {...}, "users": {...} }
 */
async function getIntegrityStats(req, res) {
  try {
    logger.info('[INTEGRITY] Obtendo estatísticas de integridade');

    const stats = await dataIntegrityService.getIntegrityStats();

    res.json({
      success: true,
      data: stats,
      message: 'Estatísticas de integridade obtidas com sucesso'
    });
  } catch (error) {
    logger.error('[INTEGRITY] Erro ao obter estatísticas de integridade:', error);
    throw new AppError('Erro ao obter estatísticas de integridade', 500);
  }
}

/**
 * Executa verificação específica de notificações órfãs.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da verificação em formato JSON.
 * @throws {Error} Se houver erro durante a verificação.
 * @example
 * // POST /api/data-integrity/check/orphaned-notifications
 * // Retorno: { "type": "orphaned_notifications", "count": 3, ... }
 */
async function checkOrphanedNotifications(req, res) {
  try {
    logger.info('[INTEGRITY] Verificando notificações órfãs via API');

    const result = await dataIntegrityService.checkOrphanedNotifications();

    res.json({
      success: true,
      data: result,
      message: `Verificação de notificações órfãs concluída. ${result.count} problemas encontrados.`
    });
  } catch (error) {
    logger.error('[INTEGRITY] Erro ao verificar notificações órfãs:', error);
    throw new AppError('Erro ao verificar notificações órfãs', 500);
  }
}

/**
 * Executa verificação específica de notificações duplicadas.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da verificação em formato JSON.
 * @throws {Error} Se houver erro durante a verificação.
 * @example
 * // POST /api/data-integrity/check/duplicate-notifications
 * // Retorno: { "type": "duplicate_notifications", "count": 5, ... }
 */
async function checkDuplicateNotifications(req, res) {
  try {
    logger.info('[INTEGRITY] Verificando notificações duplicadas via API');

    const result = await dataIntegrityService.checkDuplicateNotifications();

    res.json({
      success: true,
      data: result,
      message: `Verificação de notificações duplicadas concluída. ${result.count} problemas encontrados.`
    });
  } catch (error) {
    logger.error('[INTEGRITY] Erro ao verificar notificações duplicadas:', error);
    throw new AppError('Erro ao verificar notificações duplicadas', 500);
  }
}

/**
 * Executa verificação específica de transações órfãs.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da verificação em formato JSON.
 * @throws {Error} Se houver erro durante a verificação.
 * @example
 * // POST /api/data-integrity/check/orphaned-transactions
 * // Retorno: { "type": "orphaned_transactions", "count": 2, ... }
 */
async function checkOrphanedTransactions(req, res) {
  try {
    logger.info('[INTEGRITY] Verificando transações órfãs via API');

    const result = await dataIntegrityService.checkOrphanedTransactions();

    res.json({
      success: true,
      data: result,
      message: `Verificação de transações órfãs concluída. ${result.count} problemas encontrados.`
    });
  } catch (error) {
    logger.error('[INTEGRITY] Erro ao verificar transações órfãs:', error);
    throw new AppError('Erro ao verificar transações órfãs', 500);
  }
}

/**
 * Obtém histórico de verificações de integridade (simulado).
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Histórico em formato JSON.
 * @throws {Error} Se houver erro ao obter histórico.
 * @example
 * // GET /api/data-integrity/history
 * // Retorno: { "checks": [...], "summary": {...} }
 */
async function getIntegrityHistory(req, res) {
  try {
    logger.info('[INTEGRITY] Obtendo histórico de verificações');

    // Por enquanto, retornamos dados simulados
    // Em uma implementação real, isso viria de uma tabela de histórico
    const history = {
      checks: [
        {
          id: 1,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
          totalIssues: 3,
          criticalIssues: 0,
          autoFixed: 3,
          status: 'completed'
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
          totalIssues: 0,
          criticalIssues: 0,
          autoFixed: 0,
          status: 'completed'
        }
      ],
      summary: {
        totalChecks: 2,
        averageIssues: 1.5,
        lastCheck: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    };

    res.json({
      success: true,
      data: history,
      message: 'Histórico de verificações obtido com sucesso'
    });
  } catch (error) {
    logger.error('[INTEGRITY] Erro ao obter histórico de verificações:', error);
    throw new AppError('Erro ao obter histórico de verificações', 500);
  }
}

/**
 * Obtém configurações de verificação de integridade.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Configurações em formato JSON.
 * @throws {Error} Se houver erro ao obter configurações.
 * @example
 * // GET /api/data-integrity/config
 * // Retorno: { "autoFix": true, "sendAlert": true, "schedule": "daily" }
 */
async function getIntegrityConfig(req, res) {
  try {
    logger.info('[INTEGRITY] Obtendo configurações de integridade');

    // Configurações padrão (em uma implementação real, viriam do banco/env)
    const config = {
      autoFix: process.env.INTEGRITY_AUTO_FIX !== 'false',
      sendAlert: process.env.INTEGRITY_SEND_ALERT !== 'false',
      schedule: process.env.INTEGRITY_SCHEDULE || 'daily',
      alertThreshold: parseInt(process.env.INTEGRITY_ALERT_THRESHOLD) || 10,
      criticalThreshold: parseInt(process.env.INTEGRITY_CRITICAL_THRESHOLD) || 5
    };

    res.json({
      success: true,
      data: config,
      message: 'Configurações de integridade obtidas com sucesso'
    });
  } catch (error) {
    logger.error('[INTEGRITY] Erro ao obter configurações de integridade:', error);
    throw new AppError('Erro ao obter configurações de integridade', 500);
  }
}

module.exports = {
  runIntegrityCheck,
  getIntegrityStats,
  checkOrphanedNotifications,
  checkDuplicateNotifications,
  checkOrphanedTransactions,
  getIntegrityHistory,
  getIntegrityConfig
}; 