const { ValidationError, NotFoundError } = require('../utils/errors');
const fixedAccountJobs = require('../services/fixedAccountJobs');
const jobTracking = require('../services/jobTracking');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Controller para gerenciamento de jobs de contas fixas.
 * Permite executar jobs manualmente e monitorar seu status.
 */
class FixedAccountJobController {
  /**
   * Executa o processamento de contas fixas vencidas manualmente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da requisição.
   * @param {number} [req.body.userId] - ID do usuário específico (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resultado da execução do job.
   * @example
   * // POST /api/fixed-account-jobs/process
   * // Body: { "userId": 1 } (opcional)
   * // Retorno: { "success": true, "message": "Job executado com sucesso", "data": {...} }
   */
  async processOverdueAccounts(req, res) {
    try {
      const { userId } = req.body;

      logger.info(`[CONTROLLER] Executando processamento de contas fixas${userId ? ` para usuário ${userId}` : ' para todos os usuários'}`);

      await fixedAccountJobs.processOverdueFixedAccounts(userId);

      res.json({
        success: true,
        message: 'Processamento de contas fixas executado com sucesso',
        data: {
          jobType: 'fixed_account_processing',
          userId: userId || 'all'
        }
      });
    } catch (error) {
      logger.error('[CONTROLLER] Erro ao executar processamento de contas fixas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao executar processamento de contas fixas',
        details: error.message
      });
    }
  }

  /**
   * Cria notificações para contas fixas manualmente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da requisição.
   * @param {number} [req.body.userId] - ID do usuário específico (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resultado da execução do job.
   * @example
   * // POST /api/fixed-account-jobs/notifications
   * // Body: { "userId": 1 } (opcional)
   * // Retorno: { "success": true, "message": "Notificações criadas com sucesso", "data": {...} }
   */
  async createNotifications(req, res) {
    try {
      const { userId } = req.body;

      logger.info(`[CONTROLLER] Criando notificações de contas fixas${userId ? ` para usuário ${userId}` : ' para todos os usuários'}`);

      await fixedAccountJobs.createFixedAccountNotifications(userId);

      res.json({
        success: true,
        message: 'Notificações de contas fixas criadas com sucesso',
        data: {
          jobType: 'fixed_account_notifications',
          userId: userId || 'all'
        }
      });
    } catch (error) {
      logger.error('[CONTROLLER] Erro ao criar notificações de contas fixas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar notificações de contas fixas',
        details: error.message
      });
    }
  }

  /**
   * Executa todos os jobs de contas fixas manualmente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da requisição.
   * @param {number} [req.body.userId] - ID do usuário específico (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resultado da execução dos jobs.
   * @example
   * // POST /api/fixed-account-jobs/run-all
   * // Body: { "userId": 1 } (opcional)
   * // Retorno: { "success": true, "message": "Todos os jobs executados com sucesso", "data": {...} }
   */
  async runAllJobs(req, res) {
    try {
      const { userId } = req.body;

      logger.info(`[CONTROLLER] Executando todos os jobs de contas fixas${userId ? ` para usuário ${userId}` : ' para todos os usuários'}`);

      await fixedAccountJobs.runAllFixedAccountJobs(userId);

      res.json({
        success: true,
        message: 'Todos os jobs de contas fixas executados com sucesso',
        data: {
          jobsExecuted: ['fixed_account_processing', 'fixed_account_notifications'],
          userId: userId || 'all'
        }
      });
    } catch (error) {
      logger.error('[CONTROLLER] Erro ao executar jobs de contas fixas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao executar jobs de contas fixas',
        details: error.message
      });
    }
  }

  /**
   * Obtém o histórico de execuções dos jobs de contas fixas.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} [req.query.jobName] - Nome do job para filtrar.
   * @param {string} [req.query.status] - Status para filtrar (success, failed, running).
   * @param {string} [req.query.startDate] - Data de início (YYYY-MM-DD).
   * @param {string} [req.query.endDate] - Data de fim (YYYY-MM-DD).
   * @param {number} [req.query.page] - Página para paginação.
   * @param {number} [req.query.limit] - Limite de itens por página.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Histórico de execuções.
   * @example
   * // GET /api/fixed-account-jobs/history?jobName=fixed_account_processing&page=1&limit=10
   * // Retorno: { "success": true, "data": { "executions": [...], "pagination": {...} } }
   */
  async getJobHistory(req, res) {
    try {
      const {
        jobName,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 10
      } = req.query;

      const where = {};

      // Filtrar por nome do job
      if (jobName) {
        where.job_name = jobName;
      }

      // Filtrar por status
      if (status) {
        where.status = status;
      }

      // Filtrar por data
      if (startDate || endDate) {
        where.started_at = {};
        if (startDate) where.started_at[Op.gte] = new Date(startDate);
        if (endDate) where.started_at[Op.lte] = new Date(endDate);
      }

      const offset = (page - 1) * limit;

      const { count, rows: executions } = await jobTracking.JobExecution.findAndCountAll({
        where,
        order: [['started_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          executions,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('[CONTROLLER] Erro ao buscar histórico de jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar histórico de jobs',
        details: error.message
      });
    }
  }

  /**
   * Obtém estatísticas dos jobs de contas fixas.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} [req.query.period] - Período para estatísticas (day, week, month).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas dos jobs.
   * @example
   * // GET /api/fixed-account-jobs/stats?period=week
   * // Retorno: { "success": true, "data": { "totalExecutions": 10, "successRate": 90, ... } }
   */
  async getJobStats(req, res) {
    try {
      const { period = 'week' } = req.query;

      let startDate = new Date();
      switch (period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const where = {
        started_at: {
          [Op.gte]: startDate
        }
      };

      // Estatísticas gerais
      const totalExecutions = await jobTracking.JobExecution.count({ where });
      const successfulExecutions = await jobTracking.JobExecution.count({
        where: { ...where, status: 'success' }
      });
      const failedExecutions = await jobTracking.JobExecution.count({
        where: { ...where, status: 'failed' }
      });

      // Estatísticas por tipo de job
      const processingStats = await jobTracking.JobExecution.findAll({
        where: { ...where, job_name: 'fixed_account_processing' },
        attributes: [
          'status',
          [jobTracking.JobExecution.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['status']
      });

      const notificationStats = await jobTracking.JobExecution.findAll({
        where: { ...where, job_name: 'fixed_account_notifications' },
        attributes: [
          'status',
          [jobTracking.JobExecution.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['status']
      });

      // Calcular taxa de sucesso
      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

      res.json({
        success: true,
        data: {
          period,
          totalExecutions,
          successfulExecutions,
          failedExecutions,
          successRate: Math.round(successRate * 100) / 100,
          processingJob: {
            total: processingStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0),
            success: processingStats.find(s => s.status === 'success')?.dataValues.count || 0,
            failed: processingStats.find(s => s.status === 'failed')?.dataValues.count || 0
          },
          notificationJob: {
            total: notificationStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0),
            success: notificationStats.find(s => s.status === 'success')?.dataValues.count || 0,
            failed: notificationStats.find(s => s.status === 'failed')?.dataValues.count || 0
          }
        }
      });
    } catch (error) {
      logger.error('[CONTROLLER] Erro ao buscar estatísticas de jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatísticas de jobs',
        details: error.message
      });
    }
  }

  /**
   * Obtém informações sobre a configuração dos jobs de contas fixas.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Configuração dos jobs.
   * @example
   * // GET /api/fixed-account-jobs/config
   * // Retorno: { "success": true, "data": { "jobs": {...} } }
   */
  async getJobConfig(req, res) {
    try {
      const config = {
        jobs: {
          fixed_account_processing: {
            name: 'Processamento de Contas Fixas',
            description: 'Processa contas fixas vencidas automaticamente',
            schedule: '0 6 * * *', // Diariamente às 6h
            scheduleDescription: 'Diariamente às 6:00',
            timeout: process.env.JOB_TIMEOUT_FIXED_ACCOUNT_PROCESSING || 300000, // 5 minutos
            retries: 3
          },
          fixed_account_notifications: {
            name: 'Notificações de Contas Fixas',
            description: 'Cria notificações para contas fixas vencidas e próximas do vencimento',
            schedule: '0 */4 * * *', // A cada 4 horas
            scheduleDescription: 'A cada 4 horas',
            timeout: process.env.JOB_TIMEOUT_FIXED_ACCOUNT_NOTIFICATIONS || 120000, // 2 minutos
            retries: 2
          }
        },
        settings: {
          reminderDays: 3,
          autoProcessOverdue: true,
          checkBalance: true,
          createDefaultAccount: true
        }
      };

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('[CONTROLLER] Erro ao buscar configuração de jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar configuração de jobs',
        details: error.message
      });
    }
  }
}

module.exports = new FixedAccountJobController(); 