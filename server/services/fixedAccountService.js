/**
 * Serviço para gerenciamento de contas fixas
 * Implementa lógica de negócio para criação, verificação, pagamento e notificações
 */
const { FixedAccount, FixedAccountTransaction, Transaction, Account, Category, Supplier, User } = require('../models');
const { sequelize } = require('../models');
const TransactionService = require('./transactionService');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

class FixedAccountService {
  /**
   * Cria uma nova conta fixa com o primeiro lançamento
   * @param {Object} fixedAccountData - Dados da conta fixa
   * @param {Object} options - Opções do Sequelize
   * @returns {Promise<Object>} Conta fixa criada com primeiro lançamento
   */
  static async createFixedAccount(fixedAccountData, options = {}) {
    const transaction = options.transaction || await sequelize.transaction();
    const useTransaction = !options.transaction;

    try {
      // Validar dados obrigatórios
      if (!fixedAccountData.user_id || !fixedAccountData.category_id || 
          !fixedAccountData.amount || !fixedAccountData.start_date || 
          !fixedAccountData.periodicity) {
        throw new Error('Dados obrigatórios não fornecidos');
      }

      // Verificar se a categoria existe e é do tipo correto
      const category = await Category.findByPk(fixedAccountData.category_id, { transaction });
      if (!category) {
        throw new Error('Categoria não encontrada');
      }

      // Verificar se o tipo da conta fixa é compatível com a categoria
      if (fixedAccountData.type && category.type !== fixedAccountData.type) {
        throw new Error(`Categoria deve ser do tipo ${fixedAccountData.type}`);
      }

      // Definir tipo baseado na categoria se não fornecido
      if (!fixedAccountData.type) {
        fixedAccountData.type = category.type;
      }

      // Calcular próxima data de vencimento
      const nextDueDate = FixedAccount.calculateNextDueDate(
        fixedAccountData.start_date, 
        fixedAccountData.periodicity
      );

      // Criar a conta fixa
      const fixedAccount = await FixedAccount.create({
        ...fixedAccountData,
        next_due_date: nextDueDate
      }, { transaction });

      // Criar o primeiro lançamento
      const firstTransaction = await FixedAccountTransaction.create({
        fixed_account_id: fixedAccount.id,
        user_id: fixedAccount.user_id,
        due_date: fixedAccount.start_date,
        amount: fixedAccount.amount,
        status: 'pending'
      }, { transaction });

      if (useTransaction) {
        await transaction.commit();
      }

      logger.info(`Conta fixa criada com sucesso`, {
        fixed_account_id: fixedAccount.id,
        transaction_id: firstTransaction.id,
        type: fixedAccount.type,
        amount: fixedAccount.amount
      });

      return {
        fixedAccount,
        firstTransaction
      };

    } catch (error) {
      if (useTransaction) {
        await transaction.rollback();
      }
      
      logger.error('Erro ao criar conta fixa', {
        error: error.message,
        data: fixedAccountData
      });
      
      throw error;
    }
  }

  /**
   * Verifica contas fixas vencidas e cria novos lançamentos
   * @param {number} userId - ID do usuário (opcional)
   * @param {Object} options - Opções do Sequelize
   * @returns {Promise<Object>} Resultado da verificação
   */
  static async checkOverdueFixedAccounts(userId = null, options = {}) {
    const transaction = options.transaction || await sequelize.transaction();
    const useTransaction = !options.transaction;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const where = {
        is_active: true,
        next_due_date: {
          [Op.lte]: today
        }
      };

      if (userId) {
        where.user_id = userId;
      }

      // Buscar contas fixas vencidas
      const overdueFixedAccounts = await FixedAccount.findAll({
        where,
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' },
          { model: Account, as: 'account' }
        ],
        transaction
      });

      let newTransactions = 0;
      let updatedAccounts = 0;
      let errors = 0;

