/**
 * Service para gerenciamento de notificações
 * Implementa CRUD de notificações, lembretes de vencimento e sistema de prioridades
 */
const { Notification, User, Financing, FinancingPayment, Creditor } = require('../models');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { Op } = require('sequelize');
const { logger } = require('../utils/logger');

/**
 * Service responsável por gerenciar notificações.
 */
class NotificationService {
  /**
   * Lista todas as notificações do usuário.
   * @param {number} userId - ID do usuário.
   * @param {Object} query - Parâmetros de consulta.
   * @param {number} query.page - Página atual (opcional).
   * @param {number} query.limit - Limite por página (opcional).
   * @param {boolean} query.isRead - Filtro por status de leitura (opcional).
   * @param {string} query.type - Filtro por tipo (opcional).
   * @param {string} query.priority - Filtro por prioridade (opcional).
   * @returns {Promise<Object>} Lista de notificações paginada.
   */
  async listNotifications(userId, query = {}) {
    try {
      const { page = 1, limit = 20, isRead, type, priority } = query;
      const offset = (page - 1) * limit;

      const where = {
        userId,
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

      logger.info('Notificações do usuário listadas com sucesso', {
        user_id: userId,
        total_notifications: count,
        page: parseInt(page)
      });

      return {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      };
    } catch (error) {
      logger.error('Erro ao listar notificações do usuário', {
        error: error.message,
        user_id: userId
      });

      throw new Error('Erro ao listar notificações');
    }
  }

  /**
   * Marca uma notificação como lida.
   * @param {number} userId - ID do usuário.
   * @param {number} notificationId - ID da notificação.
   * @returns {Promise<Object>} Notificação atualizada.
   * @throws {NotFoundError} Se a notificação não for encontrada.
   */
  async markAsRead(userId, notificationId) {
    try {
      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          userId,
          isActive: true,
        },
      });

      if (!notification) {
        throw new NotFoundError('Notificação não encontrada');
      }

      await notification.update({ isRead: true });

      logger.info('Notificação marcada como lida', {
        user_id: userId,
        notification_id: notificationId
      });

