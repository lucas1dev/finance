/**
 * Serviço para validação de integridade dos dados do sistema.
 * Verifica consistência de notificações, relacionamentos e dados órfãos.
 * 
 * @module services/dataIntegrityService
 */

const { Notification, User, Financing, FinancingPayment, Transaction, Category } = require('../models');
const { logger } = require('../utils/logger');
const emailService = require('./emailService');
const { Op } = require('sequelize');

/**
 * Resultado de uma validação de integridade.
 * @typedef {Object} IntegrityResult
 * @property {string} type - Tipo de problema encontrado
 * @property {string} severity - Severidade (low, medium, high, critical)
 * @property {string} description - Descrição do problema
 * @property {number} count - Quantidade de registros afetados
 * @property {Array} affectedIds - IDs dos registros afetados
 * @property {boolean} autoFixable - Se pode ser corrigido automaticamente
 * @property {string} fixDescription - Descrição da correção aplicada
 */

/**
 * Relatório completo de integridade.
 * @typedef {Object} IntegrityReport
 * @property {Date} timestamp - Data/hora da validação
 * @property {number} totalIssues - Total de problemas encontrados
 * @property {number} criticalIssues - Problemas críticos
 * @property {number} autoFixed - Problemas corrigidos automaticamente
 * @property {Array<IntegrityResult>} issues - Lista de problemas encontrados
 * @property {Object} summary - Resumo por categoria
 */

/**
 * Verifica notificações órfãs (usuário não existe).
 * @returns {Promise<IntegrityResult>}
 */
async function checkOrphanedNotifications() {
  logger.info('[INTEGRITY] Verificando notificações órfãs...');
  
  // Buscar todas as notificações
  const allNotifications = await Notification.findAll({
    attributes: ['id', 'userId', 'title', 'createdAt']
  });

  const userIds = [...new Set(allNotifications.map(n => n.userId))];
  const existingUsers = await User.findAll({
    where: { id: { [Op.in]: userIds } },
    attributes: ['id']
  });

  const existingUserIds = new Set(existingUsers.map(u => u.id));
  const orphaned = allNotifications.filter(n => !existingUserIds.has(n.userId));

  const result = {
    type: 'orphaned_notifications',
    severity: orphaned.length > 0 ? 'high' : 'low',
    description: `Encontradas ${orphaned.length} notificações com usuário inexistente`,
    count: orphaned.length,
    affectedIds: orphaned.map(n => n.id),
    autoFixable: true,
    fixDescription: 'Notificações serão desativadas automaticamente'
  };

  // Aplicar correção automática se possível
  if (orphaned.length > 0 && result.autoFixable) {
    await Notification.update(
      { isActive: false },
      { where: { id: { [Op.in]: orphaned.map(n => n.id) } } }
    );
    result.fixDescription += ` - ${orphaned.length} notificações desativadas`;
    logger.info(`[INTEGRITY] Corrigidas ${orphaned.length} notificações órfãs`);
  }

  return result;
}

/**
 * Verifica notificações duplicadas recentes.
 * @returns {Promise<IntegrityResult>}
 */
