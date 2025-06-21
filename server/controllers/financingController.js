/**
 * Controller para gerenciamento de Financiamentos (Financings)
 * Implementa operações CRUD, cálculos de amortização e funcionalidades avançadas
 */
const { Financing, Creditor, FinancingPayment, Account, Category } = require('../models');
const { 
  createFinancingSchema, 
  updateFinancingSchema, 
  listFinancingsSchema,
  simulateEarlyPaymentSchema,
  amortizationTableSchema
} = require('../utils/financingValidators');
const {
  calculateSACPayment,
  calculatePricePayment,
  generateAmortizationTable,
  calculateUpdatedBalance,
  simulateEarlyPayment: simulateEarlyPaymentUtil
} = require('../utils/financingCalculations');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Cria um novo financiamento com cálculo automático da parcela
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.body - Dados do financiamento
 * @param {number} req.body.creditor_id - ID do credor
 * @param {string} req.body.financing_type - Tipo de financiamento
 * @param {number} req.body.total_amount - Valor total financiado
 * @param {number} req.body.interest_rate - Taxa de juros anual
 * @param {number} req.body.term_months - Prazo em meses
 * @param {string} req.body.start_date - Data de início
 * @param {string} req.body.description - Descrição
 * @param {string} req.body.amortization_method - Método de amortização (SAC/Price)
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Financiamento criado com cálculos
 * @throws {ValidationError} Se os dados forem inválidos
 * @throws {NotFoundError} Se o credor não for encontrado
 * @example
 * // POST /financings
 * // Body: { "creditor_id": 1, "financing_type": "hipoteca", "total_amount": 100000, "interest_rate": 0.12, "term_months": 120, "start_date": "2024-01-01", "description": "Financiamento imobiliário", "amortization_method": "SAC" }
 * // Retorno: { "message": "Financiamento criado com sucesso", "financing": {...}, "amortization": {...} }
 */
