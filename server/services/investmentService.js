const { Investment, Account, Category, Transaction, InvestmentContribution } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');
const { AppError } = require('../utils/errors');

/**
 * Service responsável pela lógica de negócio dos investimentos
 * @author Lucas Santos
 */
class InvestmentService {
  /**
   * Cria um novo investimento
   */
  async createInvestment(userId, data) {
    // Verifica se a conta de origem existe e pertence ao usuário
    const sourceAccount = await Account.findOne({
      where: { id: data.source_account_id, user_id: userId }
    });

    if (!sourceAccount) {
      throw new AppError('Conta não encontrada', 404);
    }

    // Verifica se a conta de destino existe e pertence ao usuário
    const destinationAccount = await Account.findOne({
      where: { id: data.destination_account_id, user_id: userId }
    });

    if (!destinationAccount) {
      throw new AppError('Conta não encontrada', 404);
    }

    // Verifica se a categoria existe (se fornecida)
    if (data.category_id) {
      const category = await Category.findOne({
        where: { id: data.category_id, user_id: userId }
      });

      if (!category) {
        throw new AppError('Categoria não encontrada', 404);
      }
    }

    // Verifica se há saldo suficiente na conta de origem para compra
    if (data.operation_type === 'compra') {
      if (parseFloat(sourceAccount.balance) < data.invested_amount) {
        throw new AppError('Saldo insuficiente na conta de origem', 400);
      }
    }

    // Inicia transação do banco de dados
    const result = await sequelize.transaction(async (t) => {
      // Cria o investimento
      const investment = await Investment.create({
        ...data,
        user_id: userId
      }, { transaction: t });

      // Cria duas transações diretamente
      const transactions = [];

      // Transação 1: Débito da conta de origem
      const debitTransaction = await Transaction.create({
        user_id: userId,
        account_id: data.source_account_id,
        category_id: data.category_id,
        investment_id: investment.id,
        type: 'expense',
        amount: data.invested_amount,
        description: `${data.operation_type === 'compra' ? 'Compra' : 'Venda'} de ${data.asset_name} - Débito`,
        payment_method: data.broker || 'transfer',
        payment_date: data.operation_date,
        date: data.operation_date
      }, { transaction: t });

      transactions.push(debitTransaction);

      // Transação 2: Crédito na conta de destino
      const creditTransaction = await Transaction.create({
        user_id: userId,
        account_id: data.destination_account_id,
        category_id: data.category_id,
        investment_id: investment.id,
        type: 'income',
        amount: data.invested_amount,
        description: `${data.operation_type === 'compra' ? 'Compra' : 'Venda'} de ${data.asset_name} - Crédito`,
        payment_method: data.broker || 'transfer',
        payment_date: data.operation_date,
        date: data.operation_date
      }, { transaction: t });

      transactions.push(creditTransaction);

      // Atualiza os saldos das contas
      await sourceAccount.update({
        balance: parseFloat(sourceAccount.balance) - data.invested_amount
      }, { transaction: t });

      await destinationAccount.update({
        balance: parseFloat(destinationAccount.balance) + data.invested_amount
      }, { transaction: t });

      return { investment, transactions };
    });

    // Busca o investimento com as associações
    const investmentWithAssociations = await Investment.findByPk(result.investment.id, {
      include: [
        { model: Account, as: 'account' },
        { model: Account, as: 'sourceAccount' },
        { model: Account, as: 'destinationAccount' },
        { model: Category, as: 'category' }
      ]
    });

    return { investment: investmentWithAssociations, transactions: result.transactions };
  }

