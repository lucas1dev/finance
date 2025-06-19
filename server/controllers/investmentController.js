const { Investment, Account, Category, Transaction } = require('../models');
const { createInvestmentSchema, updateInvestmentSchema, sellAssetSchema, listPositionsSchema } = require('../utils/investmentValidators');
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

  /**
   * Lista todas as posições ativas disponíveis para venda.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.investment_type - Filtrar por tipo de investimento.
   * @param {string} req.query.broker - Filtrar por corretora.
   * @param {string} req.query.asset_name - Buscar por nome do ativo.
   * @param {string} req.query.ticker - Buscar por ticker.
   * @param {number} req.query.page - Página para paginação.
   * @param {number} req.query.limit - Limite por página.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de posições ativas.
   * @example
   * // GET /investments/positions?investment_type=acoes&page=1&limit=10
   * // Retorno: { "positions": [...], "pagination": {...} }
   */
  async getActivePositions(req, res) {
    try {
      const validatedFilters = listPositionsSchema.parse(req.query);
      
      // Obtém todas as posições ativas
      let positions = await Investment.getActivePositions(req.userId);

      // Aplica filtros
      if (validatedFilters.investment_type) {
        positions = positions.filter(pos => pos.investment_type === validatedFilters.investment_type);
      }

      if (validatedFilters.broker) {
        positions = positions.filter(pos => pos.broker === validatedFilters.broker);
      }

      if (validatedFilters.asset_name) {
        const searchTerm = validatedFilters.asset_name.toLowerCase();
        positions = positions.filter(pos => 
          pos.assetName.toLowerCase().includes(searchTerm)
        );
      }

      if (validatedFilters.ticker) {
        const searchTerm = validatedFilters.ticker.toLowerCase();
        positions = positions.filter(pos => 
          pos.ticker && pos.ticker.toLowerCase().includes(searchTerm)
        );
      }

      // Aplica paginação
      const total = positions.length;
      const page = validatedFilters.page;
      const limit = validatedFilters.limit;
      const offset = (page - 1) * limit;
      const paginatedPositions = positions.slice(offset, offset + limit);

      res.json({
        positions: paginatedPositions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new ValidationError('Filtros inválidos', error.errors);
      }
      throw error;
    }
  }

  /**
   * Obtém a posição detalhada de um ativo específico.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.assetName - Nome do ativo.
   * @param {string} req.params.ticker - Ticker do ativo (opcional).
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Posição detalhada do ativo.
   * @throws {NotFoundError} Se o ativo não for encontrado.
   * @example
   * // GET /investments/positions/Petrobras
   * // Retorno: { "assetName": "Petrobras", "totalQuantity": 100, ... }
   */
  async getAssetPosition(req, res) {
    const { assetName, ticker } = req.params;

    const position = await Investment.getPosition(req.userId, assetName, ticker);

    if (!position.hasPosition) {
      throw new NotFoundError('Posição não encontrada para este ativo');
    }

    // Busca histórico de operações para este ativo
    const operations = await Investment.findAll({
      where: {
        user_id: req.userId,
        asset_name: assetName,
        ticker: ticker || null,
        status: 'ativo'
      },
      include: [
        { model: Account, as: 'account' },
        { model: Category, as: 'category' }
      ],
      order: [['operation_date', 'ASC']]
    });

    res.json({
      position,
      operations
    });
  }

  /**
   * Realiza a venda de ativos de investimento, gerando uma transação de entrada na conta selecionada.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da rota.
   * @param {string} req.params.assetName - Nome do ativo a ser vendido.
   * @param {string} [req.params.ticker] - Ticker do ativo (opcional).
   * @param {Object} req.body - Dados da venda.
   * @param {number} req.body.quantity - Quantidade de ativos a vender.
   * @param {number} req.body.unit_price - Preço unitário de venda.
   * @param {string} req.body.operation_date - Data da operação de venda.
   * @param {number} req.body.account_id - ID da conta que receberá o valor.
   * @param {string} req.body.broker - Corretora da operação.
   * @param {string} [req.body.observations] - Observações (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com os dados da venda, investimento e transação gerada.
   * @throws {ValidationError} Se não houver posição suficiente ou dados inválidos.
   * @throws {NotFoundError} Se o ativo ou conta não for encontrado.
   * @example
   * // POST /api/investments/positions/PETR4/sell
   * // Body: { quantity: 10, unit_price: 30, operation_date: '2024-03-25', account_id: 1, broker: 'xp_investimentos' }
   * // Retorno: { message: 'Venda registrada com sucesso', investment: { ... }, transaction: { ... } }
   */
  async sellAsset(req, res) {
    try {
      const { assetName, ticker } = req.params;
      const validatedData = sellAssetSchema.parse(req.body);
      const position = await Investment.getPosition(req.userId, assetName, ticker);
      if (!position.hasPosition) {
        throw new NotFoundError('Posição não encontrada para este ativo');
      }
      if (position.totalQuantity < validatedData.quantity) {
        throw new ValidationError(
          `Quantidade insuficiente. Posição atual: ${position.totalQuantity}, Quantidade solicitada: ${validatedData.quantity}`
        );
      }
      const account = await Account.findOne({
        where: { id: validatedData.account_id, user_id: req.userId }
      });
      if (!account) {
        throw new NotFoundError('Conta não encontrada');
      }
      const totalAmount = validatedData.quantity * validatedData.unit_price;
      const originalInvestment = await Investment.findOne({
        where: {
          user_id: req.userId,
          asset_name: assetName,
          ticker: ticker || null,
          operation_type: 'compra',
          status: 'ativo'
        },
        order: [['operation_date', 'ASC']]
      });
      const userCategory = await Category.findOne({
        where: { user_id: req.userId },
        order: [['id', 'ASC']]
      });
      const categoryId = originalInvestment?.category_id || userCategory?.id || 1;
      const investment = await Investment.create({
        investment_type: 'acoes',
        asset_name: assetName,
        ticker: ticker,
        invested_amount: totalAmount,
        quantity: validatedData.quantity,
        unit_price: validatedData.unit_price,
        operation_date: validatedData.operation_date,
        operation_type: 'venda',
        broker: validatedData.broker,
        observations: validatedData.observations,
        status: 'ativo',
        user_id: req.userId,
        account_id: validatedData.account_id,
        category_id: categoryId
      });
      await account.update({
        balance: parseFloat(account.balance) + totalAmount
      });
      const transaction = await Transaction.create({
        type: 'income',
        amount: totalAmount,
        description: `Venda de ${validatedData.quantity} ${assetName}${ticker ? ` (${ticker})` : ''}`,
        date: validatedData.operation_date,
        account_id: validatedData.account_id,
        category_id: categoryId,
        user_id: req.userId,
        investment_id: investment.id
      });
      const transactionWithAssociations = await Transaction.findByPk(transaction.id, {
        include: [
          { model: Account, as: 'account' }
        ]
      });
      const investmentWithAssociations = await Investment.findByPk(investment.id, {
        include: [
          { model: Account, as: 'account' },
          { model: Category, as: 'category' }
        ]
      });
      res.status(201).json({
        message: 'Venda registrada com sucesso',
        investment: investmentWithAssociations,
        transaction: transactionWithAssociations
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
      }
      if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
      }
      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = new InvestmentController(); 