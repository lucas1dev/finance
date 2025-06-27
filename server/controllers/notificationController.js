/**
 * Controller para gerenciamento de notificações.
 * Inclui funcionalidades para CRUD de notificações, lembretes de vencimento,
 * notificações automáticas e sistema de prioridades.
 * 
 * @module controllers/notificationController
 */

const { Notification, User, Financing, FinancingPayment, Creditor } = require('../models');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { successResponse, errorResponse } = require('../utils/response');
const { Op } = require('sequelize');

/**
 * Lista todas as notificações do usuário autenticado.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.userId - ID do usuário autenticado.
 * @param {Object} req.query - Parâmetros de consulta (page, limit, isRead, type, priority).
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Lista de notificações paginada.
 * @example
 * // GET /notifications?page=1&limit=10&isRead=false&type=payment_due
 * // Retorno: { notifications: [...], pagination: {...} }
 */
const listNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead, type, priority } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      userId: req.userId,
      isActive: true,
    };

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const totalPages = Math.ceil(count / limit);

    return successResponse(res, {
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    return errorResponse(res, 'Erro interno do servidor', 500);
  }
};

/**
 * Marca uma notificação como lida.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.userId - ID do usuário autenticado.
 * @param {string} req.params.id - ID da notificação.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Notificação atualizada.
 * @example
 * // PATCH /notifications/123/read
 * // Retorno: { notification: {...} }
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.userId,
        isActive: true,
      },
    });

    if (!notification) {
      throw new NotFoundError('Notificação não encontrada');
    }

    await notification.update({ isRead: true });

    return successResponse(res, { notification }, 'Notificação marcada como lida');
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(res, error.message, 404);
    }
    console.error('Erro ao marcar notificação como lida:', error);
    return errorResponse(res, 'Erro interno do servidor', 500);
  }
};

/**
 * Marca todas as notificações do usuário como lidas.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.userId - ID do usuário autenticado.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da operação.
 * @example
 * // PATCH /notifications/read-all
 * // Retorno: { message: "Todas as notificações foram marcadas como lidas" }
 */
const markAllAsRead = async (req, res) => {
  try {
    const updatedCount = await Notification.update(
      { isRead: true },
      {
        where: {
          userId: req.userId,
          isRead: false,
          isActive: true,
        },
      }
    );

    return successResponse(
      res,
      { updatedCount: updatedCount[0] },
      'Todas as notificações foram marcadas como lidas'
    );
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    return errorResponse(res, 'Erro interno do servidor', 500);
  }
};

/**
 * Cria uma nova notificação manual.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.userId - ID do usuário autenticado.
 * @param {Object} req.body - Dados da notificação.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Notificação criada.
 * @example
 * // POST /notifications
 * // Body: { title: "Lembrete", message: "Não esqueça do pagamento", type: "reminder" }
 * // Retorno: { notification: {...} }
 */
const createNotification = async (req, res) => {
  try {
    const { title, message, type, relatedType, relatedId, dueDate, priority, scheduledFor } = req.body;

    if (!title || !message || !type) {
      throw new ValidationError('Título, mensagem e tipo são obrigatórios');
    }

    const notification = await Notification.create({
      userId: req.userId,
      title,
      message,
      type,
      relatedType,
      relatedId,
      dueDate,
      priority: priority || 'medium',
      scheduledFor,
    });

    return successResponse(res, { notification }, 'Notificação criada com sucesso', 201);
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }
    console.error('Erro ao criar notificação:', error);
    return errorResponse(res, 'Erro interno do servidor', 500);
  }
};

/**
 * Remove uma notificação (marca como inativa).
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.userId - ID do usuário autenticado.
 * @param {string} req.params.id - ID da notificação.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da operação.
 * @example
 * // DELETE /notifications/123
 * // Retorno: { message: "Notificação removida com sucesso" }
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.userId,
        isActive: true,
      },
    });

    if (!notification) {
      throw new NotFoundError('Notificação não encontrada');
    }

    await notification.update({ isActive: false });

    return successResponse(res, null, 'Notificação removida com sucesso');
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(res, error.message, 404);
    }
    console.error('Erro ao remover notificação:', error);
    return errorResponse(res, 'Erro interno do servidor', 500);
  }
};

/**
 * Obtém estatísticas das notificações do usuário.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.userId - ID do usuário autenticado.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Estatísticas das notificações.
 * @example
 * // GET /notifications/stats
 * // Retorno: { total: 10, unread: 5, byType: {...}, byPriority: {...} }
 */
