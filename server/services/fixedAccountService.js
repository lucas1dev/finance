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

  /**
   * Lista todas as contas fixas do usuário com filtros e paginação
   * @param {number} userId - ID do usuário
   * @param {Object} filters - Filtros de consulta
   * @returns {Promise<Object>} Lista de contas fixas com paginação
   */
  static async getFixedAccounts(userId, filters = {}) {
    try {
      const where = { user_id: userId };
      
      if (filters.is_active !== undefined) {
        where.is_active = filters.is_active;
      }
      
      if (filters.category_id) {
        where.category_id = filters.category_id;
      }
      
      if (filters.supplier_id) {
        where.supplier_id = filters.supplier_id;
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      const result = await FixedAccount.findAndCountAll({
        where,
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' },
          { model: Account, as: 'account' }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(result.count / limit);

      logger.info('Contas fixas listadas com sucesso', {
        user_id: userId,
        total_fixed_accounts: result.count,
        page: page
      });

      return {
        fixedAccounts: result.rows,
        pagination: {
          page,
          limit,
          total: result.count,
          pages: totalPages
        }
      };
    } catch (error) {
      logger.error('Erro ao listar contas fixas', {
        error: error.message,
        user_id: userId
      });
      
      throw error;
    }
  }

  /**
   * Obtém uma conta fixa específica por ID
   * @param {number} userId - ID do usuário
   * @param {number} fixedAccountId - ID da conta fixa
   * @returns {Promise<Object>} Conta fixa com dados relacionados
   */
  static async getFixedAccountById(userId, fixedAccountId) {
    try {
      const fixedAccount = await FixedAccount.findOne({
        where: { id: fixedAccountId, user_id: userId },
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' },
          { model: Account, as: 'account' }
        ]
      });

      if (!fixedAccount) {
        throw new Error('Conta fixa não encontrada');
      }

      logger.info('Conta fixa obtida com sucesso', {
        user_id: userId,
        fixed_account_id: fixedAccountId
      });

      return { fixedAccount };
    } catch (error) {
      logger.error('Erro ao obter conta fixa', {
        error: error.message,
        user_id: userId,
        fixed_account_id: fixedAccountId
      });
      
      throw error;
    }
  }

  /**
   * Atualiza uma conta fixa existente
   * @param {number} userId - ID do usuário
   * @param {number} fixedAccountId - ID da conta fixa
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} Conta fixa atualizada
   */
  static async updateFixedAccount(userId, fixedAccountId, updateData) {
    const transaction = await sequelize.transaction();

    try {
      const fixedAccount = await FixedAccount.findOne({
        where: { id: fixedAccountId, user_id: userId }
      });

      if (!fixedAccount) {
        throw new Error('Conta fixa não encontrada');
      }

      // Verificar se a categoria existe (se fornecida)
      if (updateData.category_id) {
        const category = await Category.findOne({
          where: {
            id: updateData.category_id,
            [Op.or]: [
              { user_id: userId },
              { is_default: true }
            ]
          },
          transaction
        });
        
        if (!category) {
          throw new Error('Categoria não encontrada');
        }
      }

      // Verificar se o fornecedor existe (se fornecido)
      if (updateData.supplier_id) {
        const supplier = await Supplier.findOne({
          where: { id: updateData.supplier_id, user_id: userId },
          transaction
        });
        
        if (!supplier) {
          throw new Error('Fornecedor não encontrado');
        }
      }

      // Verificar se a conta bancária existe (se fornecida)
      if (updateData.account_id) {
        const account = await Account.findOne({
          where: { id: updateData.account_id, user_id: userId },
          transaction
        });
        
        if (!account) {
          throw new Error('Conta bancária não encontrada');
        }
      }

      await fixedAccount.update(updateData, { transaction });

      // Carregar associações para retornar dados completos
      await fixedAccount.reload({
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' },
          { model: Account, as: 'account' }
        ],
        transaction
      });

      await transaction.commit();

      logger.info('Conta fixa atualizada com sucesso', {
        user_id: userId,
        fixed_account_id: fixedAccountId
      });

      return { fixedAccount };
    } catch (error) {
      await transaction.rollback();
      
      logger.error('Erro ao atualizar conta fixa', {
        error: error.message,
        user_id: userId,
        fixed_account_id: fixedAccountId
      });
      
      throw error;
    }
  }

  /**
   * Ativa ou desativa uma conta fixa (toggle automático)
   * @param {number} userId - ID do usuário
   * @param {number} fixedAccountId - ID da conta fixa
   * @returns {Promise<Object>} Conta fixa atualizada
   */
  static async toggleFixedAccount(userId, fixedAccountId) {
    try {
      const fixedAccount = await FixedAccount.findOne({
        where: { id: fixedAccountId, user_id: userId }
      });

      if (!fixedAccount) {
        throw new Error('Conta fixa não encontrada');
      }

      // Alternar o valor de is_active
      const newIsActive = !fixedAccount.is_active;
      await fixedAccount.update({ is_active: newIsActive });

      // Carregar associações para retornar dados completos
      await fixedAccount.reload({
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' },
          { model: Account, as: 'account' }
        ]
      });

      logger.info('Status da conta fixa alterado com sucesso', {
        user_id: userId,
        fixed_account_id: fixedAccountId,
        new_status: newIsActive
      });

      return { fixedAccount };
    } catch (error) {
      logger.error('Erro ao alterar status da conta fixa', {
        error: error.message,
        user_id: userId,
        fixed_account_id: fixedAccountId
      });
      
      throw error;
    }
  }

  /**
   * Marca uma conta fixa como paga e cria uma transação
   * @param {number} userId - ID do usuário
   * @param {number} fixedAccountId - ID da conta fixa
   * @param {Object} paymentData - Dados do pagamento
   * @returns {Promise<Object>} Transação criada
   */
  static async payFixedAccount(userId, fixedAccountId, paymentData) {
    const transaction = await sequelize.transaction();

    try {
      const fixedAccount = await FixedAccount.findOne({
        where: { id: fixedAccountId, user_id: userId },
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' }
        ],
        transaction
      });

      if (!fixedAccount) {
        throw new Error('Conta fixa não encontrada');
      }

      if (!fixedAccount.is_active) {
        throw new Error('Conta fixa está inativa');
      }

      // Buscar a primeira conta do usuário ou criar uma padrão
      let account = await Account.findOne({
        where: { user_id: userId },
        transaction
      });

      if (!account) {
        account = await Account.create({
          user_id: userId,
          bank_name: 'Conta Padrão',
          account_type: 'corrente',
          balance: 0,
          description: 'Conta criada automaticamente para transações de contas fixas'
        }, { transaction });
      }

      // Verificar se há saldo suficiente
      if (parseFloat(account.balance) < parseFloat(fixedAccount.amount)) {
        throw new Error('Saldo insuficiente na conta bancária');
      }

      // Criar a transação usando o TransactionService
      const TransactionService = require('./transactionService');
      const financialTransaction = await TransactionService.createFromFixedAccount(
        fixedAccount,
        {
          payment_date: paymentData.payment_date || new Date(),
          account_id: account.id
        },
        { transaction }
      );

      // Atualizar o campo is_paid para true
      await fixedAccount.update({ is_paid: true }, { transaction });

      // Calcular próxima data de vencimento
      const nextDueDate = FixedAccount.calculateNextDueDate(
        fixedAccount.next_due_date,
        fixedAccount.periodicity
      );
      await fixedAccount.update({ next_due_date: nextDueDate }, { transaction });

      await transaction.commit();

      logger.info('Conta fixa paga com sucesso', {
        user_id: userId,
        fixed_account_id: fixedAccountId,
        transaction_id: financialTransaction.id
      });

      return { transaction: financialTransaction };
    } catch (error) {
      await transaction.rollback();
      
      logger.error('Erro ao pagar conta fixa', {
        error: error.message,
        user_id: userId,
        fixed_account_id: fixedAccountId
      });
      
      throw error;
    }
  }

  /**
   * Remove uma conta fixa (soft delete)
   * @param {number} userId - ID do usuário
   * @param {number} fixedAccountId - ID da conta fixa
   * @returns {Promise<Object>} Resultado da operação
   */
  static async deleteFixedAccount(userId, fixedAccountId) {
    try {
      const fixedAccount = await FixedAccount.findOne({
        where: { id: fixedAccountId, user_id: userId }
      });

      if (!fixedAccount) {
        throw new Error('Conta fixa não encontrada');
      }

      await fixedAccount.destroy();

      logger.info('Conta fixa removida com sucesso', {
        user_id: userId,
        fixed_account_id: fixedAccountId
      });

      return { message: 'Conta fixa removida com sucesso' };
    } catch (error) {
      logger.error('Erro ao remover conta fixa', {
        error: error.message,
        user_id: userId,
        fixed_account_id: fixedAccountId
      });
      
      throw error;
    }
  }

  /**
   * Obtém estatísticas das contas fixas do usuário
   * @param {number} userId - ID do usuário
   * @param {Object} filters - Filtros de consulta
   * @returns {Promise<Object>} Estatísticas das contas fixas
   */
  static async getFixedAccountStatistics(userId, filters = {}) {
    try {
      const where = { user_id: userId };

      if (filters.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      // Buscar todas as contas fixas do usuário
      const fixedAccounts = await FixedAccount.findAll({
        where,
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' }
        ]
      });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Calcular estatísticas
      const statistics = {
        total: fixedAccounts.length,
        totalAmount: 0,
        active: 0,
        inactive: 0,
        paid: 0,
        unpaid: 0,
        overdue: 0,
        dueThisMonth: 0,
        dueNextMonth: 0,
        byPeriodicity: {
          daily: 0,
          weekly: 0,
          monthly: 0,
          quarterly: 0,
          yearly: 0
        },
        byCategory: {},
        bySupplier: {},
        totalMonthlyValue: 0,
        totalYearlyValue: 0
      };

      fixedAccounts.forEach(account => {
        // Total de valores
        statistics.totalAmount += parseFloat(account.amount);

        // Status ativo/inativo
        if (account.is_active) {
          statistics.active++;
        } else {
          statistics.inactive++;
        }

        // Status pago/não pago
        if (account.is_paid) {
          statistics.paid++;
        } else {
          statistics.unpaid++;
        }

        // Verificar se está vencida
        const dueDate = new Date(account.next_due_date);
        if (dueDate < today && !account.is_paid) {
          statistics.overdue++;
        }

        // Vencimentos deste mês
        const dueDateMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        if (dueDate >= today && dueDate < nextMonth) {
          statistics.dueThisMonth++;
        }

        // Vencimentos do próximo mês
        const nextNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);
        if (dueDate >= nextMonth && dueDate < nextNextMonth) {
          statistics.dueNextMonth++;
        }

        // Por periodicidade
        statistics.byPeriodicity[account.periodicity]++;

        // Por categoria
        if (account.category) {
          const categoryName = account.category.name;
          if (!statistics.byCategory[categoryName]) {
            statistics.byCategory[categoryName] = {
              count: 0,
              totalAmount: 0,
              color: account.category.color
            };
          }
          statistics.byCategory[categoryName].count++;
          statistics.byCategory[categoryName].totalAmount += parseFloat(account.amount);
        }

        // Por fornecedor
        if (account.supplier) {
          const supplierName = account.supplier.name;
          if (!statistics.bySupplier[supplierName]) {
            statistics.bySupplier[supplierName] = {
              count: 0,
              totalAmount: 0
            };
          }
          statistics.bySupplier[supplierName].count++;
          statistics.bySupplier[supplierName].totalAmount += parseFloat(account.amount);
        }

        // Calcular valor mensal e anual baseado na periodicidade
        const amount = parseFloat(account.amount);
        switch (account.periodicity) {
          case 'daily':
            statistics.totalMonthlyValue += amount * 30;
            statistics.totalYearlyValue += amount * 365;
            break;
          case 'weekly':
            statistics.totalMonthlyValue += amount * 4.33; // 52 semanas / 12 meses
            statistics.totalYearlyValue += amount * 52;
            break;
          case 'monthly':
            statistics.totalMonthlyValue += amount;
            statistics.totalYearlyValue += amount * 12;
            break;
          case 'quarterly':
            statistics.totalMonthlyValue += amount / 3;
            statistics.totalYearlyValue += amount * 4;
            break;
          case 'yearly':
            statistics.totalMonthlyValue += amount / 12;
            statistics.totalYearlyValue += amount;
            break;
        }
      });

      // Converter para números com 2 casas decimais
      statistics.totalAmount = Math.round(statistics.totalAmount * 100) / 100;
      statistics.totalMonthlyValue = Math.round(statistics.totalMonthlyValue * 100) / 100;
      statistics.totalYearlyValue = Math.round(statistics.totalYearlyValue * 100) / 100;

      // Arredondar valores por categoria e fornecedor
      Object.keys(statistics.byCategory).forEach(category => {
        statistics.byCategory[category].totalAmount = Math.round(statistics.byCategory[category].totalAmount * 100) / 100;
      });

      Object.keys(statistics.bySupplier).forEach(supplier => {
        statistics.bySupplier[supplier].totalAmount = Math.round(statistics.bySupplier[supplier].totalAmount * 100) / 100;
      });

      logger.info('Estatísticas de contas fixas obtidas com sucesso', {
        user_id: userId
      });

      return statistics;
    } catch (error) {
      logger.error('Erro ao obter estatísticas de contas fixas', {
        error: error.message,
        user_id: userId
      });
      
      throw error;
    }
  }
}

module.exports = FixedAccountService; 