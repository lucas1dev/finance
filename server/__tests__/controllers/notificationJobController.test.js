/**
 * Testes unitários para o controller de jobs de notificação
 * Testa endpoints de histórico, estatísticas e execução manual de jobs
 */

// Mock dos serviços (antes de qualquer require)
jest.mock('../../services/jobTracking');
jest.mock('../../services/notificationJobs');
jest.mock('../../utils/logger');

const request = require('supertest');
const app = require('../../app');
const { JobExecution, User } = require('../../models');
const { createTestUser, createAdminUser } = require('../integration/factories');

describe('NotificationJobController', () => {
  let notificationJobController;
  let jobTracking;
  let notificationJobs;
  let logger;
  let mockReq;
  let mockRes;
  let user, admin, userToken, adminToken, testExecution;

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

    // Criar uma execução de job de teste
    testExecution = await JobExecution.create({
      jobName: 'payment_check',
      status: 'success',
      startedAt: new Date(Date.now() - 3600000), // 1 hora atrás
      finishedAt: new Date(Date.now() - 3500000), // 10 minutos depois
      duration: 600000, // 10 minutos
      notificationsCreated: 15,
      notificationsUpdated: 3,
      metadata: {
        usersProcessed: 25,
        paymentsChecked: 150,
        errors: 0
      }
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await JobExecution.destroy({ where: { id: testExecution.id } });
    await User.destroy({ where: { id: [user.id, admin.id] } });
  });

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

  describe('GET /api/notifications/jobs/execution/:executionId', () => {
    it('should return job execution details for a valid execution ID', async () => {
      const response = await request(app)
        .get(`/api/notifications/jobs/execution/${testExecution.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('execution');
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data).toHaveProperty('relatedExecutions');
      expect(response.body.data).toHaveProperty('analysis');

      // Verificar dados da execução
      expect(response.body.data.execution.id).toBe(testExecution.id);
      expect(response.body.data.execution.jobName).toBe('payment_check');
      expect(response.body.data.execution.status).toBe('success');
      expect(response.body.data.execution.notificationsCreated).toBe(15);
      expect(response.body.data.execution.notificationsUpdated).toBe(3);

      // Verificar estatísticas
      expect(response.body.data.stats.isRunning).toBe(false);
      expect(response.body.data.stats.hasError).toBe(false);
      expect(response.body.data.stats.durationFormatted).toBe('600000ms');
      expect(response.body.data.stats.totalNotifications).toBe(18);

      // Verificar análise
      expect(response.body.data.analysis.successRate).toBe(100);
      expect(response.body.data.analysis.performance).toBe('poor'); // > 10s
      expect(response.body.data.analysis.impact).toBe('high');
    });

    it('should return 404 for non-existent execution ID', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/execution/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Execução de job não encontrada');
    });

    it('should return 400 for invalid execution ID', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/execution/invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('ID de execução inválido');
    });

    it('should return 401 when user is not admin', async () => {
      const response = await request(app)
        .get(`/api/notifications/jobs/execution/${testExecution.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get(`/api/notifications/jobs/execution/${testExecution.id}`);

      expect(response.status).toBe(401);
    });

    it('should include related executions for the same job', async () => {
      // Criar execuções relacionadas
      const relatedExecution1 = await JobExecution.create({
        jobName: 'payment_check',
        status: 'error',
        startedAt: new Date(Date.now() - 7200000), // 2 horas atrás
        finishedAt: new Date(Date.now() - 7100000),
        duration: 300000,
        notificationsCreated: 0,
        notificationsUpdated: 0,
        errorMessage: 'Erro de teste',
        errorStack: 'Error: Erro de teste\n    at test'
      });

      const relatedExecution2 = await JobExecution.create({
        jobName: 'payment_check',
        status: 'success',
        startedAt: new Date(Date.now() - 10800000), // 3 horas atrás
        finishedAt: new Date(Date.now() - 10700000),
        duration: 50000,
        notificationsCreated: 8,
        notificationsUpdated: 1
      });

      try {
        const response = await request(app)
          .get(`/api/notifications/jobs/execution/${testExecution.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.relatedExecutions).toBeInstanceOf(Array);
        expect(response.body.data.relatedExecutions.length).toBeGreaterThan(0);

        // Verificar se as execuções relacionadas estão incluídas
        const relatedIds = response.body.data.relatedExecutions.map(rel => rel.id);
        expect(relatedIds).toContain(relatedExecution1.id);
        expect(relatedIds).toContain(relatedExecution2.id);

        // Verificar dados das execuções relacionadas
        const errorExecution = response.body.data.relatedExecutions.find(rel => rel.id === relatedExecution1.id);
        expect(errorExecution.hasError).toBe(true);
        expect(errorExecution.errorMessage).toBe('Erro de teste');

      } finally {
        // Limpar execuções de teste
        await JobExecution.destroy({ where: { id: [relatedExecution1.id, relatedExecution2.id] } });
      }
    });

    it('should handle execution with error status', async () => {
      // Criar execução com erro
      const errorExecution = await JobExecution.create({
        jobName: 'general_reminders',
        status: 'error',
        startedAt: new Date(Date.now() - 1800000), // 30 minutos atrás
        finishedAt: new Date(Date.now() - 1790000),
        duration: 45000,
        notificationsCreated: 0,
        notificationsUpdated: 0,
        errorMessage: 'Falha na conexão com banco de dados',
        errorStack: 'SequelizeConnectionError: Connection timeout\n    at ConnectionManager.getConnection'
      });

      try {
        const response = await request(app)
          .get(`/api/notifications/jobs/execution/${errorExecution.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.execution.status).toBe('error');
        expect(response.body.data.execution.errorMessage).toBe('Falha na conexão com banco de dados');
        expect(response.body.data.execution.errorStack).toContain('SequelizeConnectionError');
        
        expect(response.body.data.stats.hasError).toBe(true);
        expect(response.body.data.analysis.successRate).toBe(0);

      } finally {
        await JobExecution.destroy({ where: { id: errorExecution.id } });
      }
    });

    it('should handle running execution', async () => {
      // Criar execução em andamento
      const runningExecution = await JobExecution.create({
        jobName: 'cleanup',
        status: 'running',
        startedAt: new Date(Date.now() - 300000), // 5 minutos atrás
        duration: null,
        notificationsCreated: 0,
        notificationsUpdated: 0
      });

      try {
        const response = await request(app)
          .get(`/api/notifications/jobs/execution/${runningExecution.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.execution.status).toBe('running');
        expect(response.body.data.execution.finishedAt).toBeNull();
        expect(response.body.data.execution.duration).toBeNull();
        
        expect(response.body.data.stats.isRunning).toBe(true);
        expect(response.body.data.stats.timeSinceStart).toContain('s atrás');

      } finally {
        await JobExecution.destroy({ where: { id: runningExecution.id } });
      }
    });
  });

  describe('GET /api/notifications/jobs/history with advanced filters', () => {
    it('should return job history with basic pagination', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('history');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data).toHaveProperty('filters');
      expect(response.body.data).toHaveProperty('stats');

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('totalPages');
      expect(response.body.data.pagination).toHaveProperty('hasNextPage');
      expect(response.body.data.pagination).toHaveProperty('hasPrevPage');
    });

    it('should filter by job type', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history?jobType=payment_check')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.filters.applied.jobType).toBe('payment_check');
      
      // Verificar se todos os resultados são do tipo especificado
      response.body.data.history.forEach(execution => {
        expect(execution.jobName).toBe('payment_check');
      });
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history?status=success')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.filters.applied.status).toBe('success');
      
      // Verificar se todos os resultados têm o status especificado
      response.body.data.history.forEach(execution => {
        expect(execution.status).toBe('success');
      });
    });

    it('should filter by date range', async () => {
      const startDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]; // 1 dia atrás
      const endDate = new Date().toISOString().split('T')[0]; // hoje

      const response = await request(app)
        .get(`/api/notifications/jobs/history?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.filters.applied.startDate).toBe(startDate);
      expect(response.body.data.filters.applied.endDate).toBe(endDate);
    });

    it('should sort by duration in descending order', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history?sortBy=duration&sortOrder=DESC')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.filters.applied.sortBy).toBe('duration');
      expect(response.body.data.filters.applied.sortOrder).toBe('DESC');

      // Verificar se está ordenado por duração (decrescente)
      const durations = response.body.data.history.map(exec => exec.duration).filter(d => d !== null);
      for (let i = 0; i < durations.length - 1; i++) {
        expect(durations[i]).toBeGreaterThanOrEqual(durations[i + 1]);
      }
    });

    it('should filter by minimum duration', async () => {
      const minDuration = 100000; // 100 segundos
      const response = await request(app)
        .get(`/api/notifications/jobs/history?minDuration=${minDuration}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.filters.applied.minDuration).toBe(minDuration);

      // Verificar se todos os resultados têm duração >= minDuration
      response.body.data.history.forEach(execution => {
        if (execution.duration !== null) {
          expect(execution.duration).toBeGreaterThanOrEqual(minDuration);
        }
      });
    });

    it('should filter by minimum notifications', async () => {
      const minNotifications = 10;
      const response = await request(app)
        .get(`/api/notifications/jobs/history?minNotifications=${minNotifications}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.filters.applied.minNotifications).toBe(minNotifications);

      // Verificar se todos os resultados têm notificações >= minNotifications
      response.body.data.history.forEach(execution => {
        expect(execution.notificationsCreated).toBeGreaterThanOrEqual(minNotifications);
      });
    });

    it('should filter by hasError=true', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history?hasError=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.filters.applied.hasError).toBe(true);

      // Verificar se todos os resultados têm status 'error'
      response.body.data.history.forEach(execution => {
        expect(execution.status).toBe('error');
      });
    });

    it('should return 400 for invalid page parameter', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history?page=0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Parâmetros inválidos');
      expect(response.body.errors).toContain('Página deve ser um número positivo');
    });

    it('should return 400 for invalid limit parameter', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history?limit=150')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.errors).toContain('Limite deve ser um número entre 1 e 100');
    });

    it('should return 400 for invalid status parameter', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history?status=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.errors).toContain('Status deve ser: success, error ou running');
    });

    it('should return 400 for invalid sortBy parameter', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history?sortBy=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.errors).toContain('Campo de ordenação inválido');
    });

    it('should return 400 for invalid sortOrder parameter', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history?sortOrder=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.errors).toContain('Ordem de classificação deve ser: ASC ou DESC');
    });

    it('should include available filters in response', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.filters.available).toHaveProperty('jobTypes');
      expect(response.body.data.filters.available).toHaveProperty('dateRange');
      expect(response.body.data.filters.available.jobTypes).toBeInstanceOf(Array);
      expect(response.body.data.filters.available.dateRange).toHaveProperty('minDate');
      expect(response.body.data.filters.available.dateRange).toHaveProperty('maxDate');
    });

    it('should include statistics in response', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.stats).toHaveProperty('totalCount');
      expect(response.body.data.stats).toHaveProperty('successCount');
      expect(response.body.data.stats).toHaveProperty('errorCount');
      expect(response.body.data.stats).toHaveProperty('runningCount');
      expect(response.body.data.stats).toHaveProperty('successRate');
      expect(response.body.data.stats).toHaveProperty('avgDuration');
      expect(response.body.data.stats).toHaveProperty('distribution');
      expect(response.body.data.stats.distribution).toHaveProperty('success');
      expect(response.body.data.stats.distribution).toHaveProperty('error');
      expect(response.body.data.stats.distribution).toHaveProperty('running');
    });
  });
}); 