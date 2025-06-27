/**
 * Controller para gerenciamento de Pagamentos de Financiamentos (FinancingPayments)
 * Implementa operações CRUD, integração com transações e cálculos automáticos
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
const TransactionService = require('../services/transactionService');
const { logger } = require('../utils/logger');

/**
 * Cria um novo pagamento de financiamento com integração de transação
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.body - Dados do pagamento
 * @param {number} req.body.financing_id - ID do financiamento
 * @param {number} req.body.account_id - ID da conta
 * @param {number} req.body.installment_number - Número da parcela
 * @param {number} req.body.payment_amount - Valor do pagamento
 * @param {number} req.body.principal_amount - Valor da amortização
 * @param {number} req.body.interest_amount - Valor dos juros
 * @param {string} req.body.payment_date - Data do pagamento
 * @param {string} req.body.payment_method - Método de pagamento
 * @param {string} req.body.payment_type - Tipo de pagamento
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Pagamento criado com transação
 * @throws {ValidationError} Se os dados forem inválidos
 * @throws {NotFoundError} Se o financiamento ou conta não for encontrado
 * @example
 * // POST /financing-payments
 * // Body: { "financing_id": 1, "account_id": 1, "installment_number": 1, "payment_amount": 1000, "principal_amount": 800, "interest_amount": 200, "payment_date": "2024-01-15", "payment_method": "pix" }
 * // Retorno: { "message": "Pagamento registrado com sucesso", "payment": {...}, "transaction": {...} }
 */
