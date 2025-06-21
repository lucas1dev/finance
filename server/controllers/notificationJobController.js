/**
 * Controller para gerenciamento de jobs de notificação
 * Permite visualizar histórico, estatísticas e executar jobs manualmente
 */
const jobTracking = require('../services/jobTracking');
const notificationJobs = require('../services/notificationJobs');
const { logger } = require('../utils/logger');

/**
 * Obtém o histórico de execuções dos jobs com paginação
 */
async function getJobHistory(req, res) {
  try {
    const { page, limit, jobType } = req.query;
    const result = await jobTracking.getJobHistoryWithPagination({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      jobType
    });
    res.json({ status: 'success', data: result });
  } catch (error) {
    logger.error('Erro ao buscar histórico dos jobs:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Obtém estatísticas gerais dos jobs
 */
async function getJobStats(req, res) {
  try {
    const stats = await jobTracking.getJobStats();
    res.json({ status: 'success', data: stats });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas dos jobs:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Obtém estatísticas detalhadas por período
 */
async function getDetailedStats(req, res) {
  try {
    const { period = '30d' } = req.query;
    const stats = await jobTracking.getDetailedStats(period);
    res.json({ status: 'success', data: stats });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas detalhadas dos jobs:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Obtém as últimas execuções dos jobs
 */
async function getLastExecutions(req, res) {
  try {
    const { limit = 5 } = req.query;
    const lastExecutions = await jobTracking.getLastExecutions(parseInt(limit));
    res.json({ status: 'success', data: { lastExecutions } });
  } catch (error) {
    logger.error('Erro ao buscar últimas execuções dos jobs:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Executa manualmente o job de verificação de pagamentos
 */
async function runPaymentCheckJob(req, res) {
  try {
    const { userId } = req.body;
    logger.info(`Executando job de verificação de pagamentos manualmente${userId ? ` para usuário ${userId}` : ' para todos os usuários'}`);
    notificationJobs.createPaymentDueNotifications(userId).catch(error => {
      logger.error('Erro na execução assíncrona do job de verificação de pagamentos:', error);
    });
    res.json({ status: 'success', message: 'Job de verificação de pagamentos iniciado com sucesso', data: { userId: userId || 'all' } });
  } catch (error) {
    logger.error('Erro ao executar job de verificação de pagamentos:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Executa manualmente o job de lembretes gerais
 */
async function runGeneralRemindersJob(req, res) {
  try {
    const { userId } = req.body;
    logger.info(`Executando job de lembretes gerais manualmente${userId ? ` para usuário ${userId}` : ' para todos os usuários'}`);
    notificationJobs.createGeneralReminders(userId).catch(error => {
      logger.error('Erro na execução assíncrona do job de lembretes gerais:', error);
    });
    res.json({ status: 'success', message: 'Job de lembretes gerais iniciado com sucesso', data: { userId: userId || 'all' } });
  } catch (error) {
    logger.error('Erro ao executar job de lembretes gerais:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Executa manualmente o job de limpeza de notificações
 */
async function runCleanupJob(req, res) {
  try {
    logger.info('Executando job de limpeza de notificações manualmente');
    notificationJobs.cleanupOldNotifications().catch(error => {
      logger.error('Erro na execução assíncrona do job de limpeza:', error);
    });
    res.json({ status: 'success', message: 'Job de limpeza de notificações iniciado com sucesso' });
  } catch (error) {
    logger.error('Erro ao executar job de limpeza:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Executa todos os jobs de notificação
 */
async function runAllJobs(req, res) {
  try {
    const { userId } = req.body;
    logger.info(`Executando todos os jobs de notificação manualmente${userId ? ` para usuário ${userId}` : ' para todos os usuários'}`);
    notificationJobs.runAllNotificationJobs(userId).catch(error => {
      logger.error('Erro na execução assíncrona de todos os jobs:', error);
    });
    res.json({ status: 'success', message: 'Todos os jobs de notificação iniciados com sucesso', data: { userId: userId || 'all' } });
  } catch (error) {
    logger.error('Erro ao executar todos os jobs:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Testa o envio de email de alerta
 */
async function testEmailAlert(req, res) {
  try {
    const emailService = require('../services/emailService');
    
    const testError = new Error('Erro de teste para verificar sistema de alertas');
    testError.stack = 'Error: Erro de teste\n    at testEmailAlert (/app/controllers/notificationJobController.js:150:25)\n    at processTicksAndRejections (node:internal/process/task_queues:95:7)';
    
    const result = await emailService.sendJobFailureAlert('test_job', testError, {
      executionId: 999,
      duration: 1500,
      startedAt: new Date(),
      finishedAt: new Date()
    });
    
    if (result) {
      res.json({ 
        status: 'success', 
        message: 'Email de teste enviado com sucesso',
        data: { 
          jobName: 'test_job',
          emailSent: true,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        message: 'Falha ao enviar email de teste',
        data: { 
          jobName: 'test_job',
          emailSent: false,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    logger.error('Erro ao testar envio de email:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}

module.exports = {
  getJobHistory,
  getJobStats,
  getDetailedStats,
  getLastExecutions,
  runPaymentCheckJob,
  runGeneralRemindersJob,
  runCleanupJob,
  runAllJobs,
  testEmailAlert
}; 