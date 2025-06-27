/**
 * Service para gerenciamento de pagamentos de financiamentos
 * Implementa CRUD de pagamentos, cálculos e integração com transações
 */
const { FinancingPayment, Financing, Account, Transaction, Category, Creditor, sequelize } = require('../models');
const { 
  createFinancingPaymentSchema, 
  updateFinancingPaymentSchema, 
  listFinancingPaymentsSchema,
  payInstallmentSchema,
  earlyPaymentSchema
} = require('../utils/financingPaymentValidators');
const {
  generateAmortizationTable,
  calculateUpdatedBalance
} = require('../utils/financingCalculations');
const { ValidationError, NotFoundError } = require('../utils/errors');
const TransactionService = require('./transactionService');
const { logger } = require('../utils/logger');

/**
 * Service responsável por gerenciar pagamentos de financiamentos.
 */
class FinancingPaymentService {
  /**
   * Cria um novo pagamento de financiamento com integração de transação.
   * @param {number} userId - ID do usuário.
   * @param {Object} paymentData - Dados do pagamento.
   * @param {number} paymentData.financing_id - ID do financiamento.
   * @param {number} paymentData.account_id - ID da conta.
   * @param {number} paymentData.installment_number - Número da parcela.
   * @param {number} paymentData.payment_amount - Valor do pagamento.
   * @param {number} paymentData.principal_amount - Valor da amortização.
   * @param {number} paymentData.interest_amount - Valor dos juros.
   * @param {string} paymentData.payment_date - Data do pagamento.
   * @param {string} paymentData.payment_method - Método de pagamento.
   * @param {string} paymentData.payment_type - Tipo de pagamento.
   * @returns {Promise<Object>} Pagamento criado com transação.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se o financiamento ou conta não for encontrado.
   */
  async createFinancingPayment(userId, paymentData) {
    const dbTransaction = await sequelize.transaction();
    
    try {
      // Valida os dados de entrada
      const validatedData = createFinancingPaymentSchema.parse(paymentData);

      // Verifica se o financiamento existe e pertence ao usuário
      const financing = await Financing.findOne({
        where: {
          id: validatedData.financing_id,
          user_id: userId
        },
        transaction: dbTransaction
      });

      if (!financing) {
        throw new NotFoundError('Financiamento não encontrado');
      }

      // Verifica se a conta existe e pertence ao usuário
      const account = await Account.findOne({
        where: {
          id: validatedData.account_id,
          user_id: userId
        },
        transaction: dbTransaction
      });

      if (!account) {
        throw new NotFoundError('Conta não encontrada');
      }

      // Verifica se a parcela já foi paga
      const existingPayment = await FinancingPayment.findOne({
        where: {
          financing_id: validatedData.financing_id,
          installment_number: validatedData.installment_number
        },
        transaction: dbTransaction
      });

      if (existingPayment) {
        throw new ValidationError('Esta parcela já foi paga');
      }

      // Valida se o pagamento não resultará em saldo negativo
      const calculatedBalanceAfter = parseFloat(financing.current_balance) - validatedData.principal_amount;
      if (calculatedBalanceAfter < 0) {
        throw new ValidationError('O pagamento resultaria em saldo devedor negativo');
      }

      // Verifica se há saldo suficiente na conta bancária
      if (account.balance < validatedData.payment_amount) {
        throw new ValidationError('Saldo insuficiente na conta bancária', {
          current_balance: account.balance,
          required_amount: validatedData.payment_amount
        });
      }

      // Cria o pagamento do financiamento
      const payment = await FinancingPayment.create({
        ...validatedData,
        user_id: userId,
        balance_before: parseFloat(financing.current_balance),
        balance_after: parseFloat(financing.current_balance) - validatedData.principal_amount
      }, { transaction: dbTransaction });

      // Cria a transação automaticamente usando o TransactionService
      const transactionRecord = await TransactionService.createFromFinancingPayment(
        { ...payment.toJSON(), account_id: validatedData.account_id },
        { transaction: dbTransaction }
      );

      // Atualiza o saldo da conta
      await TransactionService.updateAccountBalance(
        validatedData.account_id,
        validatedData.payment_amount,
        'expense',
        { transaction: dbTransaction }
      );

      // Atualiza estatísticas do financiamento
      const payments = await FinancingPayment.findAll({
        where: { financing_id: financing.id },
        transaction: dbTransaction
      });

      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.payment_amount), 0);
      const totalInterestPaid = payments.reduce((sum, p) => sum + parseFloat(p.interest_amount), 0);
      const paidInstallments = payments.length;

