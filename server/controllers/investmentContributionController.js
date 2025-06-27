/**
 * Controller para gerenciar aportes de investimentos.
 * Permite criar, listar, atualizar e excluir aportes,
 * além de calcular totais e estatísticas.
 */
const { logger } = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Controlador responsável por gerenciar aportes de investimentos.
 * Delega toda a lógica de negócio para o InvestmentContributionService.
 */
class InvestmentContributionController {
  /**
   * Construtor do controller.
   * @param {Object} investmentContributionService - Service para gerenciar aportes.
   */
  constructor(investmentContributionService) {
    this.investmentContributionService = investmentContributionService;
  }

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
   * @example
   * // POST /investment-contributions
   * // Body: { "investment_id": 1, "contribution_date": "2024-01-15", "amount": 1000, "quantity": 100, "unit_price": 10 }
   * // Retorno: { "success": true, "data": { contribution: {...}, transactions: [...] }, "message": "Aporte criado com sucesso" }
   */
  async createContribution(req, res) {
    try {
      const result = await this.investmentContributionService.createContribution(req.userId, req.body);

      logger.info('Aporte de investimento criado com sucesso', {
        user_id: req.userId,
        contribution_id: result.contribution.id,
        investment_id: req.body.investment_id
      });

      return res.status(201).json({
        success: true,
        data: result,
        message: 'Aporte criado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar aporte de investimento', {
        error: error.message,
        user_id: req.userId,
        contribution_data: req.body
      });

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
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
   * // Retorno: { "success": true, "data": { contributions: [...], pagination: {...}, statistics: {...} } }
   */
  async getContributions(req, res) {
    try {
      const result = await this.investmentContributionService.getContributions(req.userId, req.query);

      logger.info('Aportes de investimento listados com sucesso', {
        user_id: req.userId,
        total_contributions: result.pagination.total
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao listar aportes de investimento', {
        error: error.message,
        user_id: req.userId,
        query: req.query
      });

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém um aporte específico por ID.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do aporte.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Aporte com dados relacionados.
   * @example
   * // GET /investment-contributions/123
   * // Retorno: { "success": true, "data": { contribution: {...} } }
   */
  async getContribution(req, res) {
    try {
      const result = await this.investmentContributionService.getContribution(req.userId, req.params.id);

      logger.info('Aporte de investimento obtido com sucesso', {
        user_id: req.userId,
        contribution_id: req.params.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao obter aporte de investimento', {
        error: error.message,
        user_id: req.userId,
        contribution_id: req.params.id
      });

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Lista aportes de um investimento específico.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.investmentId - ID do investimento.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de aportes do investimento.
   * @example
   * // GET /investments/1/contributions?page=1&limit=10
   * // Retorno: { "success": true, "data": { investment: {...}, contributions: [...], pagination: {...}, statistics: {...} } }
   */
  async getContributionsByInvestment(req, res) {
    try {
      const result = await this.investmentContributionService.getContributionsByInvestment(
        req.userId, 
        req.params.investmentId, 
        req.query
      );

      logger.info('Aportes do investimento listados com sucesso', {
        user_id: req.userId,
        investment_id: req.params.investmentId,
        total_contributions: result.pagination.total
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao listar aportes do investimento', {
        error: error.message,
        user_id: req.userId,
        investment_id: req.params.investmentId
      });

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualiza um aporte existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do aporte.
   * @param {Object} req.body - Dados para atualização.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Aporte atualizado.
   * @example
   * // PUT /investment-contributions/123
   * // Body: { "amount": 1500, "quantity": 150 }
   * // Retorno: { "success": true, "data": { contribution: {...} }, "message": "Aporte atualizado com sucesso" }
   */
  async updateContribution(req, res) {
    try {
      const result = await this.investmentContributionService.updateContribution(
        req.userId, 
        req.params.id, 
        req.body
      );

      logger.info('Aporte de investimento atualizado com sucesso', {
        user_id: req.userId,
        contribution_id: req.params.id
      });

      return res.json({
        success: true,
        data: result,
        message: 'Aporte atualizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar aporte de investimento', {
        error: error.message,
        user_id: req.userId,
        contribution_id: req.params.id,
        update_data: req.body
      });

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Remove um aporte.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do aporte.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resultado da operação.
   * @example
   * // DELETE /investment-contributions/123
   * // Retorno: { "success": true, "data": { message: "Aporte removido com sucesso" } }
   */
  async deleteContribution(req, res) {
    try {
      const result = await this.investmentContributionService.deleteContribution(req.userId, req.params.id);

      logger.info('Aporte de investimento removido com sucesso', {
        user_id: req.userId,
        contribution_id: req.params.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao remover aporte de investimento', {
        error: error.message,
        user_id: req.userId,
        contribution_id: req.params.id
      });

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém estatísticas de aportes do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Filtros de consulta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas de aportes.
   * @example
   * // GET /investment-contributions/statistics?investment_id=1
   * // Retorno: { "success": true, "data": { totalContributions: 50, totalAmount: 50000, ... } }
   */
  async getContributionStatistics(req, res) {
    try {
      const result = await this.investmentContributionService.getContributionStatistics(req.userId, req.query);

      logger.info('Estatísticas de aportes obtidas com sucesso', {
        user_id: req.userId
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao obter estatísticas de aportes', {
        error: error.message,
        user_id: req.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

// Instância padrão com o service real
const InvestmentContributionService = require('../services/investmentContributionService');
const defaultController = new InvestmentContributionController(InvestmentContributionService);

module.exports = {
  InvestmentContributionController,
  defaultController
}; 