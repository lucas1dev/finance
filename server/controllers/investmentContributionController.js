const { InvestmentContribution, Investment, Account, Transaction } = require('../models');
const { 
  createContributionSchema, 
  updateContributionSchema, 
  contributionIdSchema,
  investmentIdSchema,
  contributionFiltersSchema 
} = require('../utils/investmentContributionValidators');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { sendErrorResponse } = require('../utils/response');

/**
 * Controller para gerenciar aportes de investimentos.
 * Permite criar, listar, atualizar e excluir aportes,
 * além de calcular totais e estatísticas.
 */
class InvestmentContributionController {
  /**
   * Cria um novo aporte para um investimento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados do aporte.
   * @param {number} req.body.investment_id - ID do investimento.
   * @param {string} req.body.contribution_date - Data do aporte (YYYY-MM-DD).
   * @param {number} req.body.amount - Valor total do aporte.
   * @param {number} req.body.quantity - Quantidade de ativos.
   * @param {number} req.body.unit_price - Preço unitário.
   * @param {string} req.body.broker - Corretora (opcional).
   * @param {string} req.body.observations - Observações (opcional).
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com o aporte criado.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se o investimento não for encontrado.
   * @example
   * // POST /investment-contributions
   * // Body: { "investment_id": 1, "contribution_date": "2024-01-15", "amount": 1000, "quantity": 100, "unit_price": 10 }
   * // Retorno: { "message": "Aporte criado com sucesso", "contribution": {...} }
   */
  async createContribution(req, res) {
    try {
      // Validar dados de entrada
      const validatedData = createContributionSchema.parse(req.body);
      // Verificar se o investimento existe e pertence ao usuário
      const investment = await Investment.findOne({
        where: { id: validatedData.investment_id, user_id: req.userId }
      });
      if (!investment) {
        throw new NotFoundError('Investimento não encontrado');
      }
      // Verificar se a conta tem saldo suficiente
      const account = await Account.findOne({
        where: { id: investment.account_id, user_id: req.userId }
      });
      if (!account) {
        throw new NotFoundError('Conta não encontrada');
      }
      if (account.balance < validatedData.amount) {
        throw new ValidationError('Saldo insuficiente na conta para realizar o aporte');
      }
      // Criar o aporte
      const contribution = await InvestmentContribution.create({
        ...validatedData,
        user_id: req.userId
      });
      // Atualizar o saldo da conta
      await account.update({
        balance: account.balance - validatedData.amount
      });
      // Criar transação
      await Transaction.create({
        type: 'expense',
        amount: validatedData.amount,
        description: `Aporte em ${investment.asset_name}`,
        date: validatedData.contribution_date,
        account_id: investment.account_id,
        category_id: investment.category_id,
        user_id: req.userId,
        investment_id: investment.id
      });
      // Buscar o aporte criado com dados do investimento
      const createdContribution = await InvestmentContribution.findByPk(contribution.id, {
        include: [
          { model: Investment, as: 'investment' }
        ]
      });
      return res.status(201).json({
        message: 'Aporte criado com sucesso',
        contribution: createdContribution
      });
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }

  /**
   * Lista todos os aportes do usuário com filtros e paginação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {number} req.query.investment_id - Filtrar por investimento (opcional).
   * @param {string} req.query.broker - Filtrar por corretora (opcional).
   * @param {string} req.query.start_date - Data inicial (opcional).
   * @param {string} req.query.end_date - Data final (opcional).
   * @param {number} req.query.page - Página (padrão: 1).
   * @param {number} req.query.limit - Limite por página (padrão: 10).
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de aportes com paginação e estatísticas.
   * @example
   * // GET /investment-contributions?page=1&limit=10&investment_id=1
   * // Retorno: { "contributions": [...], "pagination": {...}, "statistics": {...} }
   */
  async getContributions(req, res) {
    try {
      const validatedFilters = contributionFiltersSchema.parse(req.query);
      const where = { user_id: req.userId };
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
      return res.status(200).json({
        message: 'Aportes listados com sucesso',
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
      });
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }

  /**
   * Busca um aporte específico por ID.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.id - ID do aporte.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Dados do aporte.
   * @throws {NotFoundError} Se o aporte não for encontrado.
   * @example
   * // GET /investment-contributions/1
   * // Retorno: { "id": 1, "amount": 1000, "quantity": 100, ... }
   */
  async getContribution(req, res) {
    try {
      const { id } = req.params;
      const contribution = await InvestmentContribution.findOne({
        where: { id, user_id: req.userId },
        include: [
          { model: Investment, as: 'investment' }
        ]
      });
      if (!contribution) {
        throw new NotFoundError('Aporte não encontrado');
      }
      return res.status(200).json({
        message: 'Aporte encontrado com sucesso',
        contribution
      });
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }

  /**
   * Lista todos os aportes de um investimento específico.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.investment_id - ID do investimento.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de aportes do investimento.
   * @throws {NotFoundError} Se o investimento não for encontrado.
   * @example
   * // GET /investment-contributions/investment/1
   * // Retorno: { "contributions": [...], "summary": {...} }
   */
  async getContributionsByInvestment(req, res) {
    try {
      const { investmentId } = req.params;
      console.log('INÍCIO getContributionsByInvestment investmentId:', investmentId);
      let investment;
      try {
        investment = await Investment.findOne({
          where: { id: investmentId, user_id: req.userId }
        });
        console.log('Investment encontrado:', investment ? investment.id : 'não encontrado');
      } catch (err) {
        console.error('Erro ao buscar investimento:', err);
        throw err;
      }
      if (!investment) {
        throw new NotFoundError('Investimento não encontrado');
      }
      const contributions = await InvestmentContribution.findAll({
        where: { investment_id: investmentId, user_id: req.userId },
        order: [['contribution_date', 'ASC']]
      });
      const totalAmount = await InvestmentContribution.sum('amount', { where: { investment_id: investmentId, user_id: req.userId } });
      const totalQuantity = await InvestmentContribution.sum('quantity', { where: { investment_id: investmentId, user_id: req.userId } });
      const averageUnitPrice = totalAmount / totalQuantity || 0;
      return res.status(200).json({
        message: 'Aportes do investimento listados com sucesso',
        contributions,
        summary: {
          totalAmount: totalAmount || 0,
          totalQuantity: totalQuantity || 0,
          averageUnitPrice: parseFloat(averageUnitPrice.toFixed(4))
        }
      });
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }

  /**
   * Atualiza um aporte existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.id - ID do aporte.
   * @param {Object} req.body - Dados para atualização.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Aporte atualizado.
   * @throws {NotFoundError} Se o aporte não for encontrado.
   * @example
   * // PUT /investment-contributions/1
   * // Body: { "amount": 1200, "observations": "Aporte atualizado" }
   * // Retorno: { "message": "Aporte atualizado com sucesso", "contribution": {...} }
   */
  async updateContribution(req, res) {
    try {
      const { id } = req.params;
      const validatedData = updateContributionSchema.parse(req.body);
      const contribution = await InvestmentContribution.findOne({
        where: { id, user_id: req.userId }
      });
      if (!contribution) {
        throw new NotFoundError('Aporte não encontrado');
      }
      await contribution.update(validatedData);
      return res.status(200).json({
        message: 'Aporte atualizado com sucesso',
        contribution
      });
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }

  /**
   * Exclui um aporte.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.id - ID do aporte.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Confirmação de exclusão.
   * @throws {NotFoundError} Se o aporte não for encontrado.
   * @example
   * // DELETE /investment-contributions/1
   * // Retorno: { "message": "Aporte excluído com sucesso" }
   */
  async deleteContribution(req, res) {
    try {
      const { id } = req.params;
      const contribution = await InvestmentContribution.findOne({
        where: { id, user_id: req.userId }
      });
      if (!contribution) {
        throw new NotFoundError('Aporte não encontrado');
      }
      await contribution.destroy();
      return res.status(200).json({
        message: 'Aporte excluído com sucesso'
      });
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }

  /**
   * Calcula estatísticas dos aportes do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas dos aportes.
   * @example
   * // GET /investment-contributions/statistics
   * // Retorno: { "general": {...}, "byInvestment": [...], "byBroker": [...] }
   */
  async getContributionStatistics(req, res) {
    try {
      const where = { user_id: req.userId };
      const totalAmount = await InvestmentContribution.sum('amount', { where });
      const totalQuantity = await InvestmentContribution.sum('quantity', { where });
      const totalContributions = await InvestmentContribution.count({ where });
      const averageAmount = totalAmount / totalContributions || 0;
      return res.status(200).json({
        message: 'Estatísticas dos aportes',
        general: {
          totalAmount: totalAmount || 0,
          totalQuantity: totalQuantity || 0,
          totalContributions: totalContributions || 0,
          averageAmount: parseFloat(averageAmount.toFixed(2))
        }
      });
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }
}

module.exports = new InvestmentContributionController(); 