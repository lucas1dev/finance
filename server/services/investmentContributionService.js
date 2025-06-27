/**
 * Service para gerenciamento de aportes de investimentos
 * Implementa CRUD de aportes, cálculos e estatísticas
 */
const { InvestmentContribution, Investment, Account, Transaction } = require('../models');
const { 
  createContributionSchema, 
  updateContributionSchema, 
  contributionIdSchema,
  investmentIdSchema,
  contributionFiltersSchema 
} = require('../utils/investmentContributionValidators');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { logger } = require('../utils/logger');

/**
 * Service responsável por gerenciar aportes de investimentos.
 */
class InvestmentContributionService {
  /**
   * Cria um novo aporte para um investimento.
   * @param {number} userId - ID do usuário.
   * @param {Object} contributionData - Dados do aporte.
   * @param {number} contributionData.investment_id - ID do investimento.
   * @param {string} contributionData.contribution_date - Data do aporte (YYYY-MM-DD).
   * @param {number} contributionData.amount - Valor total do aporte.
   * @param {number} contributionData.quantity - Quantidade de ativos.
   * @param {number} contributionData.unit_price - Preço unitário.
   * @param {string} contributionData.broker - Corretora (opcional).
   * @param {string} contributionData.observations - Observações (opcional).
   * @returns {Promise<Object>} Aporte criado com transações.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se o investimento não for encontrado.
   */
  async createContribution(userId, contributionData) {
    try {
      // Validar dados de entrada
      const validatedData = createContributionSchema.parse(contributionData);

      // Verificar se o investimento existe e pertence ao usuário
      const investment = await Investment.findOne({
        where: { id: validatedData.investment_id, user_id: userId }
      });
      if (!investment) {
        throw new NotFoundError('Investimento não encontrado');
      }

      // Verificar se a conta de origem existe e pertence ao usuário
      const sourceAccount = await Account.findOne({
        where: { id: validatedData.source_account_id, user_id: userId }
      });
      if (!sourceAccount) {
        throw new NotFoundError('Conta de origem não encontrada');
      }

      // Verificar se a conta de destino existe e pertence ao usuário
      const destinationAccount = await Account.findOne({
        where: { id: validatedData.destination_account_id, user_id: userId }
      });
      if (!destinationAccount) {
        throw new NotFoundError('Conta de destino não encontrada');
      }

      // Verificar se há saldo suficiente na conta de origem
      if (parseFloat(sourceAccount.balance) < validatedData.amount) {
        throw new ValidationError('Saldo insuficiente na conta de origem para realizar o aporte');
      }

      // Inicia transação do banco de dados
      const { sequelize } = require('../config/database');
      const result = await sequelize.transaction(async (t) => {
        // Criar o aporte
        const contribution = await InvestmentContribution.create({
          ...validatedData,
          user_id: userId
        }, { transaction: t });

        // Atualizar o saldo da conta de origem (débito)
        await sourceAccount.update({
          balance: parseFloat(sourceAccount.balance) - validatedData.amount
        }, { transaction: t });

        // Atualizar o saldo da conta de destino (crédito)
        await destinationAccount.update({
          balance: parseFloat(destinationAccount.balance) + validatedData.amount
        }, { transaction: t });

        // Criar duas transações usando o TransactionService
        const TransactionService = require('./transactionService');
        const contributionWithInvestment = {
          ...contribution.toJSON(),
          investment: investment
        };
        const transactions = await TransactionService.createFromInvestmentContribution(
          contributionWithInvestment, 
          { transaction: t }
        );

        return { contribution, transactions };
      });

      // Buscar o aporte criado com dados do investimento
      const createdContribution = await InvestmentContribution.findByPk(result.contribution.id, {
        include: [
          { model: Investment, as: 'investment' },
          { model: Account, as: 'sourceAccount' },
          { model: Account, as: 'destinationAccount' }
        ]
      });

      logger.info('Aporte de investimento criado com sucesso', {
        user_id: userId,
        contribution_id: createdContribution.id,
        investment_id: validatedData.investment_id,
        amount: validatedData.amount
      });

      return {
        contribution: createdContribution,
        transactions: result.transactions
      };
    } catch (error) {
      logger.error('Erro ao criar aporte de investimento', {
        error: error.message,
        user_id: userId,
        contribution_data: contributionData
      });

      if (error.name === 'ValidationError' || error.name === 'NotFoundError' || error.name === 'ZodError') {
        throw error;
      }

      throw new Error('Erro ao criar aporte de investimento');
    }
  }

