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
const { AppError } = require('../utils/errors');
const { Op } = require('sequelize');

/**
 * Service responsável por gerenciar financiamentos.
 * Contém toda a lógica de negócio relacionada a financiamentos.
 */
class FinancingService {
  /**
   * Cria um novo financiamento com cálculo automático da parcela.
   * @param {number} userId - ID do usuário autenticado.
   * @param {Object} financingData - Dados do financiamento.
   * @returns {Promise<Object>} Financiamento criado com cálculos.
   */
  async createFinancing(userId, financingData) {
    // Valida os dados de entrada
    const validatedData = createFinancingSchema.parse(financingData);

    // Verifica se o credor existe e pertence ao usuário
    const creditor = await Creditor.findOne({
      where: {
        id: validatedData.creditor_id,
        user_id: userId
      }
    });

    if (!creditor) {
      throw new AppError('Credor não encontrado', 404);
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
      user_id: userId,
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

    return {
      financing,
      amortization: {
        monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
        summary: amortizationTable.summary
      }
    };
  }

  /**
   * Lista todos os financiamentos do usuário com filtros e paginação.
   * @param {number} userId - ID do usuário autenticado.
   * @param {Object} queryParams - Parâmetros de consulta.
   * @returns {Promise<Object>} Lista de financiamentos paginada.
   */
  async listFinancings(userId, queryParams) {
    // Valida os parâmetros de consulta
    const validatedQuery = listFinancingsSchema.parse(queryParams);

    // Constrói as condições de busca
    const where = { user_id: userId };
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
      where.start_date = { [Op.gte]: validatedQuery.start_date_from };
    }
    if (validatedQuery.start_date_to) {
      where.start_date = { 
        ...where.start_date,
        [Op.lte]: validatedQuery.start_date_to 
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

    return {
      financings: financingsWithStats,
      pagination: {
        currentPage: validatedQuery.page,
        totalPages,
        totalItems: count,
        itemsPerPage: validatedQuery.limit,
        hasNextPage,
        hasPrevPage
      }
    };
  }

  /**
   * Obtém um financiamento específico por ID.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} financingId - ID do financiamento.
   * @returns {Promise<Object>} Financiamento com detalhes.
   */
  async getFinancingById(userId, financingId) {
    const financing = await Financing.findOne({
      where: {
        id: financingId,
        user_id: userId
      },
      include: [
        {
          model: Creditor,
          as: 'creditor',
          attributes: ['id', 'name', 'document_type', 'document_number', 'email', 'phone']
        },
        {
          model: FinancingPayment,
          as: 'payments',
          attributes: ['id', 'payment_amount', 'payment_date', 'status', 'description'],
          order: [['payment_date', 'ASC']]
        }
      ]
    });

    if (!financing) {
      throw new AppError('Financiamento não encontrado', 404);
    }

    // Calcula estatísticas detalhadas
    const payments = financing.payments || [];
    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.payment_amount), 0);
    const paidInstallments = payments.length;
    const percentagePaid = ((totalPaid / parseFloat(financing.total_amount)) * 100).toFixed(2);
    const remainingAmount = parseFloat(financing.total_amount) - totalPaid;

    return {
      ...financing.toJSON(),
      stats: {
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        remainingAmount: parseFloat(remainingAmount.toFixed(2)),
        paidInstallments,
        percentagePaid: parseFloat(percentagePaid),
        remainingInstallments: financing.term_months - paidInstallments
      }
    };
  }

  /**
   * Atualiza um financiamento existente.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} financingId - ID do financiamento.
   * @param {Object} updateData - Dados para atualização.
   * @returns {Promise<Object>} Financiamento atualizado.
   */
  async updateFinancing(userId, financingId, updateData) {
    // Valida os dados de entrada
    const validatedData = updateFinancingSchema.parse(updateData);

    const financing = await Financing.findOne({
      where: {
        id: financingId,
        user_id: userId
      }
    });

    if (!financing) {
      throw new AppError('Financiamento não encontrado', 404);
    }

    // Se o método de amortização ou parâmetros principais foram alterados, recalcula a parcela
    if (validatedData.amortization_method || validatedData.total_amount || validatedData.interest_rate || validatedData.term_months) {
      const totalAmount = validatedData.total_amount || financing.total_amount;
      const interestRate = validatedData.interest_rate || financing.interest_rate;
      const termMonths = validatedData.term_months || financing.term_months;
      const amortizationMethod = validatedData.amortization_method || financing.amortization_method;

      let monthlyPayment;
      if (amortizationMethod === 'SAC') {
        monthlyPayment = calculateSACPayment(totalAmount, interestRate, termMonths);
      } else {
        monthlyPayment = calculatePricePayment(totalAmount, interestRate, termMonths);
      }

      validatedData.monthly_payment = monthlyPayment;
    }

    await financing.update(validatedData);

    return financing;
  }

  /**
   * Exclui um financiamento específico.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} financingId - ID do financiamento.
   */
  async deleteFinancing(userId, financingId) {
    const financing = await Financing.findOne({
      where: {
        id: financingId,
        user_id: userId
      }
    });

    if (!financing) {
      throw new AppError('Financiamento não encontrado', 404);
    }

    // Verifica se há pagamentos associados
    const paymentCount = await FinancingPayment.count({
      where: { financing_id: financingId }
    });

    if (paymentCount > 0) {
      throw new AppError('Não é possível excluir um financiamento que possui pagamentos registrados', 400);
    }

    await financing.destroy();
  }

