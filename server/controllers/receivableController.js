const { Receivable, Transaction, Payment, Category, Account, Customer, CustomerType } = require('../models');
const { Op } = require('sequelize');

/**
 * Controlador responsável por gerenciar contas a receber.
 * Permite criar, listar, atualizar e excluir contas a receber, além de gerenciar pagamentos.
 */
class ReceivableController {
  /**
   * Lista todas as contas a receber do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de contas a receber em formato JSON.
   * @throws {Error} Se houver erro ao buscar contas a receber.
   * @example
   * // GET /api/receivables
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: [{ id: 1, description: 'Conta 1', amount: 1000, remaining_amount: 500, ... }]
   */
  async index(req, res) {
    try {
      const receivables = await Receivable.findAll({
        where: { user_id: req.user.id },
        include: [
          {
            model: Customer,
            as: 'customer',
            include: [
              {
                model: CustomerType,
                as: 'types',
                where: { type: 'customer' },
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
      const receivablesWithRemaining = await Promise.all(receivables.map(async (receivable) => {
        const remainingAmount = await receivable.getRemainingAmount();
        return {
          ...receivable.toJSON(),
          remaining_amount: remainingAmount
        };
      }));

      res.json(receivablesWithRemaining);
    } catch (error) {
      console.error('Erro ao buscar contas a receber:', error);
      res.status(500).json({ error: 'Erro ao buscar contas a receber' });
    }
  }

  /**
   * Retorna os detalhes de uma conta a receber específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} req.params.id - ID da conta a receber.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Detalhes da conta a receber em formato JSON.
   * @throws {Error} Se a conta a receber não for encontrada ou não pertencer ao usuário.
   * @example
   * // GET /api/receivables/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { id: 1, description: 'Conta 1', amount: 1000, remaining_amount: 500, ... }
   */
  async show(req, res) {
    try {
      const receivable = await Receivable.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: Customer,
            as: 'customer',
            include: [
              {
                model: CustomerType,
                as: 'types',
                where: { type: 'customer' },
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
        ]
      });

      if (!receivable) {
        return res.status(404).json({ error: 'Conta a receber não encontrada' });
      }

      if (receivable.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const remainingAmount = await receivable.getRemainingAmount();
      const receivableWithRemaining = {
        ...receivable.toJSON(),
        remaining_amount: remainingAmount
      };

      res.json(receivableWithRemaining);
    } catch (error) {
      console.error('Erro ao buscar conta a receber:', error);
      res.status(500).json({ error: 'Erro ao buscar conta a receber' });
    }
  }

  /**
   * Cria uma nova conta a receber para o usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da conta a receber.
   * @param {number} req.body.customer_id - ID do cliente.
   * @param {number} [req.body.category_id] - ID da categoria (opcional).
   * @param {string} req.body.description - Descrição da conta a receber.
   * @param {number} req.body.amount - Valor da conta a receber.
   * @param {string} req.body.due_date - Data de vencimento (YYYY-MM-DD).
   * @param {string} [req.body.notes] - Observações adicionais.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Conta a receber criada em formato JSON.
   * @throws {Error} Se os dados forem inválidos ou o cliente não for encontrado.
   * @example
   * // POST /api/receivables
   * // Body: { "customer_id": 1, "category_id": 2, "description": "Venda 001", "amount": 1000, "due_date": "2024-04-01" }
   * // Retorno: { id: 1, description: 'Venda 001', amount: 1000, status: 'pending', ... }
   */
  async store(req, res) {
    try {
      const { customer_id, category_id, amount, due_date, description, notes } = req.body;

      // Validação dos campos obrigatórios
      if (!customer_id || !amount || !due_date || !description) {
        return res.status(400).json({ error: 'Cliente, valor, data de vencimento e descrição são obrigatórios' });
      }

      // Verificar se o cliente existe e é do tipo 'customer'
      const customer = await Customer.findOne({
        where: { id: customer_id },
        include: [
          {
            model: CustomerType,
            as: 'types',
            where: { type: 'customer' }
          }
        ]
      });

      if (!customer) {
        return res.status(400).json({ error: 'Cliente não encontrado ou não é um cliente válido' });
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

      const receivable = await Receivable.create({
        user_id: req.user.id,
        customer_id,
        category_id: category_id || null,
        description,
        amount,
        due_date,
        status: 'pending',
        notes: notes || null
      });

      res.status(201).json(receivable);
    } catch (error) {
      console.error('Erro ao criar conta a receber:', error);
      res.status(500).json({ error: 'Erro ao criar conta a receber' });
    }
  }

  /**
   * Atualiza uma conta a receber existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados para atualização.
   * @param {string} req.body.description - Descrição da conta a receber.
   * @param {number} req.body.amount - Valor da conta a receber.
   * @param {string} req.body.due_date - Data de vencimento (YYYY-MM-DD).
   * @param {number} [req.body.category_id] - ID da categoria (opcional).
   * @param {string} [req.body.notes] - Observações adicionais.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Conta a receber atualizada em formato JSON.
   * @throws {Error} Se a conta a receber não for encontrada ou não pertencer ao usuário.
   * @example
   * // PATCH /api/receivables/1
   * // Body: { "description": "Venda 001 Atualizada", "amount": 1200, "due_date": "2024-04-15" }
   * // Retorno: { id: 1, description: 'Venda 001 Atualizada', amount: 1200, ... }
   */
  async update(req, res) {
    try {
      const { description, amount, due_date, category_id, notes } = req.body;

      const receivable = await Receivable.findOne({
        where: { id: req.params.id }
      });

      if (!receivable) {
        return res.status(404).json({ error: 'Conta a receber não encontrada' });
      }

      if (receivable.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Validação dos campos obrigatórios
      if (!description || !amount || !due_date) {
        return res.status(400).json({ error: 'Descrição, valor e data de vencimento são obrigatórios' });
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

      await receivable.update({
        description,
        amount,
        due_date,
        category_id: category_id || null,
        notes: notes || null
      });

      res.json(receivable);
    } catch (error) {
      console.error('Erro ao atualizar conta a receber:', error);
      res.status(500).json({ error: 'Erro ao atualizar conta a receber' });
    }
  }

  /**
   * Exclui uma conta a receber.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} req.params.id - ID da conta a receber.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<void>} Resposta vazia com status 204.
   * @throws {Error} Se a conta a receber não for encontrada ou não pertencer ao usuário.
   * @example
   * // DELETE /api/receivables/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: Status 204 (No Content)
   */
  async destroy(req, res) {
    try {
      const receivable = await Receivable.findOne({
        where: { id: req.params.id }
      });

      if (!receivable) {
        return res.status(404).json({ error: 'Conta a receber não encontrada' });
      }

      if (receivable.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      await receivable.destroy();
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir conta a receber:', error);
      res.status(500).json({ error: 'Erro ao excluir conta a receber' });
    }
  }

  /**
   * Lista todos os pagamentos de uma conta a receber específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} req.params.id - ID da conta a receber.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Array>} Lista de pagamentos em formato JSON.
   * @throws {Error} Se a conta a receber não for encontrada.
   * @example
   * // GET /api/receivables/1/payments
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: [{ id: 1, amount: 500, payment_date: "2024-01-15", ... }]
   */
  async getPayments(req, res) {
    try {
      const receivable = await Receivable.findByPk(req.params.id);

      if (!receivable) {
        return res.status(404).json({ error: 'Conta a receber não encontrada' });
      }

      if (receivable.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const payments = await Payment.findAll({
        where: { receivable_id: req.params.id },
        order: [['payment_date', 'DESC']]
      });

      res.json(payments);
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      res.status(500).json({ error: 'Erro ao buscar pagamentos' });
    }
  }

  /**
   * Adiciona um pagamento a uma conta a receber.
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
   * @throws {Error} Se os dados forem inválidos ou a conta a receber não for encontrada.
   * @example
   * // POST /api/receivables/1/payments
   * // Body: { "amount": 500, "payment_date": "2024-01-15", "payment_method": "pix", "account_id": 1 }
   * // Retorno: { payment: {...}, newBalance: 1500 }
   */
  async addPayment(req, res) {
    try {
      const { amount, payment_date, payment_method, description, account_id } = req.body;

      if (!amount || !payment_date || !payment_method || !account_id) {
        return res.status(400).json({ error: 'Valor, data do pagamento, método de pagamento e conta são obrigatórios' });
      }

      // Validação de valores negativos
      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Valor do pagamento deve ser maior que zero' });
      }

      const receivable = await Receivable.findByPk(req.params.id);
      if (!receivable) {
        return res.status(404).json({ error: 'Conta a receber não encontrada' });
      }

      if (receivable.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Verifica se o valor do pagamento é maior que o valor restante
      const remainingAmount = await receivable.getRemainingAmount();
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

      // Busca a categoria da conta a receber ou cria uma padrão
      let category = null;
      if (receivable.category_id) {
        category = await Category.findByPk(receivable.category_id);
      }

      if (!category) {
        // Busca a categoria padrão de recebimentos
        category = await Category.findOne({
          where: {
            user_id: req.user.id,
            type: 'income',
            name: 'Recebimentos'
          }
        });

        if (!category) {
          // Se não existir, cria a categoria padrão
          category = await Category.create({
            user_id: req.user.id,
            name: 'Recebimentos',
            type: 'income',
            color: '#4CAF50'
          });
        }
      }

      // Cria o pagamento
      const payment = await Payment.create({
        receivable_id: receivable.id,
        amount,
        payment_date,
        payment_method,
        description: description || `Pagamento: ${receivable.description}`
      });

      // Atualiza o saldo da conta
      const newBalance = Number(account.balance) + Number(amount);
      await account.update({ balance: newBalance });

      // Atualiza o status da conta a receber
      const newRemainingAmount = remainingAmount - parseFloat(amount);
      const newStatus = newRemainingAmount === 0 ? 'paid' : 'pending';

      await receivable.update({
        status: newStatus,
        payment_date: newStatus === 'paid' ? payment_date : null,
        payment_method: newStatus === 'paid' ? payment_method : null
      });

      // Registra a transação de entrada
      await Transaction.create({
        user_id: req.user.id,
        account_id,
        type: 'income',
        amount,
        description: `Recebimento: ${receivable.description}`,
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
   * Lista contas a receber que vencem nos próximos 30 dias.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de contas a vencer em formato JSON.
   * @throws {Error} Se houver erro ao buscar contas a vencer.
   * @example
   * // GET /api/receivables/upcoming-due
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: [{ id: 1, description: 'Conta 1', due_date: '2024-04-01', ... }]
   */
  async getUpcomingDue(req, res) {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const receivables = await Receivable.findAll({
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
                where: { type: 'customer' },
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

      res.json(receivables);
    } catch (error) {
      console.error('Erro ao buscar contas a vencer:', error);
      res.status(500).json({ error: 'Erro ao buscar contas a vencer' });
    }
  }

  /**
   * Lista contas a receber vencidas.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de contas vencidas em formato JSON.
   * @throws {Error} Se houver erro ao buscar contas vencidas.
   * @example
   * // GET /api/receivables/overdue
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: [{ id: 1, description: 'Conta 1', due_date: '2024-03-01', ... }]
   */
  async getOverdue(req, res) {
    try {
      const today = new Date();

      const receivables = await Receivable.findAll({
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
                where: { type: 'customer' },
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

      res.json(receivables);
    } catch (error) {
      console.error('Erro ao buscar contas vencidas:', error);
      res.status(500).json({ error: 'Erro ao buscar contas vencidas' });
    }
  }
}

const receivableController = new ReceivableController();

module.exports = {
  index: receivableController.index.bind(receivableController),
  show: receivableController.show.bind(receivableController),
  store: receivableController.store.bind(receivableController),
  update: receivableController.update.bind(receivableController),
  destroy: receivableController.destroy.bind(receivableController),
  getPayments: receivableController.getPayments.bind(receivableController),
  addPayment: receivableController.addPayment.bind(receivableController),
  getUpcomingDue: receivableController.getUpcomingDue.bind(receivableController),
  getOverdue: receivableController.getOverdue.bind(receivableController)
}; 