      await financing.update({
        current_balance: parseFloat(financing.total_amount) - (totalPaid - totalInterestPaid),
        total_paid: totalPaid,
        total_interest_paid: totalInterestPaid,
        paid_installments: paidInstallments,
        status: paidInstallments >= financing.term_months ? 'quitado' : 'ativo'
      }, { transaction: dbTransaction });

      // Confirma a transação
      await dbTransaction.commit();

      // Busca os dados atualizados
      const updatedPayment = await FinancingPayment.findByPk(payment.id, {
        include: [
          {
            model: Transaction,
            as: 'transaction'
          },
          {
            model: Account,
            as: 'account'
          }
        ]
      });

      logger.info('Pagamento de financiamento criado com sucesso', {
        user_id: userId,
        payment_id: payment.id,
        transaction_id: transactionRecord.id,
        financing_id: validatedData.financing_id,
        installment_number: validatedData.installment_number,
        amount: validatedData.payment_amount
      });

      return {
        payment: updatedPayment,
        transaction: transactionRecord
      };

    } catch (error) {
      await dbTransaction.rollback();
      
      logger.error('Erro ao criar pagamento de financiamento', {
        error: error.message,
        user_id: userId,
        payment_data: paymentData
      });

      if (error.name === 'ValidationError' || error.name === 'NotFoundError' || error.name === 'ZodError') {
        throw error;
      }

      throw new Error('Erro ao criar pagamento de financiamento');
    }
  }

  /**
   * Lista pagamentos de financiamentos com filtros e paginação.
   * @param {number} userId - ID do usuário.
   * @param {Object} filters - Filtros de consulta.
   * @param {number} filters.financing_id - Filtrar por financiamento (opcional).
   * @param {string} filters.payment_method - Filtrar por método de pagamento (opcional).
   * @param {string} filters.start_date - Data inicial (opcional).
   * @param {string} filters.end_date - Data final (opcional).
   * @param {number} filters.page - Página (padrão: 1).
   * @param {number} filters.limit - Limite por página (padrão: 10).
   * @returns {Promise<Object>} Lista de pagamentos com paginação e estatísticas.
   */
  async listFinancingPayments(userId, filters = {}) {
    try {
      const validatedFilters = listFinancingPaymentsSchema.parse(filters);
      const where = { user_id: userId };
      
      if (validatedFilters.financing_id) {
        where.financing_id = validatedFilters.financing_id;
      }
      if (validatedFilters.payment_method) {
        where.payment_method = validatedFilters.payment_method;
      }
      if (validatedFilters.start_date || validatedFilters.end_date) {
        where.payment_date = {};
        if (validatedFilters.start_date) {
          where.payment_date.$gte = validatedFilters.start_date;
        }
        if (validatedFilters.end_date) {
          where.payment_date.$lte = validatedFilters.end_date;
        }
      }

      const page = validatedFilters.page || 1;
      const limit = validatedFilters.limit || 10;
      const offset = (page - 1) * limit;

      const result = await FinancingPayment.findAndCountAll({
        where,
        include: [
          {
            model: Financing,
            as: 'financing',
            attributes: ['id', 'description', 'creditor_name', 'total_amount']
          },
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'name', 'type']
          }
        ],
        order: [['payment_date', 'DESC']],
        limit,
        offset
      });

      const totalAmount = await FinancingPayment.sum('payment_amount', { where });
      const totalInterest = await FinancingPayment.sum('interest_amount', { where });
      const totalPrincipal = await FinancingPayment.sum('principal_amount', { where });
      const totalPages = Math.ceil(result.count / limit);

      logger.info('Pagamentos de financiamento listados com sucesso', {
        user_id: userId,
        total_payments: result.count,
        page: page
      });

      return {
        payments: result.rows,
        pagination: {
          total: result.count,
          page,
          limit,
          totalPages
        },
        statistics: {
          totalAmount: totalAmount || 0,
          totalInterest: totalInterest || 0,
          totalPrincipal: totalPrincipal || 0,
          totalPayments: result.count
        }
      };
    } catch (error) {
      logger.error('Erro ao listar pagamentos de financiamento', {
        error: error.message,
        user_id: userId,
        filters: filters
      });

      if (error.name === 'ZodError') {
        throw new ValidationError('Parâmetros de consulta inválidos');
      }

      throw new Error('Erro ao listar pagamentos de financiamento');
    }
  }

  /**
   * Obtém um pagamento específico por ID.
   * @param {number} userId - ID do usuário.
   * @param {number} paymentId - ID do pagamento.
   * @returns {Promise<Object>} Pagamento com dados relacionados.
   * @throws {NotFoundError} Se o pagamento não for encontrado.
   */
  async getFinancingPayment(userId, paymentId) {
    try {
      const payment = await FinancingPayment.findOne({
        where: { id: paymentId, user_id: userId },
        include: [
          {
            model: Financing,
            as: 'financing',
            attributes: ['id', 'description', 'creditor_name', 'total_amount', 'current_balance']
          },
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'name', 'type']
          },
          {
            model: Transaction,
            as: 'transaction'
          }
        ]
      });

      if (!payment) {
        throw new NotFoundError('Pagamento não encontrado');
      }

      logger.info('Pagamento de financiamento obtido com sucesso', {
        user_id: userId,
        payment_id: paymentId
      });

      return { payment };
    } catch (error) {
      logger.error('Erro ao obter pagamento de financiamento', {
        error: error.message,
        user_id: userId,
        payment_id: paymentId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao obter pagamento de financiamento');
    }
  }

  /**
   * Atualiza um pagamento existente.
   * @param {number} userId - ID do usuário.
   * @param {number} paymentId - ID do pagamento.
   * @param {Object} updateData - Dados para atualização.
   * @returns {Promise<Object>} Pagamento atualizado.
   * @throws {NotFoundError} Se o pagamento não for encontrado.
   * @throws {ValidationError} Se os dados forem inválidos.
   */
  async updateFinancingPayment(userId, paymentId, updateData) {
    try {
      // Validar dados de entrada
      const validatedData = updateFinancingPaymentSchema.parse(updateData);

      // Buscar o pagamento
      const payment = await FinancingPayment.findOne({
        where: { id: paymentId, user_id: userId }
      });
      if (!payment) {
        throw new NotFoundError('Pagamento não encontrado');
      }

      // Atualizar o pagamento
      await payment.update(validatedData);

      // Buscar o pagamento atualizado com dados relacionados
      const updatedPayment = await FinancingPayment.findByPk(paymentId, {
        include: [
          {
            model: Financing,
            as: 'financing',
            attributes: ['id', 'description', 'creditor_name']
          },
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'name', 'type']
          }
        ]
      });

      logger.info('Pagamento de financiamento atualizado com sucesso', {
        user_id: userId,
        payment_id: paymentId
      });

      return { payment: updatedPayment };
    } catch (error) {
      logger.error('Erro ao atualizar pagamento de financiamento', {
        error: error.message,
        user_id: userId,
        payment_id: paymentId,
        update_data: updateData
      });

      if (error.name === 'NotFoundError' || error.name === 'ValidationError' || error.name === 'ZodError') {
        throw error;
      }

      throw new Error('Erro ao atualizar pagamento de financiamento');
    }
  }

  /**
   * Remove um pagamento.
   * @param {number} userId - ID do usuário.
   * @param {number} paymentId - ID do pagamento.
   * @returns {Promise<Object>} Resultado da operação.
   * @throws {NotFoundError} Se o pagamento não for encontrado.
   */
  async deleteFinancingPayment(userId, paymentId) {
    try {
      const payment = await FinancingPayment.findOne({
        where: { id: paymentId, user_id: userId }
      });
      if (!payment) {
        throw new NotFoundError('Pagamento não encontrado');
      }

      await payment.destroy();

      logger.info('Pagamento de financiamento removido com sucesso', {
        user_id: userId,
        payment_id: paymentId
      });

      return { message: 'Pagamento removido com sucesso' };
    } catch (error) {
      logger.error('Erro ao remover pagamento de financiamento', {
        error: error.message,
        user_id: userId,
        payment_id: paymentId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao remover pagamento de financiamento');
    }
  }

  /**
   * Registra pagamento de uma parcela específica.
   * @param {number} userId - ID do usuário.
   * @param {number} financingId - ID do financiamento.
   * @param {Object} paymentData - Dados do pagamento.
   * @returns {Promise<Object>} Pagamento registrado.
   */
  async payInstallment(userId, financingId, paymentData) {
    const dbTransaction = await sequelize.transaction();
    
    try {
      const validatedData = payInstallmentSchema.parse(paymentData);

      // Verificar se o financiamento existe
      const financing = await Financing.findOne({
        where: { id: financingId, user_id: userId },
        transaction: dbTransaction
      });
      if (!financing) {
        throw new NotFoundError('Financiamento não encontrado');
      }

      // Verificar se a conta existe
      const account = await Account.findOne({
        where: { id: validatedData.account_id, user_id: userId },
        transaction: dbTransaction
      });
      if (!account) {
        throw new NotFoundError('Conta não encontrada');
      }

      // Verificar se a parcela já foi paga
      const existingPayment = await FinancingPayment.findOne({
        where: {
          financing_id: financingId,
          installment_number: validatedData.installment_number
        },
        transaction: dbTransaction
      });
      if (existingPayment) {
        throw new ValidationError('Esta parcela já foi paga');
      }

      // Gerar tabela de amortização para obter valores da parcela
      const amortizationTable = generateAmortizationTable(
        financing.total_amount,
        financing.interest_rate,
        financing.term_months
      );

      const installment = amortizationTable[validatedData.installment_number - 1];
      if (!installment) {
        throw new ValidationError('Parcela inválida');
      }

      // Criar o pagamento
      const payment = await FinancingPayment.create({
        financing_id: financingId,
        account_id: validatedData.account_id,
        installment_number: validatedData.installment_number,
        payment_amount: installment.payment,
        principal_amount: installment.principal,
        interest_amount: installment.interest,
        payment_date: validatedData.payment_date || new Date(),
        payment_method: validatedData.payment_method || 'pix',
        payment_type: 'regular',
        user_id: userId,
        balance_before: parseFloat(financing.current_balance),
        balance_after: parseFloat(financing.current_balance) - installment.principal
      }, { transaction: dbTransaction });

      // Criar transação
      const transactionRecord = await TransactionService.createFromFinancingPayment(
        { ...payment.toJSON(), account_id: validatedData.account_id },
        { transaction: dbTransaction }
      );

      // Atualizar saldo da conta
      await TransactionService.updateAccountBalance(
        validatedData.account_id,
        installment.payment,
        'expense',
        { transaction: dbTransaction }
      );

      // Atualizar financiamento
      const payments = await FinancingPayment.findAll({
        where: { financing_id: financingId },
        transaction: dbTransaction
      });

      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.payment_amount), 0);
      const totalInterestPaid = payments.reduce((sum, p) => sum + parseFloat(p.interest_amount), 0);
      const paidInstallments = payments.length;

      await financing.update({
        current_balance: parseFloat(financing.total_amount) - (totalPaid - totalInterestPaid),
        total_paid: totalPaid,
        total_interest_paid: totalInterestPaid,
        paid_installments: paidInstallments,
        status: paidInstallments >= financing.term_months ? 'quitado' : 'ativo'
      }, { transaction: dbTransaction });

      await dbTransaction.commit();

      const updatedPayment = await FinancingPayment.findByPk(payment.id, {
        include: [
          { model: Transaction, as: 'transaction' },
          { model: Account, as: 'account' }
        ]
      });

      logger.info('Parcela de financiamento paga com sucesso', {
        user_id: userId,
        financing_id: financingId,
        installment_number: validatedData.installment_number,
        payment_id: payment.id
      });

      return {
        payment: updatedPayment,
        transaction: transactionRecord
      };

    } catch (error) {
      await dbTransaction.rollback();
      
      logger.error('Erro ao pagar parcela de financiamento', {
        error: error.message,
        user_id: userId,
        financing_id: financingId,
        payment_data: paymentData
      });

      if (error.name === 'ValidationError' || error.name === 'NotFoundError' || error.name === 'ZodError') {
        throw error;
      }

      throw new Error('Erro ao pagar parcela de financiamento');
    }
  }

  /**
   * Registra pagamento antecipado de financiamento.
   * @param {number} userId - ID do usuário.
   * @param {number} financingId - ID do financiamento.
   * @param {Object} paymentData - Dados do pagamento antecipado.
   * @returns {Promise<Object>} Pagamento registrado.
   */
  async registerEarlyPayment(userId, financingId, paymentData) {
    const dbTransaction = await sequelize.transaction();
    
    try {
      const validatedData = earlyPaymentSchema.parse(paymentData);

      // Verificar se o financiamento existe
      const financing = await Financing.findOne({
        where: { id: financingId, user_id: userId },
        transaction: dbTransaction
      });
      if (!financing) {
        throw new NotFoundError('Financiamento não encontrado');
      }

      // Verificar se a conta existe
      const account = await Account.findOne({
        where: { id: validatedData.account_id, user_id: userId },
        transaction: dbTransaction
      });
      if (!account) {
        throw new NotFoundError('Conta não encontrada');
      }

      // Calcular desconto de juros
      const discountAmount = validatedData.discount_amount || 0;
      const finalAmount = validatedData.payment_amount - discountAmount;

      // Criar o pagamento antecipado
      const payment = await FinancingPayment.create({
        financing_id: financingId,
        account_id: validatedData.account_id,
        installment_number: null, // Pagamento antecipado não tem número de parcela
        payment_amount: finalAmount,
        principal_amount: validatedData.principal_amount,
        interest_amount: validatedData.interest_amount || 0,
        payment_date: validatedData.payment_date || new Date(),
        payment_method: validatedData.payment_method || 'pix',
        payment_type: 'early',
        discount_amount: discountAmount,
        user_id: userId,
        balance_before: parseFloat(financing.current_balance),
        balance_after: parseFloat(financing.current_balance) - validatedData.principal_amount
      }, { transaction: dbTransaction });

      // Criar transação
      const transactionRecord = await TransactionService.createFromFinancingPayment(
        { ...payment.toJSON(), account_id: validatedData.account_id },
        { transaction: dbTransaction }
      );

      // Atualizar saldo da conta
      await TransactionService.updateAccountBalance(
        validatedData.account_id,
        finalAmount,
        'expense',
        { transaction: dbTransaction }
      );

      // Atualizar financiamento
      const payments = await FinancingPayment.findAll({
        where: { financing_id: financingId },
        transaction: dbTransaction
      });

      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.payment_amount), 0);
      const totalInterestPaid = payments.reduce((sum, p) => sum + parseFloat(p.interest_amount), 0);
      const paidInstallments = payments.filter(p => p.installment_number).length;

      await financing.update({
        current_balance: parseFloat(financing.current_balance) - validatedData.principal_amount,
        total_paid: totalPaid,
        total_interest_paid: totalInterestPaid,
        paid_installments: paidInstallments,
        status: parseFloat(financing.current_balance) - validatedData.principal_amount <= 0 ? 'quitado' : 'ativo'
      }, { transaction: dbTransaction });

      await dbTransaction.commit();

      const updatedPayment = await FinancingPayment.findByPk(payment.id, {
        include: [
          { model: Transaction, as: 'transaction' },
          { model: Account, as: 'account' }
        ]
      });

      logger.info('Pagamento antecipado de financiamento registrado com sucesso', {
        user_id: userId,
        financing_id: financingId,
        payment_id: payment.id,
        amount: finalAmount
      });

      return {
        payment: updatedPayment,
        transaction: transactionRecord
      };

    } catch (error) {
      await dbTransaction.rollback();
      
      logger.error('Erro ao registrar pagamento antecipado', {
        error: error.message,
        user_id: userId,
        financing_id: financingId,
        payment_data: paymentData
      });

      if (error.name === 'ValidationError' || error.name === 'NotFoundError' || error.name === 'ZodError') {
        throw error;
      }

      throw new Error('Erro ao registrar pagamento antecipado');
    }
  }
}

module.exports = new FinancingPaymentService(); 