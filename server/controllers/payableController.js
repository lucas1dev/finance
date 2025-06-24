const { Payable, Supplier, Payment, Category, Account, Transaction } = require('../models');
const { createPayableSchema, updatePayableSchema, addPaymentSchema } = require('../utils/validators');
const { Op } = require('sequelize');

/**
 * Controlador responsável por gerenciar contas a pagar.
 * Permite criar, listar, atualizar e excluir contas a pagar, além de gerenciar pagamentos.
 */
class PayableController {
  /**
   * Lista todas as contas a pagar do usuário autenticado, com opção de filtro por status.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} [req.query.status] - Status para filtrar ('pending' ou 'paid').
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de contas a pagar em formato JSON.
   * @throws {Error} Se houver erro ao buscar contas a pagar.
   * @example
   * // GET /api/payables?status=pending
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: [{ id: 1, description: 'Conta 1', amount: 1000, remaining_amount: 500, ... }]
   */
  async index(req, res) {
    try {
      const { status } = req.query;
      const where = { user_id: req.user.id };
      
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

      res.json(payablesWithPayments);
    } catch (error) {
      console.error('Erro ao buscar contas a pagar:', error);
      if (error && error.stack) {
        console.error('Stack trace:', error.stack);
      }
      res.status(500).json({ error: 'Erro ao buscar contas a pagar', details: error.message });
    }
  }