      for (const fixedAccount of overdueFixedAccounts) {
        try {
          // Verificar se já existe lançamento para a data atual
          const existingTransaction = await FixedAccountTransaction.findOne({
            where: {
              fixed_account_id: fixedAccount.id,
              due_date: fixedAccount.next_due_date
            },
            transaction
          });

          if (existingTransaction) {
            logger.warn(`Lançamento já existe para conta fixa ${fixedAccount.id} na data ${fixedAccount.next_due_date}`);
            continue;
          }

          // Criar novo lançamento
          const newTransaction = await FixedAccountTransaction.create({
            fixed_account_id: fixedAccount.id,
            user_id: fixedAccount.user_id,
            due_date: fixedAccount.next_due_date,
            amount: fixedAccount.amount,
            status: 'pending'
          }, { transaction });

          // Calcular próxima data de vencimento
          const nextDueDate = FixedAccount.calculateNextDueDate(
            fixedAccount.next_due_date,
            fixedAccount.periodicity
          );

          // Atualizar conta fixa
          await fixedAccount.update({
            next_due_date: nextDueDate,
            is_paid: false
          }, { transaction });

          newTransactions++;
          updatedAccounts++;

          logger.info(`Novo lançamento criado para conta fixa ${fixedAccount.id}`, {
            transaction_id: newTransaction.id,
            due_date: fixedAccount.next_due_date,
            next_due_date: nextDueDate
          });

        } catch (error) {
          errors++;
          logger.error(`Erro ao processar conta fixa ${fixedAccount.id}`, {
            error: error.message,
            fixed_account_id: fixedAccount.id
          });
        }
      }

      if (useTransaction) {
        await transaction.commit();
      }