async function createFinancing(req, res) {
  try {
    // Valida os dados de entrada
    const validatedData = createFinancingSchema.parse(req.body);

    // Verifica se o credor existe e pertence ao usuário
    const creditor = await Creditor.findOne({
      where: {
        id: validatedData.creditor_id,
        user_id: req.userId
      }
    });

    if (!creditor) {
      return res.status(404).json({
        error: 'Credor não encontrado'
      });
    }

    // Calcula a parcela mensal baseada no método de amortização
    let monthlyPayment;
    if (validatedData.amortization_method === 'SAC') {
      monthlyPayment = calculateSACPayment(
        validatedData.total_amount,
        validatedData.interest_rate,
        validatedData.term_months
      );
    } else {
      monthlyPayment = calculatePricePayment(
        validatedData.total_amount,
        validatedData.interest_rate,
        validatedData.term_months
      );
    }

    // Cria o financiamento
    const financing = await Financing.create({
      ...validatedData,
      user_id: req.userId,
      monthly_payment: monthlyPayment,
      current_balance: validatedData.total_amount
    });

    // Gera a tabela de amortização
    const amortizationTable = generateAmortizationTable(
      validatedData.total_amount,
      validatedData.interest_rate,
      validatedData.term_months,
      validatedData.amortization_method,
      new Date(validatedData.start_date)
    );

    res.status(201).json({
      message: 'Financiamento criado com sucesso',
      financing,
      amortization: {
        monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
        summary: amortizationTable.summary
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    return res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * Lista todos os financiamentos do usuário com filtros e paginação
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.query - Parâmetros de consulta
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Lista de financiamentos paginada
 * @example
 * // GET /financings?page=1&limit=10&financing_type=hipoteca
 * // Retorno: { "financings": [...], "pagination": {...} }
 */
async function listFinancings(req, res) {
  try {
    // Valida os parâmetros de consulta
    const validatedQuery = listFinancingsSchema.parse(req.query);

    // Constrói as condições de busca
    const where = { user_id: req.userId };
    if (validatedQuery.financing_type) {
      where.financing_type = validatedQuery.financing_type;
    }
    if (validatedQuery.creditor_id) {
      where.creditor_id = validatedQuery.creditor_id;
    }
    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }
    if (validatedQuery.amortization_method) {
      where.amortization_method = validatedQuery.amortization_method;
    }
    if (validatedQuery.start_date_from) {
      where.start_date = { [require('sequelize').Op.gte]: validatedQuery.start_date_from };
    }
    if (validatedQuery.start_date_to) {
      where.start_date = { 
        ...where.start_date,
        [require('sequelize').Op.lte]: validatedQuery.start_date_to 
      };
    }

    // Executa a consulta com paginação
    const { count, rows: financings } = await Financing.findAndCountAll({
      where,
      include: [
        {
          model: Creditor,
          as: 'creditor',
          attributes: ['id', 'name', 'document_type', 'document_number']
        },
        {
          model: FinancingPayment,
          as: 'payments',
          attributes: ['id', 'payment_amount', 'payment_date', 'status'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: validatedQuery.limit,
      offset: (validatedQuery.page - 1) * validatedQuery.limit
    });

    // Calcula estatísticas para cada financiamento
    const financingsWithStats = financings.map(financing => {
      const payments = financing.payments || [];
      const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.payment_amount), 0);
      const paidInstallments = payments.length;
      const percentagePaid = ((totalPaid / parseFloat(financing.total_amount)) * 100).toFixed(2);

      return {
        ...financing.toJSON(),
        stats: {
          totalPaid: parseFloat(totalPaid.toFixed(2)),
          paidInstallments,
          percentagePaid: parseFloat(percentagePaid),
          remainingInstallments: financing.term_months - paidInstallments
        }
      };
    });

    // Calcula estatísticas gerais
    const totalPages = Math.ceil(count / validatedQuery.limit);
    const hasNextPage = validatedQuery.page < totalPages;
    const hasPrevPage = validatedQuery.page > 1;

    res.json({
      financings: financingsWithStats,
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
 * Obtém um financiamento específico por ID com detalhes completos
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do financiamento
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Dados do financiamento
 * @throws {NotFoundError} Se o financiamento não for encontrado
 * @example
 * // GET /financings/1
 * // Retorno: { "financing": {...}, "creditor": {...}, "payments": [...] }
 */
async function getFinancing(req, res) {
  try {
    const { id } = req.params;

    const financing = await Financing.findOne({
      where: {
        id,
        user_id: req.userId
      },
      include: [
        {
          model: Creditor,
          as: 'creditor',
          attributes: ['id', 'name', 'document_type', 'document_number', 'phone', 'email']
        },
        {
          model: FinancingPayment,
          as: 'payments',
          include: [
            {
              model: Account,
              as: 'account',
              attributes: ['id', 'bank_name', 'account_type']
            }
          ],
          order: [['payment_date', 'ASC']]
        }
      ]
    });

    if (!financing) {
      return res.status(404).json({
        error: 'Financiamento não encontrado'
      });
    }

    // Calcula estatísticas atualizadas
    const payments = financing.payments || [];
    const updatedBalance = calculateUpdatedBalance(
      parseFloat(financing.total_amount),
      parseFloat(financing.interest_rate),
      financing.term_months,
      financing.amortization_method,
      new Date(financing.start_date),
      payments
    );

    res.json({
      financing,
      balance: updatedBalance
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * Atualiza um financiamento existente
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do financiamento
 * @param {Object} req.body - Dados para atualização
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Financiamento atualizado
 * @throws {NotFoundError} Se o financiamento não for encontrado
 * @throws {ValidationError} Se os dados forem inválidos
 * @example
 * // PUT /financings/1
 * // Body: { "description": "Nova descrição", "status": "ativo" }
 * // Retorno: { "message": "Financiamento atualizado com sucesso", "financing": {...} }
 */
async function updateFinancing(req, res) {
  try {
    const { id } = req.params;

    // Busca o financiamento
    const financing = await Financing.findOne({
      where: {
        id,
        user_id: req.userId
      }
    });

    if (!financing) {
      throw new NotFoundError('Financiamento não encontrado');
    }

    // Valida os dados de atualização
    const validatedData = updateFinancingSchema.parse(req.body);

    // Se alterou dados que afetam o cálculo, recalcula a parcela
    if (validatedData.total_amount || validatedData.interest_rate || validatedData.term_months || validatedData.amortization_method) {
      const totalAmount = validatedData.total_amount || parseFloat(financing.total_amount);
      const interestRate = validatedData.interest_rate || parseFloat(financing.interest_rate);
      const termMonths = validatedData.term_months || financing.term_months;
      const amortizationMethod = validatedData.amortization_method || financing.amortization_method;

      let monthlyPayment;
      if (amortizationMethod === 'SAC') {
        monthlyPayment = calculateSACPayment(totalAmount, interestRate, termMonths);
      } else {
        monthlyPayment = calculatePricePayment(totalAmount, interestRate, termMonths);
      }

      validatedData.monthly_payment = monthlyPayment;
      validatedData.current_balance = totalAmount;
    }

    // Atualiza o financiamento
    await financing.update(validatedData);

    res.json({
      message: 'Financiamento atualizado com sucesso',
      financing
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      throw new ValidationError('Dados inválidos', error.errors);
    }
    throw error;
  }
}

/**
 * Remove um financiamento
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do financiamento
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Confirmação de remoção
 * @throws {NotFoundError} Se o financiamento não for encontrado
 * @throws {Error} Se o financiamento tiver pagamentos registrados
 * @example
 * // DELETE /financings/1
 * // Retorno: { "message": "Financiamento removido com sucesso" }
 */
async function deleteFinancing(req, res) {
  const { id } = req.params;

  // Verifica se há pagamentos registrados
  const paymentCount = await FinancingPayment.count({
    where: { financing_id: id }
  });

  if (paymentCount > 0) {
    throw new Error('Não é possível deletar um financiamento que possui pagamentos registrados');
  }

  // Remove o financiamento
  await Financing.destroy({
    where: { id, user_id: req.userId }
  });

  res.json({
    message: 'Financiamento deletado com sucesso'
  });
}

/**
 * Gera a tabela de amortização de um financiamento
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do financiamento
 * @param {Object} req.query - Parâmetros de consulta
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Tabela de amortização
 * @throws {NotFoundError} Se o financiamento não for encontrado
 * @example
 * // GET /financings/1/amortization-table?include_payments=true
 * // Retorno: { "table": [...], "summary": {...} }
 */
async function getAmortizationTable(req, res) {
  try {
    const { id } = req.params;
    const validatedQuery = amortizationTableSchema.parse(req.query);

    // Busca o financiamento
    const financing = await Financing.findOne({
      where: {
        id,
        user_id: req.userId
      },
      include: validatedQuery.include_payments ? [
        {
          model: FinancingPayment,
          as: 'payments',
          order: [['installment_number', 'ASC']]
        }
      ] : []
    });

    if (!financing) {
      throw new NotFoundError('Financiamento não encontrado');
    }

    // Gera a tabela de amortização
    const amortizationTable = generateAmortizationTable(
      parseFloat(financing.total_amount),
      parseFloat(financing.interest_rate),
      financing.term_months,
      financing.amortization_method,
      new Date(financing.start_date)
    );

    // Se solicitado, inclui informações dos pagamentos
    if (validatedQuery.include_payments && financing.payments) {
      const payments = financing.payments;
      amortizationTable.table = amortizationTable.table.map(row => {
        const payment = payments.find(p => p.installment_number === row.installment);
        return {
          ...row,
          payment_status: payment ? payment.status : 'pendente',
          payment_date: payment ? payment.payment_date : null,
          actual_payment: payment ? parseFloat(payment.payment_amount) : null
        };
      });
    }

    res.json(amortizationTable);
  } catch (error) {
    if (error.name === 'ZodError') {
      throw new ValidationError('Parâmetros de consulta inválidos', error.errors);
    }
    throw error;
  }
}

/**
 * Simula o impacto de um pagamento antecipado
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do financiamento
 * @param {Object} req.body - Dados da simulação
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Resultado da simulação
 * @throws {NotFoundError} Se o financiamento não for encontrado
 * @throws {ValidationError} Se os dados forem inválidos
 * @example
 * // POST /financings/1/simulate-early-payment
 * // Body: { "payment_amount": 10000, "preference": "reducao_prazo" }
 * // Retorno: { "simulation": {...} }
 */
async function simulateEarlyPayment(req, res) {
  try {
    const { id } = req.params;
    const validatedData = simulateEarlyPaymentSchema.parse(req.body);

    // Busca o financiamento
    const financing = await Financing.findOne({
      where: {
        id,
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

    // Calcula meses restantes
    const remainingMonths = financing.term_months - currentBalance.paidInstallments;

    // Simula o pagamento antecipado
    const simulation = simulateEarlyPaymentUtil(
      currentBalance.currentBalance,
      parseFloat(financing.interest_rate),
      remainingMonths,
      financing.amortization_method,
      validatedData.payment_amount,
      validatedData.preference
    );

    res.json({
      simulation: {
        ...simulation,
        currentBalance: currentBalance.currentBalance,
        remainingMonths
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      throw new ValidationError('Dados inválidos', error.errors);
    }
    throw error;
  }
}

/**
 * Obtém estatísticas gerais dos financiamentos do usuário
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Estatísticas dos financiamentos
 * @example
 * // GET /financings/statistics
 * // Retorno: { "statistics": {...} }
 */
async function getFinancingStatistics(req, res) {
  const financings = await Financing.findAll({
    where: { user_id: req.userId },
    include: [
      {
        model: FinancingPayment,
        as: 'payments',
        required: false
      }
    ]
  });

  let totalFinanced = 0;
  let totalPaid = 0;
  let totalInterestPaid = 0;
  let activeFinancings = 0;
  let paidFinancings = 0;
  let overdueFinancings = 0;

  financings.forEach(financing => {
    const payments = financing.payments || [];
    const financingTotalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.payment_amount), 0);
    const financingInterestPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.interest_amount), 0);

    totalFinanced += parseFloat(financing.total_amount);
    totalPaid += financingTotalPaid;
    totalInterestPaid += financingInterestPaid;

    if (financing.status === 'ativo') activeFinancings++;
    else if (financing.status === 'quitado') paidFinancings++;
    else if (financing.status === 'inadimplente') overdueFinancings++;
  });

  const statistics = {
    totalFinancings: financings.length,
    activeFinancings,
    paidFinancings,
    overdueFinancings,
    totalFinanced: parseFloat(totalFinanced.toFixed(2)),
    totalPaid: parseFloat(totalPaid.toFixed(2)),
    totalInterestPaid: parseFloat(totalInterestPaid.toFixed(2)),
    averageFinancingAmount: financings.length > 0 ? parseFloat((totalFinanced / financings.length).toFixed(2)) : 0,
    percentagePaid: totalFinanced > 0 ? parseFloat(((totalPaid / totalFinanced) * 100).toFixed(2)) : 0
  };

  res.json({ statistics });
}

module.exports = {
  createFinancing,
  listFinancings,
  getFinancing,
  updateFinancing,
  deleteFinancing,
  getAmortizationTable,
  simulateEarlyPayment,
  getFinancingStatistics
}; 