async function createFinancingPayment(req, res) {
  const dbTransaction = await sequelize.transaction();
  
  try {
    // Valida os dados de entrada
    const validatedData = createFinancingPaymentSchema.parse(req.body);

    // Verifica se o financiamento existe e pertence ao usuário
    const financing = await Financing.findOne({
      where: {
        id: validatedData.financing_id,
        user_id: req.userId
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
        user_id: req.userId
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
      user_id: req.userId,
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

    logger.info(`Pagamento de financiamento criado com sucesso`, {
      payment_id: payment.id,
      transaction_id: transactionRecord.id,
      financing_id: validatedData.financing_id,
      installment_number: validatedData.installment_number,
      amount: validatedData.payment_amount
    });

    res.status(201).json({
      message: 'Pagamento de financiamento criado com sucesso',
      payment: updatedPayment,
      transaction: transactionRecord
    });

  } catch (error) {
    await dbTransaction.rollback();
    
    logger.error('Erro ao criar pagamento de financiamento', {
      error: error.message,
      body: req.body,
      user_id: req.userId
    });

    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Lista todos os pagamentos do usuário com filtros e paginação
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.query - Parâmetros de consulta
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Lista de pagamentos paginada
 * @example
 * // GET /financing-payments?page=1&limit=10&financing_id=1
 * // Retorno: { "payments": [...], "pagination": {...} }
 */
async function listFinancingPayments(req, res) {
  try {
    const validatedQuery = listFinancingPaymentsSchema.parse(req.query);
    const where = { user_id: req.userId };
    if (validatedQuery.financing_id) where.financing_id = validatedQuery.financing_id;
    if (validatedQuery.account_id) where.account_id = validatedQuery.account_id;
    if (validatedQuery.payment_method) where.payment_method = validatedQuery.payment_method;
    if (validatedQuery.payment_type) where.payment_type = validatedQuery.payment_type;
    if (validatedQuery.status) where.status = validatedQuery.status;
    if (validatedQuery.payment_date_from) where.payment_date = { [require('sequelize').Op.gte]: validatedQuery.payment_date_from };
    if (validatedQuery.payment_date_to) {
      where.payment_date = {
        ...where.payment_date,
        [require('sequelize').Op.lte]: validatedQuery.payment_date_to
      };
    }
    const { count, rows: payments } = await FinancingPayment.findAndCountAll({
      where,
      include: [
        { model: Financing, as: 'financing', attributes: ['id', 'description', 'financing_type', 'creditor_id'], include: [{ model: Creditor, as: 'creditor', attributes: ['id', 'name'] }] },
        { model: Account, as: 'account', attributes: ['id', 'bank_name', 'account_type'] },
        { model: Transaction, as: 'transaction', attributes: ['id', 'amount', 'description', 'date'] }
      ],
      order: [['payment_date', 'DESC']],
      limit: validatedQuery.limit,
      offset: (validatedQuery.page - 1) * validatedQuery.limit
    });
    const totalPages = Math.ceil(count / validatedQuery.limit);
    const hasNextPage = validatedQuery.page < totalPages;
    const hasPrevPage = validatedQuery.page > 1;
    res.json({
      payments,
      pagination: {
        total: count,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      throw new ValidationError('Parâmetros de consulta inválidos', error.errors);
    }
    throw error;
  }
}

/**
 * Obtém um pagamento específico por ID
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do pagamento
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Dados do pagamento
 * @throws {NotFoundError} Se o pagamento não for encontrado
 * @example
 * // GET /financing-payments/1
 * // Retorno: { "payment": {...} }
 */
async function getFinancingPayment(req, res) {
  const { id } = req.params;
  const payment = await FinancingPayment.findOne({
    where: { id, user_id: req.userId },
    include: [
      { model: Financing, as: 'financing', include: [{ model: Creditor, as: 'creditor', attributes: ['id', 'name', 'document_type', 'document_number'] }] },
      { model: Account, as: 'account', attributes: ['id', 'bank_name', 'account_type', 'balance'] },
      { model: Transaction, as: 'transaction' }
    ]
  });
  if (!payment) {
    throw new NotFoundError('Pagamento não encontrado');
  }
  res.json({ payment });
}

/**
 * Atualiza um pagamento existente
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do pagamento
 * @param {Object} req.body - Dados para atualização
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Pagamento atualizado
 * @throws {NotFoundError} Se o pagamento não for encontrado
 * @throws {ValidationError} Se os dados forem inválidos
 * @example
 * // PUT /financing-payments/1
 * // Body: { "observations": "Pagamento atualizado" }
 * // Retorno: { "message": "Pagamento atualizado com sucesso", "payment": {...} }
 */
async function updateFinancingPayment(req, res) {
  try {
    const { id } = req.params;
    const payment = await FinancingPayment.findOne({ where: { id, user_id: req.userId } });
    if (!payment) {
      throw new NotFoundError('Pagamento não encontrado');
    }
    const validatedData = updateFinancingPaymentSchema.parse(req.body);
    await payment.update(validatedData);
    res.json({ message: 'Pagamento atualizado com sucesso', payment });
  } catch (error) {
    if (error.name === 'ZodError') {
      throw new ValidationError('Dados inválidos', error.errors);
    }
    throw error;
  }
}

/**
 * Remove um pagamento (apenas se não tiver transação vinculada)
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do pagamento
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Confirmação de remoção
 * @throws {NotFoundError} Se o pagamento não for encontrado
 * @throws {ValidationError} Se o pagamento tiver transação vinculada
 * @example
 * // DELETE /financing-payments/1
 * // Retorno: { "message": "Pagamento excluído com sucesso" }
 */
async function deleteFinancingPayment(req, res) {
  const { id } = req.params;
  const payment = await FinancingPayment.findOne({ where: { id, user_id: req.userId } });
  if (!payment) {
    throw new NotFoundError('Pagamento não encontrado');
  }
  if (payment.transaction_id) {
    throw new ValidationError('Não é possível remover um pagamento com transação vinculada');
  }
  await payment.destroy();
  res.json({ message: 'Pagamento excluído com sucesso' });
}

/**
 * Registra pagamento de uma parcela específica
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.financingId - ID do financiamento
 * @param {number} req.params.installmentNumber - Número da parcela
 * @param {Object} req.body - Dados do pagamento
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Pagamento registrado
 * @throws {NotFoundError} Se o financiamento não for encontrado
 * @throws {ValidationError} Se os dados forem inválidos
 * @example
 * // POST /financings/1/installments/1/pay
 * // Body: { "account_id": 1, "payment_amount": 1000, "payment_date": "2024-01-15", "payment_method": "pix" }
 * // Retorno: { "message": "Parcela paga com sucesso", "payment": {...} }
 */
async function payInstallment(req, res) {
  try {
    const { financingId, installmentNumber } = req.params;
    const validatedData = payInstallmentSchema.parse(req.body);

    // Busca o financiamento
    const financing = await Financing.findOne({
      where: {
        id: financingId,
        user_id: req.userId
      }
    });

    if (!financing) {
      throw new NotFoundError('Financiamento não encontrado');
    }

    // Verifica se a parcela já foi paga
    const existingPayment = await FinancingPayment.findOne({
      where: {
        financing_id: financingId,
        installment_number: parseInt(installmentNumber)
      }
    });

    if (existingPayment) {
      throw new ValidationError('Esta parcela já foi paga');
    }

    // Gera a tabela de amortização para obter os valores da parcela
    const amortizationTable = generateAmortizationTable(
      parseFloat(financing.total_amount),
      parseFloat(financing.interest_rate),
      financing.term_months,
      financing.amortization_method,
      new Date(financing.start_date)
    );

    const installment = amortizationTable.table.find(row => row.installment === parseInt(installmentNumber));
    if (!installment) {
      throw new ValidationError('Parcela não encontrada na tabela de amortização');
    }

    // Verifica se o valor pago é suficiente
    if (validatedData.payment_amount < installment.payment) {
      throw new ValidationError(`Valor insuficiente. Valor da parcela: R$ ${installment.payment.toFixed(2)}`);
    }

    // Cria o pagamento usando a função existente
    const paymentData = {
      financing_id: parseInt(financingId),
      account_id: validatedData.account_id,
      installment_number: parseInt(installmentNumber),
      payment_amount: validatedData.payment_amount,
      principal_amount: installment.amortization,
      interest_amount: installment.interest,
      payment_date: validatedData.payment_date,
      payment_method: validatedData.payment_method,
      payment_type: validatedData.payment_amount > installment.payment ? 'parcial' : 'parcela',
      balance_before: installment.remainingBalance + installment.amortization,
      balance_after: installment.remainingBalance,
      observations: validatedData.observations
    };

    // Chama a função de criação de pagamento
    await createFinancingPayment({ body: paymentData, userId: req.userId }, res);
  } catch (error) {
    if (error.name === 'ZodError') {
      throw new ValidationError('Dados inválidos', error.errors);
    }
    throw error;
  }
}

/**
 * Registra pagamento antecipado
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.financingId - ID do financiamento
 * @param {Object} req.body - Dados do pagamento antecipado
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Pagamento antecipado registrado
 * @throws {NotFoundError} Se o financiamento não for encontrado
 * @throws {ValidationError} Se os dados forem inválidos
 * @example
 * // POST /financings/1/early-payment
 * // Body: { "account_id": 1, "payment_amount": 10000, "payment_date": "2024-01-15", "payment_method": "pix", "preference": "reducao_prazo" }
 * // Retorno: { "message": "Pagamento antecipado registrado", "payment": {...}, "simulation": {...} }
 */
async function registerEarlyPayment(req, res) {
  try {
    const { financingId } = req.params;
    const validatedData = earlyPaymentSchema.parse(req.body);

    // Busca o financiamento
    const financing = await Financing.findOne({
      where: {
        id: financingId,
        user_id: req.userId
      },
      include: [
        {
          model: FinancingPayment,
          as: 'payments',
          required: false
        }
      ]
    });

    if (!financing) {
      throw new NotFoundError('Financiamento não encontrado');
    }

    // Calcula o saldo atual
    const payments = financing.payments || [];
    const currentBalance = calculateUpdatedBalance(
      parseFloat(financing.total_amount),
      parseFloat(financing.interest_rate),
      financing.term_months,
      financing.amortization_method,
      new Date(financing.start_date),
      payments
    );

    // Verifica se o valor do pagamento é válido
    if (validatedData.payment_amount >= currentBalance.currentBalance) {
      throw new ValidationError('Valor do pagamento antecipado deve ser menor que o saldo devedor');
    }

    // Calcula a próxima parcela para usar como referência
    const nextInstallment = payments.length + 1;
    const amortizationTable = generateAmortizationTable(
      parseFloat(financing.total_amount),
      parseFloat(financing.interest_rate),
      financing.term_months,
      financing.amortization_method,
      new Date(financing.start_date)
    );

    const installment = amortizationTable.table.find(row => row.installment === nextInstallment);
    if (!installment) {
      throw new ValidationError('Não há mais parcelas para pagar');
    }

    // Cria o pagamento antecipado
    const paymentData = {
      financing_id: parseInt(financingId),
      account_id: validatedData.account_id,
      installment_number: nextInstallment,
      payment_amount: validatedData.payment_amount,
      principal_amount: validatedData.payment_amount, // Todo o valor vai para amortização
      interest_amount: 0, // Pagamento antecipado não tem juros
      payment_date: validatedData.payment_date,
      payment_method: validatedData.payment_method,
      payment_type: 'antecipado',
      balance_before: currentBalance.currentBalance,
      balance_after: currentBalance.currentBalance - validatedData.payment_amount,
      observations: `Pagamento antecipado - ${validatedData.observations || ''}`
    };

    // Chama a função de criação de pagamento
    await createFinancingPayment({ body: paymentData, userId: req.userId }, res);
  } catch (error) {
    if (error.name === 'ZodError') {
      throw new ValidationError('Dados inválidos', error.errors);
    }
    throw error;
  }
}

module.exports = {
  createFinancingPayment,
  listFinancingPayments,
  getFinancingPayment,
  updateFinancingPayment,
  deleteFinancingPayment,
  payInstallment,
  registerEarlyPayment
}; 