      return {
        processed: overdueFixedAccounts.length,
        newTransactions,
        updatedAccounts,
        errors
      };

    } catch (error) {
      if (useTransaction) {
        await transaction.rollback();
      }
      
      logger.error('Erro ao verificar contas fixas vencidas', {
        error: error.message,
        user_id: userId
      });
      
      throw error;
    }
  }

  /**
   * Registra pagamento de lançamentos de conta fixa
   * @param {Object} paymentData - Dados do pagamento
   * @param {number[]} paymentData.transaction_ids - IDs dos lançamentos
   * @param {string} paymentData.payment_date - Data do pagamento
   * @param {string} paymentData.payment_method - Método de pagamento
   * @param {string} paymentData.observations - Observações
   * @param {number} paymentData.account_id - ID da conta bancária
   * @param {Object} options - Opções do Sequelize
   * @returns {Promise<Object>} Resultado do pagamento
   */
  static async payFixedAccountTransactions(paymentData, options = {}) {
    const transaction = options.transaction || await sequelize.transaction();
    const useTransaction = !options.transaction;

    try {
      const { transaction_ids, payment_date, payment_method, observations, account_id } = paymentData;

      if (!transaction_ids || transaction_ids.length === 0) {
        throw new Error('IDs dos lançamentos são obrigatórios');
      }

      if (!payment_date) {
        throw new Error('Data do pagamento é obrigatória');
      }

      if (!account_id) {
        throw new Error('ID da conta bancária é obrigatório');
      }

      // Verificar se a conta bancária existe
      const account = await Account.findByPk(account_id, { transaction });
      if (!account) {
        throw new Error('Conta bancária não encontrada');
      }

      // Buscar lançamentos
      const transactions = await FixedAccountTransaction.findAll({
        where: {
          id: { [Op.in]: transaction_ids },
          status: { [Op.in]: ['pending', 'overdue'] }
        },
        include: [
          {
            model: FixedAccount,
            as: 'fixedAccount',
            include: [
              { model: Category, as: 'category' },
              { model: Supplier, as: 'supplier' }
            ]
          }
        ],
        transaction
      });

      if (transactions.length === 0) {
        throw new Error('Nenhum lançamento válido encontrado');
      }

      // Verificar se há saldo suficiente (apenas para despesas)
      const totalAmount = transactions.reduce((sum, t) => {
        return sum + (t.fixedAccount.type === 'expense' ? parseFloat(t.amount) : 0);
      }, 0);

      if (totalAmount > 0 && account.balance < totalAmount) {
        throw new Error('Saldo insuficiente na conta bancária');
      }

      const paidTransactions = [];
      const createdTransactions = [];

      for (const fixedAccountTransaction of transactions) {
        try {
          // Criar transação financeira
          const transactionData = {
            user_id: fixedAccountTransaction.user_id,
            account_id: account_id,
            category_id: fixedAccountTransaction.fixedAccount.category_id,
            supplier_id: fixedAccountTransaction.fixedAccount.supplier_id,
            type: fixedAccountTransaction.fixedAccount.type,
            amount: fixedAccountTransaction.amount,
            description: `Conta Fixa: ${fixedAccountTransaction.fixedAccount.description}`,
            payment_method: payment_method || fixedAccountTransaction.fixedAccount.payment_method,
            payment_date: payment_date,
            date: payment_date
          };

          const financialTransaction = await TransactionService.createFromFixedAccount(
            { ...transactionData, id: fixedAccountTransaction.fixedAccount.id },
            { transaction }
          );

          // Atualizar saldo da conta
          await TransactionService.updateAccountBalance(
            account_id,
            fixedAccountTransaction.amount,
            fixedAccountTransaction.fixedAccount.type,
            { transaction }
          );

          // Marcar lançamento como pago
          await fixedAccountTransaction.markAsPaid({
            payment_date,
            payment_method,
            observations,
            transaction_id: financialTransaction.id
          });

          // Verificar se é o lançamento atual da conta fixa
          if (fixedAccountTransaction.due_date === fixedAccountTransaction.fixedAccount.next_due_date) {
            await fixedAccountTransaction.fixedAccount.update({
              is_paid: true
            }, { transaction });
          }

          paidTransactions.push(fixedAccountTransaction);
          createdTransactions.push(financialTransaction);

        } catch (error) {
          logger.error(`Erro ao processar pagamento do lançamento ${fixedAccountTransaction.id}`, {
            error: error.message,
            transaction_id: fixedAccountTransaction.id
          });
          throw error;
        }
      }

      if (useTransaction) {
        await transaction.commit();
      }

      logger.info(`Pagamento de lançamentos de conta fixa registrado`, {
        paid_transactions: paidTransactions.length,
        total_amount: totalAmount,
        account_id: account_id
      });

      return {
        paidTransactions,
        createdTransactions,
        totalAmount
      };

    } catch (error) {
      if (useTransaction) {
        await transaction.rollback();
      }
      
      logger.error('Erro ao registrar pagamento de lançamentos', {
        error: error.message,
        payment_data: paymentData
      });
      
      throw error;
    }
  }

  /**
   * Lista lançamentos de conta fixa com filtros
   * @param {Object} filters - Filtros de consulta
   * @param {number} filters.user_id - ID do usuário
   * @param {string} filters.status - Status dos lançamentos
   * @param {number} filters.category_id - ID da categoria
   * @param {number} filters.supplier_id - ID do fornecedor
   * @param {string} filters.due_date_from - Data de vencimento inicial
   * @param {string} filters.due_date_to - Data de vencimento final
   * @param {number} filters.page - Página
   * @param {number} filters.limit - Limite por página
   * @returns {Promise<Object>} Lista paginada de lançamentos
   */
  static async listFixedAccountTransactions(filters = {}) {
    try {
      const {
        user_id,
        status,
        category_id,
        supplier_id,
        due_date_from,
        due_date_to,
        page = 1,
        limit = 20
      } = filters;

      const where = {};

      if (user_id) {
        where.user_id = user_id;
      }

      if (status) {
        where.status = status;
      }

      if (due_date_from || due_date_to) {
        where.due_date = {};
        if (due_date_from) {
          where.due_date[Op.gte] = due_date_from;
        }
        if (due_date_to) {
          where.due_date[Op.lte] = due_date_to;
        }
      }

      const include = [
        {
          model: FixedAccount,
          as: 'fixedAccount',
          include: [
            { model: Category, as: 'category' },
            { model: Supplier, as: 'supplier' }
          ],
          where: {}
        }
      ];

      if (category_id) {
        include[0].where.category_id = category_id;
      }

      if (supplier_id) {
        include[0].where.supplier_id = supplier_id;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await FixedAccountTransaction.findAndCountAll({
        where,
        include,
        order: [['due_date', 'ASC']],
        limit,
        offset
      });

      return {
        transactions: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error('Erro ao listar lançamentos de conta fixa', {
        error: error.message,
        filters
      });
      
      throw error;
    }
  }

  /**
   * Gera notificações para contas fixas vencendo em breve
   * @param {number} userId - ID do usuário (opcional)
   * @returns {Promise<Object>} Resultado das notificações
   */
  static async generateNotifications(userId = null) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const where = {
        is_active: true,
        is_paid: false
      };

      if (userId) {
        where.user_id = userId;
      }

      const fixedAccounts = await FixedAccount.findAll({
        where,
        include: [
          { model: User, as: 'user' },
          { model: Category, as: 'category' }
        ]
      });

      let notifications = 0;

      for (const fixedAccount of fixedAccounts) {
        if (fixedAccount.isDueSoon()) {
          // Aqui você pode integrar com seu sistema de notificações
          // Por exemplo, enviar email, push notification, etc.
          
          logger.info(`Notificação gerada para conta fixa ${fixedAccount.id}`, {
            user_id: fixedAccount.user_id,
            due_date: fixedAccount.next_due_date,
            reminder_days: fixedAccount.reminder_days
          });

          notifications++;
        }
      }

      return {
        processed: fixedAccounts.length,
        notifications
      };

    } catch (error) {
      logger.error('Erro ao gerar notificações', {
        error: error.message,
        user_id: userId
      });
      
      throw error;
    }
  }
}

module.exports = FixedAccountService; 