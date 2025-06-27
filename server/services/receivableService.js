const { Receivable, Transaction, Payment, Category, Account, Customer } = require('../models');
const { createReceivableSchema, updateReceivableSchema, createReceivablePaymentSchema } = require('../utils/validators');
const { Op } = require('sequelize');
const { AppError } = require('../utils/errors');

/**
 * Service responsável por gerenciar contas a receber.
 * Contém toda a lógica de negócio relacionada a contas a receber.
 */
class ReceivableService {
  /**
   * Lista todas as contas a receber do usuário.
   * @param {number} userId - ID do usuário autenticado.
   * @returns {Promise<Array>} Lista de contas a receber com valor restante.
   */
  async listReceivables(userId) {
    const receivables = await Receivable.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'is_default']
        },
        {
          model: Payment,
          as: 'payments'
        }
      ],
      order: [['due_date', 'ASC']]
    });

    // Calcula o valor restante para cada conta
    const receivablesWithRemaining = await Promise.all(receivables.map(async (receivable) => {
      const remainingAmount = await receivable.getRemainingAmount();
      return {
        ...receivable.toJSON(),
        remaining_amount: remainingAmount
      };
    }));

    return receivablesWithRemaining;
  }

  /**
   * Retorna os detalhes de uma conta a receber específica.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} receivableId - ID da conta a receber.
   * @returns {Promise<Object>} Detalhes da conta a receber com valor restante.
   */
  async getReceivableById(userId, receivableId) {
    const receivable = await Receivable.findOne({
      where: { id: receivableId },
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'is_default']
        },
        {
          model: Payment,
          as: 'payments'
        }
      ]
    });

    if (!receivable) {
      throw new AppError('Conta a receber não encontrada', 404);
    }

    if (receivable.user_id !== userId) {
      throw new AppError('Acesso negado', 403);
    }

    const remainingAmount = await receivable.getRemainingAmount();
    return {
      ...receivable.toJSON(),
      remaining_amount: remainingAmount
    };
  }

  /**
   * Cria uma nova conta a receber.
   * @param {number} userId - ID do usuário autenticado.
   * @param {Object} receivableData - Dados da conta a receber.
   * @returns {Promise<Object>} Conta a receber criada.
   */
  async createReceivable(userId, receivableData) {
    // Validar dados de entrada
    const validatedData = createReceivableSchema.parse(receivableData);
    const { customer_id, category_id, amount, due_date, description, invoice_number, payment_terms, notes } = validatedData;

    // Verificar se o cliente existe
    const customer = await Customer.findOne({
      where: { id: customer_id }
    });

    if (!customer) {
      throw new AppError('Cliente não encontrado', 400);
    }

    // Verificar se a categoria existe (se fornecida)
    let finalCategoryId = category_id;
    if (!finalCategoryId) {
      const defaultCategory = await Category.findOne({
        where: { 
          [Op.or]: [
            { user_id: userId, is_default: true },
            { user_id: null, is_default: true } // Categorias padrão do sistema
          ]
        }
      });

      if (!defaultCategory) {
        throw new AppError('Categoria é obrigatória', 400);
      }
      finalCategoryId = defaultCategory.id;
    } else {
      const category = await Category.findOne({
        where: { 
          id: finalCategoryId,
          [Op.or]: [
            { user_id: userId },
            { user_id: null } // Categorias padrão do sistema
          ]
        }
      });

      if (!category) {
        throw new AppError('Categoria não encontrada', 400);
      }
    }

    const receivable = await Receivable.create({
      user_id: userId,
      customer_id,
      category_id: finalCategoryId,
      description,
      amount,
      due_date,
      invoice_number: invoice_number || null,
      payment_terms: payment_terms || null,
      notes: notes || null,
      status: 'pending'
    });

    return receivable;
  }

  /**
   * Atualiza uma conta a receber existente.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} receivableId - ID da conta a receber.
   * @param {Object} updateData - Dados para atualização.
   * @returns {Promise<Object>} Conta a receber atualizada.
   */
  async updateReceivable(userId, receivableId, updateData) {
    // Validar dados de entrada
    const validatedData = updateReceivableSchema.parse(updateData);
    const { description, amount, due_date, category_id, invoice_number, payment_terms, notes } = validatedData;

    const receivable = await Receivable.findOne({
      where: { id: receivableId }
    });

    if (!receivable) {
      throw new AppError('Conta a receber não encontrada', 404);
    }

    if (receivable.user_id !== userId) {
      throw new AppError('Acesso negado', 403);
    }

    // Verificar se a categoria existe (se fornecida)
    if (category_id) {
      const category = await Category.findOne({
        where: { 
          id: category_id,
          [Op.or]: [
            { user_id: userId },
            { user_id: null } // Categorias padrão do sistema
          ]
        }
      });

      if (!category) {
        throw new AppError('Categoria não encontrada', 400);
      }
    }

    await receivable.update({
      description,
      amount,
      due_date,
      category_id: category_id || null,
      invoice_number: invoice_number || null,
      payment_terms: payment_terms || null,
      notes: notes || null
    });

    return receivable;
  }

  /**
   * Exclui uma conta a receber específica.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} receivableId - ID da conta a receber.
   */
  async deleteReceivable(userId, receivableId) {
    const receivable = await Receivable.findOne({
      where: { 
        id: receivableId,
        user_id: userId 
      }
    });

    if (!receivable) {
      throw new AppError('Conta a receber não encontrada', 404);
    }

    // Verificar se há pagamentos associados
    const paymentCount = await Payment.count({
      where: { receivable_id: receivableId }
    });

    if (paymentCount > 0) {
      throw new AppError('Não é possível excluir uma conta a receber que possui pagamentos registrados', 400);
    }

    await receivable.destroy();
  }

  /**
   * Lista todos os pagamentos de uma conta a receber específica.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} receivableId - ID da conta a receber.
   * @returns {Promise<Array>} Lista de pagamentos.
   */
  async getPayments(userId, receivableId) {
    const receivable = await Receivable.findByPk(receivableId);

    if (!receivable) {
      throw new AppError('Conta a receber não encontrada', 404);
    }

    if (receivable.user_id !== userId) {
      throw new AppError('Acesso negado', 403);
    }

    const payments = await Payment.findAll({
      where: { receivable_id: receivableId },
      order: [['payment_date', 'DESC']]
    });

    return payments;
  }

  /**
   * Adiciona um pagamento a uma conta a receber.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} receivableId - ID da conta a receber.
   * @param {Object} paymentData - Dados do pagamento.
   * @returns {Promise<Object>} Pagamento criado e informações atualizadas.
   */
  async addPayment(userId, receivableId, paymentData) {
    // Validar dados de entrada
    const validatedData = createReceivablePaymentSchema.parse(paymentData);
    const { amount, payment_date, payment_method, account_id, notes } = validatedData;

    // Buscar a conta a receber
    const receivable = await Receivable.findOne({
      where: { 
        id: receivableId, 
        user_id: userId 
      },
      attributes: ['id', 'amount', 'status', 'description']
    });

    if (!receivable) {
      throw new AppError('Conta a receber não encontrada', 404);
    }

    // Verificar se a conta a receber já foi paga
    if (receivable.status === 'paid') {
      throw new AppError('Esta conta a receber já foi paga', 400);
    }

    // Buscar a conta bancária
    const account = await Account.findOne({
      where: { 
        id: account_id, 
        user_id: userId 
      },
      attributes: ['id', 'balance', 'bank_name']
    });

    if (!account) {
      throw new AppError('Conta bancária não encontrada', 404);
    }

    // Calcular valor restante da conta a receber
    const remainingAmount = await receivable.getRemainingAmount();

    // Verificar se o pagamento não excede o valor restante
    if (parseFloat(amount) > remainingAmount) {
      throw new AppError('Valor do pagamento excede o valor restante da conta a receber', 400);
    }

    // Criar o pagamento
    const payment = await Payment.create({
      receivable_id: receivableId,
      amount,
      payment_date,
      payment_method,
      account_id,
      notes: notes || null,
      user_id: userId
    });

    // Atualizar saldo da conta bancária
    const newBalance = parseFloat(account.balance) + parseFloat(amount);
    await account.update({ balance: newBalance });

    // Verificar se a conta a receber foi totalmente paga
    const newRemainingAmount = await receivable.getRemainingAmount();
    
    if (newRemainingAmount <= 0) {
      await receivable.update({ 
        status: 'paid',
        payment_date: payment_date,
        payment_method: payment_method
      });
    }

    return {
      payment: {
        id: payment.id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        account_id: payment.account_id,
        notes: payment.notes,
        created_at: payment.created_at
      },
      new_balance: newBalance,
      remaining_amount: newRemainingAmount
    };
  }

  /**
   * Lista contas a receber que vencem nos próximos 30 dias.
   * @param {number} userId - ID do usuário autenticado.
   * @returns {Promise<Array>} Lista de contas a vencer.
   */
  async getUpcomingDue(userId) {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const receivables = await Receivable.findAll({
      where: {
        user_id: userId,
        due_date: {
          [Op.between]: [today, thirtyDaysFromNow]
        },
        status: 'pending'
      },
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'is_default']
        }
      ],
      order: [['due_date', 'ASC']]
    });

    return receivables;
  }

  /**
   * Lista contas a receber vencidas.
   * @param {number} userId - ID do usuário autenticado.
   * @returns {Promise<Array>} Lista de contas vencidas.
   */
  async getOverdue(userId) {
    const today = new Date();

    const receivables = await Receivable.findAll({
      where: {
        user_id: userId,
        due_date: {
          [Op.lt]: today
        },
        status: 'pending'
      },
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'is_default']
        }
      ],
      order: [['due_date', 'ASC']]
    });

    return receivables;
  }
}

module.exports = new ReceivableService(); 