async function checkDuplicateNotifications() {
  logger.info('[INTEGRITY] Verificando notificações duplicadas...');
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Buscar notificações das últimas 24h
  const recentNotifications = await Notification.findAll({
    where: {
      createdAt: { [Op.gte]: oneDayAgo }
    },
    attributes: ['id', 'userId', 'type', 'relatedType', 'relatedId', 'title', 'createdAt'],
    order: [['createdAt', 'ASC']]
  });

  // Agrupar por critérios de duplicação
  const groups = {};
  recentNotifications.forEach(notification => {
    const key = `${notification.userId}-${notification.type}-${notification.relatedType}-${notification.relatedId}-${notification.title}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notification);
  });

  // Identificar duplicatas
  const duplicates = [];
  Object.values(groups).forEach(group => {
    if (group.length > 1) {
      // Manter a primeira, marcar as outras como duplicatas
      duplicates.push(...group.slice(1));
    }
  });

  const result = {
    type: 'duplicate_notifications',
    severity: duplicates.length > 10 ? 'medium' : 'low',
    description: `Encontradas ${duplicates.length} notificações duplicadas nas últimas 24h`,
    count: duplicates.length,
    affectedIds: duplicates.map(n => n.id),
    autoFixable: true,
    fixDescription: 'Notificações duplicadas serão removidas automaticamente'
  };

  // Aplicar correção automática
  if (duplicates.length > 0 && result.autoFixable) {
    await Notification.destroy({
      where: { id: { [Op.in]: duplicates.map(n => n.id) } }
    });
    result.fixDescription += ` - ${duplicates.length} duplicatas removidas`;
    logger.info(`[INTEGRITY] Removidas ${duplicates.length} notificações duplicadas`);
  }

  return result;
}

/**
 * Verifica notificações com dados inconsistentes.
 * @returns {Promise<Array<IntegrityResult>>}
 */
async function checkInconsistentNotifications() {
  logger.info('[INTEGRITY] Verificando notificações inconsistentes...');
  
  const issues = [];
  
  // Verificar notificações de pagamento com relatedId inválido
  const paymentNotifications = await Notification.findAll({
    where: {
      relatedType: 'financing_payment',
      relatedId: { [Op.ne]: null }
    }
  });

  if (paymentNotifications.length > 0) {
    const paymentIds = [...new Set(paymentNotifications.map(n => n.relatedId))];
    const existingPayments = await FinancingPayment.findAll({
      where: { id: { [Op.in]: paymentIds } },
      attributes: ['id']
    });

    const existingPaymentIds = new Set(existingPayments.map(p => p.id));
    const invalidPaymentNotifications = paymentNotifications.filter(
      n => !existingPaymentIds.has(n.relatedId)
    );

    if (invalidPaymentNotifications.length > 0) {
      issues.push({
        type: 'invalid_payment_references',
        severity: 'medium',
        description: `${invalidPaymentNotifications.length} notificações referenciam pagamentos inexistentes`,
        count: invalidPaymentNotifications.length,
        affectedIds: invalidPaymentNotifications.map(n => n.id),
        autoFixable: true,
        fixDescription: 'Notificações serão desativadas'
      });
    }
  }

  // Verificar notificações com campos obrigatórios vazios
  const emptyFields = await Notification.findAll({
    where: {
      [Op.or]: [
        { title: { [Op.or]: [null, ''] } },
        { message: { [Op.or]: [null, ''] } },
        { type: { [Op.or]: [null, ''] } }
      ]
    }
  });

  if (emptyFields.length > 0) {
    issues.push({
      type: 'empty_required_fields',
      severity: 'high',
      description: `${emptyFields.length} notificações com campos obrigatórios vazios`,
      count: emptyFields.length,
      affectedIds: emptyFields.map(n => n.id),
      autoFixable: false,
      fixDescription: 'Requer intervenção manual'
    });
  }

  return issues;
}

/**
 * Verifica transações órfãs (sem categoria válida).
 * @returns {Promise<IntegrityResult>}
 */
async function checkOrphanedTransactions() {
  logger.info('[INTEGRITY] Verificando transações órfãs...');
  
  const transactions = await Transaction.findAll({
    where: {
      categoryId: { [Op.ne]: null }
    },
    attributes: ['id', 'categoryId']
  });

  if (transactions.length > 0) {
    const categoryIds = [...new Set(transactions.map(t => t.categoryId))];
    const existingCategories = await Category.findAll({
      where: { id: { [Op.in]: categoryIds } },
      attributes: ['id']
    });

    const existingCategoryIds = new Set(existingCategories.map(c => c.id));
    const orphanedTransactions = transactions.filter(
      t => !existingCategoryIds.has(t.categoryId)
    );

    const result = {
      type: 'orphaned_transactions',
      severity: orphanedTransactions.length > 0 ? 'medium' : 'low',
      description: `${orphanedTransactions.length} transações com categoria inexistente`,
      count: orphanedTransactions.length,
      affectedIds: orphanedTransactions.map(t => t.id),
      autoFixable: true,
      fixDescription: 'Categoria será definida como null'
    };

    // Aplicar correção automática
    if (orphanedTransactions.length > 0 && result.autoFixable) {
      await Transaction.update(
        { categoryId: null },
        { where: { id: { [Op.in]: orphanedTransactions.map(t => t.id) } } }
      );
      result.fixDescription += ` - ${orphanedTransactions.length} transações corrigidas`;
      logger.info(`[INTEGRITY] Corrigidas ${orphanedTransactions.length} transações órfãs`);
    }

    return result;
  }

  return {
    type: 'orphaned_transactions',
    severity: 'low',
    description: 'Nenhuma transação órfã encontrada',
    count: 0,
    affectedIds: [],
    autoFixable: false,
    fixDescription: 'Nenhuma correção necessária'
  };
}

/**
 * Executa todas as validações de integridade.
 * @param {Object} options - Opções de validação.
 * @param {boolean} options.autoFix - Se deve aplicar correções automáticas.
 * @param {boolean} options.sendAlert - Se deve enviar alertas por email.
 * @returns {Promise<IntegrityReport>}
 */
async function runIntegrityCheck(options = {}) {
  const { autoFix = true, sendAlert = true } = options;
  const startTime = Date.now();
  
  logger.info('[INTEGRITY] Iniciando verificação de integridade dos dados...');

  try {
    // Executar todas as validações
    const [
      orphanedNotifications,
      duplicateNotifications,
      inconsistentNotifications,
      orphanedTransactions
    ] = await Promise.all([
      checkOrphanedNotifications(),
      checkDuplicateNotifications(),
      checkInconsistentNotifications(),
      checkOrphanedTransactions()
    ]);

    // Consolidar resultados
    const allIssues = [
      orphanedNotifications,
      duplicateNotifications,
      ...inconsistentNotifications,
      orphanedTransactions
    ].filter(issue => issue.count > 0);

    const totalIssues = allIssues.reduce((sum, issue) => sum + issue.count, 0);
    const criticalIssues = allIssues.filter(issue => issue.severity === 'critical').length;
    const autoFixed = allIssues.filter(issue => issue.autoFixable && autoFix).length;

    const report = {
      timestamp: new Date(),
      totalIssues,
      criticalIssues,
      autoFixed,
      issues: allIssues,
      summary: {
        orphaned_notifications: orphanedNotifications.count,
        duplicate_notifications: duplicateNotifications.count,
        inconsistent_notifications: inconsistentNotifications.reduce((sum, issue) => sum + issue.count, 0),
        orphaned_transactions: orphanedTransactions.count
      }
    };

    const duration = Date.now() - startTime;
    logger.info(`[INTEGRITY] Verificação concluída em ${duration}ms. Problemas encontrados: ${totalIssues}`);

    // Enviar alerta se houver problemas críticos
    if (sendAlert && (criticalIssues > 0 || totalIssues > 10)) {
      await emailService.sendIntegrityAlert(report);
    }

    return report;

  } catch (error) {
    logger.error('[INTEGRITY] Erro durante verificação de integridade:', error);
    throw error;
  }
}

/**
 * Obtém estatísticas de integridade dos dados.
 * @returns {Promise<Object>}
 */
async function getIntegrityStats() {
  const [
    totalNotifications,
    activeNotifications,
    totalTransactions,
    totalUsers
  ] = await Promise.all([
    Notification.count(),
    Notification.count({ where: { isActive: true } }),
    Transaction.count(),
    User.count()
  ]);

  return {
    notifications: {
      total: totalNotifications,
      active: activeNotifications,
      inactive: totalNotifications - activeNotifications
    },
    transactions: {
      total: totalTransactions
    },
    users: {
      total: totalUsers
    },
    lastCheck: new Date()
  };
}

module.exports = {
  runIntegrityCheck,
  getIntegrityStats,
  checkOrphanedNotifications,
  checkDuplicateNotifications,
  checkInconsistentNotifications,
  checkOrphanedTransactions
}; 