/**
 * Controller para gerenciamento de Pagamentos de Financiamentos (FinancingPayments)
 * Implementa operações CRUD, integração com transações e cálculos automáticos
 */
const { FinancingPayment, Financing, Account, Transaction, Category, Creditor, sequelize } = require('../models');
const { 
  createFinancingPaymentSchema, 
  updateFinancingPaymentSchema, 
  listFinancingPaymentsSchema,
  payInstallmentSchema,
  earlyPaymentSchema
} = require('../utils/financingPaymentValidators');
const {
  generateAmortizationTable,
  calculateUpdatedBalance
} = require('../utils/financingCalculations');
const { ValidationError, NotFoundError } = require('../utils/errors');
const TransactionService = require('../services/transactionService');
const { logger } = require('../utils/logger');
const FinancingPaymentService = require('../services/financingPaymentService');

/**
 * Controlador responsável por gerenciar pagamentos de financiamentos.
 * Delega toda a lógica de negócio para o FinancingPaymentService.
 */
class FinancingPaymentController {
  /**
   * Cria um novo pagamento de financiamento com integração de transação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados do pagamento.
   * @param {number} req.body.financing_id - ID do financiamento.
   * @param {number} req.body.account_id - ID da conta.
   * @param {number} req.body.installment_number - Número da parcela.
   * @param {number} req.body.payment_amount - Valor do pagamento.
   * @param {number} req.body.principal_amount - Valor da amortização.
   * @param {number} req.body.interest_amount - Valor dos juros.
   * @param {string} req.body.payment_date - Data do pagamento.
   * @param {string} req.body.payment_method - Método de pagamento.
   * @param {string} req.body.payment_type - Tipo de pagamento.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Pagamento criado com transação.
   * @example
   * // POST /financing-payments
   * // Body: { "financing_id": 1, "account_id": 1, "installment_number": 1, "payment_amount": 1000, "principal_amount": 800, "interest_amount": 200, "payment_date": "2024-01-15", "payment_method": "pix" }
   * // Retorno: { "success": true, "data": { payment: {...}, transaction: {...} }, "message": "Pagamento registrado com sucesso" }
   */
  async createFinancingPayment(req, res) {
    try {
      const result = await FinancingPaymentService.createFinancingPayment(req.userId, req.body);

      logger.info('Pagamento de financiamento criado com sucesso', {
        user_id: req.userId,
        payment_id: result.payment.id,
        financing_id: req.body.financing_id,
        installment_number: req.body.installment_number
      });

      return res.status(201).json({
        success: true,
        data: result,
        message: 'Pagamento registrado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar pagamento de financiamento', {
        error: error.message,
        user_id: req.userId,
        payment_data: req.body
      });

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'NotFoundError') {
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
   * Lista pagamentos de financiamentos com filtros e paginação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {number} req.query.financing_id - Filtrar por financiamento (opcional).
   * @param {string} req.query.payment_method - Filtrar por método de pagamento (opcional).
   * @param {string} req.query.start_date - Data inicial (opcional).
   * @param {string} req.query.end_date - Data final (opcional).
   * @param {number} req.query.page - Página (padrão: 1).
   * @param {number} req.query.limit - Limite por página (padrão: 10).
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de pagamentos com paginação e estatísticas.
   * @example
   * // GET /financing-payments?page=1&limit=10&financing_id=1
   * // Retorno: { "success": true, "data": { payments: [...], pagination: {...}, statistics: {...} } }
   */
  async listFinancingPayments(req, res) {
    try {
      const result = await FinancingPaymentService.listFinancingPayments(req.userId, req.query);

      logger.info('Pagamentos de financiamento listados com sucesso', {
        user_id: req.userId,
        total_payments: result.pagination.total
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao listar pagamentos de financiamento', {
        error: error.message,
        user_id: req.userId,
        query: req.query
      });

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
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
   * Obtém um pagamento específico por ID.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do pagamento.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Pagamento com dados relacionados.
   * @example
   * // GET /financing-payments/123
   * // Retorno: { "success": true, "data": { payment: {...} } }
   */
  async getFinancingPayment(req, res) {
    try {
      const result = await FinancingPaymentService.getFinancingPayment(req.userId, req.params.id);

      logger.info('Pagamento de financiamento obtido com sucesso', {
        user_id: req.userId,
        payment_id: req.params.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao obter pagamento de financiamento', {
        error: error.message,
        user_id: req.userId,
        payment_id: req.params.id
      });

      if (error.name === 'NotFoundError') {
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
   * Atualiza um pagamento existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do pagamento.
   * @param {Object} req.body - Dados para atualização.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Pagamento atualizado.
   * @example
   * // PUT /financing-payments/123
   * // Body: { "payment_method": "boleto", "payment_date": "2024-01-20" }
   * // Retorno: { "success": true, "data": { payment: {...} }, "message": "Pagamento atualizado com sucesso" }
   */
  async updateFinancingPayment(req, res) {
    try {
      const result = await FinancingPaymentService.updateFinancingPayment(
        req.userId, 
        req.params.id, 
        req.body
      );

      logger.info('Pagamento de financiamento atualizado com sucesso', {
        user_id: req.userId,
        payment_id: req.params.id
      });

      return res.json({
        success: true,
        data: result,
        message: 'Pagamento atualizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar pagamento de financiamento', {
        error: error.message,
        user_id: req.userId,
        payment_id: req.params.id,
        update_data: req.body
      });

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'NotFoundError') {
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
   * Remove um pagamento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do pagamento.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resultado da operação.
   * @example
   * // DELETE /financing-payments/123
   * // Retorno: { "success": true, "data": { message: "Pagamento removido com sucesso" } }
   */
  async deleteFinancingPayment(req, res) {
    try {
      const result = await FinancingPaymentService.deleteFinancingPayment(req.userId, req.params.id);

      logger.info('Pagamento de financiamento removido com sucesso', {
        user_id: req.userId,
        payment_id: req.params.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao remover pagamento de financiamento', {
        error: error.message,
        user_id: req.userId,
        payment_id: req.params.id
      });

      if (error.name === 'NotFoundError') {
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
   * Registra pagamento de uma parcela específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.financingId - ID do financiamento.
   * @param {Object} req.body - Dados do pagamento.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Pagamento registrado.
   * @example
   * // POST /financings/1/pay-installment
   * // Body: { "account_id": 1, "installment_number": 1, "payment_date": "2024-01-15", "payment_method": "pix" }
   * // Retorno: { "success": true, "data": { payment: {...}, transaction: {...} }, "message": "Parcela paga com sucesso" }
   */
  async payInstallment(req, res) {
    try {
      const result = await FinancingPaymentService.payInstallment(
        req.userId, 
        req.params.financingId, 
        req.body
      );

      logger.info('Parcela de financiamento paga com sucesso', {
        user_id: req.userId,
        financing_id: req.params.financingId,
        installment_number: req.body.installment_number
      });

      return res.status(201).json({
        success: true,
        data: result,
        message: 'Parcela paga com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao pagar parcela de financiamento', {
        error: error.message,
        user_id: req.userId,
        financing_id: req.params.financingId,
        payment_data: req.body
      });

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'NotFoundError') {
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
   * Registra pagamento antecipado de financiamento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.financingId - ID do financiamento.
   * @param {Object} req.body - Dados do pagamento antecipado.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Pagamento registrado.
   * @example
   * // POST /financings/1/early-payment
   * // Body: { "account_id": 1, "payment_amount": 5000, "principal_amount": 4800, "discount_amount": 200, "payment_date": "2024-01-15" }
   * // Retorno: { "success": true, "data": { payment: {...}, transaction: {...} }, "message": "Pagamento antecipado registrado com sucesso" }
   */
  async registerEarlyPayment(req, res) {
    try {
      const result = await FinancingPaymentService.registerEarlyPayment(
        req.userId, 
        req.params.financingId, 
        req.body
      );

      logger.info('Pagamento antecipado de financiamento registrado com sucesso', {
        user_id: req.userId,
        financing_id: req.params.financingId,
        amount: req.body.payment_amount
      });

      return res.status(201).json({
        success: true,
        data: result,
        message: 'Pagamento antecipado registrado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao registrar pagamento antecipado', {
        error: error.message,
        user_id: req.userId,
        financing_id: req.params.financingId,
        payment_data: req.body
      });

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'NotFoundError') {
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
}

module.exports = new FinancingPaymentController(); 