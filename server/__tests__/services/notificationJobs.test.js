/**
 * Testes unitários para o serviço de jobs de notificação.
 * Testa a criação de notificações automáticas e limpeza.
 * 
 * @module __tests__/services/notificationJobs.test
 */

describe('NotificationJobs Service', () => {
  let notificationJobs;
  let mockUser, mockFinancingPayment, mockNotification, mockFinancing, mockJobExecution;

  beforeEach(() => {
    jest.resetModules(); // Limpa o cache dos requires
    jest.clearAllMocks();

    // Mock do node-cron
    jest.mock('node-cron', () => ({
      schedule: jest.fn((cronExpression, callback) => {
        return {
          start: jest.fn(),
          stop: jest.fn(),
        };
      }),
    }));

    // Mock do Sequelize Op
    jest.mock('sequelize', () => ({
      Op: {
        lte: 'lte',
        gte: 'gte',
      },
    }));

    // Mock do logger
    jest.mock('../../utils/logger', () => ({
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }
    }));

    // Mock do jobTracking
    jest.mock('../../services/jobTracking', () => ({
      startJobTracking: jest.fn().mockResolvedValue({ id: 1 }),
      finishJobTracking: jest.fn().mockResolvedValue(),
      failJobTracking: jest.fn().mockResolvedValue(),
    }));

    // Mock do jobRetry
    jest.mock('../../services/jobRetry', () => ({
      withRetry: jest.fn((fn) => fn)
    }));

    // Configurar mocks dos modelos
    mockUser = {
      findByPk: jest.fn(),
      findAll: jest.fn(),
    };

    mockFinancingPayment = {
      findAll: jest.fn(),
    };

    mockNotification = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    mockFinancing = {
      count: jest.fn(),
    };

    mockJobExecution = {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findByPk: jest.fn().mockResolvedValue({ 
        id: 1, 
        update: jest.fn().mockResolvedValue({ id: 1 }),
        startedAt: new Date()
      }),
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] }),
      sequelize: {
        fn: jest.fn(),
        Op: { gte: 'gte' }
      }
    };

    // Mock dos modelos
    jest.mock('../../models', () => ({
      User: mockUser,
      FinancingPayment: mockFinancingPayment,
      Notification: mockNotification,
      Financing: mockFinancing,
      JobExecution: mockJobExecution,
    }));

    // Importar o serviço após os mocks
    notificationJobs = require('../../services/notificationJobs');
  });

  describe('createPaymentDueNotifications', () => {
    it('deve criar notificação para pagamento vencido', async () => {
      // Configurar mocks
      mockUser.findByPk.mockResolvedValue({ id: 1 });
      
      const mockPayments = [
        {
          id: 1,
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // vencido há 2 dias
          amount: 1000,
          isPaid: false,
          Financing: { description: 'Financiamento Teste' },
        },
      ];
      
      mockFinancingPayment.findAll.mockResolvedValue(mockPayments);
      mockNotification.findOne.mockResolvedValue(null); // não existe notificação
      
      // Executar o serviço
      await notificationJobs.createPaymentDueNotifications(1);
      
      // Verificar se os mocks foram chamados
      expect(mockUser.findByPk).toHaveBeenCalledWith(1);
      expect(mockFinancingPayment.findAll).toHaveBeenCalled();
      expect(mockNotification.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 1,
        type: 'payment_overdue',
        title: 'Pagamento Vencido',
        message: expect.stringContaining('venceu há 2 dia'),
        priority: 'urgent',
        isRead: false,
        isActive: true,
      }));
    });

    it('deve criar notificação para pagamento que vence hoje', async () => {
      mockUser.findByPk.mockResolvedValue({ id: 1 });
      
      const mockPayments = [
        {
          id: 1,
          dueDate: new Date(), // vence hoje
          amount: 1000,
          isPaid: false,
          Financing: { description: 'Financiamento Teste' },
        },
      ];
      
      mockFinancingPayment.findAll.mockResolvedValue(mockPayments);
      mockNotification.findOne.mockResolvedValue(null);
      
      await notificationJobs.createPaymentDueNotifications(1);
      
      expect(mockNotification.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 1,
        type: 'payment_due_today',
        title: 'Pagamento Vence Hoje',
        message: expect.stringContaining('vence hoje'),
        priority: 'high',
        isRead: false,
        isActive: true,
      }));
    });

    it('deve criar notificação para pagamento que vence em breve', async () => {
      mockUser.findByPk.mockResolvedValue({ id: 1 });
      
      const mockPayments = [
        {
          id: 1,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // vence em 2 dias
          amount: 1000,
          isPaid: false,
          Financing: { description: 'Financiamento Teste' },
        },
      ];
      
      mockFinancingPayment.findAll.mockResolvedValue(mockPayments);
      mockNotification.findOne.mockResolvedValue(null);
      
      await notificationJobs.createPaymentDueNotifications(1);
      
      expect(mockNotification.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 1,
        type: 'payment_due',
        title: 'Pagamento Vence em Breve',
        message: expect.stringContaining('vence em 2 dia'),
        priority: 'medium',
        isRead: false,
        isActive: true,
      }));
    });

    it('deve criar notificação de lembrete para pagamento que vence em 5 dias', async () => {
      mockUser.findByPk.mockResolvedValue({ id: 1 });
      
      const mockPayments = [
        {
          id: 1,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // vence em 5 dias
          amount: 1000,
          isPaid: false,
          Financing: { description: 'Financiamento Teste' },
        },
      ];
      
      mockFinancingPayment.findAll.mockResolvedValue(mockPayments);
      mockNotification.findOne.mockResolvedValue(null);
      
      await notificationJobs.createPaymentDueNotifications(1);
      
      expect(mockNotification.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 1,
        type: 'payment_reminder',
        title: 'Lembrete de Pagamento',
        message: expect.stringContaining('vence em 5 dia'),
        priority: 'low',
        isRead: false,
        isActive: true,
      }));
    });

    it('não deve criar notificação para pagamento já realizado', async () => {
      mockUser.findByPk.mockResolvedValue({ id: 1 });
      
      const mockPayments = [
        {
          id: 1,
          dueDate: new Date(),
          amount: 1000,
          isPaid: true, // já pago
          Financing: { description: 'Financiamento Teste' },
        },
      ];
      
      mockFinancingPayment.findAll.mockResolvedValue([]); // não retorna pagamentos pagos
      
      await notificationJobs.createPaymentDueNotifications(1);
      
      expect(mockNotification.create).not.toHaveBeenCalled();
    });

    it('não deve criar notificação duplicada', async () => {
      mockUser.findByPk.mockResolvedValue({ id: 1 });
      
      const mockPayments = [
        {
          id: 1,
          dueDate: new Date(),
          amount: 1000,
          isPaid: false,
          Financing: { description: 'Financiamento Teste' },
        },
      ];
      
      mockFinancingPayment.findAll.mockResolvedValue(mockPayments);
      mockNotification.findOne.mockResolvedValue({ id: 1 }); // já existe notificação
      
      await notificationJobs.createPaymentDueNotifications(1);
      
      expect(mockNotification.create).not.toHaveBeenCalled();
    });
  });

  describe('createGeneralReminders', () => {
    it('deve criar lembrete geral para usuário com financiamentos ativos', async () => {
      mockUser.findByPk.mockResolvedValue({ id: 1 });
      mockFinancing.count.mockResolvedValue(1); // tem financiamentos ativos
      mockNotification.findOne.mockResolvedValue(null); // não existe lembrete hoje
      
      await notificationJobs.createGeneralReminders(1);
      
      expect(mockFinancing.count).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ userId: 1, status: 'active' })
      }));
      expect(mockNotification.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 1,
        type: 'general_reminder',
        title: 'Lembrete Geral',
        isRead: false,
        isActive: true,
      }));
    });

    it('não deve criar lembrete para usuário sem financiamentos ativos', async () => {
      mockUser.findByPk.mockResolvedValue({ id: 1 });
      mockFinancing.count.mockResolvedValue(0); // não tem financiamentos ativos
      
      await notificationJobs.createGeneralReminders(1);
      
      expect(mockNotification.create).not.toHaveBeenCalled();
    });

    it('não deve criar lembrete duplicado no mesmo dia', async () => {
      mockUser.findByPk.mockResolvedValue({ id: 1 });
      mockFinancing.count.mockResolvedValue(1);
      mockNotification.findOne.mockResolvedValue({ id: 1 }); // já existe lembrete hoje
      
      await notificationJobs.createGeneralReminders(1);
      
      expect(mockNotification.create).not.toHaveBeenCalled();
    });
  });

  describe('cleanupOldNotifications', () => {
    it('deve desativar notificações antigas', async () => {
      await notificationJobs.cleanupOldNotifications();
      
      expect(mockNotification.update).toHaveBeenCalledWith(
        { isActive: false },
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
      );
    });
  });

  describe('initializeNotificationJobs', () => {
    it('deve inicializar os jobs de notificação', () => {
      expect(() => notificationJobs.initializeNotificationJobs()).not.toThrow();
    });
  });

  describe('runAllNotificationJobs', () => {
    it('deve executar todos os jobs de notificação', async () => {
      mockUser.findByPk.mockResolvedValue({ id: 1 });
      mockFinancingPayment.findAll.mockResolvedValue([]);
      mockFinancing.count.mockResolvedValue(1);
      
      await notificationJobs.runAllNotificationJobs(1);
      
      expect(mockUser.findByPk).toHaveBeenCalledWith(1);
      expect(mockFinancing.count).toHaveBeenCalled();
    });
  });
}); 