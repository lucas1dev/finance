/**
 * Serviço de jobs para processamento automático de contas fixas.
 * Executa verificações periódicas para processar contas fixas vencidas,
 * gerar transações automaticamente e enviar notificações.
 * 
 * @module services/fixedAccountJobs
 */

const cron = require('node-cron');
const { User, FixedAccount, Transaction, Account, Category, Supplier, Notification } = require('../models');
const { logger } = require('../utils/logger');
const jobTracking = require('./jobTracking');
const { withRetry } = require('./jobRetry');
const { executeWithTimeout } = require('./jobTimeout');
const TransactionService = require('./transactionService');
const FixedAccountService = require('./fixedAccountService');
const { Op } = require('sequelize');

/**
 * Calcula a próxima data de vencimento baseada na periodicidade.
 * @param {string} currentDate - Data atual (YYYY-MM-DD).
 * @param {string} periodicity - Periodicidade (daily, weekly, monthly, quarterly, yearly).
 * @returns {string} Próxima data de vencimento (YYYY-MM-DD).
 */
function calculateNextDueDate(currentDate, periodicity) {
  const date = new Date(currentDate);
  
  switch (periodicity) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  
  return date.toISOString().split('T')[0];
}

/**
 * Processa contas fixas vencidas automaticamente.
 * Gera transações, marca como pagas e calcula próxima data de vencimento.
 * @param {number} userId - ID do usuário (opcional, se não fornecido, processa todos os usuários).
 * @returns {Promise<void>}
 */
async function processOverdueFixedAccounts(userId = null) {
  let executionId = null;
  const startTime = Date.now();
  
  try {
    // Iniciar tracking
    const execution = await jobTracking.startJobTracking('fixed_account_processing');
    executionId = execution.id;

    logger.info(`[JOB:fixed_account_processing] Iniciando processamento de contas fixas${userId ? ` para usuário ${userId}` : ' para todos os usuários'}`);

    // Usar o novo FixedAccountService para verificar contas vencidas
    const result = await FixedAccountService.checkOverdueFixedAccounts(userId);

    const duration = Date.now() - startTime;

    // Finalizar tracking com sucesso
    await jobTracking.finishJobTracking(executionId, {
      newTransactions: result.newTransactions,
      updatedAccounts: result.updatedAccounts,
      errors: result.errors,
      metadata: { 
        processed: result.processed,
        duration
      }
    });

    logger.info(`[JOB:fixed_account_processing] Concluído com sucesso em ${duration}ms. Contas processadas: ${result.processed}, Novos lançamentos: ${result.newTransactions}, Contas atualizadas: ${result.updatedAccounts}, Erros: ${result.errors}`);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Registrar falha no tracking
    if (executionId) {
      await jobTracking.failJobTracking(executionId, error);
    }
    
    logger.error(`[JOB:fixed_account_processing] Falhou após ${duration}ms. Erro: ${error.message}`, {
      error: error.stack,
      userId,
      duration
    });
    
    throw error;
  }
}

/**
 * Cria notificações para contas fixas vencidas e próximas do vencimento.
 * @param {number} userId - ID do usuário (opcional, se não fornecido, processa todos os usuários).
 * @returns {Promise<void>}
 */
