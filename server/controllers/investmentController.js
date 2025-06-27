const { Investment, Account, Category, Transaction, InvestmentContribution } = require('../models');
const { createInvestmentSchema, updateInvestmentSchema, sellAssetSchema, listPositionsSchema } = require('../utils/investmentValidators');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { Op } = require('sequelize');
const { sequelize } = require('../models');
const investmentService = require('../services/investmentService');

/**
 * Controller para gerenciamento de investimentos.
 * Agora delega toda a lógica ao service e padroniza respostas.
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
   * // Retorno: { "success": true, "data": { "investment": {...}, "transactions": [...] } }
   */
  async createInvestment(req, res, next) {
    try {
      const validatedData = createInvestmentSchema.parse(req.body);
      const result = await investmentService.createInvestment(req.userId, validatedData);
      
      res.status(201).json({
        success: true,
        data: {
          message: 'Investimento criado com sucesso',
          investment: result.investment,
          transactions: result.transactions
        }
      });
    } catch (error) {
      next(error);
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
   * // Retorno: { "success": true, "data": { "investments": [...], "pagination": {...}, "statistics": {...} } }
   */
  async getInvestments(req, res, next) {
    try {
      const filters = {
        investment_type: req.query.investment_type,
        operation_type: req.query.operation_type,
        status: req.query.status,
        broker: req.query.broker,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const result = await investmentService.getInvestments(req.userId, filters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
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
   * // Retorno: { "success": true, "data": { "investment": {...} } }
   */
  async getInvestment(req, res, next) {
    try {
      const investment = await investmentService.getInvestment(req.userId, req.params.id);
      
      res.json({
        success: true,
        data: { investment }
      });
    } catch (error) {
      next(error);
    }
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
   * // Retorno: { "success": true, "data": { "message": "Investimento atualizado com sucesso", "investment": {...} } }
   */
  async updateInvestment(req, res, next) {
    try {
      const validatedData = updateInvestmentSchema.parse(req.body);
      const investment = await investmentService.updateInvestment(req.userId, req.params.id, validatedData);
      
      res.json({
        success: true,
        data: {
          message: 'Investimento atualizado com sucesso',
          investment
        }
      });
    } catch (error) {
      next(error);
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
   * // Retorno: { "success": true, "data": { "message": "Investimento excluído com sucesso" } }
   */
  async deleteInvestment(req, res, next) {
    try {
      await investmentService.deleteInvestment(req.userId, req.params.id);
      
      res.json({
        success: true,
        data: { message: 'Investimento excluído com sucesso' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém estatísticas dos investimentos.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas em formato JSON.
   * @example
   * // GET /investments/statistics
   * // Retorno: { "success": true, "data": { "general": {...}, "byType": [...], "byBroker": [...] } }
   */
  async getInvestmentStatistics(req, res, next) {
    try {
      const statistics = await investmentService.getInvestmentStatistics(req.userId);
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
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
   * // Retorno: { "success": true, "data": { "positions": [...], "pagination": {...} } }
   */
  async getActivePositions(req, res, next) {
    try {
      const validatedFilters = listPositionsSchema.parse(req.query);
      const result = await investmentService.getActivePositions(req.userId, validatedFilters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
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
   * // Retorno: { "success": true, "data": { "position": {...}, "operations": [...] } }
   */
  async getAssetPosition(req, res, next) {
    try {
      const { assetName, ticker } = req.params;
      const result = await investmentService.getAssetPosition(req.userId, assetName, ticker);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
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
   * // Retorno: { "success": true, "data": { "message": "Venda registrada com sucesso", "investment": {...}, "transaction": {...} } }
   */
  async sellAsset(req, res, next) {
    try {
      const { assetName, ticker } = req.params;
      const validatedData = sellAssetSchema.parse(req.body);
      const result = await investmentService.sellAsset(req.userId, assetName, ticker, validatedData);
      
      res.status(201).json({
        success: true,
        data: {
          message: 'Venda registrada com sucesso',
          investment: result.investment,
          transaction: result.transaction
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InvestmentController(); 