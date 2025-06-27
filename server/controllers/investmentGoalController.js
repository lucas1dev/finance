const { InvestmentGoal, Category, Investment } = require('../models');
const { createInvestmentGoalSchema, updateInvestmentGoalSchema, updateGoalAmountSchema } = require('../utils/investmentValidators');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { Op } = require('sequelize');
const InvestmentGoalService = require('../services/investmentGoalService');

/**
 * Controller para gerenciamento de metas de investimento.
 * Permite criar, listar, atualizar e excluir metas,
 * além de calcular o progresso baseado nos investimentos atuais.
 */
class InvestmentGoalController {
  constructor() {
    this.investmentGoalService = new InvestmentGoalService();
  }

  /**
   * Cria uma nova meta de investimento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da meta.
   * @param {string} req.body.title - Título da meta.
   * @param {string} req.body.description - Descrição da meta.
   * @param {number} req.body.target_amount - Valor alvo.
   * @param {string} req.body.target_date - Data alvo.
   * @param {number} req.body.current_amount - Valor atual (opcional).
   * @param {string} req.body.color - Cor da meta (opcional).
   * @param {number} req.body.category_id - ID da categoria (opcional).
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Meta criada em formato JSON.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se a categoria não for encontrada.
   * @example
   * // POST /investment-goals
   * // Body: { "title": "Aposentadoria", "target_amount": 500000, "target_date": "2030-12-31" }
   * // Retorno: { "success": true, "data": { "message": "...", "goal": {...} } }
   */
  async createInvestmentGoal(req, res) {
    // Valida os dados de entrada
    const validatedData = createInvestmentGoalSchema.parse(req.body);

    // Delega para o service
    const goal = await this.investmentGoalService.createInvestmentGoal(req.userId, validatedData);

    res.status(201).json({
      success: true,
      data: {
        message: 'Meta de investimento criada com sucesso',
        goal
      }
    });
  }

  /**
   * Lista todas as metas de investimento do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.status - Filtrar por status.
   * @param {number} req.query.page - Página para paginação.
   * @param {number} req.query.limit - Limite de itens por página.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de metas em formato JSON.
   * @example
   * // GET /investment-goals?status=ativa&page=1&limit=10
   * // Retorno: { "success": true, "data": { "goals": [...], "pagination": {...}, "statistics": {...} } }
   */
  async getInvestmentGoals(req, res) {
    const filters = {
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    };

    // Remove valores undefined
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    // Delega para o service
    const result = await this.investmentGoalService.getInvestmentGoals(req.userId, filters);

    res.json({
      success: true,
      data: result
    });
  }

  /**
   * Obtém uma meta de investimento específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da meta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Meta em formato JSON.
   * @throws {NotFoundError} Se a meta não for encontrada.
   * @example
   * // GET /investment-goals/1
   * // Retorno: { "success": true, "data": { "id": 1, "title": "Aposentadoria", "progress": 25, ... } }
   */
  async getInvestmentGoal(req, res) {
    const { id } = req.params;

    // Delega para o service
    const goal = await this.investmentGoalService.getInvestmentGoal(req.userId, id);

    res.json({
      success: true,
      data: goal
    });
  }

  /**
   * Atualiza uma meta de investimento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da meta.
   * @param {Object} req.body - Dados para atualização.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Meta atualizada em formato JSON.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se a meta não for encontrada.
   * @example
   * // PUT /investment-goals/1
   * // Body: { "title": "Aposentadoria Atualizada", "target_amount": 600000 }
   * // Retorno: { "success": true, "data": { "id": 1, "title": "Aposentadoria Atualizada", ... } }
   */
  async updateInvestmentGoal(req, res) {
    const { id } = req.params;

    // Valida os dados de entrada
    const validatedData = updateInvestmentGoalSchema.parse(req.body);

    // Delega para o service
    const goal = await this.investmentGoalService.updateInvestmentGoal(req.userId, id, validatedData);

    res.json({
      success: true,
      data: {
        message: 'Meta de investimento atualizada com sucesso',
        goal
      }
    });
  }

  /**
   * Atualiza o valor atual de uma meta de investimento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da meta.
   * @param {Object} req.body - Dados para atualização.
   * @param {number} req.body.current_amount - Novo valor atual.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Meta atualizada em formato JSON.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se a meta não for encontrada.
   * @example
   * // PUT /investment-goals/1/amount
   * // Body: { "current_amount": 250000 }
   * // Retorno: { "success": true, "data": { "message": "...", "goal": {...} } }
   */
  async updateGoalAmount(req, res) {
    const { id } = req.params;

    // Valida os dados de entrada
    const validatedData = updateGoalAmountSchema.parse(req.body);

    // Delega para o service
    const goal = await this.investmentGoalService.updateGoalAmount(req.userId, id, validatedData);

    res.json({
      success: true,
      data: {
        message: 'Valor atual da meta atualizado com sucesso',
        goal
      }
    });
  }

  /**
   * Calcula o valor atual de uma meta baseado nos investimentos.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da meta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Meta com valor calculado em formato JSON.
   * @throws {NotFoundError} Se a meta não for encontrada.
   * @example
   * // POST /investment-goals/1/calculate
   * // Retorno: { "success": true, "data": { "message": "...", "goal": {...}, "calculatedAmount": 250000, "investmentsCount": 5 } }
   */
  async calculateGoalAmount(req, res) {
    const { id } = req.params;

    // Delega para o service
    const result = await this.investmentGoalService.calculateGoalAmount(req.userId, id);

    res.json({
      success: true,
      data: {
        message: 'Valor da meta calculado com sucesso',
        goal: result,
        calculatedAmount: result.calculatedAmount,
        investmentsCount: result.investmentsCount
      }
    });
  }

  /**
   * Exclui uma meta de investimento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da meta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Confirmação de exclusão em formato JSON.
   * @throws {NotFoundError} Se a meta não for encontrada.
   * @example
   * // DELETE /investment-goals/1
   * // Retorno: { "success": true, "data": { "message": "Meta de investimento excluída com sucesso" } }
   */
  async deleteInvestmentGoal(req, res) {
    const { id } = req.params;

    // Delega para o service
    const result = await this.investmentGoalService.deleteInvestmentGoal(req.userId, id);

    res.json({
      success: true,
      data: result
    });
  }

  /**
   * Obtém estatísticas das metas de investimento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas em formato JSON.
   * @example
   * // GET /investment-goals/statistics
   * // Retorno: { "success": true, "data": { "summary": {...}, "amounts": {...}, "progressByCategory": {...} } }
   */
  async getInvestmentGoalStatistics(req, res) {
    // Delega para o service
    const statistics = await this.investmentGoalService.getInvestmentGoalStatistics(req.userId);

    res.json({
      success: true,
      data: statistics
    });
  }
}

module.exports = InvestmentGoalController; 