const getNotificationStats = async (req, res) => {
  try {
    const where = {
      userId: req.userId,
      isActive: true,
    };

    const [total, unread, byType, byPriority] = await Promise.all([
      Notification.count({ where }),
      Notification.count({ where: { ...where, isRead: false } }),
      Notification.findAll({
        where,
        attributes: [
          'type',
          [Notification.sequelize.fn('COUNT', '*'), 'count'],
        ],
        group: ['type'],
      }),
      Notification.findAll({
        where,
        attributes: [
          'priority',
          [Notification.sequelize.fn('COUNT', '*'), 'count'],
        ],
        group: ['priority'],
      }),
    ]);

    const stats = {
      total,
      unread,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.dataValues.count);
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = parseInt(item.dataValues.count);
        return acc;
      }, {}),
    };

    return successResponse(res, stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas das notificações:', error);
    return errorResponse(res, 'Erro interno do servidor', 500);
  }
};

/**
 * Cria notificações automáticas para vencimentos de financiamentos.
 * Esta função deve ser executada por um job/cron.
 * @param {number} userId - ID do usuário (opcional, se null cria para todos).
 * @returns {Promise<void>}
 */
const createPaymentDueNotifications = async (userId = null) => {
  try {
    const where = {
      status: 'pendente',
      payment_date: {
        [Op.between]: [
          new Date(),
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        ],
      },
    };

    if (userId) {
      where.user_id = userId;
    }

    const payments = await FinancingPayment.findAll({
      where,
      include: [
        {
          model: Financing,
          as: 'financing',
          include: [
            {
              model: Creditor,
              as: 'creditor',
            },
          ],
        },
      ],
    });

    for (const payment of payments) {
      const daysUntilDue = Math.ceil((payment.payment_date - new Date()) / (1000 * 60 * 60 * 24));
      
      let title, message, priority;
      
      if (daysUntilDue <= 0) {
        title = 'Pagamento Vencido';
        message = `O pagamento do financiamento "${payment.financing.name}" venceu. Valor: R$ ${payment.payment_amount.toFixed(2)}`;
        priority = 'urgent';
      } else if (daysUntilDue <= 3) {
        title = 'Pagamento Vence em Breve';
        message = `O pagamento do financiamento "${payment.financing.name}" vence em ${daysUntilDue} dias. Valor: R$ ${payment.payment_amount.toFixed(2)}`;
        priority = 'high';
      } else {
        title = 'Lembrete de Pagamento';
        message = `O pagamento do financiamento "${payment.financing.name}" vence em ${daysUntilDue} dias. Valor: R$ ${payment.payment_amount.toFixed(2)}`;
        priority = 'medium';
      }

      // Verifica se já existe uma notificação para este pagamento
      const existingNotification = await Notification.findOne({
        where: {
          userId: payment.user_id,
          relatedType: 'financing_payment',
          relatedId: payment.id,
          type: daysUntilDue <= 0 ? 'payment_overdue' : 'payment_due',
          isActive: true,
        },
      });

      if (!existingNotification) {
        await Notification.create({
          userId: payment.user_id,
          title,
          message,
          type: daysUntilDue <= 0 ? 'payment_overdue' : 'payment_due',
          relatedType: 'financing_payment',
          relatedId: payment.id,
          dueDate: payment.payment_date,
          priority,
        });
      }
    }
  } catch (error) {
    console.error('Erro ao criar notificações de vencimento:', error);
  }
};

/**
 * Obtém o histórico de execuções dos jobs de notificação.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.query.jobName - Nome do job para filtrar (opcional).
 * @param {string} req.query.status - Status para filtrar (success, error, running).
 * @param {string} req.query.startDate - Data de início para filtrar (YYYY-MM-DD).
 * @param {string} req.query.endDate - Data de fim para filtrar (YYYY-MM-DD).
 * @param {string} req.query.page - Página para paginação (padrão: 1).
 * @param {string} req.query.limit - Limite de itens por página (padrão: 20).
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Histórico de execuções dos jobs paginado.
 * @example
 * // GET /notifications/jobs/history?jobName=payment_check&status=success&page=1&limit=10
 * // Retorno: { executions: [...], pagination: {...} }
 */
