// Mock dos serviços antes de qualquer require
jest.mock('../../services/fixedAccountJobs');
jest.mock('../../services/jobTracking');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

let fixedAccountJobController;
let fixedAccountJobs;
let jobTracking;

describe('FixedAccountJobController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock explícito dos métodos dos serviços
    const fixedAccountJobsMock = {
      processOverdueFixedAccounts: jest.fn().mockResolvedValue({ success: true }),
      createFixedAccountNotifications: jest.fn().mockResolvedValue({ success: true }),
      runAllFixedAccountJobs: jest.fn().mockResolvedValue({ success: true })
    };

    const jobExecutionMock = {
      findAndCountAll: jest.fn().mockResolvedValue({ count: 1, rows: [] }),
      count: jest.fn().mockResolvedValue(0),
      findAll: jest.fn().mockResolvedValue([])
    };

    const jobTrackingMock = {
      JobExecution: jobExecutionMock
    };

    // Aplicar mocks antes do require
    jest.doMock('../../services/fixedAccountJobs', () => fixedAccountJobsMock);
    jest.doMock('../../services/jobTracking', () => jobTrackingMock);

    // Agora importar os módulos
    fixedAccountJobController = require('../../controllers/fixedAccountJobController');
    fixedAccountJobs = require('../../services/fixedAccountJobs');
    jobTracking = require('../../services/jobTracking');

    mockReq = {
      body: {},
      query: {},
      params: {}
    };
    
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('processOverdueAccounts', () => {
    it('should process overdue accounts successfully', async () => {
      mockReq.body = { userId: 1 };
      
      await fixedAccountJobController.processOverdueAccounts(mockReq, mockRes);

      expect(fixedAccountJobs.processOverdueFixedAccounts).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Processamento de contas fixas executado com sucesso',
        data: {
          jobType: 'fixed_account_processing',
          userId: 1
        }
      });
    });

    it('should process all users when no userId provided', async () => {
      await fixedAccountJobController.processOverdueAccounts(mockReq, mockRes);

      expect(fixedAccountJobs.processOverdueFixedAccounts).toHaveBeenCalledWith(undefined);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Processamento de contas fixas executado com sucesso',
        data: {
          jobType: 'fixed_account_processing',
          userId: 'all'
        }
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      fixedAccountJobs.processOverdueFixedAccounts.mockRejectedValue(error);

      await fixedAccountJobController.processOverdueAccounts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro ao executar processamento de contas fixas',
        details: 'Test error'
      });
    });
  });

  describe('createNotifications', () => {
    it('should create notifications successfully', async () => {
      mockReq.body = { userId: 1 };
      
      await fixedAccountJobController.createNotifications(mockReq, mockRes);

      expect(fixedAccountJobs.createFixedAccountNotifications).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notificações de contas fixas criadas com sucesso',
        data: {
          jobType: 'fixed_account_notifications',
          userId: 1
        }
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      fixedAccountJobs.createFixedAccountNotifications.mockRejectedValue(error);

      await fixedAccountJobController.createNotifications(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro ao criar notificações de contas fixas',
        details: 'Test error'
      });
    });
  });

  describe('runAllJobs', () => {
    it('should run all jobs successfully', async () => {
      mockReq.body = { userId: 1 };
      
      await fixedAccountJobController.runAllJobs(mockReq, mockRes);

      expect(fixedAccountJobs.runAllFixedAccountJobs).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todos os jobs de contas fixas executados com sucesso',
        data: {
          jobsExecuted: ['fixed_account_processing', 'fixed_account_notifications'],
          userId: 1
        }
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      fixedAccountJobs.runAllFixedAccountJobs.mockRejectedValue(error);

      await fixedAccountJobController.runAllJobs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro ao executar jobs de contas fixas',
        details: 'Test error'
      });
    });
  });

  describe('getJobHistory', () => {
    it('should return job history with pagination', async () => {
      mockReq.query = {
        jobName: 'fixed_account_processing',
        status: 'success',
        page: 1,
        limit: 10
      };

      const mockExecutions = [
        { id: 1, job_name: 'fixed_account_processing', status: 'success' }
      ];

      jobTracking.JobExecution.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockExecutions
      });

      await fixedAccountJobController.getJobHistory(mockReq, mockRes);

      expect(jobTracking.JobExecution.findAndCountAll).toHaveBeenCalledWith({
        where: {
          job_name: 'fixed_account_processing',
          status: 'success'
        },
        order: [['started_at', 'DESC']],
        limit: 10,
        offset: 0
      });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          executions: mockExecutions,
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1
          }
        }
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      jobTracking.JobExecution.findAndCountAll.mockRejectedValue(error);

      await fixedAccountJobController.getJobHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro ao buscar histórico de jobs',
        details: 'Test error'
      });
    });
  });

  describe('getJobStats', () => {
    it('should return job statistics', async () => {
      mockReq.query = { period: 'week' };

      // Mock do sequelize.fn
      const mockSequelizeFn = jest.fn().mockReturnValue('COUNT(*)');
      jobTracking.JobExecution.sequelize = {
        fn: mockSequelizeFn
      };

      jobTracking.JobExecution.count
        .mockResolvedValueOnce(10) // totalExecutions
        .mockResolvedValueOnce(8)  // successfulExecutions
        .mockResolvedValueOnce(2); // failedExecutions

      jobTracking.JobExecution.findAll
        .mockResolvedValueOnce([
          { status: 'success', dataValues: { count: 5 } },
          { status: 'failed', dataValues: { count: 1 } }
        ]) // processingStats
        .mockResolvedValueOnce([
          { status: 'success', dataValues: { count: 3 } },
          { status: 'failed', dataValues: { count: 1 } }
        ]); // notificationStats

      await fixedAccountJobController.getJobStats(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          period: 'week',
          totalExecutions: 10,
          successfulExecutions: 8,
          failedExecutions: 2,
          successRate: 80,
          processingJob: {
            total: 6,
            success: 5,
            failed: 1
          },
          notificationJob: {
            total: 4,
            success: 3,
            failed: 1
          }
        }
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      jobTracking.JobExecution.count.mockRejectedValue(error);

      await fixedAccountJobController.getJobStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro ao buscar estatísticas de jobs',
        details: 'Test error'
      });
    });
  });

  describe('getJobConfig', () => {
    it('should return job configuration', async () => {
      await fixedAccountJobController.getJobConfig(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          jobs: {
            fixed_account_processing: {
              name: 'Processamento de Contas Fixas',
              description: 'Processa contas fixas vencidas automaticamente',
              schedule: '0 6 * * *',
              scheduleDescription: 'Diariamente às 6:00',
              timeout: 300000,
              retries: 3
            },
            fixed_account_notifications: {
              name: 'Notificações de Contas Fixas',
              description: 'Cria notificações para contas fixas vencidas e próximas do vencimento',
              schedule: '0 */4 * * *',
              scheduleDescription: 'A cada 4 horas',
              timeout: 120000,
              retries: 2
            }
          },
          settings: {
            reminderDays: 3,
            autoProcessOverdue: true,
            checkBalance: true,
            createDefaultAccount: true
          }
        }
      });
    });
  });
}); 