  /**
   * Lista todos os aportes do usuário com filtros e paginação.
   * @param {number} userId - ID do usuário.
   * @param {Object} filters - Filtros de consulta.
   * @param {number} filters.investment_id - Filtrar por investimento (opcional).
   * @param {string} filters.broker - Filtrar por corretora (opcional).
   * @param {string} filters.start_date - Data inicial (opcional).
   * @param {string} filters.end_date - Data final (opcional).
   * @param {number} filters.page - Página (padrão: 1).
   * @param {number} filters.limit - Limite por página (padrão: 10).
   * @returns {Promise<Object>} Lista de aportes com paginação e estatísticas.
   */
  async getContributions(userId, filters = {}) {
    try {
      const validatedFilters = contributionFiltersSchema.parse(filters);
      const where = { user_id: userId };
      
      if (validatedFilters.investment_id) {
        where.investment_id = validatedFilters.investment_id;
      }
      if (validatedFilters.broker) {
        where.broker = validatedFilters.broker;
      }
      if (validatedFilters.start_date || validatedFilters.end_date) {
        where.contribution_date = {};
        if (validatedFilters.start_date) {
          where.contribution_date.$gte = validatedFilters.start_date;
        }
        if (validatedFilters.end_date) {
          where.contribution_date.$lte = validatedFilters.end_date;
        }
      }

      const page = validatedFilters.page || 1;
      const limit = validatedFilters.limit || 10;
      const offset = (page - 1) * limit;

      const result = await InvestmentContribution.findAndCountAll({
        where,
        include: [
          { 
            model: Investment, 
            as: 'investment',
            attributes: ['id', 'asset_name', 'ticker', 'investment_type']
          }
        ],
        order: [['contribution_date', 'DESC']],
        limit,
        offset
      });

      const totalAmount = await InvestmentContribution.sum('amount', { where });
      const totalQuantity = await InvestmentContribution.sum('quantity', { where });
      const averageUnitPrice = totalAmount / totalQuantity || 0;
      const totalPages = Math.ceil(result.count / limit);

      logger.info('Aportes de investimento listados com sucesso', {
        user_id: userId,
        total_contributions: result.count,
        page: page
      });

      return {
        contributions: result.rows,
        pagination: {
          total: result.count,
          page,
          limit,
          totalPages
        },
        statistics: {
          totalAmount: totalAmount || 0,
          totalQuantity: totalQuantity || 0,
          averageUnitPrice: parseFloat(averageUnitPrice.toFixed(4)),
          totalContributions: result.count
        }
      };
    } catch (error) {
      logger.error('Erro ao listar aportes de investimento', {
        error: error.message,
        user_id: userId,
        filters: filters
      });

      if (error.name === 'ZodError') {
        throw new ValidationError('Parâmetros de consulta inválidos');
      }

      throw new Error('Erro ao listar aportes de investimento');
    }
  }