  /**
   * Retorna os detalhes de uma conta a pagar específica do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} req.params.id - ID da conta a pagar.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Detalhes da conta a pagar em formato JSON.
   * @throws {Error} Se a conta a pagar não for encontrada ou não pertencer ao usuário.
   * @example
   * // GET /api/payables/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { id: 1, description: 'Conta 1', amount: 1000, remaining_amount: 500, payments: [...] }
   */
  async show(req, res) {
    try {
      const payable = await Payable.findOne({
        where: { 
          id: req.params.id,
          user_id: req.user.id 
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
        return res.status(404).json({ error: 'Conta a pagar não encontrada' });
      }

      // Buscar pagamentos separadamente
      const payments = await Payment.findAll({
        where: { payable_id: req.params.id },
        attributes: ['id', 'amount', 'payment_date', 'payment_method', 'description', 'created_at', 'updated_at'],
        order: [['payment_date', 'DESC']]
      });

      // Calcular valor restante
      const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const remainingAmount = parseFloat(payable.amount) - totalPaid;

      const payableWithDetails = {
        ...payable.toJSON(),
        payments,
        remaining_amount: remainingAmount
      };

      res.json(payableWithDetails);
    } catch (error) {
      console.error('Erro ao buscar conta a pagar:', error);
      res.status(500).json({ error: 'Erro ao buscar conta a pagar' });
    }
  }

  /**
   * Cria uma nova conta a pagar para o usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da conta a pagar.
   * @param {number} req.body.supplier_id - ID do fornecedor.
   * @param {number} [req.body.category_id] - ID da categoria (opcional).
   * @param {string} req.body.description - Descrição da conta a pagar.
   * @param {number} req.body.amount - Valor da conta a pagar.
   * @param {string} req.body.due_date - Data de vencimento (YYYY-MM-DD).
   * @param {string} [req.body.notes] - Observações adicionais.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Conta a pagar criada em formato JSON.
   * @throws {Error} Se os dados forem inválidos ou o fornecedor não for encontrado.
   * @example
   * // POST /api/payables
   * // Body: { "supplier_id": 1, "category_id": 2, "description": "Conta 1", "amount": 1000, "due_date": "2024-04-01" }
   * // Retorno: { id: 1, description: 'Conta 1', amount: 1000, status: 'pending', ... }
   */
  async create(req, res) {
    try {
      // Validar dados de entrada
      const validatedData = createPayableSchema.parse(req.body);
      const { supplier_id, category_id, description, amount, due_date, notes } = validatedData;

      // Verificar se o fornecedor existe
      const supplier = await Supplier.findOne({
        where: { 
          id: supplier_id,
          user_id: req.user.id
        }
      });

      if (!supplier) {
        return res.status(400).json({ error: 'Fornecedor não encontrado' });
      }

      // Verificar se a categoria existe (se fornecida)
      if (category_id) {
        const category = await Category.findOne({
          where: { 
            id: category_id,
            [Op.or]: [
              { user_id: req.user.id },
              { user_id: null } // Categorias padrão do sistema
            ]
          }
        });

        if (!category) {
          return res.status(400).json({ error: 'Categoria não encontrada' });
        }
      }

      const payable = await Payable.create({
        user_id: req.user.id,
        supplier_id,
        category_id: category_id || null,
        description,
        amount,
        due_date,
        status: 'pending',
        notes: notes || null
      });

      res.status(201).json(payable);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Dados inválidos' });
      }
      console.error('Erro ao criar conta a pagar:', error);
      res.status(500).json({ error: 'Erro ao criar conta a pagar' });
    }
  }

  /**
   * Atualiza uma conta a pagar existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados para atualização.
   * @param {string} req.body.description - Descrição da conta a pagar.
   * @param {number} req.body.amount - Valor da conta a pagar.
   * @param {string} req.body.due_date - Data de vencimento (YYYY-MM-DD).
   * @param {number} [req.body.category_id] - ID da categoria (opcional).
   * @param {string} [req.body.notes] - Observações adicionais.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Conta a pagar atualizada em formato JSON.
   * @throws {Error} Se a conta a pagar não for encontrada ou não pertencer ao usuário.
   * @example
   * // PATCH /api/payables/1
   * // Body: { "description": "Conta 1 Atualizada", "amount": 1200, "due_date": "2024-04-15" }
   * // Retorno: { id: 1, description: 'Conta 1 Atualizada', amount: 1200, ... }
   */
  async update(req, res) {
    try {
      // Validar dados de entrada
      const validatedData = updatePayableSchema.parse(req.body);
      const { description, amount, due_date, category_id, notes } = validatedData;

      const payable = await Payable.findOne({
        where: { id: req.params.id }
      });

      if (!payable) {
        return res.status(404).json({ error: 'Conta a pagar não encontrada' });
      }

      if (payable.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Verificar se a categoria existe (se fornecida)
      if (category_id) {
        const category = await Category.findOne({
          where: { 
            id: category_id,
            [Op.or]: [
              { user_id: req.user.id },
              { user_id: null } // Categorias padrão do sistema
            ]
          }
        });

        if (!category) {
          return res.status(400).json({ error: 'Categoria não encontrada' });
        }
      }

      await payable.update({
        description,
        amount,
        due_date,
        category_id: category_id || null,
        notes: notes || null
      });

      res.json(payable);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Dados inválidos' });
      }
      console.error('Erro ao atualizar conta a pagar:', error);
      res.status(500).json({ error: 'Erro ao atualizar conta a pagar' });
    }
  }

  /**
   * Exclui uma conta a pagar específica do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} req.params.id - ID da conta a pagar.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<void>} Resposta vazia com status 204.
   * @throws {Error} Se a conta a pagar não for encontrada ou não pertencer ao usuário.
   * @example
   * // DELETE /api/payables/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: Status 204 (No Content)
   */
  async delete(req, res) {
    try {
      // Buscar apenas os campos essenciais para verificação
      const payable = await Payable.findOne({
        where: { 
          id: req.params.id,
          user_id: req.user.id 
        },
        attributes: ['id', 'user_id', 'amount']
      });

      if (!payable) {
        return res.status(404).json({ error: 'Conta a pagar não encontrada' });
      }

      // Verificar se há pagamentos associados usando uma query separada
      const paymentCount = await Payment.count({
        where: { payable_id: req.params.id }
      });

      if (paymentCount > 0) {
        return res.status(400).json({ 
          error: 'Não é possível excluir uma conta a pagar que possui pagamentos registrados' 
        });
      }

      // Excluir usando uma query direta para evitar problemas com hooks
      const deletedCount = await Payable.destroy({
        where: { 
          id: req.params.id,
          user_id: req.user.id 
        }
      });

      if (deletedCount === 0) {
        return res.status(404).json({ error: 'Conta a pagar não encontrada' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir conta a pagar:', error);
      if (error && error.stack) {
        console.error('Stack trace:', error.stack);
      }
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ 
          error: 'Não é possível excluir esta conta a pagar pois ela possui relacionamentos ativos' 
        });
      }
      res.status(500).json({ error: 'Erro ao excluir conta a pagar', details: error.message });
    }
  }

  /**
   * Lista todos os pagamentos de uma conta a pagar específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} req.params.id - ID da conta a pagar.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Array>} Lista de pagamentos em formato JSON.
   * @throws {Error} Se a conta a pagar não for encontrada.
   * @example
   * // GET /api/payables/1/payments
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: [{ id: 1, amount: 500, payment_date: "2024-01-15", ... }]
   */
  async getPayments(req, res) {
    try {
      const payable = await Payable.findByPk(req.params.id);

      if (!payable) {
        return res.status(404).json({ error: 'Conta a pagar não encontrada' });
      }

      if (payable.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const payments = await Payment.findAll({
        where: { payable_id: req.params.id },
        order: [['payment_date', 'DESC']]
      });

      res.json(payments);
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      res.status(500).json({ error: 'Erro ao buscar pagamentos' });
    }
  }

  /**
   * Adiciona um pagamento a uma conta a pagar.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados do pagamento.
   * @param {number} req.body.amount - Valor do pagamento.
   * @param {string} req.body.payment_date - Data do pagamento (YYYY-MM-DD).
   * @param {string} req.body.payment_method - Método de pagamento.
   * @param {number} req.body.account_id - ID da conta bancária.
   * @param {string} [req.body.description] - Descrição do pagamento.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Pagamento criado e novo saldo da conta em formato JSON.
   * @throws {Error} Se os dados forem inválidos ou a conta a pagar não for encontrada.
   * @example
   * // POST /api/payables/1/payments
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "amount": 500, "payment_date": "2024-04-01", "payment_method": "pix", "account_id": 1 }
   * // Retorno: { "payment": {...}, "new_balance": 1500 }
   */
  async addPayment(req, res) {
    try {
      console.log('🔍 [addPayment] Iniciando processo de adição de pagamento');
      console.log('📋 [addPayment] Parâmetros recebidos:', {
        payable_id: req.params.id,
        user_id: req.user.id,
        body: req.body
      });

      const { id: payableId } = req.params;
      const { amount, payment_date, payment_method, account_id, notes } = req.body;

      console.log('🔍 [addPayment] Validando dados de entrada...');

      // Validar dados de entrada
      const validatedData = addPaymentSchema.parse({
        amount,
        payment_date,
        payment_method,
        account_id,
        notes
      });

      console.log('✅ [addPayment] Dados validados com sucesso');

      // Buscar a conta a pagar
      console.log('🔍 [addPayment] Buscando conta a pagar...');
      const payable = await Payable.findOne({
        where: { 
          id: payableId, 
          user_id: req.user.id 
        },
        attributes: ['id', 'amount', 'status', 'description']
      });

      if (!payable) {
        console.log('❌ [addPayment] Conta a pagar não encontrada');
        return res.status(404).json({ error: 'Conta a pagar não encontrada' });
      }

      console.log('✅ [addPayment] Conta a pagar encontrada:', {
        id: payable.id,
        amount: payable.amount,
        status: payable.status
      });

      // Verificar se a conta a pagar já foi paga
      if (payable.status === 'paid') {
        console.log('❌ [addPayment] Conta a pagar já foi paga');
        return res.status(400).json({ error: 'Esta conta a pagar já foi paga' });
      }

      // Buscar a conta bancária
      console.log('🔍 [addPayment] Buscando conta bancária...');
      const account = await Account.findOne({
        where: { 
          id: account_id, 
          user_id: req.user.id 
        },
        attributes: ['id', 'balance', 'bank_name']
      });

      if (!account) {
        console.log('❌ [addPayment] Conta bancária não encontrada');
        return res.status(404).json({ error: 'Conta bancária não encontrada' });
      }

      console.log('✅ [addPayment] Conta bancária encontrada:', {
        id: account.id,
        balance: account.balance,
        bank_name: account.bank_name
      });

      // Verificar se há saldo suficiente
      if (parseFloat(account.balance) < parseFloat(amount)) {
        console.log('❌ [addPayment] Saldo insuficiente na conta bancária');
        return res.status(400).json({ error: 'Saldo insuficiente na conta bancária' });
      }

      // Calcular valor restante da conta a pagar
      console.log('🔍 [addPayment] Calculando valor restante...');
      const remainingAmount = await payable.getRemainingAmount();
      console.log('📊 [addPayment] Valor restante calculado:', remainingAmount);

      // Verificar se o pagamento não excede o valor restante
      if (parseFloat(amount) > remainingAmount) {
        console.log('❌ [addPayment] Valor do pagamento excede o valor restante');
        return res.status(400).json({ 
          error: 'Valor do pagamento excede o valor restante da conta a pagar',
          remaining_amount: remainingAmount
        });
      }

      // Criar o pagamento
      console.log('🔍 [addPayment] Criando pagamento...');
      const payment = await Payment.create({
        payable_id: payableId,
        amount,
        payment_date,
        payment_method,
        account_id,
        notes: notes || null,
        user_id: req.user.id
      });

      console.log('✅ [addPayment] Pagamento criado com sucesso:', {
        id: payment.id,
        amount: payment.amount
      });

      // Atualizar saldo da conta bancária
      console.log('🔍 [addPayment] Atualizando saldo da conta bancária...');
      const newBalance = parseFloat(account.balance) - parseFloat(amount);
      await account.update({ balance: newBalance });

      console.log('✅ [addPayment] Saldo da conta bancária atualizado:', {
        old_balance: account.balance,
        new_balance: newBalance
      });

      // Verificar se a conta a pagar foi totalmente paga
      console.log('🔍 [addPayment] Verificando se conta foi totalmente paga...');
      const newRemainingAmount = await payable.getRemainingAmount();
      
      if (newRemainingAmount <= 0) {
        console.log('✅ [addPayment] Conta a pagar totalmente paga, atualizando status...');
        await payable.update({ 
          status: 'paid',
          payment_date: payment_date,
          payment_method: payment_method
        });
      }

      console.log('✅ [addPayment] Processo concluído com sucesso');

      res.status(201).json({
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
      });

    } catch (error) {
      console.error('❌ [addPayment] Erro durante o processo:', error);
      console.error('❌ [addPayment] Stack trace:', error.stack);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      
      res.status(500).json({ error: 'Erro ao adicionar pagamento', details: error.message });
    }
  }

  /**
   * Lista contas a pagar que vencem nos próximos 30 dias.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de contas a vencer em formato JSON.
   * @throws {Error} Se houver erro ao buscar contas a vencer.
   * @example
   * // GET /api/payables/upcoming-due
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: [{ id: 1, description: 'Conta 1', due_date: '2024-04-01', ... }]
   */
  async getUpcomingDue(req, res) {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const payables = await Payable.findAll({
        where: {
          user_id: req.user.id,
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

      res.json(payables);
    } catch (error) {
      console.error('Erro ao buscar contas a vencer:', error);
      res.status(500).json({ error: 'Erro ao buscar contas a vencer' });
    }
  }

  /**
   * Lista contas a pagar vencidas.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de contas vencidas em formato JSON.
   * @throws {Error} Se houver erro ao buscar contas vencidas.
   * @example
   * // GET /api/payables/overdue
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: [{ id: 1, description: 'Conta 1', due_date: '2024-03-01', ... }]
   */
  async getOverdue(req, res) {
    try {
      const today = new Date();

      const payables = await Payable.findAll({
        where: {
          user_id: req.user.id,
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

      res.json(payables);
    } catch (error) {
      console.error('Erro ao buscar contas vencidas:', error);
      res.status(500).json({ error: 'Erro ao buscar contas vencidas' });
    }
  }
}

const payableController = new PayableController();

module.exports = {
  index: payableController.index.bind(payableController),
  show: payableController.show.bind(payableController),
  create: payableController.create.bind(payableController),
  update: payableController.update.bind(payableController),
  delete: payableController.delete.bind(payableController),
  getPayments: payableController.getPayments.bind(payableController),
  addPayment: payableController.addPayment.bind(payableController),
  getUpcomingDue: payableController.getUpcomingDue.bind(payableController),
  getOverdue: payableController.getOverdue.bind(payableController)
}; 