async function createFixedAccountNotifications(userId = null) {
  let executionId = null;
  const startTime = Date.now();
  
  try {
    // Iniciar tracking
    const execution = await jobTracking.startJobTracking('fixed_account_notifications');
    executionId = execution.id;

    logger.info(`[JOB:fixed_account_notifications] Iniciando criação de notificações para contas fixas${userId ? ` para usuário ${userId}` : ' para todos os usuários'}`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    let notificationsCreated = 0;
    let usersProcessed = 0;
    let accountsChecked = 0;

    // Buscar usuários (todos ou um específico)
    const users = userId ? await User.findByPk(userId) : await User.findAll();
    const userList = userId ? [users] : users;

    logger.info(`[JOB:fixed_account_notifications] Processando ${userList.length} usuário(s)`);

    for (const user of userList) {
      if (!user) continue;
      usersProcessed++;

      try {
        // Buscar contas fixas do usuário que precisam de notificação
        const fixedAccounts = await FixedAccount.findAll({
          where: {
            user_id: user.id,
            is_active: true,
            is_paid: false,
            next_due_date: {
              [Op.lte]: threeDaysFromNow
            }
          },
          include: [
            { model: Category, as: 'category' },
            { model: Supplier, as: 'supplier' }
          ]
        });

        accountsChecked += fixedAccounts.length;

        for (const fixedAccount of fixedAccounts) {
          const daysUntilDue = Math.ceil((new Date(fixedAccount.next_due_date) - today) / (1000 * 60 * 60 * 24));
          
          let notificationType = '';
          let title = '';
          let message = '';
          let priority = 'medium';

          if (daysUntilDue < 0) {
            // Conta vencida
            notificationType = 'fixed_account_overdue';
            title = 'Conta Fixa Vencida';
            message = `A conta fixa "${fixedAccount.description}" venceu há ${Math.abs(daysUntilDue)} dia(s). Valor: R$ ${parseFloat(fixedAccount.amount).toFixed(2)}`;
            priority = 'urgent';
          } else if (daysUntilDue === 0) {
            // Vence hoje
            notificationType = 'fixed_account_due_today';
            title = 'Conta Fixa Vence Hoje';
            message = `A conta fixa "${fixedAccount.description}" vence hoje. Valor: R$ ${parseFloat(fixedAccount.amount).toFixed(2)}`;
            priority = 'high';
          } else if (daysUntilDue <= 3) {
            // Vence em breve
            notificationType = 'fixed_account_due';
            title = 'Conta Fixa Vence em Breve';
            message = `A conta fixa "${fixedAccount.description}" vence em ${daysUntilDue} dia(s). Valor: R$ ${parseFloat(fixedAccount.amount).toFixed(2)}`;
            priority = 'medium';
          }

          if (notificationType) {
            // Verificar se já existe notificação similar recente
            const existingNotification = await Notification.findOne({
              where: {
                user_id: user.id,
                type: notificationType,
                related_type: 'fixed_account',
                related_id: fixedAccount.id,
                created_at: {
                  [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
                }
              }
            });

            if (!existingNotification) {
              await Notification.create({
                user_id: user.id,
                title,
                message,
                type: notificationType,
                priority,
                related_type: 'fixed_account',
                related_id: fixedAccount.id,
                is_read: false,
                is_active: true
              });
              notificationsCreated++;
            }
          }
        }

      } catch (error) {
        logger.error(`[JOB:fixed_account_notifications] Erro ao processar notificações para usuário ${user.id}: ${error.message}`, {
          error: error.stack,
          userId: user.id
        });
      }
    }

    const duration = Date.now() - startTime;

    // Finalizar tracking com sucesso
    await jobTracking.finishJobTracking(executionId, {
      notificationsCreated,
      accountsChecked,
      metadata: { 
        usersProcessed,
        duration
      }
    });

    logger.info(`[JOB:fixed_account_notifications] Concluído com sucesso em ${duration}ms. Usuários processados: ${usersProcessed}, Contas verificadas: ${accountsChecked}, Notificações criadas: ${notificationsCreated}`);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Registrar falha no tracking
    if (executionId) {
      await jobTracking.failJobTracking(executionId, error);
    }
    
    logger.error(`[JOB:fixed_account_notifications] Falhou após ${duration}ms. Erro: ${error.message}`, {
      error: error.stack,
      userId,
      duration
    });
  }
}

/**
 * Inicializa os jobs de contas fixas.
 * @returns {void}
 */
function initializeFixedAccountJobs() {
  logger.info('Inicializando jobs de contas fixas...');

  // Job para processar contas fixas vencidas (diariamente às 6h)
  cron.schedule('0 6 * * *', async () => {
    logger.info('Executando job de processamento de contas fixas...');
    try {
      await executeWithTimeout('fixed_account_processing', processOverdueFixedAccounts);
    } catch (error) {
      logger.error('Job de processamento de contas fixas falhou:', error);
    }
  });

  // Job para notificações de contas fixas (a cada 4 horas)
  cron.schedule('0 */4 * * *', async () => {
    logger.info('Executando job de notificações de contas fixas...');
    try {
      await executeWithTimeout('fixed_account_notifications', createFixedAccountNotifications);
    } catch (error) {
      logger.error('Job de notificações de contas fixas falhou:', error);
    }
  });

  logger.info('Jobs de contas fixas inicializados com sucesso.');
}

/**
 * Executa todos os jobs de contas fixas manualmente.
 * @param {number} userId - ID do usuário (opcional).
 * @returns {Promise<void>}
 */
async function runAllFixedAccountJobs(userId = null) {
  try {
    logger.info('Executando todos os jobs de contas fixas...');
    await executeWithTimeout('fixed_account_processing', processOverdueFixedAccounts, { userId });
    await executeWithTimeout('fixed_account_notifications', createFixedAccountNotifications, { userId });
    logger.info('Todos os jobs de contas fixas executados com sucesso.');
  } catch (error) {
    logger.error('Erro ao executar jobs de contas fixas:', error);
  }
}

/**
 * Executa um job específico de contas fixas.
 * @param {string} jobName - Nome do job.
 * @param {Function} jobFunction - Função do job.
 * @param {number} userId - ID do usuário (opcional).
 * @returns {Promise<void>}
 */
async function runSpecificFixedAccountJob(jobName, jobFunction, userId = null) {
  try {
    logger.info(`Executando job específico de contas fixas: ${jobName}`);
    await executeWithTimeout(jobName, jobFunction, { userId });
    logger.info(`Job ${jobName} executado com sucesso.`);
  } catch (error) {
    logger.error(`Erro ao executar job ${jobName}:`, error);
    throw error;
  }
}

module.exports = {
  processOverdueFixedAccounts,
  createFixedAccountNotifications,
  initializeFixedAccountJobs,
  runAllFixedAccountJobs,
  runSpecificFixedAccountJob,
  calculateNextDueDate
}; 