  /**
   * Obtém um aporte específico por ID.
   * @param {number} userId - ID do usuário.
   * @param {number} contributionId - ID do aporte.
   * @returns {Promise<Object>} Aporte com dados relacionados.
   * @throws {NotFoundError} Se o aporte não for encontrado.
   */
  async getContribution(userId, contributionId) {
    try {
      const contribution = await InvestmentContribution.findOne({
        where: { id: contributionId, user_id: userId },
        include: [
          { model: Investment, as: 'investment' },
          { model: Account, as: 'sourceAccount' },
          { model: Account, as: 'destinationAccount' }
        ]
      });

      if (!contribution) {
        throw new NotFoundError('Aporte não encontrado');
      }

      logger.info('Aporte de investimento obtido com sucesso', {
        user_id: userId,
        contribution_id: contributionId
      });

      return { contribution };
    } catch (error) {
      logger.error('Erro ao obter aporte de investimento', {
        error: error.message,
        user_id: userId,
        contribution_id: contributionId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao obter aporte de investimento');
    }
  }

  /**
   * Lista aportes de um investimento específico.
   * @param {number} userId - ID do usuário.
   * @param {number} investmentId - ID do investimento.
   * @param {Object} filters - Filtros de consulta.
   * @returns {Promise<Object>} Lista de aportes do investimento.
   * @throws {NotFoundError} Se o investimento não for encontrado.
   */
  async getContributionsByInvestment(userId, investmentId, filters = {}) {
    try {
      // Verificar se o investimento existe e pertence ao usuário
      const investment = await Investment.findOne({
        where: { id: investmentId, user_id: userId }
      });
      if (!investment) {
        throw new NotFoundError('Investimento não encontrado');
      }

      const where = { 
        user_id: userId, 
        investment_id: investmentId 
      };

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      const result = await InvestmentContribution.findAndCountAll({
        where,
        include: [
          { 
            model: Investment, 
            as: 'investment',
            attributes: ['id', 'asset_name', 'ticker', 'investment_type']
          }
        ],
        order: [['contribution_date', 'DESC']],
        limit,
        offset
      });

      const totalAmount = await InvestmentContribution.sum('amount', { where });
      const totalQuantity = await InvestmentContribution.sum('quantity', { where });
      const averageUnitPrice = totalAmount / totalQuantity || 0;
      const totalPages = Math.ceil(result.count / limit);

      logger.info('Aportes do investimento listados com sucesso', {
        user_id: userId,
        investment_id: investmentId,
        total_contributions: result.count
      });

      return {
        investment,
        contributions: result.rows,
        pagination: {
          total: result.count,
          page,
          limit,
          totalPages
        },
        statistics: {
          totalAmount: totalAmount || 0,
          totalQuantity: totalQuantity || 0,
          averageUnitPrice: parseFloat(averageUnitPrice.toFixed(4)),
          totalContributions: result.count
        }
      };
    } catch (error) {
      logger.error('Erro ao listar aportes do investimento', {
        error: error.message,
        user_id: userId,
        investment_id: investmentId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao listar aportes do investimento');
    }
  }

  /**
   * Atualiza um aporte existente.
   * @param {number} userId - ID do usuário.
   * @param {number} contributionId - ID do aporte.
   * @param {Object} updateData - Dados para atualização.
   * @returns {Promise<Object>} Aporte atualizado.
   * @throws {NotFoundError} Se o aporte não for encontrado.
   * @throws {ValidationError} Se os dados forem inválidos.
   */
  async updateContribution(userId, contributionId, updateData) {
    try {
      // Validar dados de entrada
      const validatedData = updateContributionSchema.parse(updateData);

      // Buscar o aporte
      const contribution = await InvestmentContribution.findOne({
        where: { id: contributionId, user_id: userId }
      });
      if (!contribution) {
        throw new NotFoundError('Aporte não encontrado');
      }

      // Atualizar o aporte
      await contribution.update(validatedData);

      // Buscar o aporte atualizado com dados relacionados
      const updatedContribution = await InvestmentContribution.findByPk(contributionId, {
        include: [
          { model: Investment, as: 'investment' },
          { model: Account, as: 'sourceAccount' },
          { model: Account, as: 'destinationAccount' }
        ]
      });

      logger.info('Aporte de investimento atualizado com sucesso', {
        user_id: userId,
        contribution_id: contributionId
      });

      return { contribution: updatedContribution };
    } catch (error) {
      logger.error('Erro ao atualizar aporte de investimento', {
        error: error.message,
        user_id: userId,
        contribution_id: contributionId,
        update_data: updateData
      });

      if (error.name === 'NotFoundError' || error.name === 'ValidationError' || error.name === 'ZodError') {
        throw error;
      }

      throw new Error('Erro ao atualizar aporte de investimento');
    }
  }

  /**
   * Remove um aporte.
   * @param {number} userId - ID do usuário.
   * @param {number} contributionId - ID do aporte.
   * @returns {Promise<Object>} Resultado da operação.
   * @throws {NotFoundError} Se o aporte não for encontrado.
   */
  async deleteContribution(userId, contributionId) {
    try {
      const contribution = await InvestmentContribution.findOne({
        where: { id: contributionId, user_id: userId }
      });
      if (!contribution) {
        throw new NotFoundError('Aporte não encontrado');
      }

      await contribution.destroy();

      logger.info('Aporte de investimento removido com sucesso', {
        user_id: userId,
        contribution_id: contributionId
      });

      return { message: 'Aporte removido com sucesso' };
    } catch (error) {
      logger.error('Erro ao remover aporte de investimento', {
        error: error.message,
        user_id: userId,
        contribution_id: contributionId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao remover aporte de investimento');
    }
  }

  /**
   * Obtém estatísticas de aportes do usuário.
   * @param {number} userId - ID do usuário.
   * @param {Object} filters - Filtros de consulta.
   * @returns {Promise<Object>} Estatísticas de aportes.
   */
  async getContributionStatistics(userId, filters = {}) {
    try {
      const where = { user_id: userId };
      
      if (filters.investment_id) {
        where.investment_id = filters.investment_id;
      }
      if (filters.start_date || filters.end_date) {
        where.contribution_date = {};
        if (filters.start_date) {
          where.contribution_date.$gte = filters.start_date;
        }
        if (filters.end_date) {
          where.contribution_date.$lte = filters.end_date;
        }
      }

      const [
        totalContributions,
        totalAmount,
        totalQuantity,
        averageAmount,
        averageQuantity,
        contributionsByMonth,
        topInvestments
      ] = await Promise.all([
        InvestmentContribution.count({ where }),
        InvestmentContribution.sum('amount', { where }),
        InvestmentContribution.sum('quantity', { where }),
        InvestmentContribution.findOne({
          where,
          attributes: [
            [require('sequelize').fn('AVG', require('sequelize').col('amount')), 'average']
          ],
          raw: true
        }),
        InvestmentContribution.findOne({
          where,
          attributes: [
            [require('sequelize').fn('AVG', require('sequelize').col('quantity')), 'average']
          ],
          raw: true
        }),
        InvestmentContribution.findAll({
          where,
          attributes: [
            [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('contribution_date'), '%Y-%m'), 'month'],
            [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total_amount'],
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
          ],
          group: [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('contribution_date'), '%Y-%m')],
          order: [[require('sequelize').fn('DATE_FORMAT', require('sequelize').col('contribution_date'), '%Y-%m'), 'DESC']],
          limit: 12
        }),
        InvestmentContribution.findAll({
          where,
          attributes: [
            'investment_id',
            [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total_amount'],
            [require('sequelize').fn('SUM', require('sequelize').col('quantity')), 'total_quantity'],
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
          ],
          include: [
            {
              model: Investment,
              as: 'investment',
              attributes: ['id', 'asset_name', 'ticker']
            }
          ],
          group: ['investment_id'],
          order: [[require('sequelize').fn('SUM', require('sequelize').col('amount')), 'DESC']],
          limit: 10
        })
      ]);

      logger.info('Estatísticas de aportes obtidas com sucesso', {
        user_id: userId
      });

      return {
        totalContributions: totalContributions || 0,
        totalAmount: totalAmount || 0,
        totalQuantity: totalQuantity || 0,
        averageAmount: parseFloat(averageAmount?.average || 0),
        averageQuantity: parseFloat(averageQuantity?.average || 0),
        contributionsByMonth: contributionsByMonth || [],
        topInvestments: topInvestments || []
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas de aportes', {
        error: error.message,
        user_id: userId
      });

      throw new Error('Erro ao obter estatísticas de aportes');
    }
  }
}

module.exports = new InvestmentContributionService(); 