      return { notification };
    } catch (error) {
      logger.error('Erro ao marcar notificação como lida', {
        error: error.message,
        user_id: userId,
        notification_id: notificationId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao marcar notificação como lida');
    }
  }

  /**
   * Marca todas as notificações do usuário como lidas.
   * @param {number} userId - ID do usuário.
   * @returns {Promise<Object>} Resultado da operação.
   */
  async markAllAsRead(userId) {
    try {
      const [updatedCount] = await Notification.update(
        { isRead: true },
        {
          where: {
            userId,
            isRead: false,
            isActive: true,
          },
        }
      );

      logger.info('Todas as notificações do usuário marcadas como lidas', {
        user_id: userId,
        updated_count: updatedCount
      });

      return { updatedCount };
    } catch (error) {
      logger.error('Erro ao marcar todas as notificações como lidas', {
        error: error.message,
        user_id: userId
      });

      throw new Error('Erro ao marcar notificações como lidas');
    }
  }

  /**
   * Cria uma nova notificação manual.
   * @param {number} userId - ID do usuário.
   * @param {Object} notificationData - Dados da notificação.
   * @param {string} notificationData.title - Título da notificação.
   * @param {string} notificationData.message - Mensagem da notificação.
   * @param {string} notificationData.type - Tipo da notificação.
   * @param {string} notificationData.relatedType - Tipo do item relacionado (opcional).
   * @param {number} notificationData.relatedId - ID do item relacionado (opcional).
   * @param {Date} notificationData.dueDate - Data de vencimento (opcional).
   * @param {string} notificationData.priority - Prioridade (opcional).
   * @param {Date} notificationData.scheduledFor - Data agendada (opcional).
   * @returns {Promise<Object>} Notificação criada.
   * @throws {ValidationError} Se os dados forem inválidos.
   */
  async createNotification(userId, notificationData) {
    try {
      const { title, message, type, relatedType, relatedId, dueDate, priority, scheduledFor } = notificationData;

      if (!title || !message || !type) {
        throw new ValidationError('Título, mensagem e tipo são obrigatórios');
      }

      const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        relatedType,
        relatedId,
        dueDate,
        priority: priority || 'medium',
        scheduledFor,
      });

      logger.info('Notificação criada com sucesso', {
        user_id: userId,
        notification_id: notification.id,
        type: notification.type
      });

      return { notification };
    } catch (error) {
      logger.error('Erro ao criar notificação', {
        error: error.message,
        user_id: userId,
        notification_data: notificationData
      });

      if (error.name === 'ValidationError') {
        throw error;
      }

      throw new Error('Erro ao criar notificação');
    }
  }

  /**
   * Remove uma notificação (marca como inativa).
   * @param {number} userId - ID do usuário.
   * @param {number} notificationId - ID da notificação.
   * @returns {Promise<Object>} Resultado da operação.
   * @throws {NotFoundError} Se a notificação não for encontrada.
   */
  async deleteNotification(userId, notificationId) {
    try {
      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          userId,
          isActive: true,
        },
      });

      if (!notification) {
        throw new NotFoundError('Notificação não encontrada');
      }

      await notification.update({ isActive: false });

      logger.info('Notificação removida com sucesso', {
        user_id: userId,
        notification_id: notificationId
      });

      return { message: 'Notificação removida com sucesso' };
    } catch (error) {
      logger.error('Erro ao remover notificação', {
        error: error.message,
        user_id: userId,
        notification_id: notificationId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao remover notificação');
    }
  }

  /**
   * Obtém estatísticas de notificações do usuário.
   * @param {number} userId - ID do usuário.
   * @returns {Promise<Object>} Estatísticas de notificações.
   */
  async getNotificationStats(userId) {
    try {
      const [
        totalNotifications,
        unreadNotifications,
        highPriorityNotifications,
        todayNotifications,
        weeklyNotifications
      ] = await Promise.all([
        Notification.count({
          where: { userId, isActive: true }
        }),
        Notification.count({
          where: { userId, isRead: false, isActive: true }
        }),
        Notification.count({
          where: { userId, priority: 'high', isActive: true }
        }),
        Notification.count({
          where: {
            userId,
            isActive: true,
            createdAt: {
              [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        Notification.count({
          where: {
            userId,
            isActive: true,
            createdAt: {
              [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 7))
            }
          }
        })
      ]);

      const typeStats = await Notification.findAll({
        where: { userId, isActive: true },
        attributes: [
          'type',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['type'],
        raw: true
      });

      logger.info('Estatísticas de notificações obtidas com sucesso', {
        user_id: userId
      });

      return {
        total: totalNotifications,
        unread: unreadNotifications,
        highPriority: highPriorityNotifications,
        today: todayNotifications,
        weekly: weeklyNotifications,
        byType: typeStats.reduce((acc, stat) => {
          acc[stat.type] = parseInt(stat.count);
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas de notificações', {
        error: error.message,
        user_id: userId
      });

      throw new Error('Erro ao obter estatísticas de notificações');
    }
  }

  /**
   * Cria notificações de vencimento de pagamentos.
   * @param {number} userId - ID do usuário (opcional, se null cria para todos).
   * @returns {Promise<Object>} Resultado da operação.
   */
  async createPaymentDueNotifications(userId = null) {
    try {
      const where = {
        due_date: {
          [Op.between]: [
            new Date(),
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Próximos 7 dias
          ]
        },
        status: 'pending'
      };

      if (userId) {
        where.user_id = userId;
      }

      const payments = await FinancingPayment.findAll({
        where,
        include: [
          {
            model: Financing,
            include: [{ model: Creditor }]
          }
        ]
      });

      const notifications = [];
      const now = new Date();

      for (const payment of payments) {
        const daysUntilDue = Math.ceil((new Date(payment.due_date) - now) / (1000 * 60 * 60 * 24));
        
        let priority = 'medium';
        let title = '';
        let message = '';

        if (daysUntilDue <= 0) {
          priority = 'high';
          title = 'Pagamento Vencido';
          message = `O pagamento de R$ ${payment.amount.toFixed(2)} do financiamento "${payment.Financing.Creditor.name}" está vencido.`;
        } else if (daysUntilDue <= 3) {
          priority = 'high';
          title = 'Pagamento Vence em Breve';
          message = `O pagamento de R$ ${payment.amount.toFixed(2)} do financiamento "${payment.Financing.Creditor.name}" vence em ${daysUntilDue} dia(s).`;
        } else {
          title = 'Lembrete de Pagamento';
          message = `O pagamento de R$ ${payment.amount.toFixed(2)} do financiamento "${payment.Financing.Creditor.name}" vence em ${daysUntilDue} dia(s).`;
        }

        // Verificar se já existe notificação para este pagamento
        const existingNotification = await Notification.findOne({
          where: {
            userId: payment.Financing.user_id,
            relatedType: 'financing_payment',
            relatedId: payment.id,
            type: 'payment_due',
            isActive: true
          }
        });

        if (!existingNotification) {
          notifications.push({
            userId: payment.Financing.user_id,
            title,
            message,
            type: 'payment_due',
            relatedType: 'financing_payment',
            relatedId: payment.id,
            priority,
            dueDate: payment.due_date
          });
        }
      }

      if (notifications.length > 0) {
        await Notification.bulkCreate(notifications);
      }

      logger.info('Notificações de vencimento criadas com sucesso', {
        user_id: userId,
        notifications_created: notifications.length,
        payments_processed: payments.length
      });

      return {
        notificationsCreated: notifications.length,
        paymentsProcessed: payments.length
      };
    } catch (error) {
      logger.error('Erro ao criar notificações de vencimento', {
        error: error.message,
        user_id: userId
      });

      throw new Error('Erro ao criar notificações de vencimento');
    }
  }

  /**
   * Obtém histórico de jobs de notificação.
   * @param {Object} query - Parâmetros de consulta.
   * @param {number} query.page - Página atual (opcional).
   * @param {number} query.limit - Limite por página (opcional).
   * @returns {Promise<Object>} Histórico de jobs.
   */
  async getJobHistory(query = {}) {
    try {
      const { page = 1, limit = 20 } = query;
      const offset = (page - 1) * limit;

      // Simular histórico de jobs (implementar com tabela real se necessário)
      const jobHistory = [
        {
          id: 1,
          type: 'payment_due_notifications',
          status: 'completed',
          started_at: new Date(Date.now() - 3600000),
          completed_at: new Date(Date.now() - 3500000),
          notifications_created: 15,
          errors: 0
        },
        {
          id: 2,
          type: 'payment_due_notifications',
          status: 'completed',
          started_at: new Date(Date.now() - 7200000),
          completed_at: new Date(Date.now() - 7100000),
          notifications_created: 8,
          errors: 0
        }
      ];

      logger.info('Histórico de jobs obtido com sucesso');

      return {
        jobs: jobHistory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalItems: jobHistory.length,
          itemsPerPage: parseInt(limit),
        },
      };
    } catch (error) {
      logger.error('Erro ao obter histórico de jobs', {
        error: error.message
      });

      throw new Error('Erro ao obter histórico de jobs');
    }
  }

  /**
   * Obtém estatísticas de jobs de notificação.
   * @returns {Promise<Object>} Estatísticas de jobs.
   */
  async getJobStats() {
    try {
      // Simular estatísticas de jobs (implementar com dados reais se necessário)
      const stats = {
        totalJobs: 150,
        successfulJobs: 145,
        failedJobs: 5,
        averageExecutionTime: 2.5,
        lastExecution: new Date(Date.now() - 3600000),
        notificationsCreatedToday: 23,
        notificationsCreatedThisWeek: 156,
        averageNotificationsPerJob: 12.5
      };

      logger.info('Estatísticas de jobs obtidas com sucesso');

      return stats;
    } catch (error) {
      logger.error('Erro ao obter estatísticas de jobs', {
        error: error.message
      });

      throw new Error('Erro ao obter estatísticas de jobs');
    }
  }

  /**
   * Reprocessa notificações (para casos de erro).
   * @param {number} userId - ID do usuário (opcional).
   * @returns {Promise<Object>} Resultado da operação.
   */
  async reprocessNotifications(userId = null) {
    try {
      const result = await this.createPaymentDueNotifications(userId);

      logger.info('Notificações reprocessadas com sucesso', {
        user_id: userId,
        result
      });

      return {
        message: 'Notificações reprocessadas com sucesso',
        ...result
      };
    } catch (error) {
      logger.error('Erro ao reprocessar notificações', {
        error: error.message,
        user_id: userId
      });

      throw new Error('Erro ao reprocessar notificações');
    }
  }
}

module.exports = new NotificationService(); 