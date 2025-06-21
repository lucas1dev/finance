/**
 * Testes unitários para o controller de jobs de notificação
 * Testa endpoints de histórico, estatísticas e execução manual de jobs
 */

// Mock dos serviços (antes de qualquer require)
jest.mock('../../services/jobTracking');
jest.mock('../../services/notificationJobs');
jest.mock('../../utils/logger');

describe('NotificationJobController', () => {
  let notificationJobController;
  let jobTracking;
  let notificationJobs;
  let logger;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.resetModules();
    // Requerer módulos após reset para garantir mocks
    notificationJobController = require('../../controllers/notificationJobController');
    jobTracking = require('../../services/jobTracking');
    notificationJobs = require('../../services/notificationJobs');
    logger = require('../../utils/logger').logger;

    mockReq = {
      query: {},
      body: {},
      userId: 1
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('getJobHistory', () => {
    it('deve retornar histórico de jobs com paginação', async () => {
      const mockHistory = {
        history: [
          { id: 1, jobName: 'payment_check', status: 'success' }
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
      };

      jobTracking.getJobHistoryWithPagination.mockResolvedValue(mockHistory);

      await notificationJobController.getJobHistory(mockReq, mockRes);

      expect(jobTracking.getJobHistoryWithPagination).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        jobType: undefined
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockHistory
      });
    });

    it('deve lidar com parâmetros de consulta personalizados', async () => {
      mockReq.query = { page: '2', limit: '10', jobType: 'payment_check' };

      await notificationJobController.getJobHistory(mockReq, mockRes);

      expect(jobTracking.getJobHistoryWithPagination).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        jobType: 'payment_check'
      });
    });

    it('deve lidar com erros', async () => {
      const error = new Error('Erro de banco de dados');
      jobTracking.getJobHistoryWithPagination.mockRejectedValue(error);

      await notificationJobController.getJobHistory(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Erro ao buscar histórico dos jobs:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    });
  });

  describe('getJobStats', () => {
    it('deve retornar estatísticas dos jobs', async () => {
      const mockStats = {
        totalExecutions: 100,
        successRate: 0.95,
        avgDuration: 1200
      };

      jobTracking.getJobStats.mockResolvedValue(mockStats);

      await notificationJobController.getJobStats(mockReq, mockRes);

      expect(jobTracking.getJobStats).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockStats
      });
    });

    it('deve lidar com erros', async () => {
      const error = new Error('Erro de banco de dados');
      jobTracking.getJobStats.mockRejectedValue(error);

      await notificationJobController.getJobStats(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Erro ao buscar estatísticas dos jobs:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getDetailedStats', () => {
    it('deve retornar estatísticas detalhadas', async () => {
      const mockDetailedStats = {
        dailyStats: [],
        jobTypeStats: {},
        performanceMetrics: {}
      };

      jobTracking.getDetailedStats.mockResolvedValue(mockDetailedStats);

      await notificationJobController.getDetailedStats(mockReq, mockRes);

      expect(jobTracking.getDetailedStats).toHaveBeenCalledWith('30d');
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockDetailedStats
      });
    });

    it('deve usar período personalizado', async () => {
      mockReq.query = { period: '7d' };

      await notificationJobController.getDetailedStats(mockReq, mockRes);

      expect(jobTracking.getDetailedStats).toHaveBeenCalledWith('7d');
    });
  });

  describe('getLastExecutions', () => {
    it('deve retornar últimas execuções', async () => {
      const mockLastExecutions = [
        { id: 1, jobName: 'payment_check', status: 'success' }
      ];

      jobTracking.getLastExecutions.mockResolvedValue(mockLastExecutions);

      await notificationJobController.getLastExecutions(mockReq, mockRes);

      expect(jobTracking.getLastExecutions).toHaveBeenCalledWith(5);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: { lastExecutions: mockLastExecutions }
      });
    });

    it('deve usar limite personalizado', async () => {
      mockReq.query = { limit: '10' };

      await notificationJobController.getLastExecutions(mockReq, mockRes);

      expect(jobTracking.getLastExecutions).toHaveBeenCalledWith(10);
    });
  });

  describe('runPaymentCheckJob', () => {
    it('deve executar job de verificação de pagamentos', async () => {
      notificationJobs.createPaymentDueNotifications.mockResolvedValue();
      mockReq.body = { userId: 123 };

      await notificationJobController.runPaymentCheckJob(mockReq, mockRes);

      expect(logger.info).toHaveBeenCalledWith('Executando job de verificação de pagamentos manualmente para usuário 123');
      expect(notificationJobs.createPaymentDueNotifications).toHaveBeenCalledWith(123);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Job de verificação de pagamentos iniciado com sucesso',
        data: { userId: 123 }
      });
    });

    it('deve executar para todos os usuários quando userId não fornecido', async () => {
      notificationJobs.createPaymentDueNotifications.mockResolvedValue();
      await notificationJobController.runPaymentCheckJob(mockReq, mockRes);

      expect(notificationJobs.createPaymentDueNotifications).toHaveBeenCalledWith(undefined);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Job de verificação de pagamentos iniciado com sucesso',
        data: { userId: 'all' }
      });
    });
  });

  describe('runGeneralRemindersJob', () => {
    it('deve executar job de lembretes gerais', async () => {
      notificationJobs.createGeneralReminders.mockResolvedValue();
      mockReq.body = { userId: 123 };

      await notificationJobController.runGeneralRemindersJob(mockReq, mockRes);

      expect(logger.info).toHaveBeenCalledWith('Executando job de lembretes gerais manualmente para usuário 123');
      expect(notificationJobs.createGeneralReminders).toHaveBeenCalledWith(123);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Job de lembretes gerais iniciado com sucesso',
        data: { userId: 123 }
      });
    });
  });

  describe('runCleanupJob', () => {
    it('deve executar job de limpeza', async () => {
      notificationJobs.cleanupOldNotifications.mockResolvedValue();
      await notificationJobController.runCleanupJob(mockReq, mockRes);

      expect(logger.info).toHaveBeenCalledWith('Executando job de limpeza de notificações manualmente');
      expect(notificationJobs.cleanupOldNotifications).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Job de limpeza de notificações iniciado com sucesso'
      });
    });
  });

  describe('runAllJobs', () => {
    it('deve executar todos os jobs', async () => {
      notificationJobs.runAllNotificationJobs.mockResolvedValue();
      mockReq.body = { userId: 123 };

      await notificationJobController.runAllJobs(mockReq, mockRes);

      expect(logger.info).toHaveBeenCalledWith('Executando todos os jobs de notificação manualmente para usuário 123');
      expect(notificationJobs.runAllNotificationJobs).toHaveBeenCalledWith(123);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Todos os jobs de notificação iniciados com sucesso',
        data: { userId: 123 }
      });
    });

    it('deve executar para todos os usuários quando userId não fornecido', async () => {
      notificationJobs.runAllNotificationJobs.mockResolvedValue();
      await notificationJobController.runAllJobs(mockReq, mockRes);

      expect(notificationJobs.runAllNotificationJobs).toHaveBeenCalledWith(undefined);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Todos os jobs de notificação iniciados com sucesso',
        data: { userId: 'all' }
      });
    });
  });
}); 