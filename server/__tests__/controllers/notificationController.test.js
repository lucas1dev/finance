/**
 * Testes unitários para o controlador de notificações.
 * @author Lucas Santos
 *
 * @fileoverview
 * Testa as funções do notificationController, cobrindo casos de sucesso, erro e borda.
 *
 * @example
 * // Para rodar os testes:
 * // npm test __tests__/controllers/notificationController.test.js
 */

const request = require('supertest');
const app = require('../../app');
const { User, Notification, Financing, FinancingPayment } = require('../../models');
const { createTestUser, createAdminUser } = require('../integration/factories');

describe('NotificationController', () => {
  let notificationController;
  let mockModels, mockErrors, mockResponse, mockOp;
  let user, admin, userToken, adminToken;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock dos operadores do Sequelize
    mockOp = {
      gte: Symbol('gte'),
      lte: Symbol('lte')
    };

    // Mocks dos modelos
    mockModels = {
      Notification: {
        findAndCountAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        findAll: jest.fn(),
        sequelize: {
          fn: jest.fn()
        }
      },
      User: {
        findOne: jest.fn()
      },
      Financing: {
        findOne: jest.fn()
      },
      FinancingPayment: {
        findAll: jest.fn()
      },
      Creditor: {
        findOne: jest.fn()
      },
      JobExecution: {
        findAndCountAll: jest.fn(),
        findAll: jest.fn()
      }
    };

    // Mocks dos erros
    mockErrors = {
      ValidationError: class ValidationError extends Error {
        constructor(message) {
          super(message);
          this.name = 'ValidationError';
        }
      },
      NotFoundError: class NotFoundError extends Error {
        constructor(message) {
          super(message);
          this.name = 'NotFoundError';
        }
      }
    };

    // Mocks das funções de resposta
    mockResponse = {
      successResponse: jest.fn(),
      errorResponse: jest.fn()
    };

    // Aplicar mocks
    jest.mock('../../models', () => mockModels);
    jest.mock('../../utils/errors', () => mockErrors);
    jest.mock('../../utils/response', () => mockResponse);
    jest.mock('sequelize', () => ({
      Op: mockOp
    }));

    // Importar controller
    notificationController = require('../../controllers/notificationController');
  });

  beforeAll(async () => {
    // Criar usuários de teste
    user = await createTestUser();
    admin = await createAdminUser();
    
    // Fazer login para obter tokens
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: 'password123'
      });
    userToken = userLogin.body.data.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: admin.email,
        password: 'password123'
      });
    adminToken = adminLogin.body.data.token;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await User.destroy({ where: { id: [user.id, admin.id] } });
  });

  describe('listNotifications', () => {
    it('deve listar notificações com paginação padrão', async () => {
      const req = { userId: 1, query: {} };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockNotifications = [
        { id: 1, title: 'Notificação 1', isRead: false },
        { id: 2, title: 'Notificação 2', isRead: true }
      ];

      mockModels.Notification.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockNotifications
      });

      await notificationController.listNotifications(req, res);

      expect(mockModels.Notification.findAndCountAll).toHaveBeenCalledWith({
        where: {
          userId: 1,
          isActive: true
        },
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: 20,
        offset: 0
      });
      expect(mockResponse.successResponse).toHaveBeenCalledWith(res, {
        notifications: mockNotifications,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 2,
          itemsPerPage: 20
        }
      });
    });

    it('deve filtrar notificações por tipo e prioridade', async () => {
      const req = { 
        userId: 1, 
        query: { 
          type: 'payment_due', 
          priority: 'high',
          page: 2,
          limit: 10
        } 
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockNotifications = [
        { id: 1, title: 'Pagamento vence', type: 'payment_due', priority: 'high' }
      ];

      mockModels.Notification.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockNotifications
      });

      await notificationController.listNotifications(req, res);

      expect(mockModels.Notification.findAndCountAll).toHaveBeenCalledWith({
        where: {
          userId: 1,
          isActive: true,
          type: 'payment_due',
          priority: 'high'
        },
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: 10,
        offset: 10
      });
    });

    it('deve filtrar notificações por status de leitura', async () => {
      const req = { userId: 1, query: { isRead: 'false' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockNotifications = [
        { id: 1, title: 'Não lida', isRead: false }
      ];

      mockModels.Notification.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockNotifications
      });

      await notificationController.listNotifications(req, res);

      expect(mockModels.Notification.findAndCountAll).toHaveBeenCalledWith({
        where: {
          userId: 1,
          isActive: true,
          isRead: false
        },
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: 20,
        offset: 0
      });
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { userId: 1, query: {} };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.Notification.findAndCountAll.mockRejectedValue(new Error('Erro de banco'));

      await notificationController.listNotifications(req, res);

      expect(mockResponse.errorResponse).toHaveBeenCalledWith(res, 'Erro interno do servidor', 500);
    });
  });

  describe('markAsRead', () => {
    it('deve marcar notificação como lida', async () => {
      const req = { userId: 1, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockNotification = {
        id: 1,
        title: 'Notificação Teste',
        isRead: false,
        update: jest.fn().mockResolvedValue(true)
      };

      mockModels.Notification.findOne.mockResolvedValue(mockNotification);

      await notificationController.markAsRead(req, res);

      expect(mockModels.Notification.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: 1,
          isActive: true
        }
      });
      expect(mockNotification.update).toHaveBeenCalledWith({ isRead: true });
      expect(mockResponse.successResponse).toHaveBeenCalledWith(res, { notification: mockNotification }, 'Notificação marcada como lida');
    });

    it('deve retornar erro quando notificação não é encontrada', async () => {
      const req = { userId: 1, params: { id: 999 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.Notification.findOne.mockResolvedValue(null);

      await notificationController.markAsRead(req, res);

      expect(mockResponse.errorResponse).toHaveBeenCalledWith(res, 'Notificação não encontrada', 404);
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { userId: 1, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.Notification.findOne.mockRejectedValue(new Error('Erro de banco'));

      await notificationController.markAsRead(req, res);

      expect(mockResponse.errorResponse).toHaveBeenCalledWith(res, 'Erro interno do servidor', 500);
    });
  });

  describe('markAllAsRead', () => {
    it('deve marcar todas as notificações como lidas', async () => {
      const req = { userId: 1 };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.Notification.update.mockResolvedValue([5]); // 5 notificações atualizadas

      await notificationController.markAllAsRead(req, res);

      expect(mockModels.Notification.update).toHaveBeenCalledWith(
        { isRead: true },
        {
          where: {
            userId: 1,
            isRead: false,
            isActive: true
          }
        }
      );
      expect(mockResponse.successResponse).toHaveBeenCalledWith(
        res,
        { updatedCount: 5 },
        'Todas as notificações foram marcadas como lidas'
      );
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { userId: 1 };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.Notification.update.mockRejectedValue(new Error('Erro de banco'));

      await notificationController.markAllAsRead(req, res);

      expect(mockResponse.errorResponse).toHaveBeenCalledWith(res, 'Erro interno do servidor', 500);
    });
  });

  describe('createNotification', () => {
    it('deve criar uma nova notificação com sucesso', async () => {
      const req = {
        userId: 1,
        body: {
          title: 'Lembrete de Pagamento',
          message: 'Não esqueça do pagamento',
          type: 'reminder',
          priority: 'high'
        }
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockNotification = {
        id: 1,
        title: 'Lembrete de Pagamento',
        message: 'Não esqueça do pagamento',
        type: 'reminder',
        priority: 'high'
      };

      mockModels.Notification.create.mockResolvedValue(mockNotification);

      await notificationController.createNotification(req, res);

      expect(mockModels.Notification.create).toHaveBeenCalledWith({
        userId: 1,
        title: 'Lembrete de Pagamento',
        message: 'Não esqueça do pagamento',
        type: 'reminder',
        relatedType: undefined,
        relatedId: undefined,
        dueDate: undefined,
        priority: 'high',
        scheduledFor: undefined
      });
      expect(mockResponse.successResponse).toHaveBeenCalledWith(res, { notification: mockNotification }, 'Notificação criada com sucesso', 201);
    });

    it('deve retornar erro para dados inválidos', async () => {
      const req = {
        userId: 1,
        body: {
          title: '', // Título vazio
          message: 'Teste',
          type: 'reminder'
        }
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await notificationController.createNotification(req, res);

      expect(mockResponse.errorResponse).toHaveBeenCalledWith(res, 'Título, mensagem e tipo são obrigatórios', 400);
    });

    it('deve usar prioridade padrão quando não fornecida', async () => {
      const req = {
        userId: 1,
        body: {
          title: 'Teste',
          message: 'Mensagem teste',
          type: 'reminder'
        }
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockNotification = {
        id: 1,
        title: 'Teste',
        priority: 'medium'
      };

      mockModels.Notification.create.mockResolvedValue(mockNotification);

      await notificationController.createNotification(req, res);

      expect(mockModels.Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'medium'
        })
      );
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = {
        userId: 1,
        body: {
          title: 'Teste',
          message: 'Mensagem teste',
          type: 'reminder'
        }
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.Notification.create.mockRejectedValue(new Error('Erro de banco'));

      await notificationController.createNotification(req, res);

      expect(mockResponse.errorResponse).toHaveBeenCalledWith(res, 'Erro interno do servidor', 500);
    });
  });

  describe('deleteNotification', () => {
    it('deve remover notificação (marcar como inativa)', async () => {
      const req = { userId: 1, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockNotification = {
        id: 1,
        title: 'Notificação Teste',
        isActive: true,
        update: jest.fn().mockResolvedValue(true)
      };

      mockModels.Notification.findOne.mockResolvedValue(mockNotification);

      await notificationController.deleteNotification(req, res);

      expect(mockModels.Notification.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: 1,
          isActive: true
        }
      });
      expect(mockNotification.update).toHaveBeenCalledWith({ isActive: false });
      expect(mockResponse.successResponse).toHaveBeenCalledWith(res, null, 'Notificação removida com sucesso');
    });

    it('deve retornar erro quando notificação não é encontrada', async () => {
      const req = { userId: 1, params: { id: 999 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.Notification.findOne.mockResolvedValue(null);

      await notificationController.deleteNotification(req, res);

      expect(mockResponse.errorResponse).toHaveBeenCalledWith(res, 'Notificação não encontrada', 404);
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { userId: 1, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.Notification.findOne.mockRejectedValue(new Error('Erro de banco'));

      await notificationController.deleteNotification(req, res);

      expect(mockResponse.errorResponse).toHaveBeenCalledWith(res, 'Erro interno do servidor', 500);
    });
  });

  describe('getNotificationStats', () => {
    it('deve retornar estatísticas das notificações', async () => {
      const req = { userId: 1 };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockByType = [
        { type: 'payment_due', dataValues: { count: '5' } },
        { type: 'reminder', dataValues: { count: '3' } }
      ];

      const mockByPriority = [
        { priority: 'high', dataValues: { count: '2' } },
        { priority: 'medium', dataValues: { count: '6' } }
      ];

      mockModels.Notification.count
        .mockResolvedValueOnce(8) // Total
        .mockResolvedValueOnce(3); // Não lidas

      mockModels.Notification.findAll
        .mockResolvedValueOnce(mockByType)
        .mockResolvedValueOnce(mockByPriority);

      await notificationController.getNotificationStats(req, res);

      expect(mockResponse.successResponse).toHaveBeenCalledWith(res, {
        total: 8,
        unread: 3,
        byType: {
          payment_due: 5,
          reminder: 3
        },
        byPriority: {
          high: 2,
          medium: 6
        }
      });
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { userId: 1 };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.Notification.count.mockRejectedValue(new Error('Erro de banco'));

      await notificationController.getNotificationStats(req, res);

      expect(mockResponse.errorResponse).toHaveBeenCalledWith(res, 'Erro interno do servidor', 500);
    });
  });

  describe('getJobHistory', () => {
    it('deve retornar histórico de execuções dos jobs', async () => {
      const req = { 
        query: { 
          jobName: 'payment_check',
          status: 'success',
          page: 1,
          limit: 10
        } 
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockExecutions = [
        { id: 1, jobName: 'payment_check', status: 'success', startedAt: new Date() }
      ];

      mockModels.JobExecution.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockExecutions
      });

      await notificationController.getJobHistory(req, res);

      expect(mockModels.JobExecution.findAndCountAll).toHaveBeenCalledWith({
        where: {
          jobName: 'payment_check',
          status: 'success'
        },
        order: [['startedAt', 'DESC']],
        limit: 10,
        offset: 0
      });
      expect(mockResponse.successResponse).toHaveBeenCalledWith(res, {
        executions: mockExecutions,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10
        }
      });
    });

    it('deve filtrar por período de datas', async () => {
      const req = { 
        query: { 
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          page: 1,
          limit: 20
        } 
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockExecutions = [];

      mockModels.JobExecution.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: mockExecutions
      });

      await notificationController.getJobHistory(req, res);

      expect(mockModels.JobExecution.findAndCountAll).toHaveBeenCalledWith({
        where: {
          startedAt: {
            [mockOp.gte]: new Date('2024-01-01'),
            [mockOp.lte]: new Date('2024-01-31 23:59:59')
          }
        },
        order: [['startedAt', 'DESC']],
        limit: 20,
        offset: 0
      });
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { query: {} };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.JobExecution.findAndCountAll.mockRejectedValue(new Error('Erro de banco'));

      await notificationController.getJobHistory(req, res);

      expect(mockResponse.errorResponse).toHaveBeenCalledWith(res, 'Erro interno do servidor', 500);
    });
  });

  describe('getJobStats', () => {
    it('deve retornar estatísticas dos jobs', async () => {
      const req = { query: { days: '7' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockExecutions = [
        {
          jobName: 'payment_check',
          status: 'success',
          duration: 1000,
          notificationsCreated: 5,
          notificationsUpdated: 2,
          startedAt: new Date()
        }
      ];

      mockModels.JobExecution.findAll.mockResolvedValue(mockExecutions);

      await notificationController.getJobStats(req, res);

      expect(mockModels.JobExecution.findAll).toHaveBeenCalledWith({
        where: {
          startedAt: {
            [mockOp.gte]: expect.any(Date)
          }
        },
        attributes: [
          'jobName',
          'status',
          'duration',
          'notificationsCreated',
          'notificationsUpdated',
          'startedAt'
        ]
      });
      expect(mockResponse.successResponse).toHaveBeenCalledWith(res, {
        global: expect.objectContaining({
          totalExecutions: 1,
          successRate: 1
        }),
        byJob: expect.objectContaining({
          payment_check: expect.objectContaining({
            totalExecutions: 1,
            successRate: 1
          })
        })
      });
    });

    it('deve usar período padrão de 30 dias', async () => {
      const req = { query: {} };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockExecutions = [];

      mockModels.JobExecution.findAll.mockResolvedValue(mockExecutions);

      await notificationController.getJobStats(req, res);

      expect(mockModels.JobExecution.findAll).toHaveBeenCalledWith({
        where: {
          startedAt: {
            [mockOp.gte]: expect.any(Date)
          }
        },
        attributes: [
          'jobName',
          'status',
          'duration',
          'notificationsCreated',
          'notificationsUpdated',
          'startedAt'
        ]
      });
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { query: {} };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.JobExecution.findAll.mockRejectedValue(new Error('Erro de banco'));

      await notificationController.getJobStats(req, res);

      expect(mockResponse.errorResponse).toHaveBeenCalledWith(res, 'Erro interno do servidor', 500);
    });
  });

  describe('POST /api/notifications/reprocess', () => {
    it('should reprocess notifications for a specific user', async () => {
      const response = await request(app)
        .post('/api/notifications/reprocess')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetUserId: user.id,
          notificationType: 'payment_check',
          clearExisting: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('targetUserId', user.id);
      expect(response.body.data).toHaveProperty('notificationType', 'payment_check');
      expect(response.body.data).toHaveProperty('clearExisting', true);
      expect(response.body.data).toHaveProperty('notificationsCreated');
      expect(response.body.data).toHaveProperty('notificationsRemoved');
      expect(response.body.data).toHaveProperty('jobsExecuted');
      expect(response.body.data.jobsExecuted).toContain('payment_check');
    });

    it('should reprocess all notification types when type is "all"', async () => {
      const response = await request(app)
        .post('/api/notifications/reprocess')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetUserId: user.id,
          notificationType: 'all',
          clearExisting: false
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notificationType', 'all');
      expect(response.body.data.jobsExecuted).toContain('payment_check');
      expect(response.body.data.jobsExecuted).toContain('general_reminders');
    });

    it('should return 400 when targetUserId is missing', async () => {
      const response = await request(app)
        .post('/api/notifications/reprocess')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notificationType: 'payment_check'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('ID do usuário alvo é obrigatório');
    });

    it('should return 400 when notificationType is invalid', async () => {
      const response = await request(app)
        .post('/api/notifications/reprocess')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetUserId: user.id,
          notificationType: 'invalid_type'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when target user does not exist', async () => {
      const response = await request(app)
        .post('/api/notifications/reprocess')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetUserId: 99999,
          notificationType: 'payment_check'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Usuário alvo não encontrado');
    });

    it('should return 401 when user is not admin', async () => {
      const response = await request(app)
        .post('/api/notifications/reprocess')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          targetUserId: user.id,
          notificationType: 'payment_check'
        });

      expect(response.status).toBe(401);
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post('/api/notifications/reprocess')
        .send({
          targetUserId: user.id,
          notificationType: 'payment_check'
        });

      expect(response.status).toBe(401);
    });
  });
}); 