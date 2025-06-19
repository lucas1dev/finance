const { Investment, Account, Category, Transaction } = require('../models');
const { createInvestmentSchema, updateInvestmentSchema } = require('../utils/investmentValidators');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { Op } = require('sequelize');

/**
 * Controller para gerenciamento de investimentos.
 * Permite criar, listar, atualizar e excluir investimentos,
 * além de gerenciar o impacto nas contas e transações.
 */
class InvestmentController {
  /**
   * Cria um novo investimento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados do investimento.
   * @param {string} req.body.investment_type - Tipo de investimento.
   * @param {string} req.body.asset_name - Nome do ativo.
   * @param {string} req.body.ticker - Ticker do ativo (opcional).
   * @param {number} req.body.invested_amount - Valor investido.
   * @param {number} req.body.quantity - Quantidade de ativos.
   * @param {string} req.body.operation_date - Data da operação.
   * @param {string} req.body.operation_type - Tipo de operação (compra/venda).
   * @param {string} req.body.broker - Corretora (opcional).
   * @param {string} req.body.observations - Observações (opcional).
   * @param {number} req.body.account_id - ID da conta.
   * @param {number} req.body.category_id - ID da categoria (opcional).
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Investimento criado em formato JSON.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se a conta ou categoria não forem encontradas.
   * @example
   * // POST /investments
   * // Body: { "investment_type": "acoes", "asset_name": "Petrobras", "invested_amount": 1000, ... }
   * // Retorno: { "id": 1, "investment_type": "acoes", "asset_name": "Petrobras", ... }
   */
  async createInvestment(req, res) {
    try {
      // Valida os dados de entrada
      const validatedData = createInvestmentSchema.parse(req.body);

      // Verifica se a conta existe e pertence ao usuário
      const account = await Account.findOne({
        where: { id: validatedData.account_id, user_id: req.userId }
      });

      if (!account) {
        throw new NotFoundError('Conta não encontrada');
      }

      // Verifica se a categoria existe (se fornecida)
      if (validatedData.category_id) {
        const category = await Category.findOne({
          where: { id: validatedData.category_id, user_id: req.userId }
        });

        if (!category) {
          throw new NotFoundError('Categoria não encontrada');
        }
      }

      // Verifica se há saldo suficiente na conta para compra
      if (validatedData.operation_type === 'compra') {
        if (parseFloat(account.balance) < validatedData.invested_amount) {
          throw new ValidationError('Saldo insuficiente na conta');
        }
      }

      // Cria o investimento
      const investment = await Investment.create({
        ...validatedData,
        user_id: req.userId
      });

      // Atualiza o saldo da conta
      const balanceChange = validatedData.operation_type === 'compra' 
        ? -validatedData.invested_amount 
        : validatedData.invested_amount;

      await account.update({
        balance: parseFloat(account.balance) + balanceChange
      });

      // Cria uma transação para registrar a operação
      const transaction = await Transaction.create({
        type: validatedData.operation_type === 'compra' ? 'expense' : 'income',
        amount: validatedData.invested_amount,
        description: `${validatedData.operation_type === 'compra' ? 'Compra' : 'Venda'} de ${validatedData.asset_name}`,
        date: validatedData.operation_date,
        account_id: validatedData.account_id,
        category_id: validatedData.category_id,
        user_id: req.userId,
        investment_id: investment.id
      });

      // Busca o investimento com as associações
      const investmentWithAssociations = await Investment.findByPk(investment.id, {
        include: [
          { model: Account, as: 'account' },
          { model: Category, as: 'category' }
        ]
      });

      res.status(201).json({
        message: 'Investimento criado com sucesso',
        investment: investmentWithAssociations,
        transaction: transaction
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new ValidationError('Dados inválidos', error.errors);
      }
      throw error;
    }
  }

  /**
   * Lista todos os investimentos do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.investment_type - Filtrar por tipo de investimento.
   * @param {string} req.query.operation_type - Filtrar por tipo de operação.
   * @param {string} req.query.status - Filtrar por status.
   * @param {string} req.query.broker - Filtrar por corretora.
   * @param {number} req.query.page - Página para paginação.
   * @param {number} req.query.limit - Limite de itens por página.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de investimentos em formato JSON.
   * @example
   * // GET /investments?investment_type=acoes&page=1&limit=10
   * // Retorno: { "investments": [...], "total": 50, "page": 1, "totalPages": 5 }
   */
  async getInvestments(req, res) {
    const {
      investment_type,
      operation_type,
      status,
      broker,
      page = 1,
      limit = 10
    } = req.query;

    // Constrói os filtros
    const where = { user_id: req.userId };
    
    if (investment_type) where.investment_type = investment_type;
    if (operation_type) where.operation_type = operation_type;
    if (status) where.status = status;
    if (broker) where.broker = broker;

    // Configura a paginação
    const offset = (page - 1) * limit;

    // Busca os investimentos
    const { count, rows: investments } = await Investment.findAndCountAll({
      where,
      include: [
        { model: Account, as: 'account' },
        { model: Category, as: 'category' }
      ],
      order: [['operation_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calcula estatísticas
    const totalInvested = await Investment.sum('invested_amount', {
      where: { 
        user_id: req.userId,
        operation_type: 'compra',
        status: 'ativo'
      }
    });

    const totalSold = await Investment.sum('invested_amount', {
      where: { 
        user_id: req.userId,
        operation_type: 'venda',
        status: 'vendido'
      }
    });

    res.json({
      investments,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      statistics: {
        totalInvested: totalInvested || 0,
        totalSold: totalSold || 0,
        netInvestment: (totalInvested || 0) - (totalSold || 0)
      }
    });
  }

  /**
   * Obtém um investimento específico.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID do investimento.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Investimento em formato JSON.
   * @throws {NotFoundError} Se o investimento não for encontrado.
   * @example
   * // GET /investments/1
   * // Retorno: { "id": 1, "investment_type": "acoes", "asset_name": "Petrobras", ... }
   */
  async getInvestment(req, res) {
    const { id } = req.params;

    const investment = await Investment.findOne({
      where: { id, user_id: req.userId },
      include: [
        { model: Account, as: 'account' },
        { model: Category, as: 'category' },
        { model: require('../models').InvestmentContribution, as: 'contributions' }
      ]
    });

    if (!investment) {
      throw new NotFoundError('Investimento não encontrado');
    }

    res.json(investment);
  }

  /**
   * Atualiza um investimento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID do investimento.
   * @param {Object} req.body - Dados para atualização.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Investimento atualizado em formato JSON.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se o investimento não for encontrado.
   * @example
   * // PUT /investments/1
   * // Body: { "observations": "Atualização das observações" }
   * // Retorno: { "id": 1, "observations": "Atualização das observações", ... }
   */
  async updateInvestment(req, res) {
    try {
      const { id } = req.params;

      // Valida os dados de entrada
      const validatedData = updateInvestmentSchema.parse(req.body);

      // Busca o investimento
      const investment = await Investment.findOne({
        where: { id, user_id: req.userId }
      });

      if (!investment) {
        throw new NotFoundError('Investimento não encontrado');
      }

      // Verifica se a conta existe (se fornecida)
      if (validatedData.account_id) {
        const account = await Account.findOne({
          where: { id: validatedData.account_id, user_id: req.userId }
        });

        if (!account) {
          throw new NotFoundError('Conta não encontrada');
        }
      }

      // Verifica se a categoria existe (se fornecida)
      if (validatedData.category_id) {
        const category = await Category.findOne({
          where: { id: validatedData.category_id, user_id: req.userId }
        });

        if (!category) {
          throw new NotFoundError('Categoria não encontrada');
        }
      }

      // Atualiza o investimento
      await investment.update(validatedData);

      // Busca o investimento atualizado com as associações
      const updatedInvestment = await Investment.findByPk(id, {
        include: [
          { model: Account, as: 'account' },
          { model: Category, as: 'category' }
        ]
      });

      res.json({
        message: 'Investimento atualizado com sucesso',
        investment: updatedInvestment
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new ValidationError('Dados inválidos', error.errors);
      }
      throw error;
    }
  }

  /**
   * Exclui um investimento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID do investimento.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Mensagem de confirmação.
   * @throws {NotFoundError} Se o investimento não for encontrado.
   * @example
   * // DELETE /investments/1
   * // Retorno: { "message": "Investimento excluído com sucesso" }
   */
  async deleteInvestment(req, res) {
    const { id } = req.params;

    const investment = await Investment.findOne({
      where: { id, user_id: req.userId }
    });

    if (!investment) {
      throw new NotFoundError('Investimento não encontrado');
    }

    // Verifica se há transações associadas
    const transaction = await Transaction.findOne({
      where: { investment_id: id }
    });

    if (transaction) {
      throw new ValidationError('Não é possível excluir um investimento que possui transações associadas');
    }

    // Exclui o investimento
    await investment.destroy();

    res.json({
      message: 'Investimento excluído com sucesso'
    });
  }

  /**
   * Obtém estatísticas dos investimentos.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas em formato JSON.
   * @example
   * // GET /investments/statistics
   * // Retorno: { "totalInvested": 50000, "totalSold": 10000, "byType": {...} }
   */
  async getInvestmentStatistics(req, res) {
    // Estatísticas gerais
    const totalInvested = await Investment.sum('invested_amount', {
      where: { 
        user_id: req.userId,
        operation_type: 'compra',
        status: 'ativo'
      }
    });

    const totalSold = await Investment.sum('invested_amount', {
      where: { 
        user_id: req.userId,
        operation_type: 'venda',
        status: 'vendido'
      }
    });

    // Estatísticas por tipo de investimento
    const byType = await Investment.findAll({
      where: { user_id: req.userId },
      attributes: [
        'investment_type',
        [Investment.sequelize.fn('SUM', Investment.sequelize.col('invested_amount')), 'total_amount'],
        [Investment.sequelize.fn('COUNT', Investment.sequelize.col('id')), 'count']
      ],
      group: ['investment_type']
    });

    // Estatísticas por corretora
    const byBroker = await Investment.findAll({
      where: { 
        user_id: req.userId,
        broker: { [Op.ne]: null }
      },
      attributes: [
        'broker',
        [Investment.sequelize.fn('SUM', Investment.sequelize.col('invested_amount')), 'total_amount'],
        [Investment.sequelize.fn('COUNT', Investment.sequelize.col('id')), 'count']
      ],
      group: ['broker']
    });

    // Investimentos mais recentes
    const recentInvestments = await Investment.findAll({
      where: { user_id: req.userId },
      include: [
        { model: Account, as: 'account' },
        { model: Category, as: 'category' }
      ],
      order: [['operation_date', 'DESC']],
      limit: 5
    });

    res.json({
      general: {
        totalInvested: totalInvested || 0,
        totalSold: totalSold || 0,
        netInvestment: (totalInvested || 0) - (totalSold || 0),
        totalTransactions: await Investment.count({ where: { user_id: req.userId } })
      },
      byType,
      byBroker,
      recentInvestments
    });
  }
}

module.exports = new InvestmentController(); 