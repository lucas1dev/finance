const { User, Notification, UserSession, UserSetting } = require('../models');
const { Op } = require('sequelize');

const settingsController = {
  /**
   * Obtém as configurações do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Configurações do usuário em formato JSON.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // GET /api/settings
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { notifications: {...}, preferences: {...}, timezone: "America/Sao_Paulo", ... }
   */
  getSettings: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
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
        return res.status(404).json({ error: 'Usuário não encontrado' });
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

      res.json({
        notifications: notificationSettings,
        preferences,
        timezone: user.timezone || 'America/Sao_Paulo',
        language: user.language || 'pt-BR',
        email_verified: user.email_verified,
        two_factor_enabled: user.two_factor_enabled
      });
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
  },

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
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // PUT /api/settings
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "notifications": { "email": false }, "preferences": { "theme": "dark" } }
   * // Retorno: { "message": "Configurações atualizadas com sucesso" }
   */
  updateSettings: async (req, res) => {
    try {
      const { notifications, preferences, timezone, language } = req.body;
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

      await User.update(updateData, {
        where: { id: req.user.id }
      });

      res.json({ 
        message: 'Configurações atualizadas com sucesso',
        updated: Object.keys(updateData)
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
  },

  /**
   * Obtém as sessões ativas do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.page - Página atual (opcional).
   * @param {string} req.query.limit - Limite por página (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de sessões em formato JSON.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // GET /api/settings/sessions?page=1&limit=10
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { sessions: [...], total: 5 }
   */
  getSessions: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      // Simular sessões para demonstração
      const sessions = [
        {
          id: 'current',
          device: 'Web Browser',
          browser: 'Chrome',
          ip: '192.168.1.1',
          location: 'São Paulo, BR',
          last_activity: new Date().toISOString(),
          is_current: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'session123',
          device: 'Mobile',
          browser: 'Safari',
          ip: '192.168.1.2',
          location: 'Rio de Janeiro, BR',
          last_activity: new Date(Date.now() - 3600000).toISOString(),
          is_current: false,
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ];

      res.json({
        sessions,
        total: sessions.length,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      res.status(500).json({ error: 'Erro ao buscar sessões' });
    }
  },

  /**
   * Obtém as sessões ativas do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de sessões em formato JSON.
   * @throws {Error} Se houver erro no banco de dados.
   */
  getActiveSessions: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'name', 'email', 'last_login', 'last_login_ip']
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const sessions = await UserSession.findAll({
        where: {
          user_id: req.user.id,
          active: true
        },
        order: [['created_at', 'DESC']]
      });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          last_login: user.last_login,
          last_login_ip: user.last_login_ip
        },
        sessions: sessions.map(session => ({
          id: session.id,
          device: session.device,
          browser: session.browser,
          ip: session.ip,
          location: session.location,
          last_activity: session.last_activity,
          created_at: session.created_at,
          is_current: session.id === req.sessionID
        }))
      });
    } catch (error) {
      console.error('Erro ao buscar sessões ativas:', error);
      res.status(500).json({ error: 'Erro ao buscar sessões ativas' });
    }
  },

  /**
   * Obtém as configurações de notificação do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Configurações de notificação em formato JSON.
   * @throws {Error} Se houver erro no banco de dados.
   */
  getNotificationSettings: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'name', 'email', 'two_factor_enabled']
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const userSettings = await UserSetting.findOne({
        where: { user_id: req.user.id }
      });

      const defaultSettings = {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        account_alerts: true,
        payment_reminders: true,
        security_alerts: true,
        marketing_emails: false,
        weekly_reports: true,
        monthly_reports: true
      };

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          two_factor_enabled: user.two_factor_enabled
        },
        settings: userSettings ? {
          ...defaultSettings,
          ...userSettings.toJSON()
        } : defaultSettings
      });
    } catch (error) {
      console.error('Erro ao buscar configurações de notificação:', error);
      res.status(500).json({ error: 'Erro ao buscar configurações de notificação' });
    }
  },

  /**
   * Atualiza as configurações de notificação do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.body - Dados das configurações.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se houver erro no banco de dados.
   */
  updateNotificationSettings: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const settings = req.body;

      // Validação básica
      const validSettings = [
        'email_notifications', 'push_notifications', 'sms_notifications',
        'account_alerts', 'payment_reminders', 'security_alerts',
        'marketing_emails', 'weekly_reports', 'monthly_reports'
      ];

      const invalidSettings = Object.keys(settings).filter(key => !validSettings.includes(key));
      if (invalidSettings.length > 0) {
        return res.status(400).json({ 
          error: 'Configurações inválidas',
          invalid: invalidSettings
        });
      }

      const [userSettings, created] = await UserSetting.findOrCreate({
        where: { user_id: req.user.id },
        defaults: { user_id: req.user.id }
      });

      await userSettings.update(settings);

      res.json({
        message: 'Configurações de notificação atualizadas com sucesso',
        settings: userSettings.toJSON()
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações de notificação:', error);
      res.status(500).json({ error: 'Erro ao atualizar configurações de notificação' });
    }
  },

  /**
   * Exclui uma sessão específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID da sessão.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // DELETE /api/settings/sessions/session123
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "message": "Sessão encerrada com sucesso" }
   */
  deleteSession: async (req, res) => {
    try {
      const { id } = req.params;

      if (id === 'current') {
        return res.status(400).json({ error: 'Não é possível encerrar a sessão atual' });
      }

      // Simular exclusão de sessão
      res.json({ message: 'Sessão encerrada com sucesso' });
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      res.status(500).json({ error: 'Erro ao encerrar sessão' });
    }
  },

  /**
   * Encerra uma sessão específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.sessionId - ID da sessão.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se houver erro no banco de dados.
   */
  endSession: async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId || isNaN(parseInt(sessionId))) {
        return res.status(400).json({ error: 'ID da sessão inválido' });
      }

      const session = await UserSession.findOne({
        where: {
          id: parseInt(sessionId),
          user_id: req.user.id
        }
      });

      if (!session) {
        return res.status(404).json({ error: 'Sessão não encontrada' });
      }

      if (session.id === req.sessionID) {
        return res.status(400).json({ error: 'Não é possível encerrar a sessão atual' });
      }

      await session.update({ active: false });

      res.json({ message: 'Sessão encerrada com sucesso' });
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      res.status(500).json({ error: 'Erro ao encerrar sessão' });
    }
  },

  /**
   * Encerra todas as sessões do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se houver erro no banco de dados.
   */
  endAllSessions: async (req, res) => {
    try {
      await UserSession.update(
        { active: false },
        {
          where: {
            user_id: req.user.id,
            id: { [Op.ne]: req.sessionID } // Não encerra a sessão atual
          }
        }
      );

      res.json({ message: 'Todas as sessões foram encerradas com sucesso' });
    } catch (error) {
      console.error('Erro ao encerrar todas as sessões:', error);
      res.status(500).json({ error: 'Erro ao encerrar todas as sessões' });
    }
  },

  /**
   * Obtém estatísticas das configurações do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas em formato JSON.
   * @throws {Error} Se houver erro no banco de dados.
   */
  getSettingsStats: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'two_factor_enabled', 'last_login', 'created_at', 'updated_at']
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const userSettings = await UserSetting.findOne({
        where: { user_id: req.user.id }
      });

      const activeSessions = await UserSession.count({
        where: {
          user_id: req.user.id,
          active: true
        }
      });

      const stats = {
        user: {
          id: user.id,
          two_factor_enabled: user.two_factor_enabled,
          last_login: user.last_login,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        sessions: {
          active: activeSessions
        },
        notifications: userSettings ? {
          email_enabled: userSettings.email_notifications,
          push_enabled: userSettings.push_notifications,
          sms_enabled: userSettings.sms_notifications,
          alerts_enabled: userSettings.account_alerts,
          reminders_enabled: userSettings.payment_reminders,
          security_enabled: userSettings.security_alerts,
          marketing_enabled: userSettings.marketing_emails,
          reports_enabled: userSettings.weekly_reports || userSettings.monthly_reports
        } : {
          email_enabled: true,
          push_enabled: true,
          sms_enabled: false,
          alerts_enabled: true,
          reminders_enabled: true,
          security_enabled: true,
          marketing_enabled: false,
          reports_enabled: true
        }
      };

      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas das configurações:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas das configurações' });
    }
  },

  /**
   * Obtém as notificações do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.page - Página atual (opcional).
   * @param {string} req.query.limit - Limite por página (opcional).
   * @param {string} req.query.read - Filtro por status de leitura (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de notificações em formato JSON.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // GET /api/settings/notifications?page=1&limit=10&read=false
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { notifications: [...], pagination: {...} }
   */
  getNotifications: async (req, res) => {
    try {
      const { page = 1, limit = 10, read } = req.query;
      const offset = (page - 1) * limit;

      const where = { user_id: req.user.id };
      if (read !== undefined) {
        where.is_read = read === 'true';
      }

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: totalPages
        }
      });
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
  },

  /**
   * Marca uma notificação como lida.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID da notificação.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // PUT /api/settings/notifications/1/read
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "message": "Notificação marcada como lida" }
   */
  markNotificationAsRead: async (req, res) => {
    try {
      const { id } = req.params;

      const notification = await Notification.findOne({
        where: { 
          id: parseInt(id), 
          user_id: req.user.id 
        }
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notificação não encontrada' });
      }

      await notification.update({ 
        is_read: true,
        read_at: new Date()
      });

      res.json({ 
        message: 'Notificação marcada como lida',
        notificationId: parseInt(id)
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
    }
  },

  /**
   * Exclui uma notificação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID da notificação.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // DELETE /api/settings/notifications/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "message": "Notificação excluída com sucesso" }
   */
  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params;

      const notification = await Notification.findOne({
        where: { 
          id: parseInt(id), 
          user_id: req.user.id 
        }
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notificação não encontrada' });
      }

      await notification.destroy();

      res.json({ 
        message: 'Notificação excluída com sucesso',
        notificationId: parseInt(id)
      });
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      res.status(500).json({ error: 'Erro ao excluir notificação' });
    }
  }
};

module.exports = settingsController; 