const { User, Notification, UserSession, UserSetting } = require('../models');
const { Op } = require('sequelize');
const SettingsService = require('../services/settingsService');
const { logger } = require('../utils/logger');

/**
 * Controller para gerenciamento de configurações do usuário
 * Implementa configurações de notificação, preferências e sessões
 */
class SettingsController {
  /**
   * Obtém as configurações do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Configurações do usuário em formato JSON.
   * @example
   * // GET /api/settings
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "success": true, "data": { notifications: {...}, preferences: {...}, timezone: "America/Sao_Paulo", ... } }
   */
  async getSettings(req, res) {
    try {
      const result = await SettingsService.getUserSettings(req.user.id);

      logger.info('Configurações do usuário obtidas com sucesso', {
        user_id: req.user.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao buscar configurações do usuário', {
        error: error.message,
        user_id: req.user.id
      });

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar configurações'
      });
    }
  }

  /**
   * Atualiza as configurações do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.body - Dados para atualização.
   * @param {Object} req.body.notifications - Configurações de notificação (opcional).
   * @param {Object} req.body.preferences - Preferências gerais (opcional).
   * @param {string} req.body.timezone - Fuso horário (opcional).
   * @param {string} req.body.language - Idioma (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @example
   * // PUT /api/settings
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "notifications": { "email": false }, "preferences": { "theme": "dark" } }
   * // Retorno: { "success": true, "data": { "message": "Configurações atualizadas com sucesso", "updated": [...] } }
   */
  async updateSettings(req, res) {
    try {
      const result = await SettingsService.updateUserSettings(req.user.id, req.body);

      logger.info('Configurações do usuário atualizadas com sucesso', {
        user_id: req.user.id,
        updated_fields: result.updated
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao atualizar configurações do usuário', {
        error: error.message,
        user_id: req.user.id,
        settings_data: req.body
      });

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar configurações'
      });
    }
  }

  /**
   * Obtém as sessões ativas do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.page - Página atual (opcional).
   * @param {string} req.query.limit - Limite por página (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de sessões em formato JSON.
   * @example
   * // GET /api/settings/sessions?page=1&limit=10
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "success": true, "data": { sessions: [...], total: 5, page: 1, limit: 10 } }
   */
  async getSessions(req, res) {
    try {
      const result = await SettingsService.getUserSessions(req.user.id, req.query);

      logger.info('Sessões do usuário obtidas com sucesso', {
        user_id: req.user.id,
        total_sessions: result.total
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao buscar sessões do usuário', {
        error: error.message,
        user_id: req.user.id
      });

      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar sessões'
      });
    }
  }

  /**
   * Obtém as sessões ativas do usuário (método alternativo).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de sessões ativas em formato JSON.
   * @example
   * // GET /api/settings/active-sessions
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "success": true, "data": { user: {...}, sessions: [...] } }
   */
  async getActiveSessions(req, res) {
    try {
      const result = await SettingsService.getActiveSessions(req.user.id);

      logger.info('Sessões ativas do usuário obtidas com sucesso', {
        user_id: req.user.id,
        active_sessions: result.sessions.length
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao buscar sessões ativas do usuário', {
        error: error.message,
        user_id: req.user.id
      });

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar sessões ativas'
      });
    }
  }

  /**
   * Revoga uma sessão específica do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.sessionId - ID da sessão.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @example
   * // DELETE /api/settings/sessions/:sessionId
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "success": true, "data": { "message": "Sessão revogada com sucesso" } }
   */
  async revokeSession(req, res) {
    try {
      const result = await SettingsService.revokeSession(req.user.id, req.params.sessionId);

      logger.info('Sessão do usuário revogada com sucesso', {
        user_id: req.user.id,
        session_id: req.params.sessionId
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao revogar sessão do usuário', {
        error: error.message,
        user_id: req.user.id,
        session_id: req.params.sessionId
      });

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao revogar sessão'
      });
    }
  }

  /**
   * Revoga todas as sessões do usuário exceto a atual.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @example
   * // DELETE /api/settings/sessions
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "success": true, "data": { "message": "Todas as sessões foram revogadas com sucesso", "revoked_count": 3 } }
   */
  async revokeAllSessions(req, res) {
    try {
      const currentToken = req.headers.authorization?.replace('Bearer ', '');
      const result = await SettingsService.revokeAllSessions(req.user.id, currentToken);

      logger.info('Todas as sessões do usuário revogadas com sucesso', {
        user_id: req.user.id,
        revoked_sessions: result.revoked_count
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao revogar todas as sessões do usuário', {
        error: error.message,
        user_id: req.user.id
      });

      return res.status(500).json({
        success: false,
        error: 'Erro ao revogar sessões'
      });
    }
  }

  /**
   * Obtém estatísticas de segurança do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas de segurança em formato JSON.
   * @example
   * // GET /api/settings/security-stats
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "success": true, "data": { email_verified: true, two_factor_enabled: false, active_sessions: 2, ... } }
   */
  async getSecurityStats(req, res) {
    try {
      const result = await SettingsService.getSecurityStats(req.user.id);

      logger.info('Estatísticas de segurança do usuário obtidas com sucesso', {
        user_id: req.user.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas de segurança do usuário', {
        error: error.message,
        user_id: req.user.id
      });

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatísticas de segurança'
      });
    }
  }
}

module.exports = new SettingsController(); 