  /**
   * Gera a tabela de amortização para um financiamento.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} financingId - ID do financiamento.
   * @returns {Promise<Object>} Tabela de amortização completa.
   */
  async getAmortizationTable(userId, financingId) {
    const financing = await Financing.findOne({
      where: {
        id: financingId,
        user_id: userId
      }
    });

    if (!financing) {
      throw new AppError('Financiamento não encontrado', 404);
    }

    const amortizationTable = generateAmortizationTable(
      financing.total_amount,
      financing.interest_rate,
      financing.term_months,
      financing.amortization_method,
      new Date(financing.start_date)
    );

    return {
      financing: {
        id: financing.id,
        description: financing.description,
        total_amount: financing.total_amount,
        interest_rate: financing.interest_rate,
        term_months: financing.term_months,
        amortization_method: financing.amortization_method,
        start_date: financing.start_date,
        monthly_payment: financing.monthly_payment
      },
      amortization: amortizationTable
    };
  }

  /**
   * Simula o pagamento antecipado de um financiamento.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} financingId - ID do financiamento.
   * @param {Object} simulationData - Dados da simulação.
   * @returns {Promise<Object>} Resultado da simulação.
   */
  async simulateEarlyPayment(userId, financingId, simulationData) {
    // Valida os dados de entrada
    const validatedData = simulateEarlyPaymentSchema.parse(simulationData);

    const financing = await Financing.findOne({
      where: {
        id: financingId,
        user_id: userId
      }
    });

    if (!financing) {
      throw new AppError('Financiamento não encontrado', 404);
    }

    const simulation = simulateEarlyPaymentUtil(
      financing,
      validatedData.early_payment_amount,
      validatedData.payment_date
    );

    return {
      financing: {
        id: financing.id,
        description: financing.description,
        current_balance: financing.current_balance
      },
      simulation
    };
  }

  /**
   * Obtém estatísticas gerais dos financiamentos do usuário.
   * @param {number} userId - ID do usuário autenticado.
   * @returns {Promise<Object>} Estatísticas consolidadas.
   */
  async getFinancingStatistics(userId) {
    const financings = await Financing.findAll({
      where: { user_id: userId },
      include: [
        {
          model: FinancingPayment,
          as: 'payments',
          attributes: ['payment_amount', 'payment_date', 'status'],
          required: false
        }
      ]
    });

    let totalFinanced = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let activeFinancings = 0;
    let completedFinancings = 0;

    financings.forEach(financing => {
      const payments = financing.payments || [];
      const paidAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.payment_amount), 0);
      
      totalFinanced += parseFloat(financing.total_amount);
      totalPaid += paidAmount;
      totalRemaining += parseFloat(financing.total_amount) - paidAmount;

      if (financing.status === 'active') {
        activeFinancings++;
      } else if (financing.status === 'completed') {
        completedFinancings++;
      }
    });

    const averageInterestRate = financings.length > 0 
      ? financings.reduce((sum, f) => sum + parseFloat(f.interest_rate), 0) / financings.length 
      : 0;

    return {
      summary: {
        totalFinancings: financings.length,
        activeFinancings,
        completedFinancings,
        totalFinanced: parseFloat(totalFinanced.toFixed(2)),
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        totalRemaining: parseFloat(totalRemaining.toFixed(2)),
        averageInterestRate: parseFloat(averageInterestRate.toFixed(4))
      },
      byType: this.groupByType(financings),
      byStatus: this.groupByStatus(financings)
    };
  }

  /**
   * Agrupa financiamentos por tipo.
   * @param {Array} financings - Lista de financiamentos.
   * @returns {Object} Agrupamento por tipo.
   */
  groupByType(financings) {
    const grouped = {};
    financings.forEach(financing => {
      const type = financing.financing_type;
      if (!grouped[type]) {
        grouped[type] = {
          count: 0,
          totalAmount: 0,
          totalPaid: 0
        };
      }
      grouped[type].count++;
      grouped[type].totalAmount += parseFloat(financing.total_amount);
      
      const payments = financing.payments || [];
      const paidAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.payment_amount), 0);
      grouped[type].totalPaid += paidAmount;
    });

    // Formata os valores
    Object.keys(grouped).forEach(type => {
      grouped[type].totalAmount = parseFloat(grouped[type].totalAmount.toFixed(2));
      grouped[type].totalPaid = parseFloat(grouped[type].totalPaid.toFixed(2));
    });

    return grouped;
  }

  /**
   * Agrupa financiamentos por status.
   * @param {Array} financings - Lista de financiamentos.
   * @returns {Object} Agrupamento por status.
   */
  groupByStatus(financings) {
    const grouped = {};
    financings.forEach(financing => {
      const status = financing.status;
      if (!grouped[status]) {
        grouped[status] = {
          count: 0,
          totalAmount: 0
        };
      }
      grouped[status].count++;
      grouped[status].totalAmount += parseFloat(financing.total_amount);
    });

    // Formata os valores
    Object.keys(grouped).forEach(status => {
      grouped[status].totalAmount = parseFloat(grouped[status].totalAmount.toFixed(2));
    });

    return grouped;
  }
}

module.exports = new FinancingService(); 