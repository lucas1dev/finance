const { Payable, Supplier, Payment, Category, Account, Transaction } = require('../models');
const { createPayableSchema, updatePayableSchema, addPaymentSchema } = require('../utils/validators');
const { Op } = require('sequelize');
const { AppError } = require('../utils/errors');

/**
 * Service responsável por gerenciar contas a pagar.
 * Contém toda a lógica de negócio relacionada a contas a pagar.
 */
class PayableService {
  /**
   * Lista todas as contas a pagar do usuário, com opção de filtro por status.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} [status] - Status para filtrar ('pending' ou 'paid').
   * @returns {Promise<Array>} Lista de contas a pagar com pagamentos e valor restante.
   */
  async listPayables(userId, status = null) {
    const where = { user_id: userId };
    
    if (status) {
      where.status = status;
    }

    const payables = await Payable.findAll({
      where,
      attributes: [
        'id', 'user_id', 'supplier_id', 'category_id', 'description', 
        'amount', 'due_date', 'status', 'payment_date', 'payment_method', 
        'notes', 'created_at', 'updated_at'
      ],
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'document_type', 'document_number', 'email', 'phone', 'address']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'is_default']
        }
      ],
      order: [['due_date', 'ASC']]
    });

    // Buscar pagamentos separadamente para evitar problemas com campos inexistentes
    const payablesWithPayments = await Promise.all(payables.map(async (payable) => {
      const payments = await Payment.findAll({
        where: { payable_id: payable.id },
        attributes: ['id', 'amount', 'payment_date', 'payment_method', 'description', 'created_at', 'updated_at'],
        order: [['payment_date', 'DESC']]
      });

      // Calcular valor restante
      const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const remainingAmount = parseFloat(payable.amount) - totalPaid;

      return {
        ...payable.toJSON(),
        payments,
        remaining_amount: remainingAmount
      };
    }));

    return payablesWithPayments;
  }

  /**
   * Retorna os detalhes de uma conta a pagar específica.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} payableId - ID da conta a pagar.
   * @returns {Promise<Object>} Detalhes da conta a pagar com pagamentos.
   */
  async getPayableById(userId, payableId) {
    const payable = await Payable.findOne({
      where: { 
        id: payableId,
        user_id: userId 
      },
      attributes: [
        'id', 'user_id', 'supplier_id', 'category_id', 'description', 
        'amount', 'due_date', 'status', 'payment_date', 'payment_method', 
        'notes', 'created_at', 'updated_at'
      ],
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'document_type', 'document_number', 'email', 'phone', 'address']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'is_default']
        }
      ]
    });

    if (!payable) {
      throw new AppError('Conta a pagar não encontrada', 404);
    }

    // Buscar pagamentos separadamente
    const payments = await Payment.findAll({
      where: { payable_id: payableId },
      attributes: ['id', 'amount', 'payment_date', 'payment_method', 'description', 'created_at', 'updated_at'],
      order: [['payment_date', 'DESC']]
    });

    // Calcular valor restante
    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const remainingAmount = parseFloat(payable.amount) - totalPaid;

    return {
      ...payable.toJSON(),
      payments,
      remaining_amount: remainingAmount
    };
  }

  /**
   * Cria uma nova conta a pagar.
   * @param {number} userId - ID do usuário autenticado.
   * @param {Object} payableData - Dados da conta a pagar.
   * @returns {Promise<Object>} Conta a pagar criada.
   */
  async createPayable(userId, payableData) {
    // Validar dados de entrada
    const validatedData = createPayableSchema.parse(payableData);
    const { supplier_id, category_id, description, amount, due_date, notes } = validatedData;

    // Verificar se o fornecedor existe
    const supplier = await Supplier.findOne({
      where: { 
        id: supplier_id,
        user_id: userId
      }
    });

    if (!supplier) {
      throw new AppError('Fornecedor não encontrado', 400);
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

    const payable = await Payable.create({
      user_id: userId,
      supplier_id,
      category_id: category_id || null,
      description,
      amount,
      due_date,
      status: 'pending',
      notes: notes || null
    });

    return payable;
  }

  /**
   * Atualiza uma conta a pagar existente.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} payableId - ID da conta a pagar.
   * @param {Object} updateData - Dados para atualização.
   * @returns {Promise<Object>} Conta a pagar atualizada.
   */
  async updatePayable(userId, payableId, updateData) {
    // Validar dados de entrada
    const validatedData = updatePayableSchema.parse(updateData);
    const { description, amount, due_date, category_id, notes } = validatedData;

    const payable = await Payable.findOne({
      where: { id: payableId }
    });

    if (!payable) {
      throw new AppError('Conta a pagar não encontrada', 404);
    }

    if (payable.user_id !== userId) {
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

    await payable.update({
      description,
      amount,
      due_date,
      category_id: category_id || null,
      notes: notes || null
    });

    return payable;
  }

  /**
   * Exclui uma conta a pagar específica.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} payableId - ID da conta a pagar.
   */
  async deletePayable(userId, payableId) {
    // Buscar apenas os campos essenciais para verificação
    const payable = await Payable.findOne({
      where: { 
        id: payableId,
        user_id: userId 
      },
      attributes: ['id', 'user_id', 'amount']
    });

    if (!payable) {
      throw new AppError('Conta a pagar não encontrada', 404);
    }

    // Verificar se há pagamentos associados usando uma query separada
    const paymentCount = await Payment.count({
      where: { payable_id: payableId }
    });

    if (paymentCount > 0) {
      throw new AppError('Não é possível excluir uma conta a pagar que possui pagamentos registrados', 400);
    }

    // Excluir usando uma query direta para evitar problemas com hooks
    const deletedCount = await Payable.destroy({
      where: { 
        id: payableId,
        user_id: userId 
      }
    });

    if (deletedCount === 0) {
      throw new AppError('Conta a pagar não encontrada', 404);
    }
  }

  /**
   * Lista todos os pagamentos de uma conta a pagar específica.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} payableId - ID da conta a pagar.
   * @returns {Promise<Array>} Lista de pagamentos.
   */
  async getPayments(userId, payableId) {
    const payable = await Payable.findByPk(payableId);

    if (!payable) {
      throw new AppError('Conta a pagar não encontrada', 404);
    }

    if (payable.user_id !== userId) {
      throw new AppError('Acesso negado', 403);
    }

    const payments = await Payment.findAll({
      where: { payable_id: payableId },
      order: [['payment_date', 'DESC']]
    });

    return payments;
  }

  /**
   * Adiciona um pagamento a uma conta a pagar.
   * @param {number} userId - ID do usuário autenticado.
   * @param {string} payableId - ID da conta a pagar.
   * @param {Object} paymentData - Dados do pagamento.
   * @returns {Promise<Object>} Pagamento criado e informações atualizadas.
   */
  async addPayment(userId, payableId, paymentData) {
    // Validar dados de entrada
    const validatedData = addPaymentSchema.parse(paymentData);
    const { amount, payment_date, payment_method, account_id, notes } = validatedData;

    // Buscar a conta a pagar
    const payable = await Payable.findOne({
      where: { 
        id: payableId, 
        user_id: userId 
      },
      attributes: ['id', 'amount', 'status', 'description']
    });

    if (!payable) {
      throw new AppError('Conta a pagar não encontrada', 404);
    }

    // Verificar se a conta a pagar já foi paga
    if (payable.status === 'paid') {
      throw new AppError('Esta conta a pagar já foi paga', 400);
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

    // Verificar se há saldo suficiente
    if (parseFloat(account.balance) < parseFloat(amount)) {
      throw new AppError('Saldo insuficiente na conta bancária', 400);
    }

    // Calcular valor restante da conta a pagar
    const remainingAmount = await payable.getRemainingAmount();

    // Verificar se o pagamento não excede o valor restante
    if (parseFloat(amount) > remainingAmount) {
      throw new AppError('Valor do pagamento excede o valor restante da conta a pagar', 400);
    }

    // Criar o pagamento
    const payment = await Payment.create({
      payable_id: payableId,
      amount,
      payment_date,
      payment_method,
      account_id,
      notes: notes || null,
      user_id: userId
    });

    // Atualizar saldo da conta bancária
    const newBalance = parseFloat(account.balance) - parseFloat(amount);
    await account.update({ balance: newBalance });

    // Verificar se a conta a pagar foi totalmente paga
    const newRemainingAmount = await payable.getRemainingAmount();
    
    if (newRemainingAmount <= 0) {
      await payable.update({ 
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
   * Lista contas a pagar que vencem nos próximos 30 dias.
   * @param {number} userId - ID do usuário autenticado.
   * @returns {Promise<Array>} Lista de contas a vencer.
   */
  async getUpcomingDue(userId) {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const payables = await Payable.findAll({
      where: {
        user_id: userId,
        due_date: {
          [Op.between]: [today, thirtyDaysFromNow]
        },
        status: 'pending'
      },
      include: [
        {
          model: Supplier,
          as: 'supplier'
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'is_default']
        }
      ],
      order: [['due_date', 'ASC']]
    });

    return payables;
  }

  /**
   * Lista contas a pagar vencidas.
   * @param {number} userId - ID do usuário autenticado.
   * @returns {Promise<Array>} Lista de contas vencidas.
   */
  async getOverdue(userId) {
    const today = new Date();

    const payables = await Payable.findAll({
      where: {
        user_id: userId,
        due_date: {
          [Op.lt]: today
        },
        status: 'pending'
      },
      include: [
        {
          model: Supplier,
          as: 'supplier'
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'is_default']
        }
      ],
      order: [['due_date', 'ASC']]
    });

    return payables;
  }
}

module.exports = new PayableService(); 