/**
 * Testes unitários para o SettingsController
 * @module tests/controllers/settingsController.test.js
 */

const { ValidationError, NotFoundError } = require('../../utils/errors');

// Mock dos modelos
jest.mock('../../models', () => ({
  User: {
    findByPk: jest.fn(),
    update: jest.fn()
  },
  UserSession: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    update: jest.fn()
  },
  UserSetting: {
    findOne: jest.fn(),
    findOrCreate: jest.fn()
  }
}));

// Mock das funções de resposta
const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
};

const mockReq = {
  userId: '123',
  params: {},
  body: {}
};

let settingsController;
let User, UserSession, UserSetting;

describe('SettingsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    settingsController = require('../../controllers/settingsController');
    ({ User, UserSession, UserSetting } = require('../../models'));
    mockReq.userId = '123';
    mockReq.params = {};
    mockReq.body = {};
  });

  describe('getActiveSessions', () => {
    it('should return active sessions successfully', async () => {
      const mockUser = {
        id: 123,
        name: 'Test User',
        email: 'test@example.com',
        last_login: new Date(),
        last_login_ip: '192.168.1.1'
      };

      const mockSessions = [
        {
          id: 1,
          device_type: 'desktop',
          device_name: 'MacBook Pro',
          browser: 'Chrome',
          os: 'macOS',
          user_agent: 'Mozilla/5.0...',
          ip_address: '192.168.1.1',
          location: 'São Paulo, Brasil',
          current: true,
          last_activity: new Date()
        }
      ];

      User.findByPk.mockResolvedValue(mockUser);
      UserSession.findAll.mockResolvedValue(mockSessions);

      await settingsController.getActiveSessions(mockReq, mockRes);

      expect(User.findByPk).toHaveBeenCalledWith('123', {
        attributes: ['id', 'name', 'email', 'last_login', 'last_login_ip']
      });
      expect(UserSession.findAll).toHaveBeenCalledWith({
        where: {
          user_id: '123',
          active: true
        },
        order: [['last_activity', 'DESC']],
        attributes: [
          'id', 'device_type', 'device_name', 'browser', 'os', 'user_agent',
          'ip_address', 'location', 'latitude', 'longitude', 'current',
          'last_activity', 'created_at'
        ]
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            sessions: expect.arrayContaining([
              expect.objectContaining({
                id: 1,
                device: 'Chrome - macOS',
                current: true
              })
            ])
          })
        })
      );
    });

    it('should return 404 when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await settingsController.getActiveSessions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Usuário não encontrado'
        })
      );
    });

    it('should handle database error', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      await settingsController.getActiveSessions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Erro interno do servidor'
        })
      );
    });
  });

  describe('getNotificationSettings', () => {
    it('should return notification settings successfully', async () => {
      const mockUser = {
        id: 123,
        name: 'Test User',
        email: 'test@example.com',
        two_factor_enabled: true
      };

      const mockUserSettings = {
        id: 1,
        user_id: 123,
        category: 'notifications',
        settings: JSON.stringify({
          emailNotifications: false,
          pushNotifications: true
        })
      };

      User.findByPk.mockResolvedValue(mockUser);
      UserSetting.findOne.mockResolvedValue(mockUserSettings);

      await settingsController.getNotificationSettings(mockReq, mockRes);

      expect(User.findByPk).toHaveBeenCalledWith('123', {
        attributes: ['id', 'name', 'email', 'two_factor_enabled']
      });
      expect(UserSetting.findOne).toHaveBeenCalledWith({
        where: {
          user_id: '123',
          category: 'notifications'
        }
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            emailNotifications: false,
            pushNotifications: true,
            smsNotifications: false,
            transactionAlerts: true
          })
        })
      );
    });

    it('should return default settings when user has no saved settings', async () => {
      const mockUser = {
        id: 123,
        name: 'Test User',
        email: 'test@example.com',
        two_factor_enabled: false
      };

      User.findByPk.mockResolvedValue(mockUser);
      UserSetting.findOne.mockResolvedValue(null);

      await settingsController.getNotificationSettings(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false
          })
        })
      );
    });

    it('should return 404 when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await settingsController.getNotificationSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Usuário não encontrado'
        })
      );
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update notification settings successfully', async () => {
      const mockUser = {
        id: 123,
        update: jest.fn().mockResolvedValue(true)
      };

      const mockUserSettings = {
        id: 1,
        settings: '{}',
        version: 1,
        save: jest.fn().mockResolvedValue(true)
      };

      const settings = {
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: true,
        transactionAlerts: true,
        paymentReminders: false,
        securityAlerts: true,
        marketingEmails: false
      };

      mockReq.body = settings;
      User.findByPk.mockResolvedValue(mockUser);
      UserSetting.findOrCreate.mockResolvedValue([mockUserSettings, false]);

      await settingsController.updateNotificationSettings(mockReq, mockRes);

      expect(User.findByPk).toHaveBeenCalledWith('123');
      expect(UserSetting.findOrCreate).toHaveBeenCalledWith({
        where: {
          user_id: '123',
          category: 'notifications'
        },
        defaults: {
          settings: JSON.stringify(settings),
          version: 1
        }
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: settings
        })
      );
    });

    it('should return 400 for invalid settings', async () => {
      const invalidSettings = {
        emailNotifications: 'invalid', // Should be boolean
        pushNotifications: false
      };

      mockReq.body = invalidSettings;

      await settingsController.updateNotificationSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('deve ser um valor booleano')
        })
      );
    });

    it('should return 404 when user not found', async () => {
      const settings = {
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: true,
        transactionAlerts: true,
        paymentReminders: false,
        securityAlerts: true,
        marketingEmails: false
      };

      mockReq.body = settings;
      User.findByPk.mockResolvedValue(null);

      await settingsController.updateNotificationSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Usuário não encontrado'
        })
      );
    });
  });

  describe('endSession', () => {
    it('should end session successfully', async () => {
      const mockSession = {
        id: 2,
        user_id: 123,
        active: true,
        current: false,
        save: jest.fn().mockResolvedValue(true)
      };

      mockReq.params.sessionId = '2';
      UserSession.findOne.mockResolvedValue(mockSession);

      await settingsController.endSession(mockReq, mockRes);

      expect(UserSession.findOne).toHaveBeenCalledWith({
        where: {
          id: 2,
          user_id: '123',
          active: true
        }
      });
      expect(mockSession.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Sessão encerrada com sucesso'
        })
      );
    });

    it('should return 400 for invalid session ID', async () => {
      mockReq.params.sessionId = 'invalid';

      await settingsController.endSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'ID da sessão inválido'
        })
      );
    });

    it('should return 400 when trying to end current session', async () => {
      const mockSession = {
        id: 1,
        user_id: 123,
        active: true,
        current: true
      };

      mockReq.params.sessionId = '1';
      UserSession.findOne.mockResolvedValue(mockSession);

      await settingsController.endSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Não é possível encerrar a sessão atual'
        })
      );
    });

    it('should return 404 when session not found', async () => {
      mockReq.params.sessionId = '999';
      UserSession.findOne.mockResolvedValue(null);

      await settingsController.endSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Sessão não encontrada'
        })
      );
    });
  });

  describe('endAllSessions', () => {
    it('should end all sessions successfully', async () => {
      UserSession.update.mockResolvedValue([1]);

      await settingsController.endAllSessions(mockReq, mockRes);

      expect(UserSession.update).toHaveBeenCalledWith(
        { active: false },
        {
          where: {
            user_id: '123',
            active: true,
            current: false
          }
        }
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Todas as sessões foram encerradas com sucesso'
        })
      );
    });

    it('should handle error', async () => {
      UserSession.update.mockRejectedValue(new Error('Database error'));

      await settingsController.endAllSessions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Erro interno do servidor'
        })
      );
    });
  });

  describe('getSettingsStats', () => {
    it('should return settings stats successfully', async () => {
      const mockUser = {
        id: 123,
        two_factor_enabled: true,
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockUserSettings = {
        id: 1,
        settings: JSON.stringify({
          emailNotifications: true,
          pushNotifications: false,
          smsNotifications: true
        }),
        updated_at: new Date()
      };

      User.findByPk.mockResolvedValue(mockUser);
      UserSession.count.mockResolvedValue(3);
      UserSetting.findOne.mockResolvedValue(mockUserSettings);

      await settingsController.getSettingsStats(mockReq, mockRes);

      expect(User.findByPk).toHaveBeenCalledWith('123', {
        attributes: ['id', 'two_factor_enabled', 'last_login', 'created_at', 'updated_at']
      });
      expect(UserSession.count).toHaveBeenCalledWith({
        where: {
          user_id: '123',
          active: true
        }
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            activeSessions: 3,
            enabledNotifications: 2,
            totalNotifications: 3,
            securityLevel: 'high',
            twoFactorEnabled: true
          })
        })
      );
    });

    it('should return 404 when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await settingsController.getSettingsStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Usuário não encontrado'
        })
      );
    });

    it('should handle user with no notification settings', async () => {
      const mockUser = {
        id: 123,
        two_factor_enabled: false,
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      User.findByPk.mockResolvedValue(mockUser);
      UserSession.count.mockResolvedValue(1);
      UserSetting.findOne.mockResolvedValue(null);

      await settingsController.getSettingsStats(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            activeSessions: 1,
            enabledNotifications: 8,
            totalNotifications: 11,
            twoFactorEnabled: false
          })
        })
      );
    });
  });
}); 