const getJobHistory = async (req, res) => {
  try {
    const { 
      jobName, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const { JobExecution } = require('../models');

    const where = {};

    if (jobName) {
      where.jobName = jobName;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) {
        where.startedAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.startedAt[Op.lte] = new Date(endDate + ' 23:59:59');
      }
    }

    const { count, rows: executions } = await JobExecution.findAndCountAll({
      where,
      order: [['startedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const totalPages = Math.ceil(count / limit);

    return successResponse(res, {
      executions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Erro ao obter histórico dos jobs:', error);
    return errorResponse(res, 'Erro interno do servidor', 500);
  }
};

/**
 * Obtém estatísticas globais dos jobs de notificação.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.query.days - Número de dias para calcular estatísticas (padrão: 30).
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Estatísticas agregadas dos jobs.
 * @example
 * // GET /notifications/jobs/stats?days=7
 * // Retorno: { totalExecutions: 100, successRate: 0.95, avgDuration: 1500, ... }
 */
const getJobStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const { JobExecution } = require('../models');
    const { Op } = require('sequelize');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const where = {
      startedAt: {
        [Op.gte]: startDate,
      },
    };

    const executions = await JobExecution.findAll({
      where,
      attributes: [
        'jobName',
        'status',
        'duration',
        'notificationsCreated',
        'notificationsUpdated',
        'startedAt',
      ],
    });

    // Estatísticas por job
    const jobStats = {};
    const jobNames = [...new Set(executions.map(e => e.jobName))];

    for (const jobName of jobNames) {
      const jobExecutions = executions.filter(e => e.jobName === jobName);
      const totalExecutions = jobExecutions.length;
      const successfulExecutions = jobExecutions.filter(e => e.status === 'success').length;
      const failedExecutions = jobExecutions.filter(e => e.status === 'error').length;
      const runningExecutions = jobExecutions.filter(e => e.status === 'running').length;

      const durations = jobExecutions
        .filter(e => e.duration && e.status === 'success')
        .map(e => e.duration);

      const totalNotificationsCreated = jobExecutions.reduce((sum, e) => sum + e.notificationsCreated, 0);
      const totalNotificationsUpdated = jobExecutions.reduce((sum, e) => sum + e.notificationsUpdated, 0);

      jobStats[jobName] = {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        runningExecutions,
        successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) : 0,
        avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        minDuration: durations.length > 0 ? Math.min(...durations) : 0,
        maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
        totalNotificationsCreated,
        totalNotificationsUpdated,
        lastExecution: jobExecutions.length > 0 ? jobExecutions[0].startedAt : null,
      };
    }

    // Estatísticas globais
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === 'success').length;
    const failedExecutions = executions.filter(e => e.status === 'error').length;
    const runningExecutions = executions.filter(e => e.status === 'running').length;

    const allDurations = executions
      .filter(e => e.duration && e.status === 'success')
      .map(e => e.duration);

    const totalNotificationsCreated = executions.reduce((sum, e) => sum + e.notificationsCreated, 0);
    const totalNotificationsUpdated = executions.reduce((sum, e) => sum + e.notificationsUpdated, 0);

    const globalStats = {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      runningExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) : 0,
      avgDuration: allDurations.length > 0 ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length : 0,
      minDuration: allDurations.length > 0 ? Math.min(...allDurations) : 0,
      maxDuration: allDurations.length > 0 ? Math.max(...allDurations) : 0,
      totalNotificationsCreated,
      totalNotificationsUpdated,
      periodDays: parseInt(days),
    };

    return successResponse(res, {
      global: globalStats,
      byJob: jobStats,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas dos jobs:', error);
    return errorResponse(res, 'Erro interno do servidor', 500);
  }
};

/**
 * Reprocessa notificações específicas para um usuário.
 * Permite recriar notificações de pagamentos vencidos, lembretes gerais, etc.
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.userId - ID do usuário autenticado (admin).
 * @param {Object} req.body - Dados da requisição.
 * @param {number} req.body.targetUserId - ID do usuário alvo.
 * @param {string} req.body.notificationType - Tipo de notificação a reprocessar (payment_check, general_reminders, all).
 * @param {boolean} req.body.clearExisting - Se deve limpar notificações existentes antes de reprocessar.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado do reprocessamento.
 * @example
 * // POST /notifications/reprocess
 * // Body: { targetUserId: 123, notificationType: "payment_check", clearExisting: true }
 * // Retorno: { message: "Notificações reprocessadas com sucesso", data: {...} }
 */
const reprocessNotifications = async (req, res) => {
  try {
    const { targetUserId, notificationType = 'all', clearExisting = false } = req.body;

    // Validações
    if (!targetUserId) {
      throw new ValidationError('ID do usuário alvo é obrigatório');
    }

    if (!['payment_check', 'general_reminders', 'all'].includes(notificationType)) {
      throw new ValidationError('Tipo de notificação deve ser: payment_check, general_reminders ou all');
    }

    // Verificar se o usuário alvo existe
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      throw new NotFoundError('Usuário alvo não encontrado');
    }

    // Verificar se o usuário alvo está ativo
    if (!targetUser.isActive) {
      throw new ValidationError('Usuário alvo está inativo');
    }

    // Importar serviços necessários
    const notificationJobs = require('../services/notificationJobs');
    const { logger } = require('../utils/logger');

    let result = {
      targetUserId: parseInt(targetUserId),
      notificationType,
      clearExisting,
      notificationsCreated: 0,
      notificationsRemoved: 0,
      jobsExecuted: []
    };

    // Limpar notificações existentes se solicitado
    if (clearExisting) {
      const whereClause = {
        userId: targetUserId,
        isActive: true
      };

      // Filtrar por tipo se não for 'all'
      if (notificationType !== 'all') {
        const typeMap = {
          'payment_check': ['payment_overdue', 'payment_due_today', 'payment_due', 'payment_reminder'],
          'general_reminders': ['general_reminder', 'financing_summary', 'account_balance']
        };
        whereClause.type = { [Op.in]: typeMap[notificationType] };
      }

      const removedCount = await Notification.update(
        { isActive: false },
        { where: whereClause }
      );

      result.notificationsRemoved = removedCount[0];
      logger.info(`[REPROCESS] Removidas ${result.notificationsRemoved} notificações existentes para usuário ${targetUserId}`);
    }

    // Executar jobs específicos
    if (notificationType === 'payment_check' || notificationType === 'all') {
      logger.info(`[REPROCESS] Executando job de verificação de pagamentos para usuário ${targetUserId}`);
      
      // Executar job de verificação de pagamentos
      await notificationJobs.createPaymentDueNotifications(targetUserId);
      result.jobsExecuted.push('payment_check');
    }

    if (notificationType === 'general_reminders' || notificationType === 'all') {
      logger.info(`[REPROCESS] Executando job de lembretes gerais para usuário ${targetUserId}`);
      
      // Executar job de lembretes gerais
      await notificationJobs.createGeneralReminders(targetUserId);
      result.jobsExecuted.push('general_reminders');
    }

    // Contar notificações criadas recentemente
    const recentNotifications = await Notification.count({
      where: {
        userId: targetUserId,
        isActive: true,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
        }
      }
    });

    result.notificationsCreated = recentNotifications;

    // Log da operação
    logger.info(`[REPROCESS] Reprocessamento concluído para usuário ${targetUserId}`, {
      targetUserId,
      notificationType,
      clearExisting,
      notificationsCreated: result.notificationsCreated,
      notificationsRemoved: result.notificationsRemoved,
      jobsExecuted: result.jobsExecuted,
      adminUserId: req.userId
    });

    return successResponse(
      res,
      result,
      `Notificações reprocessadas com sucesso para o usuário ${targetUser.name}`,
      200
    );

  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, 400);
    }
    if (error instanceof NotFoundError) {
      return errorResponse(res, error.message, 404);
    }
    
    console.error('Erro ao reprocessar notificações:', error);
    return errorResponse(res, 'Erro interno do servidor', 500);
  }
};

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
  getNotificationStats,
  createPaymentDueNotifications,
  getJobHistory,
  getJobStats,
  reprocessNotifications,
};