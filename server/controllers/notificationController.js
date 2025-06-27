/**
 * Controller para gerenciamento de notificações.
 * Implementa funcionalidades para CRUD de notificações, lembretes de vencimento,
 * notificações automáticas e sistema de prioridades.
 */
const NotificationService = require('../services/notificationService');
const { logger } = require('../utils/logger');

/**
 * Controlador responsável por gerenciar notificações.
 * Delega toda a lógica de negócio para o NotificationService.
 */
class NotificationController {
  /**
   * Lista todas as notificações do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} req.query - Parâmetros de consulta (page, limit, isRead, type, priority).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de notificações paginada.
   * @example
   * // GET /notifications?page=1&limit=10&isRead=false&type=payment_due
   * // Retorno: { "success": true, "data": { notifications: [...], pagination: {...} } }
   */
  async listNotifications(req, res) {
    try {
      const result = await NotificationService.listNotifications(req.userId, req.query);

      logger.info('Notificações do usuário listadas com sucesso', {
        user_id: req.userId,
        total_notifications: result.pagination.totalItems
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao listar notificações do usuário', {
        error: error.message,
        user_id: req.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Marca uma notificação como lida.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {string} req.params.id - ID da notificação.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Notificação atualizada.
   * @example
   * // PATCH /notifications/123/read
   * // Retorno: { "success": true, "data": { notification: {...} }, "message": "Notificação marcada como lida" }
   */
  async markAsRead(req, res) {
    try {
      const result = await NotificationService.markAsRead(req.userId, req.params.id);

      logger.info('Notificação marcada como lida', {
        user_id: req.userId,
        notification_id: req.params.id
      });

      return res.json({
        success: true,
        data: result,
        message: 'Notificação marcada como lida'
      });
    } catch (error) {
      logger.error('Erro ao marcar notificação como lida', {
        error: error.message,
        user_id: req.userId,
        notification_id: req.params.id
      });

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Marca todas as notificações do usuário como lidas.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resultado da operação.
   * @example
   * // PATCH /notifications/read-all
   * // Retorno: { "success": true, "data": { updatedCount: 5 }, "message": "Todas as notificações foram marcadas como lidas" }
   */
  async markAllAsRead(req, res) {
    try {
      const result = await NotificationService.markAllAsRead(req.userId);

      logger.info('Todas as notificações do usuário marcadas como lidas', {
        user_id: req.userId,
        updated_count: result.updatedCount
      });

      return res.json({
        success: true,
        data: result,
        message: 'Todas as notificações foram marcadas como lidas'
      });
    } catch (error) {
      logger.error('Erro ao marcar todas as notificações como lidas', {
        error: error.message,
        user_id: req.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

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
   * // Retorno: { "success": true, "data": { notification: {...} }, "message": "Notificação criada com sucesso" }
   */
  async createNotification(req, res) {
    try {
      const result = await NotificationService.createNotification(req.userId, req.body);

      logger.info('Notificação criada com sucesso', {
        user_id: req.userId,
        notification_id: result.notification.id,
        type: result.notification.type
      });

      return res.status(201).json({
        success: true,
        data: result,
        message: 'Notificação criada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar notificação', {
        error: error.message,
        user_id: req.userId,
        notification_data: req.body
      });

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Remove uma notificação (marca como inativa).
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {string} req.params.id - ID da notificação.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resultado da operação.
   * @example
   * // DELETE /notifications/123
   * // Retorno: { "success": true, "data": { message: "Notificação removida com sucesso" } }
   */
  async deleteNotification(req, res) {
    try {
      const result = await NotificationService.deleteNotification(req.userId, req.params.id);

      logger.info('Notificação removida com sucesso', {
        user_id: req.userId,
        notification_id: req.params.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao remover notificação', {
        error: error.message,
        user_id: req.userId,
        notification_id: req.params.id
      });

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém estatísticas de notificações do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas de notificações.
   * @example
   * // GET /notifications/stats
   * // Retorno: { "success": true, "data": { total: 50, unread: 10, highPriority: 3, ... } }
   */
  async getNotificationStats(req, res) {
    try {
      const result = await NotificationService.getNotificationStats(req.userId);

      logger.info('Estatísticas de notificações obtidas com sucesso', {
        user_id: req.userId
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao obter estatísticas de notificações', {
        error: error.message,
        user_id: req.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Cria notificações de vencimento de pagamentos.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resultado da operação.
   * @example
   * // POST /notifications/create-payment-due
   * // Retorno: { "success": true, "data": { notificationsCreated: 15, paymentsProcessed: 20 } }
   */
  async createPaymentDueNotifications(req, res) {
    try {
      const userId = req.userId || null;
      const result = await NotificationService.createPaymentDueNotifications(userId);

      logger.info('Notificações de vencimento criadas com sucesso', {
        user_id: userId,
        notifications_created: result.notificationsCreated,
        payments_processed: result.paymentsProcessed
      });

      return res.json({
        success: true,
        data: result,
        message: 'Notificações de vencimento criadas com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar notificações de vencimento', {
        error: error.message,
        user_id: req.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém histórico de jobs de notificação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Histórico de jobs.
   * @example
   * // GET /notifications/job-history?page=1&limit=10
   * // Retorno: { "success": true, "data": { jobs: [...], pagination: {...} } }
   */
  async getJobHistory(req, res) {
    try {
      const result = await NotificationService.getJobHistory(req.query);

      logger.info('Histórico de jobs obtido com sucesso');

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao obter histórico de jobs', {
        error: error.message
      });

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém estatísticas de jobs de notificação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas de jobs.
   * @example
   * // GET /notifications/job-stats
   * // Retorno: { "success": true, "data": { totalJobs: 150, successfulJobs: 145, ... } }
   */
  async getJobStats(req, res) {
    try {
      const result = await NotificationService.getJobStats();

      logger.info('Estatísticas de jobs obtidas com sucesso');

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao obter estatísticas de jobs', {
        error: error.message
      });

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Reprocessa notificações (para casos de erro).
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resultado da operação.
   * @example
   * // POST /notifications/reprocess
   * // Retorno: { "success": true, "data": { message: "Notificações reprocessadas com sucesso", ... } }
   */
  async reprocessNotifications(req, res) {
    try {
      const userId = req.userId || null;
      const result = await NotificationService.reprocessNotifications(userId);

      logger.info('Notificações reprocessadas com sucesso', {
        user_id: userId,
        result
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao reprocessar notificações', {
        error: error.message,
        user_id: req.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new NotificationController();