  /**
   * Lista todos os investimentos do usuário com filtros e paginação
   */
  async getInvestments(userId, filters = {}) {
    const {
      investment_type,
      operation_type,
      status,
      broker,
      page = 1,
      limit = 10
    } = filters;

    // Constrói os filtros
    const where = { user_id: userId };
    
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
        { model: Account, as: 'sourceAccount' },
        { model: Account, as: 'destinationAccount' },
        { model: Category, as: 'category' }
      ],
      order: [['operation_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calcula estatísticas
    const totalInvested = await Investment.sum('invested_amount', {
      where: { 
        user_id: userId,
        operation_type: 'compra',
        status: 'ativo'
      }
    });

    const totalSold = await Investment.sum('invested_amount', {
      where: { 
        user_id: userId,
        operation_type: 'venda',
        status: 'vendido'
      }
    });

    return {
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
    };
  }

  /**
   * Obtém um investimento específico
   */
  async getInvestment(userId, investmentId) {
    const investment = await Investment.findOne({
      where: { id: investmentId, user_id: userId },
      include: [
        { model: Account, as: 'account' },
        { model: Account, as: 'sourceAccount' },
        { model: Account, as: 'destinationAccount' },
        { model: Category, as: 'category' },
        { model: InvestmentContribution, as: 'contributions' }
      ]
    });

    if (!investment) {
      throw new AppError('Investimento não encontrado', 404);
    }

    return investment;
  }

  /**
   * Atualiza um investimento
   */
  async updateInvestment(userId, investmentId, data) {
    // Busca o investimento
    const investment = await Investment.findOne({
      where: { id: investmentId, user_id: userId }
    });

    if (!investment) {
      throw new AppError('Investimento não encontrado', 404);
    }

    // Verifica se a conta existe (se fornecida)
    if (data.account_id) {
      const account = await Account.findOne({
        where: { id: data.account_id, user_id: userId }
      });

      if (!account) {
        throw new AppError('Conta não encontrada', 404);
      }
    }

    // Verifica se a categoria existe (se fornecida)
    if (data.category_id) {
      const category = await Category.findOne({
        where: { id: data.category_id, user_id: userId }
      });

      if (!category) {
        throw new AppError('Categoria não encontrada', 404);
      }
    }

    // Atualiza o investimento
    await investment.update(data);

    // Busca o investimento atualizado com as associações
    const updatedInvestment = await Investment.findByPk(investmentId, {
      include: [
        { model: Account, as: 'account' },
        { model: Category, as: 'category' }
      ]
    });

    return updatedInvestment;
  }

  /**
   * Exclui um investimento
   */
  async deleteInvestment(userId, investmentId) {
    const investment = await Investment.findOne({
      where: { id: investmentId, user_id: userId }
    });

    if (!investment) {
      throw new AppError('Investimento não encontrado', 404);
    }

    // Verifica se há transações associadas
    const transaction = await Transaction.findOne({
      where: { investment_id: investmentId }
    });

    if (transaction) {
      throw new AppError('Não é possível excluir um investimento que possui transações associadas', 400);
    }

    // Exclui o investimento
    await investment.destroy();
    return true;
  }

  /**
   * Obtém estatísticas dos investimentos
   */
  async getInvestmentStatistics(userId) {
    // Estatísticas gerais
    const totalInvested = await Investment.sum('invested_amount', {
      where: { 
        user_id: userId,
        operation_type: 'compra',
        status: 'ativo'
      }
    });

    const totalSold = await Investment.sum('invested_amount', {
      where: { 
        user_id: userId,
        operation_type: 'venda',
        status: 'vendido'
      }
    });

    // Estatísticas por tipo de investimento
    const byType = await Investment.findAll({
      where: { user_id: userId },
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
        user_id: userId,
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
      where: { user_id: userId },
      include: [
        { model: Account, as: 'account' },
        { model: Category, as: 'category' }
      ],
      order: [['operation_date', 'DESC']],
      limit: 5
    });

    return {
      general: {
        totalInvested: totalInvested || 0,
        totalSold: totalSold || 0,
        netInvestment: (totalInvested || 0) - (totalSold || 0),
        totalTransactions: await Investment.count({ where: { user_id: userId } })
      },
      byType,
      byBroker,
      recentInvestments
    };
  }

  /**
   * Lista todas as posições ativas disponíveis para venda
   */
  async getActivePositions(userId, filters = {}) {
    // Obtém todas as posições ativas
    let positions = await Investment.getActivePositions(userId);

    // Aplica filtros
    if (filters.investment_type) {
      positions = positions.filter(pos => pos.investment_type === filters.investment_type);
    }

    if (filters.broker) {
      positions = positions.filter(pos => pos.broker === filters.broker);
    }

    if (filters.asset_name) {
      const searchTerm = filters.asset_name.toLowerCase();
      positions = positions.filter(pos => 
        pos.assetName.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.ticker) {
      const searchTerm = filters.ticker.toLowerCase();
      positions = positions.filter(pos => 
        pos.ticker && pos.ticker.toLowerCase().includes(searchTerm)
      );
    }

    // Aplica paginação
    const total = positions.length;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const paginatedPositions = positions.slice(offset, offset + limit);

    return {
      positions: paginatedPositions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtém a posição detalhada de um ativo específico
   */
  async getAssetPosition(userId, assetName, ticker) {
    const position = await Investment.getPosition(userId, assetName, ticker);

    if (!position.hasPosition) {
      throw new AppError('Posição não encontrada para este ativo', 404);
    }

    // Busca histórico de operações para este ativo
    const operations = await Investment.findAll({
      where: {
        user_id: userId,
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

    return { position, operations };
  }

  /**
   * Realiza a venda de ativos de investimento
   */
  async sellAsset(userId, assetName, ticker, data) {
    const position = await Investment.getPosition(userId, assetName, ticker);
    
    if (!position.hasPosition) {
      throw new AppError('Posição não encontrada para este ativo', 404);
    }
    
    if (position.totalQuantity < data.quantity) {
      throw new AppError(
        `Quantidade insuficiente. Posição atual: ${position.totalQuantity}, Quantidade solicitada: ${data.quantity}`,
        400
      );
    }

    const account = await Account.findOne({
      where: { id: data.account_id, user_id: userId }
    });

    if (!account) {
      throw new AppError('Conta não encontrada', 404);
    }

    const totalAmount = data.quantity * data.unit_price;
    
    const originalInvestment = await Investment.findOne({
      where: {
        user_id: userId,
        asset_name: assetName,
        ticker: ticker || null,
        operation_type: 'compra',
        status: 'ativo'
      },
      order: [['operation_date', 'ASC']]
    });

    const userCategory = await Category.findOne({
      where: { user_id: userId },
      order: [['id', 'ASC']]
    });

    const categoryId = originalInvestment?.category_id || userCategory?.id || 1;

    const investment = await Investment.create({
      investment_type: 'acoes',
      asset_name: assetName,
      ticker: ticker,
      invested_amount: totalAmount,
      quantity: data.quantity,
      unit_price: data.unit_price,
      operation_date: data.operation_date,
      operation_type: 'venda',
      broker: data.broker,
      observations: data.observations,
      status: 'ativo',
      user_id: userId,
      account_id: data.account_id,
      category_id: categoryId
    });

    await account.update({
      balance: parseFloat(account.balance) + totalAmount
    });

    const transaction = await Transaction.create({
      type: 'income',
      amount: totalAmount,
      description: `Venda de ${data.quantity} ${assetName}${ticker ? ` (${ticker})` : ''}`,
      date: data.operation_date,
      account_id: data.account_id,
      category_id: categoryId,
      user_id: userId,
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

    return {
      investment: investmentWithAssociations,
      transaction: transactionWithAssociations
    };
  }
}

module.exports = new InvestmentService(); 