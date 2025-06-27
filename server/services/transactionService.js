/**
 * Serviço para gerenciar a criação automática de transações
 * Integra transações com contas a pagar, receber, fixas e financiamentos
 */
const { Transaction, Category, Account } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');
const cacheService = require('./cacheService');
const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');

class TransactionService {
  /**
   * Cria uma nova transação e atualiza o saldo da conta
   */
  async createTransaction(userId, transactionData) {
    const t = await sequelize.transaction();
    
    try {
      const { account_id, category_id, type, amount, description, date } = transactionData;

      // Busca a conta
      const account = await Account.findOne({
        where: { id: account_id, user_id: userId },
        transaction: t
      });

      if (!account) {
        throw new AppError('Conta não encontrada', 404);
      }

      // Calcula o novo saldo
      const newBalance = type === 'income' 
        ? Number(account.balance) + Number(amount)
        : Number(account.balance) - Number(amount);

      // Atualiza o saldo da conta
      await account.update({ balance: newBalance }, { transaction: t });

      // Cria a transação
      const transaction = await Transaction.create({
        user_id: userId,
        account_id,
        category_id,
        type,
        amount,
        description,
        date: date || new Date()
      }, { transaction: t });

      await t.commit();

      // Invalida cache relacionado
      await this.invalidateUserCache(userId);

      logger.info(`Transação criada: ID ${transaction.id}, Usuário ${userId}, Valor ${amount}`);

      return {
        transaction,
        newBalance
      };
    } catch (error) {
      await t.rollback();
      logger.error(`Erro ao criar transação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza uma transação existente e recalcula saldos
   */
  async updateTransaction(userId, transactionId, updateData) {
    const t = await sequelize.transaction();
    
    try {
      const { type, amount, category_id, description, date } = updateData;

      // Busca a transação
      const transaction = await Transaction.findOne({
        where: { id: transactionId, user_id: userId },
        transaction: t
      });

      if (!transaction) {
        throw new AppError('Transação não encontrada', 404);
      }

      // Busca a conta
      const account = await Account.findOne({
        where: { id: transaction.account_id, user_id: userId },
        transaction: t
      });

      if (!account) {
        throw new AppError('Conta não encontrada', 404);
      }

      // Reverte o saldo da transação antiga
      const oldBalance = transaction.type === 'income' 
        ? Number(account.balance) - Number(transaction.amount)
        : Number(account.balance) + Number(transaction.amount);

      // Aplica o novo saldo
      const newBalance = type === 'income' 
        ? oldBalance + Number(amount)
        : oldBalance - Number(amount);

      // Atualiza a conta
      await account.update({ balance: newBalance }, { transaction: t });

      // Atualiza a transação
      await transaction.update({
        type,
        amount,
        category_id,
        description,
        date: date || transaction.date
      }, { transaction: t });

      await t.commit();

      // Invalida cache relacionado
      await this.invalidateUserCache(userId);

      logger.info(`Transação atualizada: ID ${transactionId}, Usuário ${userId}`);

      return {
        transaction,
        newBalance
      };
    } catch (error) {
      await t.rollback();
      logger.error(`Erro ao atualizar transação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove uma transação e reverte o saldo da conta
   */
  async deleteTransaction(userId, transactionId) {
    const t = await sequelize.transaction();
    
    try {
      // Busca a transação
      const transaction = await Transaction.findOne({
        where: { id: transactionId, user_id: userId },
        transaction: t
      });

      if (!transaction) {
        throw new AppError('Transação não encontrada', 404);
      }

      // Busca a conta
      const account = await Account.findOne({
        where: { id: transaction.account_id, user_id: userId },
        transaction: t
      });

      if (!account) {
        throw new AppError('Conta não encontrada', 404);
      }

      // Reverte o saldo
      const newBalance = transaction.type === 'income' 
        ? Number(account.balance) - Number(transaction.amount)
        : Number(account.balance) + Number(transaction.amount);

      // Atualiza a conta
      await account.update({ balance: newBalance }, { transaction: t });

      // Remove a transação
      await transaction.destroy({ transaction: t });

      await t.commit();

      // Invalida cache relacionado
      await this.invalidateUserCache(userId);

      logger.info(`Transação removida: ID ${transactionId}, Usuário ${userId}`);

      return { newBalance };
    } catch (error) {
      await t.rollback();
      logger.error(`Erro ao remover transação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista transações com filtros
   */
  async getTransactions(userId, filters = {}) {
    const { startDate, endDate, type, category_id, account_id } = filters;

    const where = { user_id: userId };
    
    if (startDate) where.date = { ...where.date, [Op.gte]: startDate };
    if (endDate) where.date = { ...where.date, [Op.lte]: endDate };
    if (type) where.type = type;
    if (category_id) where.category_id = category_id;
    if (account_id) where.account_id = account_id;

    return await Transaction.findAll({
      where,
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['bank_name', 'account_type']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['name', 'color', 'is_default']
        }
      ],
      order: [['date', 'DESC']]
    });
  }

  /**
   * Busca uma transação específica
   */
  async getTransaction(userId, transactionId) {
    const transaction = await Transaction.findOne({
      where: { id: transactionId, user_id: userId },
      include: [
        { model: Account, as: 'account' },
        { model: Category, as: 'category' }
      ]
    });

    if (!transaction) {
      throw new AppError('Transação não encontrada', 404);
    }

    return transaction;
  }

  /**
   * Obtém estatísticas de transações (com cache)
   */
  async getTransactionStats(userId, period = 'month') {
    const cacheKey = `transaction:stats:${userId}:${period}`;
    
    return await cacheService.getStats(cacheKey, async () => {
      const currentDate = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(currentDate.getMonth() / 3);
          startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(currentDate.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      }

      const transactions = await Transaction.findAll({
        where: {
          user_id: userId,
          date: { [Op.gte]: startDate }
        }
      });

      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const netAmount = totalIncome - totalExpenses;
      const transactionCount = transactions.length;

      return {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netAmount: Math.round(netAmount * 100) / 100,
        transactionCount,
        period,
        startDate: startDate.toISOString(),
        endDate: currentDate.toISOString()
      };
    }, 1800); // 30 minutos
  }

  /**
   * Obtém dados de timeline para gráficos
   */
  async getTimelineData(userId, period = 'month') {
    const cacheKey = `transaction:timeline:${userId}:${period}`;
    
    return await cacheService.getStats(cacheKey, async () => {
      const currentDate = new Date();
      const data = [];
      
      let intervals, intervalType;
      switch (period) {
        case 'week':
          intervals = 7;
          intervalType = 'day';
          break;
        case 'month':
          intervals = 30;
          intervalType = 'day';
          break;
        case 'quarter':
          intervals = 12;
          intervalType = 'week';
          break;
        case 'year':
          intervals = 12;
          intervalType = 'month';
          break;
        default:
          intervals = 30;
          intervalType = 'day';
      }

      for (let i = intervals - 1; i >= 0; i--) {
        let startDate, endDate, label;
        
        if (intervalType === 'day') {
          startDate = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
          label = startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } else if (intervalType === 'week') {
          startDate = new Date(currentDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
          label = `Semana ${Math.ceil((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
        } else {
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
          label = startDate.toLocaleDateString('pt-BR', { month: 'short' });
        }

        const transactions = await Transaction.findAll({
          where: {
            user_id: userId,
            date: { [Op.between]: [startDate, endDate] }
          }
        });

        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
        const expenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        data.push({
          label,
          date: startDate.toISOString(),
          income: Math.round(income * 100) / 100,
          expenses: Math.round(expenses * 100) / 100,
          net: Math.round((income - expenses) * 100) / 100,
          count: transactions.length
        });
      }

      return { timeline: data };
    }, 1800); // 30 minutos
  }

  /**
   * Obtém dados de categorias para gráficos
   */
  async getCategoryChartData(userId, period = 'month') {
    const cacheKey = `transaction:categories:${userId}:${period}`;
    
    return await cacheService.getStats(cacheKey, async () => {
      const currentDate = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(currentDate.getMonth() / 3);
          startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(currentDate.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      }

      const transactions = await Transaction.findAll({
        where: {
          user_id: userId,
          date: { [Op.gte]: startDate }
        },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['name', 'type', 'color']
        }]
      });

      const categoryData = transactions
        .filter(t => t.category)
        .reduce((acc, t) => {
          const categoryName = t.category.name;
          if (!acc[categoryName]) {
            acc[categoryName] = {
              name: categoryName,
              type: t.category.type,
              color: t.category.color,
              total: 0,
              count: 0
            };
          }
          acc[categoryName].total += parseFloat(t.amount || 0);
          acc[categoryName].count++;
          return acc;
        }, {});

      const incomeCategories = Object.values(categoryData)
        .filter(cat => cat.type === 'income')
        .map(cat => ({
          ...cat,
          total: Math.round(cat.total * 100) / 100
        }))
        .sort((a, b) => b.total - a.total);

      const expenseCategories = Object.values(categoryData)
        .filter(cat => cat.type === 'expense')
        .map(cat => ({
          ...cat,
          total: Math.round(cat.total * 100) / 100
        }))
        .sort((a, b) => b.total - a.total);

      return {
        income: incomeCategories,
        expenses: expenseCategories
      };
    }, 1800); // 30 minutos
  }

  /**
   * Invalida cache do usuário
   */
  async invalidateUserCache(userId) {
    try {
      await cacheService.invalidateUserCache(userId);
      await cacheService.delPattern(`transaction:*:${userId}:*`);
      logger.debug(`Cache invalidado para usuário ${userId}`);
    } catch (error) {
      logger.warn(`Erro ao invalidar cache do usuário ${userId}: ${error.message}`);
    }
  }

  /**
   * Cria uma transação a partir de um pagamento de conta a pagar
   * @param {Object} paymentData - Dados do pagamento
   * @param {Object} payableData - Dados da conta a pagar
   * @param {Object} options - Opções do Sequelize
   * @returns {Promise<Transaction>}
   */
  static async createFromPayablePayment(paymentData, payableData, options = {}) {
    try {
      const transactionData = {
        user_id: payableData.user_id,
        account_id: paymentData.account_id,
        category_id: payableData.category_id,
        supplier_id: payableData.supplier_id,
        type: 'expense',
        amount: paymentData.amount,
        description: `Pagamento: ${payableData.description}`,
        payment_method: paymentData.payment_method || payableData.payment_method,
        payment_date: paymentData.payment_date,
        date: paymentData.payment_date
      };

      const transaction = await Transaction.create(transactionData, {
        ...options,
        transaction: options.transaction
      });

      logger.info(`Transação criada a partir do pagamento de conta a pagar ID: ${payableData.id}`, {
        transaction_id: transaction.id,
        payable_id: payableData.id,
        amount: paymentData.amount
      });

      return transaction;
    } catch (error) {
      logger.error('Erro ao criar transação a partir de pagamento de conta a pagar', {
        error: error.message,
        payable_id: payableData.id,
        payment_data: paymentData
      });
      throw error;
    }
  }

  /**
   * Cria uma transação a partir de um recebimento de conta a receber
   * @param {Object} paymentData - Dados do recebimento
   * @param {Object} receivableData - Dados da conta a receber
   * @param {Object} options - Opções do Sequelize
   * @returns {Promise<Transaction>}
   */
  static async createFromReceivablePayment(paymentData, receivableData, options = {}) {
    try {
      const isPartialPayment = paymentData.amount < receivableData.amount;
      const description = isPartialPayment 
        ? `Recebimento parcial: ${receivableData.description} (${paymentData.amount}/${receivableData.amount})`
        : `Recebimento: ${receivableData.description}`;

      const transactionData = {
        user_id: receivableData.user_id,
        account_id: paymentData.account_id,
        category_id: receivableData.category_id,
        type: 'income',
        amount: paymentData.amount,
        description: description,
        payment_method: paymentData.payment_method,
        payment_date: paymentData.payment_date,
        date: paymentData.payment_date
      };

      const transaction = await Transaction.create(transactionData, {
        ...options,
        transaction: options.transaction
      });

      logger.info(`Transação criada a partir do recebimento de conta a receber ID: ${receivableData.id}`, {
        transaction_id: transaction.id,
        receivable_id: receivableData.id,
        amount: paymentData.amount,
        is_partial: isPartialPayment
      });

      return transaction;
    } catch (error) {
      logger.error('Erro ao criar transação a partir de recebimento de conta a receber', {
        error: error.message,
        receivable_id: receivableData.id,
        payment_data: paymentData
      });
      throw error;
    }
  }

  /**
   * Cria uma transação a partir de um pagamento de financiamento
   * @param {Object} financingPaymentData - Dados do pagamento de financiamento
   * @param {Object} options - Opções do Sequelize
   * @returns {Promise<Transaction>}
   */
  static async createFromFinancingPayment(financingPaymentData, options = {}) {
    try {
      const description = `Parcela ${financingPaymentData.installment_number} - Financiamento`;
      
      const transactionData = {
        user_id: financingPaymentData.user_id,
        account_id: financingPaymentData.account_id,
        type: 'expense',
        amount: financingPaymentData.payment_amount,
        description: description,
        payment_method: financingPaymentData.payment_method,
        payment_date: financingPaymentData.payment_date,
        date: financingPaymentData.payment_date
      };

      const transaction = await Transaction.create(transactionData, {
        ...options,
        transaction: options.transaction
      });

      logger.info(`Transação criada a partir do pagamento de financiamento ID: ${financingPaymentData.id}`, {
        transaction_id: transaction.id,
        financing_payment_id: financingPaymentData.id,
        installment_number: financingPaymentData.installment_number,
        amount: financingPaymentData.payment_amount
      });

      return transaction;
    } catch (error) {
      logger.error('Erro ao criar transação a partir de pagamento de financiamento', {
        error: error.message,
        financing_payment_id: financingPaymentData.id,
        payment_data: financingPaymentData
      });
      throw error;
    }
  }

  /**
   * Cria uma transação a partir de uma conta fixa
   * @param {Object} fixedAccountData - Dados da conta fixa
   * @param {Object} options - Opções do Sequelize
   * @returns {Promise<Transaction>}
   */
  static async createFromFixedAccount(fixedAccountData, options = {}) {
    try {
      const transactionData = {
        user_id: fixedAccountData.user_id,
        account_id: fixedAccountData.account_id,
        category_id: fixedAccountData.category_id,
        supplier_id: fixedAccountData.supplier_id,
        fixed_account_id: fixedAccountData.id,
        type: fixedAccountData.type || 'expense',
        amount: fixedAccountData.amount,
        description: `Conta Fixa: ${fixedAccountData.description}`,
        payment_method: fixedAccountData.payment_method,
        payment_date: fixedAccountData.payment_date || new Date(),
        date: fixedAccountData.date || fixedAccountData.payment_date || new Date()
      };

      const transaction = await Transaction.create(transactionData, {
        ...options,
        transaction: options.transaction
      });

      logger.info(`Transação criada a partir da conta fixa ID: ${fixedAccountData.id}`, {
        transaction_id: transaction.id,
        fixed_account_id: fixedAccountData.id,
        type: transactionData.type,
        amount: fixedAccountData.amount
      });

      return transaction;
    } catch (error) {
      logger.error('Erro ao criar transação a partir de conta fixa', {
        error: error.message,
        fixed_account_id: fixedAccountData.id,
        fixed_account_data: fixedAccountData
      });
      throw error;
    }
  }

  /**
   * Cria duas transações a partir de um investimento (compra/venda)
   * Uma transação de débito da conta de origem e outra de crédito na conta de destino
   * @param {Object} investmentData - Dados do investimento
   * @param {Object} options - Opções do Sequelize
   * @returns {Promise<Array<Transaction>>}
   */
  static async createFromInvestment(investmentData, options = {}) {
    try {
      const transactions = [];

      // Transação 1: Débito da conta de origem
      const debitTransactionData = {
        user_id: investmentData.user_id,
        account_id: investmentData.source_account_id,
        category_id: investmentData.category_id,
        investment_id: investmentData.id,
        type: 'expense',
        amount: investmentData.invested_amount,
        description: `${investmentData.operation_type === 'compra' ? 'Compra' : 'Venda'} de ${investmentData.asset_name} - Débito`,
        payment_method: investmentData.broker || 'transfer',
        payment_date: investmentData.operation_date,
        date: investmentData.operation_date
      };

      const debitTransaction = await Transaction.create(debitTransactionData, {
        ...options,
        transaction: options.transaction
      });

      transactions.push(debitTransaction);

      // Transação 2: Crédito na conta de destino
      const creditTransactionData = {
        user_id: investmentData.user_id,
        account_id: investmentData.destination_account_id,
        category_id: investmentData.category_id,
        investment_id: investmentData.id,
        type: 'income',
        amount: investmentData.invested_amount,
        description: `${investmentData.operation_type === 'compra' ? 'Compra' : 'Venda'} de ${investmentData.asset_name} - Crédito`,
        payment_method: investmentData.broker || 'transfer',
        payment_date: investmentData.operation_date,
        date: investmentData.operation_date
      };

      const creditTransaction = await Transaction.create(creditTransactionData, {
        ...options,
        transaction: options.transaction
      });

      transactions.push(creditTransaction);

      logger.info(`Duas transações criadas a partir do investimento ID: ${investmentData.id}`, {
        investment_id: investmentData.id,
        debit_transaction_id: debitTransaction.id,
        credit_transaction_id: creditTransaction.id,
        amount: investmentData.invested_amount,
        operation_type: investmentData.operation_type
      });

      return transactions;
    } catch (error) {
      logger.error('Erro ao criar transações a partir de investimento', {
        error: error.message,
        investment_id: investmentData.id,
        investment_data: investmentData
      });
      throw error;
    }
  }

  /**
   * Cria duas transações a partir de um aporte de investimento
   * Uma transação de débito da conta de origem e outra de crédito na conta de destino
   * @param {Object} contributionData - Dados do aporte
   * @param {Object} options - Opções do Sequelize
   * @returns {Promise<Array<Transaction>>}
   */
  static async createFromInvestmentContribution(contributionData, options = {}) {
    try {
      const transactions = [];

      // Transação 1: Débito da conta de origem
      const debitTransactionData = {
        user_id: contributionData.user_id,
        account_id: contributionData.source_account_id,
        category_id: null, // Aporte não tem categoria específica
        investment_contribution_id: contributionData.id,
        type: 'expense',
        amount: contributionData.amount,
        description: `Aporte em ${contributionData.investment?.asset_name || 'Investimento'} - Débito`,
        payment_method: contributionData.broker || 'transfer',
        payment_date: contributionData.contribution_date,
        date: contributionData.contribution_date
      };

      const debitTransaction = await Transaction.create(debitTransactionData, {
        ...options,
        transaction: options.transaction
      });

      transactions.push(debitTransaction);

      // Transação 2: Crédito na conta de destino
      const creditTransactionData = {
        user_id: contributionData.user_id,
        account_id: contributionData.destination_account_id,
        category_id: null, // Aporte não tem categoria específica
        investment_contribution_id: contributionData.id,
        type: 'income',
        amount: contributionData.amount,
        description: `Aporte em ${contributionData.investment?.asset_name || 'Investimento'} - Crédito`,
        payment_method: contributionData.broker || 'transfer',
        payment_date: contributionData.contribution_date,
        date: contributionData.contribution_date
      };

      const creditTransaction = await Transaction.create(creditTransactionData, {
        ...options,
        transaction: options.transaction
      });

      transactions.push(creditTransaction);

      logger.info(`Duas transações criadas a partir do aporte ID: ${contributionData.id}`, {
        contribution_id: contributionData.id,
        debit_transaction_id: debitTransaction.id,
        credit_transaction_id: creditTransaction.id,
        amount: contributionData.amount
      });

      return transactions;
    } catch (error) {
      logger.error('Erro ao criar transações a partir de aporte de investimento', {
        error: error.message,
        contribution_id: contributionData.id,
        contribution_data: contributionData
      });
      throw error;
    }
  }

  /**
   * Atualiza o saldo da conta após criar uma transação
   * @param {number} accountId - ID da conta
   * @param {number} amount - Valor da transação
   * @param {string} type - Tipo da transação (income/expense)
   * @param {Object} options - Opções do Sequelize
   * @returns {Promise<void>}
   */
  static async updateAccountBalance(accountId, amount, type, options = {}) {
    try {
      const { Account } = require('../models');
      const account = await Account.findByPk(accountId, { transaction: options.transaction });
      
      if (!account) {
        throw new Error(`Conta ID ${accountId} não encontrada`);
      }

      const balanceChange = type === 'income' ? amount : -amount;
      await account.update({
        balance: account.balance + balanceChange
      }, { transaction: options.transaction });

      logger.info(`Saldo da conta ${accountId} atualizado`, {
        account_id: accountId,
        balance_change: balanceChange,
        new_balance: account.balance + balanceChange
      });
    } catch (error) {
      logger.error('Erro ao atualizar saldo da conta', {
        error: error.message,
        account_id: accountId,
        amount,
        type
      });
      throw error;
    }
  }

  /**
   * Remove uma transação e reverte o saldo da conta
   * @param {number} transactionId - ID da transação
   * @param {Object} options - Opções do Sequelize
   * @returns {Promise<void>}
   */
  static async removeTransaction(transactionId, options = {}) {
    try {
      const transaction = await Transaction.findByPk(transactionId, {
        transaction: options.transaction
      });

      if (!transaction) {
        throw new Error(`Transação ID ${transactionId} não encontrada`);
      }

      // Reverte o saldo da conta
      await this.updateAccountBalance(
        transaction.account_id,
        transaction.amount,
        transaction.type === 'income' ? 'expense' : 'income',
        options
      );

      // Remove a transação
      await transaction.destroy({ transaction: options.transaction });

      logger.info(`Transação ${transactionId} removida e saldo revertido`);
    } catch (error) {
      logger.error('Erro ao remover transação', {
        error: error.message,
        transaction_id: transactionId
      });
      throw error;
    }
  }
}

module.exports = new TransactionService(); 