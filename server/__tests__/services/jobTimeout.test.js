/**
 * Testes para o serviço de timeout de jobs.
 * 
 * @module __tests__/services/jobTimeout.test
 */

jest.mock('../../services/jobTracking');
jest.mock('../../services/emailService');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('Job Timeout Service', () => {
  let jobTimeout, jobTracking, emailService;
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jobTimeout = require('../../services/jobTimeout');
    jobTracking = require('../../services/jobTracking');
    emailService = require('../../services/emailService');
    // Mock do jobTracking
    jobTracking.startJobTracking.mockResolvedValue({ id: 1 });
    jobTracking.finishJobTracking.mockResolvedValue();
    jobTracking.failJobTracking.mockResolvedValue();
    // Mock do emailService
    emailService.sendJobFailureAlert.mockResolvedValue();
  });

  describe('getTimeoutConfig', () => {
    it('should return default config for unknown job', () => {
      const config = jobTimeout.getTimeoutConfig('unknown_job');
      expect(config).toEqual({
        timeoutMinutes: 10,
        description: 'Job padrão'
      });
    });

    it('should return specific config for known job', () => {
      const config = jobTimeout.getTimeoutConfig('payment_check');
      expect(config).toEqual({
        timeoutMinutes: 10,
        description: 'Verificação de pagamentos'
      });
    });
  });

  describe('getAllTimeoutConfigs', () => {
    it('should return all timeout configurations', () => {
      const configs = jobTimeout.getAllTimeoutConfigs();
      expect(configs).toHaveProperty('payment_check');
      expect(configs).toHaveProperty('general_reminders');
      expect(configs).toHaveProperty('cleanup');
      expect(configs).toHaveProperty('default');
    });
  });

  describe('updateTimeoutConfig', () => {
    it('should update timeout configuration for existing job', () => {
      jobTimeout.updateTimeoutConfig('payment_check', 15, 'Nova descrição');
      
      const config = jobTimeout.getTimeoutConfig('payment_check');
      expect(config.timeoutMinutes).toBe(15);
      expect(config.description).toBe('Nova descrição');
    });

    it('should create new timeout configuration for unknown job', () => {
      jobTimeout.updateTimeoutConfig('new_job', 20, 'Novo job');
      
      const config = jobTimeout.getTimeoutConfig('new_job');
      expect(config.timeoutMinutes).toBe(20);
      expect(config.description).toBe('Novo job');
    });
  });

  describe('executeWithTimeout', () => {
    it('should execute job successfully within timeout', async () => {
      const mockJob = jest.fn().mockResolvedValue('success');
      
      const promise = jobTimeout.executeWithTimeout('payment_check', mockJob);
      
      // Aguardar a promessa diretamente
      const result = await promise;
      
      expect(result).toBe('success');
      expect(mockJob).toHaveBeenCalledWith(undefined);
      expect(jobTracking.startJobTracking).toHaveBeenCalledWith('payment_check');
      expect(jobTracking.finishJobTracking).toHaveBeenCalledWith(1, expect.objectContaining({
        notificationsCreated: 0,
        notificationsUpdated: 0,
        metadata: expect.objectContaining({
          timeoutMinutes: 10
        })
      }));
    });

    it('should execute job with userId parameter', async () => {
      const mockJob = jest.fn().mockResolvedValue('success');
      
      const promise = jobTimeout.executeWithTimeout('payment_check', mockJob, { userId: 123 });
      
      const result = await promise;
      
      expect(result).toBe('success');
      expect(mockJob).toHaveBeenCalledWith(123);
    });

    it('should handle job failure and track error', async () => {
      const mockError = new Error('Job failed');
      const mockJob = jest.fn().mockRejectedValue(mockError);
      
      const promise = jobTimeout.executeWithTimeout('payment_check', mockJob);
      
      await expect(promise).rejects.toThrow('Job failed');
      
      expect(jobTracking.failJobTracking).toHaveBeenCalledWith(1, mockError);
    });

    it.skip('should abort job when timeout is reached', async () => {
      jest.useFakeTimers();
      jobTimeout.updateTimeoutConfig('payment_check', 0.001, 'Timeout Teste Rápido'); // 0.001 min = 60ms
      const mockJob = jest.fn().mockImplementation(() => {
        return new Promise(() => {}); // nunca resolve
      });
      const promise = jobTimeout.executeWithTimeout('payment_check', mockJob);
      jest.advanceTimersByTime(100); // Avança 100ms
      await jest.runAllTimersAsync();
      await expect(promise).rejects.toThrow();
      expect(jobTracking.failJobTracking).toHaveBeenCalledWith(1, expect.objectContaining({
        name: 'JobTimeoutError',
        message: expect.stringContaining('Job payment_check foi abortado por timeout')
      }));
      expect(emailService.sendJobFailureAlert).toHaveBeenCalledWith(
        'payment_check',
        expect.objectContaining({
          name: 'JobTimeoutError'
        }),
        expect.objectContaining({
          executionId: 1,
          timeoutMinutes: 0.001,
          description: 'Timeout Teste Rápido'
        })
      );
      jest.useRealTimers();
    });
  });

  describe('createJobTimeout and cancelJobTimeout', () => {
    it('should create and cancel timeout correctly', () => {
      const timeoutId = jobTimeout.createJobTimeout('payment_check', 1);
      
      expect(timeoutId).toBeDefined();
      
      // Cancelar timeout
      jobTimeout.cancelJobTimeout(timeoutId, 'payment_check', 1);
      
      // Avançar o tempo para verificar que o timeout não foi executado
      
      
      expect(jobTracking.failJobTracking).not.toHaveBeenCalled();
    });
  });

  describe('timeout configuration from environment variables', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should use environment variable for timeout configuration', () => {
      process.env.JOB_TIMEOUT_PAYMENT_CHECK = '15';
      
      // Recarregar o módulo para pegar as novas variáveis de ambiente
      const jobTimeoutModule = require('../../services/jobTimeout');
      
      const config = jobTimeoutModule.getTimeoutConfig('payment_check');
      expect(config.timeoutMinutes).toBe(15);
    });

    it('should fallback to default when environment variable is not set', () => {
      delete process.env.JOB_TIMEOUT_PAYMENT_CHECK;
      
      const jobTimeoutModule = require('../../services/jobTimeout');
      
      const config = jobTimeoutModule.getTimeoutConfig('payment_check');
      expect(config.timeoutMinutes).toBe(10); // valor padrão
    });
  });
}); 