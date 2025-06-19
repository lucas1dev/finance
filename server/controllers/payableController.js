const { Payable, Customer, CustomerType, Payment, Category, Account, Transaction } = require('../models');
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
        include: [
          {
            model: Customer,
            as: 'customer',
            include: [
              {
                model: CustomerType,
                as: 'types',
                where: { type: 'supplier' },
                attributes: ['type']
              }
            ]
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'color']
          },
          {
            model: Payment,
            as: 'payments'
          }
        ],
        order: [['due_date', 'ASC']]
      });

      // Calcula o valor restante para cada conta
      const payablesWithRemaining = await Promise.all(payables.map(async (payable) => {
        const remainingAmount = await payable.getRemainingAmount();
        return {
          ...payable.toJSON(),
          remaining_amount: remainingAmount
        };
      }));

      res.json(payablesWithRemaining);
    } catch (error) {
      console.error('Erro ao buscar contas a pagar:', error);
      res.status(500).json({ error: 'Erro ao buscar contas a pagar' });
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
   * // Retorno: { id: 1, description: 'Conta 1', amount: 1000, remaining_amount: 500, customer: {...}, payments: [...] }
   */
  async show(req, res) {
    try {
      const payable = await Payable.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: Customer,
            as: 'customer',
            include: [
              {
                model: CustomerType,
                as: 'types',
                where: { type: 'supplier' },
                attributes: ['type']
              }
            ]
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'color']
          },
          {
            model: Payment,
            as: 'payments',
            attributes: ['id', 'amount', 'payment_date', 'payment_method']
          }
        ]
      });

      if (!payable) {
        return res.status(404).json({ error: 'Conta a pagar não encontrada' });
      }

      if (payable.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const remainingAmount = await payable.getRemainingAmount();
      const payableWithRemaining = {
        ...payable.toJSON(),
        remaining_amount: remainingAmount
      };

      res.json(payableWithRemaining);
    } catch (error) {
      console.error('Erro ao buscar conta a pagar:', error);
      res.status(500).json({ error: 'Erro ao buscar conta a pagar' });
    }
  }

  /**
   * Cria uma nova conta a pagar para o usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da conta a pagar.
   * @param {number} req.body.customer_id - ID do fornecedor.
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
   * // Body: { "customer_id": 1, "category_id": 2, "description": "Conta 1", "amount": 1000, "due_date": "2024-04-01" }
   * // Retorno: { id: 1, description: 'Conta 1', amount: 1000, status: 'pending', ... }
   */
  async create(req, res) {
    try {
      const { customer_id, category_id, description, amount, due_date, notes } = req.body;

      // Validação dos campos obrigatórios
      if (!customer_id || !description || !amount || !due_date) {
        return res.status(400).json({ error: 'Fornecedor, descrição, valor e data de vencimento são obrigatórios' });
      }

      // Verificar se o fornecedor existe e é do tipo 'supplier'
      const supplier = await Customer.findOne({
        where: { id: customer_id },
        include: [
          {
            model: CustomerType,
            as: 'types',
            where: { type: 'supplier' }
          }
        ]
      });

      if (!supplier) {
        return res.status(400).json({ error: 'Fornecedor não encontrado ou não é um fornecedor válido' });
      }

      // Verificar se a categoria existe (se fornecida)
      if (category_id) {
        const category = await Category.findOne({
          where: { 
            id: category_id,
            user_id: req.user.id
          }
        });

        if (!category) {
          return res.status(400).json({ error: 'Categoria não encontrada' });
        }
      }

      const payable = await Payable.create({
        user_id: req.user.id,
        customer_id,
        category_id: category_id || null,
        description,
        amount,
        due_date,
        status: 'pending',
        notes: notes || null
      });

      res.status(201).json(payable);
    } catch (error) {
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
      const { description, amount, due_date, category_id, notes } = req.body;

      // Validação dos campos obrigatórios
      if (!description || !amount || !due_date) {
        return res.status(400).json({ error: 'Descrição, valor e data de vencimento são obrigatórios' });
      }

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
            user_id: req.user.id
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
      console.error('Erro ao atualizar conta a pagar:', error);
      res.status(500).json({ error: 'Erro ao atualizar conta a pagar' });
    }
  }

  /**
   * Exclui uma conta a pagar.
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
      const payable = await Payable.findOne({
        where: { id: req.params.id }
      });

      if (!payable) {
        return res.status(404).json({ error: 'Conta a pagar não encontrada' });
      }

      if (payable.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      await payable.destroy();
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir conta a pagar:', error);
      res.status(500).json({ error: 'Erro ao excluir conta a pagar' });
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
   * // Body: { "amount": 500, "payment_date": "2024-01-15", "payment_method": "pix", "account_id": 1 }
   * // Retorno: { payment: {...}, newBalance: 500 }
   */
  async addPayment(req, res) {
    try {
      const { amount, payment_date, payment_method, description, account_id } = req.body;

      if (!amount || !payment_date || !payment_method || !account_id) {
        return res.status(400).json({ error: 'Valor, data do pagamento, método de pagamento e conta são obrigatórios' });
      }

      const payable = await Payable.findByPk(req.params.id);
      if (!payable) {
        return res.status(404).json({ error: 'Conta a pagar não encontrada' });
      }

      if (payable.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Verifica se o valor do pagamento é maior que o valor restante
      const remainingAmount = await payable.getRemainingAmount();
      if (parseFloat(amount) > remainingAmount) {
        return res.status(400).json({ error: 'Valor do pagamento não pode ser maior que o valor restante' });
      }

      // Busca a conta
      const account = await Account.findOne({
        where: {
          id: account_id,
          user_id: req.user.id
        }
      });

      if (!account) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      // Busca a categoria da conta a pagar ou cria uma padrão
      let category = null;
      if (payable.category_id) {
        category = await Category.findByPk(payable.category_id);
      }

      if (!category) {
        // Busca a categoria padrão de pagamentos
        category = await Category.findOne({
          where: {
            user_id: req.user.id,
            type: 'expense',
            name: 'Pagamentos'
          }
        });

        if (!category) {
          // Se não existir, cria a categoria padrão
          category = await Category.create({
            user_id: req.user.id,
            name: 'Pagamentos',
            type: 'expense',
            color: '#F44336'
          });
        }
      }

      // Cria o pagamento
      const payment = await Payment.create({
        payable_id: payable.id,
        amount,
        payment_date,
        payment_method,
        description: description || `Pagamento: ${payable.description}`
      });

      // Atualiza o saldo da conta (reduz o valor)
      const newBalance = Number(account.balance) - Number(amount);
      await account.update({ balance: newBalance });

      // Atualiza o status da conta a pagar
      const newRemainingAmount = remainingAmount - parseFloat(amount);
      const newStatus = newRemainingAmount === 0 ? 'paid' : 'pending';

      await payable.update({
        status: newStatus,
        payment_date: newStatus === 'paid' ? payment_date : null,
        payment_method: newStatus === 'paid' ? payment_method : null
      });

      // Registra a transação de saída
      await Transaction.create({
        user_id: req.user.id,
        account_id,
        type: 'expense',
        amount,
        description: `Pagamento: ${payable.description}`,
        date: payment_date,
        category_id: category.id,
        payment_id: payment.id
      });

      res.status(201).json({
        payment,
        newBalance
      });
    } catch (error) {
      console.error('Erro ao adicionar pagamento:', error);
      res.status(500).json({ error: 'Erro ao adicionar pagamento' });
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
            model: Customer,
            as: 'customer',
            include: [
              {
                model: CustomerType,
                as: 'types',
                where: { type: 'supplier' },
                attributes: ['type']
              }
            ]
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'color']
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
            model: Customer,
            as: 'customer',
            include: [
              {
                model: CustomerType,
                as: 'types',
                where: { type: 'supplier' },
                attributes: ['type']
              }
            ]
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'color']
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