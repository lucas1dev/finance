/**
 * Controller para gerenciamento de Financiamentos (Financings)
 * Implementa operações CRUD, cálculos de amortização e funcionalidades avançadas
 */
const { Financing, Creditor, FinancingPayment, Account, Category } = require('../models');
const { 
  createFinancingSchema, 
  updateFinancingSchema, 
  listFinancingsSchema,
  simulateEarlyPaymentSchema,
  amortizationTableSchema
} = require('../utils/financingValidators');
const {
  calculateSACPayment,
  calculatePricePayment,
  generateAmortizationTable,
  calculateUpdatedBalance,
  simulateEarlyPayment: simulateEarlyPaymentUtil
} = require('../utils/financingCalculations');
const { ValidationError, NotFoundError } = require('../utils/errors');
const FinancingService = require('../services/financingService');
const { logger } = require('../utils/logger');

/**
 * Controlador responsável por gerenciar financiamentos.
 * Delega toda a lógica de negócio para o FinancingService.
 */
class FinancingController {
  /**
   * Cria um novo financiamento com cálculo automático da parcela.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados do financiamento.
   * @param {number} req.body.creditor_id - ID do credor.
   * @param {string} req.body.financing_type - Tipo de financiamento.
   * @param {number} req.body.total_amount - Valor total financiado.
   * @param {number} req.body.interest_rate - Taxa de juros anual.
   * @param {number} req.body.term_months - Prazo em meses.
   * @param {string} req.body.start_date - Data de início.
   * @param {string} req.body.description - Descrição.
   * @param {string} req.body.amortization_method - Método de amortização (SAC/Price).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com o financiamento criado.
   */
  async create(req, res) {
    try {
      const result = await FinancingService.createFinancing(req.userId, req.body);

      logger.info('Financiamento criado com sucesso', {
        financing_id: result.financing.id,
        user_id: req.userId,
        creditor_id: req.body.creditor_id
      });

      return res.status(201).json({
        success: true,
        data: result,
        message: 'Financiamento criado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar financiamento', {
        error: error.message,
        user_id: req.userId,
        body: req.body
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      if (error.statusCode) {
        return res.status(error.statusCode).json({
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
   * Lista todos os financiamentos do usuário com filtros e paginação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com lista de financiamentos.
   */
  async list(req, res) {
    try {
      const result = await FinancingService.listFinancings(req.userId, req.query);

      logger.info('Financiamentos listados com sucesso', {
        user_id: req.userId,
        total_items: result.pagination.totalItems
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao listar financiamentos', {
        error: error.message,
        user_id: req.userId,
        query: req.query
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Parâmetros de consulta inválidos',
          details: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém um financiamento específico por ID.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do financiamento.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com o financiamento.
   */
  async getById(req, res) {
    try {
      const result = await FinancingService.getFinancingById(req.userId, req.params.id);

      logger.info('Financiamento obtido com sucesso', {
        financing_id: req.params.id,
        user_id: req.userId
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao obter financiamento', {
        error: error.message,
        financing_id: req.params.id,
        user_id: req.userId
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
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
   * Atualiza um financiamento existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do financiamento.
   * @param {Object} req.body - Dados para atualização.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com o financiamento atualizado.
   */
  async update(req, res) {
    try {
      const result = await FinancingService.updateFinancing(req.userId, req.params.id, req.body);

      logger.info('Financiamento atualizado com sucesso', {
        financing_id: req.params.id,
        user_id: req.userId
      });

      return res.json({
        success: true,
        data: result,
        message: 'Financiamento atualizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar financiamento', {
        error: error.message,
        financing_id: req.params.id,
        user_id: req.userId,
        body: req.body
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      if (error.statusCode) {
        return res.status(error.statusCode).json({
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
   * Exclui um financiamento específico.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do financiamento.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON de confirmação.
   */
  async delete(req, res) {
    try {
      await FinancingService.deleteFinancing(req.userId, req.params.id);

      logger.info('Financiamento excluído com sucesso', {
        financing_id: req.params.id,
        user_id: req.userId
      });

      return res.json({
        success: true,
        message: 'Financiamento excluído com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao excluir financiamento', {
        error: error.message,
        financing_id: req.params.id,
        user_id: req.userId
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
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
   * Gera a tabela de amortização para um financiamento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do financiamento.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com a tabela de amortização.
   */
  async getAmortizationTable(req, res) {
    try {
      const result = await FinancingService.getAmortizationTable(req.userId, req.params.id);

      logger.info('Tabela de amortização gerada com sucesso', {
        financing_id: req.params.id,
        user_id: req.userId
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao gerar tabela de amortização', {
        error: error.message,
        financing_id: req.params.id,
        user_id: req.userId
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
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
   * Simula o pagamento antecipado de um financiamento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do financiamento.
   * @param {Object} req.body - Dados da simulação.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com o resultado da simulação.
   */
  async simulateEarlyPayment(req, res) {
    try {
      const result = await FinancingService.simulateEarlyPayment(req.userId, req.params.id, req.body);

      logger.info('Simulação de pagamento antecipado realizada com sucesso', {
        financing_id: req.params.id,
        user_id: req.userId
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao simular pagamento antecipado', {
        error: error.message,
        financing_id: req.params.id,
        user_id: req.userId,
        body: req.body
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      if (error.statusCode) {
        return res.status(error.statusCode).json({
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
   * Obtém estatísticas gerais dos financiamentos do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com estatísticas.
   */
  async getStatistics(req, res) {
    try {
      const result = await FinancingService.getFinancingStatistics(req.userId);

      logger.info('Estatísticas de financiamentos obtidas com sucesso', {
        user_id: req.userId
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao obter estatísticas de financiamentos', {
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

module.exports = new FinancingController(); 