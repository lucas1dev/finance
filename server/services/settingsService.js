/**
 * Service para gerenciamento de configurações do usuário
 * Implementa configurações de notificação, preferências e sessões
 */
const { User, UserSession, UserSetting } = require('../models');
const { Op } = require('sequelize');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { logger } = require('../utils/logger');

/**
 * Service responsável por gerenciar configurações do usuário.
 */
class SettingsService {
  /**
   * Obtém as configurações do usuário.
   * @param {number} userId - ID do usuário.
   * @returns {Promise<Object>} Configurações do usuário.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   */
  async getUserSettings(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: [
          'notification_settings', 
          'preferences', 
          'timezone', 
          'language', 
          'email_verified',
          'two_factor_enabled'
        ]
      });

      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      // Parse JSON strings para objetos
      const notificationSettings = user.notification_settings 
        ? JSON.parse(user.notification_settings) 
        : {
            email: true,
            push: true,
            sms: false,
            account_alerts: true,
            payment_reminders: true,
            security_alerts: true,
            marketing: false
          };

      const preferences = user.preferences 
        ? JSON.parse(user.preferences) 
        : {
            theme: 'light',
            currency: 'BRL',
            date_format: 'DD/MM/YYYY',
            decimal_places: 2,
            auto_backup: true
          };

      logger.info('Configurações do usuário obtidas com sucesso', {
        user_id: userId
      });

      return {
        notifications: notificationSettings,
        preferences,
        timezone: user.timezone || 'America/Sao_Paulo',
        language: user.language || 'pt-BR',
        email_verified: user.email_verified,
        two_factor_enabled: user.two_factor_enabled
      };
    } catch (error) {
      logger.error('Erro ao buscar configurações do usuário', {
        error: error.message,
        user_id: userId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao buscar configurações');
    }
  }

  /**
   * Atualiza as configurações do usuário.
   * @param {number} userId - ID do usuário.
   * @param {Object} settingsData - Dados das configurações.
   * @param {Object} settingsData.notifications - Configurações de notificação (opcional).
   * @param {Object} settingsData.preferences - Preferências gerais (opcional).
   * @param {string} settingsData.timezone - Fuso horário (opcional).
   * @param {string} settingsData.language - Idioma (opcional).
   * @returns {Promise<Object>} Configurações atualizadas.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   * @throws {ValidationError} Se os dados forem inválidos.
   */
  async updateUserSettings(userId, settingsData) {
    try {
      const { notifications, preferences, timezone, language } = settingsData;
      const updateData = {};

      if (notifications) {
        updateData.notification_settings = JSON.stringify(notifications);
      }

      if (preferences) {
        updateData.preferences = JSON.stringify(preferences);
      }

      if (timezone) {
        updateData.timezone = timezone;
      }

      if (language) {
        updateData.language = language;
      }

      const [updatedRows] = await User.update(updateData, {
        where: { id: userId }
      });

      if (updatedRows === 0) {
        throw new NotFoundError('Usuário não encontrado');
      }

      logger.info('Configurações do usuário atualizadas com sucesso', {
        user_id: userId,
        updated_fields: Object.keys(updateData)
      });

      return {
        message: 'Configurações atualizadas com sucesso',
        updated: Object.keys(updateData)
      };
    } catch (error) {
      logger.error('Erro ao atualizar configurações do usuário', {
        error: error.message,
        user_id: userId,
        settings_data: settingsData
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao atualizar configurações');
    }
  }

  /**
   * Obtém as sessões ativas do usuário.
   * @param {number} userId - ID do usuário.
   * @param {Object} query - Parâmetros de consulta.
   * @param {number} query.page - Página atual (opcional).
   * @param {number} query.limit - Limite por página (opcional).
   * @returns {Promise<Object>} Lista de sessões com paginação.
   */
  async getUserSessions(userId, query = {}) {
    try {
      const { page = 1, limit = 10 } = query;
      const offset = (page - 1) * limit;

      const { count, rows: sessions } = await UserSession.findAndCountAll({
        where: {
          user_id: userId,
          expires_at: { [Op.gt]: new Date() }
        },
        attributes: [
          'id',
          'token',
          'created_at',
          'expires_at',
          'user_agent',
          'ip_address'
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Enriquecer dados das sessões
      const enrichedSessions = sessions.map(session => ({
        id: session.id,
        device: this._extractDeviceInfo(session.user_agent),
        browser: this._extractBrowserInfo(session.user_agent),
        ip: session.ip_address,
        location: 'Localização não disponível', // Implementar geolocalização se necessário
        last_activity: session.created_at,
        is_current: false, // Será determinado pelo controller
        created_at: session.created_at,
        expires_at: session.expires_at
      }));

      logger.info('Sessões do usuário obtidas com sucesso', {
        user_id: userId,
        total_sessions: count
      });

      return {
        sessions: enrichedSessions,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      };
    } catch (error) {
      logger.error('Erro ao buscar sessões do usuário', {
        error: error.message,
        user_id: userId
      });

      throw new Error('Erro ao buscar sessões');
    }
  }

  /**
   * Obtém as sessões ativas do usuário (método alternativo).
   * @param {number} userId - ID do usuário.
   * @returns {Promise<Object>} Lista de sessões ativas.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   */
  async getActiveSessions(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'last_login', 'last_login_ip']
      });

      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      const sessions = await UserSession.findAll({
        where: {
          user_id: userId,
          expires_at: { [Op.gt]: new Date() }
        },
        attributes: [
          'id',
          'token',
          'created_at',
          'expires_at',
          'user_agent',
          'ip_address'
        ],
        order: [['created_at', 'DESC']]
      });

      logger.info('Sessões ativas do usuário obtidas com sucesso', {
        user_id: userId,
        active_sessions: sessions.length
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          last_login: user.last_login,
          last_login_ip: user.last_login_ip
        },
        sessions: sessions.map(session => ({
          id: session.id,
          device: this._extractDeviceInfo(session.user_agent),
          browser: this._extractBrowserInfo(session.user_agent),
          ip: session.ip_address,
          location: 'Localização não disponível',
          last_activity: session.created_at,
          created_at: session.created_at,
          expires_at: session.expires_at
        }))
      };
    } catch (error) {
      logger.error('Erro ao buscar sessões ativas do usuário', {
        error: error.message,
        user_id: userId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao buscar sessões ativas');
    }
  }

  /**
   * Revoga uma sessão específica do usuário.
   * @param {number} userId - ID do usuário.
   * @param {string} sessionId - ID da sessão.
   * @returns {Promise<Object>} Mensagem de sucesso.
   * @throws {NotFoundError} Se a sessão não for encontrada.
   */
  async revokeSession(userId, sessionId) {
    try {
      const deletedRows = await UserSession.destroy({
        where: {
          id: sessionId,
          user_id: userId
        }
      });

      if (deletedRows === 0) {
        throw new NotFoundError('Sessão não encontrada');
      }

      logger.info('Sessão do usuário revogada com sucesso', {
        user_id: userId,
        session_id: sessionId
      });

      return { message: 'Sessão revogada com sucesso' };
    } catch (error) {
      logger.error('Erro ao revogar sessão do usuário', {
        error: error.message,
        user_id: userId,
        session_id: sessionId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao revogar sessão');
    }
  }

  /**
   * Revoga todas as sessões do usuário exceto a atual.
   * @param {number} userId - ID do usuário.
   * @param {string} currentToken - Token da sessão atual.
   * @returns {Promise<Object>} Mensagem de sucesso.
   */
  async revokeAllSessions(userId, currentToken) {
    try {
      const deletedRows = await UserSession.destroy({
        where: {
          user_id: userId,
          token: { [Op.ne]: currentToken }
        }
      });

      logger.info('Todas as sessões do usuário revogadas com sucesso', {
        user_id: userId,
        revoked_sessions: deletedRows
      });

      return { 
        message: 'Todas as sessões foram revogadas com sucesso',
        revoked_count: deletedRows
      };
    } catch (error) {
      logger.error('Erro ao revogar todas as sessões do usuário', {
        error: error.message,
        user_id: userId
      });

      throw new Error('Erro ao revogar sessões');
    }
  }

  /**
   * Obtém estatísticas de segurança do usuário.
   * @param {number} userId - ID do usuário.
   * @returns {Promise<Object>} Estatísticas de segurança.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   */
  async getSecurityStats(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: [
          'id',
          'email_verified',
          'two_factor_enabled',
          'last_login',
          'created_at'
        ]
      });

      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      const activeSessions = await UserSession.count({
        where: {
          user_id: userId,
          expires_at: { [Op.gt]: new Date() }
        }
      });

      const totalSessions = await UserSession.count({
        where: { user_id: userId }
      });

      logger.info('Estatísticas de segurança do usuário obtidas com sucesso', {
        user_id: userId
      });

      return {
        email_verified: user.email_verified,
        two_factor_enabled: user.two_factor_enabled,
        active_sessions: activeSessions,
        total_sessions: totalSessions,
        account_age_days: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)),
        last_login: user.last_login
      };
    } catch (error) {
      logger.error('Erro ao buscar estatísticas de segurança do usuário', {
        error: error.message,
        user_id: userId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao buscar estatísticas de segurança');
    }
  }

  /**
   * Extrai informações do dispositivo a partir do User-Agent.
   * @param {string} userAgent - String do User-Agent.
   * @returns {string} Informações do dispositivo.
   * @private
   */
  _extractDeviceInfo(userAgent) {
    if (!userAgent) return 'Desconhecido';

    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Desktop (Windows)';
    if (userAgent.includes('Mac')) return 'Desktop (Mac)';
    if (userAgent.includes('Linux')) return 'Desktop (Linux)';

    return 'Desktop';
  }

  /**
   * Extrai informações do navegador a partir do User-Agent.
   * @param {string} userAgent - String do User-Agent.
   * @returns {string} Informações do navegador.
   * @private
   */
  _extractBrowserInfo(userAgent) {
    if (!userAgent) return 'Desconhecido';

    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';

    return 'Desconhecido';
  }
}

module.exports = new SettingsService(); 