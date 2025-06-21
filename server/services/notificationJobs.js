/**
 * Serviço de jobs para notificações automáticas.
 * Executa verificações periódicas para criar notificações de pagamentos vencidos e próximos do vencimento.
 * 
 * @module services/notificationJobs
 */

const cron = require('node-cron');
const { User, Financing, FinancingPayment, Notification } = require('../models');
const { logger } = require('../utils/logger');
const jobTracking = require('./jobTracking');
const { withRetry } = require('./jobRetry');
const { executeWithTimeout } = require('./jobTimeout');
const dataIntegrityService = require('./dataIntegrityService');
const { Op } = require('sequelize');

/**
 * Cria notificações para pagamentos vencidos e próximos do vencimento.
 * @param {number} userId - ID do usuário (opcional, se não fornecido, processa todos os usuários).
 * @returns {Promise<void>}
 */
async function createPaymentDueNotifications(userId = null) {
  let executionId = null;
  const startTime = Date.now();
  
  try {
    // Iniciar tracking
    const execution = await jobTracking.startJobTracking('payment_check');
    executionId = execution.id;

    logger.info(`[JOB:payment_check] Iniciando verificação de pagamentos${userId ? ` para usuário ${userId}` : ' para todos os usuários'}`);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

    let notificationsCreated = 0;
    let usersProcessed = 0;
    let paymentsChecked = 0;

    // Buscar usuários (todos ou um específico)
    const users = userId ? await User.findByPk(userId) : await User.findAll();
    const userList = userId ? [users] : users;

    logger.info(`[JOB:payment_check] Processando ${userList.length} usuário(s)`);

    for (const user of userList) {
      if (!user) continue;
      usersProcessed++;

      // Buscar pagamentos de financiamento do usuário
      const payments = await FinancingPayment.findAll({
        include: [{
          model: Financing,
          where: { userId: user.id },
          attributes: ['id', 'description']
        }],
        where: {
          isPaid: false,
          dueDate: {
            [Op.lte]: fiveDaysFromNow
          }
        },
        order: [['dueDate', 'ASC']]
      });

      paymentsChecked += payments.length;

      for (const payment of payments) {
        const daysUntilDue = Math.ceil((payment.dueDate - today) / (1000 * 60 * 60 * 24));
        
        let notificationType = '';
        let title = '';
        let message = '';
        let priority = 'medium';

        if (daysUntilDue < 0) {
          // Pagamento vencido
          notificationType = 'payment_overdue';
          title = 'Pagamento Vencido';
          message = `O pagamento do financiamento "${payment.Financing.description}" venceu há ${Math.abs(daysUntilDue)} dia(s). Valor: R$ ${payment.amount.toFixed(2)}`;
          priority = 'urgent';
        } else if (daysUntilDue === 0) {
          // Vence hoje
          notificationType = 'payment_due_today';
          title = 'Pagamento Vence Hoje';
          message = `O pagamento do financiamento "${payment.Financing.description}" vence hoje. Valor: R$ ${payment.amount.toFixed(2)}`;
          priority = 'high';
        } else if (daysUntilDue <= 3) {
          // Vence em breve
          notificationType = 'payment_due';
          title = 'Pagamento Vence em Breve';
          message = `O pagamento do financiamento "${payment.Financing.description}" vence em ${daysUntilDue} dia(s). Valor: R$ ${payment.amount.toFixed(2)}`;
          priority = 'medium';
        } else if (daysUntilDue === 5) {
          // Lembrete 5 dias antes
          notificationType = 'payment_reminder';
          title = 'Lembrete de Pagamento';
          message = `O pagamento do financiamento "${payment.Financing.description}" vence em ${daysUntilDue} dias. Valor: R$ ${payment.amount.toFixed(2)}`;
          priority = 'low';
        }

        if (notificationType) {
          // Verificar se já existe notificação similar recente
          const existingNotification = await Notification.findOne({
            where: {
              userId: user.id,
              type: notificationType,
              relatedType: 'financing_payment',
              relatedId: payment.id,
              createdAt: {
                [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
              }
            }
          });

          if (!existingNotification) {
            await Notification.create({
              userId: user.id,
              title,
              message,
              type: notificationType,
              priority,
              relatedType: 'financing_payment',
              relatedId: payment.id,
              isRead: false,
              isActive: true
            });
            notificationsCreated++;
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    // Finalizar tracking com sucesso
    await jobTracking.finishJobTracking(executionId, {
      notificationsCreated,
      notificationsUpdated: 0,
      metadata: { 
        usersProcessed,
        paymentsChecked,
        duration
      }
    });

    logger.info(`[JOB:payment_check] Concluído com sucesso em ${duration}ms. Usuários processados: ${usersProcessed}, Pagamentos verificados: ${paymentsChecked}, Notificações criadas: ${notificationsCreated}`);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Registrar falha no tracking
    if (executionId) {
      await jobTracking.failJobTracking(executionId, error);
    }
    
    logger.error(`[JOB:payment_check] Falhou após ${duration}ms. Erro: ${error.message}`, {
      error: error.stack,
      userId,
      duration
    });
  }
}

/**
 * Cria notificações de lembretes gerais.
 * @param {number} userId - ID do usuário (opcional).
 * @returns {Promise<void>}
 */
async function createGeneralReminders(userId = null) {
  let executionId = null;
  const startTime = Date.now();
  
  try {
    // Iniciar tracking
    const execution = await jobTracking.startJobTracking('general_reminders');
    executionId = execution.id;

    logger.info(`[JOB:general_reminders] Iniciando criação de lembretes gerais${userId ? ` para usuário ${userId}` : ' para todos os usuários'}`);

    let notificationsCreated = 0;
    let usersProcessed = 0;
    let usersWithActiveFinancings = 0;

    // Buscar usuários (todos ou um específico)
    const users = userId ? await User.findByPk(userId) : await User.findAll();
    const userList = userId ? [users] : users;

    logger.info(`[JOB:general_reminders] Processando ${userList.length} usuário(s)`);

    for (const user of userList) {
      if (!user) continue;
      usersProcessed++;

      // Verificar se o usuário tem financiamentos ativos
      const activeFinancings = await Financing.count({
        where: { 
          userId: user.id,
          status: 'active'
        }
      });

      if (activeFinancings > 0) {
        usersWithActiveFinancings++;
        
        // Verificar se já existe notificação de lembrete recente
        const existingNotification = await Notification.findOne({
          where: {
            userId: user.id,
            type: 'general_reminder',
            createdAt: {
              [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Última semana
            }
          }
        });

        if (!existingNotification) {
          await Notification.create({
            userId: user.id,
            title: 'Lembrete Geral',
            message: `Você tem ${activeFinancings} financiamento(s) ativo(s). Verifique seus pagamentos pendentes.`,
            type: 'general_reminder',
            priority: 'low',
            relatedType: 'general',
            relatedId: null,
            isRead: false,
            isActive: true
          });
          notificationsCreated++;
        }
      }
    }

    const duration = Date.now() - startTime;

    // Finalizar tracking com sucesso
    await jobTracking.finishJobTracking(executionId, {
      notificationsCreated,
      notificationsUpdated: 0,
      metadata: { 
        usersProcessed,
        usersWithActiveFinancings,
        duration
      }
    });

    logger.info(`[JOB:general_reminders] Concluído com sucesso em ${duration}ms. Usuários processados: ${usersProcessed}, Usuários com financiamentos ativos: ${usersWithActiveFinancings}, Notificações criadas: ${notificationsCreated}`);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Registrar falha no tracking
    if (executionId) {
      await jobTracking.failJobTracking(executionId, error);
    }
    
    logger.error(`[JOB:general_reminders] Falhou após ${duration}ms. Erro: ${error.message}`, {
      error: error.stack,
      userId,
      duration
    });
  }
}

/**
 * Limpa notificações antigas (mais de 30 dias).
 * @returns {Promise<void>}
 */
async function cleanupOldNotifications() {
  const startTime = Date.now();
  
  logger.info('[JOB:cleanup] Iniciando limpeza de notificações antigas');

  // Desativar notificações antigas (mais de 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await Notification.update(
    { isActive: false },
    {
      where: {
        createdAt: {
          [Op.lt]: thirtyDaysAgo
        },
        isActive: true
      }
    }
  );

  // Sequelize pode retornar diferentes formatos, então vamos ser robustos
  const notificationsUpdated = Array.isArray(result) ? result[0] : (result || 0);
  const duration = Date.now() - startTime;

  logger.info(`[JOB:cleanup] Concluído com sucesso em ${duration}ms. Notificações desativadas: ${notificationsUpdated}, Data de corte: ${thirtyDaysAgo.toISOString()}`);
}

/**
 * Inicializa os jobs de notificação.
 * @returns {void}
 */
function initializeNotificationJobs() {
  logger.info('Inicializando jobs de notificação...');

  // Job para verificar pagamentos vencidos e próximos do vencimento (a cada 6 horas)
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Executando job de verificação de pagamentos...');
    try {
      await executeWithTimeout('payment_check', createPaymentDueNotifications);
    } catch (error) {
      logger.error('Job de verificação de pagamentos falhou:', error);
    }
  });

  // Job para lembretes gerais (diariamente às 9h)
  cron.schedule('0 9 * * *', async () => {
    logger.info('Executando job de lembretes gerais...');
    try {
      await executeWithTimeout('general_reminders', createGeneralReminders);
    } catch (error) {
      logger.error('Job de lembretes gerais falhou:', error);
    }
  });

  // Job para limpeza de notificações antigas (semanalmente aos domingos às 2h)
  cron.schedule('0 2 * * 0', async () => {
    logger.info('Executando job de limpeza de notificações...');
    try {
      await executeWithTimeout('cleanup', cleanupOldNotifications);
    } catch (error) {
      logger.error('Job de limpeza de notificações falhou:', error);
    }
  });

  // Job para verificação de integridade de dados (diariamente às 3h)
  cron.schedule('0 3 * * *', async () => {
    logger.info('Executando job de verificação de integridade...');
    try {
      await executeWithTimeout('data_integrity', async () => {
        await dataIntegrityService.runIntegrityCheck({
          autoFix: true,
          sendAlert: true
        });
      });
    } catch (error) {
      logger.error('Job de verificação de integridade falhou:', error);
    }
  });

  logger.info('Jobs de notificação inicializados com sucesso.');
}

/**
 * Executa todos os jobs de notificação manualmente, com timeout configurável.
 * @param {number} userId - ID do usuário (opcional).
 * @returns {Promise<void>}
 * @example
 * await runAllNotificationJobs();
 * // Executa todos os jobs críticos com timeout configurável
 */
async function runAllNotificationJobs(userId = null) {
  try {
    logger.info('Executando todos os jobs de notificação...');
    await executeWithTimeout('payment_check', createPaymentDueNotifications, { userId });
    await executeWithTimeout('general_reminders', createGeneralReminders, { userId });
    await executeWithTimeout('cleanup', cleanupOldNotifications);
    logger.info('Todos os jobs de notificação executados com sucesso.');
  } catch (error) {
    logger.error('Erro ao executar jobs de notificação:', error);
  }
}

/**
 * Executa um job específico com timeout e retry.
 * @param {string} jobName - Nome do job.
 * @param {Function} jobFunction - Função do job.
 * @param {number} userId - ID do usuário (opcional).
 * @returns {Promise<void>}
 */
async function runSpecificJob(jobName, jobFunction, userId = null) {
  try {
    logger.info(`Executando job específico: ${jobName}`);
    await executeWithTimeout(jobName, jobFunction, { userId });
    logger.info(`Job ${jobName} executado com sucesso.`);
  } catch (error) {
    logger.error(`Erro ao executar job ${jobName}:`, error);
    throw error;
  }
}

module.exports = {
  createPaymentDueNotifications,
  createGeneralReminders,
  cleanupOldNotifications,
  initializeNotificationJobs,
  runAllNotificationJobs,
  runSpecificJob,
}; 