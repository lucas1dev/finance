const { FixedAccount, Category, Supplier, Transaction, Account } = require('../models');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { z } = require('zod');
const { Op } = require('sequelize');
const { logger } = require('../utils/logger');

/**
 * Esquema de validação para criação de conta fixa
 */
const createFixedAccountSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(255, 'Descrição deve ter no máximo 255 caracteres'),
  type: z.enum(['expense', 'income'], {
    errorMap: () => ({ message: 'Tipo deve ser: expense ou income' })
  }).optional(),
  amount: z.number().positive('Valor deve ser positivo'),
  periodicity: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], {
    errorMap: () => ({ message: 'Periodicidade deve ser: daily, weekly, monthly, quarterly, yearly' })
  }),
  start_date: z.string().refine((date) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }, 'Data de início deve ser uma data válida'),
  category_id: z.number().int().positive('Categoria é obrigatória'),
  supplier_id: z.number().int().positive().optional(),
  account_id: z.number().int().positive().optional(),
  payment_method: z.enum(['card', 'boleto', 'automatic_debit']).optional(),
  observations: z.string().optional(),
  reminder_days: z.number().int().min(0).max(30).default(3)
});

/**
 * Esquema de validação para atualização de conta fixa
 */
const updateFixedAccountSchema = createFixedAccountSchema.partial();

/**
 * Controlador responsável por gerenciar contas fixas.
 * Delega toda a lógica de negócio para o FixedAccountService.
 */
class FixedAccountController {
  constructor(service) {
    this.service = service;
  }

  /**
   * Cria uma nova conta fixa.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da conta fixa.
   * @param {string} req.body.description - Descrição da conta fixa.
   * @param {string} [req.body.type] - Tipo da conta fixa (expense/income).
   * @param {number} req.body.amount - Valor da conta fixa.
   * @param {string} req.body.periodicity - Periodicidade (daily, weekly, monthly, quarterly, yearly).
   * @param {string} req.body.start_date - Data de início (YYYY-MM-DD).
   * @param {number} req.body.category_id - ID da categoria.
   * @param {number} [req.body.supplier_id] - ID do fornecedor (opcional).
   * @param {number} [req.body.account_id] - ID da conta bancária (opcional).
   * @param {string} [req.body.payment_method] - Método de pagamento (opcional).
   * @param {string} [req.body.observations] - Observações (opcional).
   * @param {number} [req.body.reminder_days] - Dias de antecedência para lembretes (padrão: 3).
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com a conta fixa criada.
   * @example
   * // POST /fixed-accounts
   * // Body: { "description": "Aluguel", "type": "expense", "amount": 1500.00, "periodicity": "monthly", "start_date": "2024-01-01", "category_id": 1 }
   * // Retorno: { "success": true, "data": { fixedAccount: {...}, firstTransaction: {...} } }
   */
  async createFixedAccount(req, res) {
    try {
      const result = await this.service.createFixedAccount({
        ...req.body,
        user_id: req.userId
      });

      logger.info('Conta fixa criada com sucesso', {
        user_id: req.userId,
        fixed_account_id: result.fixedAccount.id,
        transaction_id: result.firstTransaction.id
      });

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao criar conta fixa', {
        error: error.message,
        user_id: req.userId,
        fixed_account_data: req.body
      });

      if (error instanceof ValidationError || error.name === 'ValidationError' || error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error instanceof NotFoundError || error.name === 'NotFoundError') {
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
   * Lista todas as contas fixas do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de contas fixas em formato JSON.
   * @example
   * // GET /fixed-accounts
   * // Retorno: { "success": true, "data": { fixedAccounts: [...], pagination: {...} } }
   */
  async getFixedAccounts(req, res) {
    try {
      const result = await this.service.getFixedAccounts(req.userId, req.query);

      logger.info('Contas fixas listadas com sucesso', {
        user_id: req.userId,
        total_fixed_accounts: result.pagination?.total || result.fixedAccounts.length
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao listar contas fixas', {
        error: error.message,
        user_id: req.userId
      });

      if (error instanceof ValidationError || error.name === 'ValidationError' || error.name === 'ZodError') {
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
   * Obtém uma conta fixa específica por ID.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da conta fixa.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Conta fixa em formato JSON.
   * @example
   * // GET /fixed-accounts/1
   * // Retorno: { "success": true, "data": { fixedAccount: {...} } }
   */
  async getFixedAccountById(req, res) {
    try {
      const result = await this.service.getFixedAccountById(req.userId, req.params.id);

      logger.info('Conta fixa obtida com sucesso', {
        user_id: req.userId,
        fixed_account_id: req.params.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao obter conta fixa', {
        error: error.message,
        user_id: req.userId,
        fixed_account_id: req.params.id
      });

      if (error instanceof NotFoundError || error.name === 'NotFoundError') {
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
   * Atualiza uma conta fixa existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da conta fixa.
   * @param {Object} req.body - Dados para atualização.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Conta fixa atualizada em formato JSON.
   * @example
   * // PUT /fixed-accounts/1
   * // Body: { "amount": 1600.00, "observations": "Aumento do aluguel" }
   * // Retorno: { "success": true, "data": { fixedAccount: {...} } }
   */
  async updateFixedAccount(req, res) {
    try {
      const result = await this.service.updateFixedAccount(
        req.userId,
        req.params.id,
        req.body
      );

      logger.info('Conta fixa atualizada com sucesso', {
        user_id: req.userId,
        fixed_account_id: req.params.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao atualizar conta fixa', {
        error: error.message,
        user_id: req.userId,
        fixed_account_id: req.params.id,
        update_data: req.body
      });

      if (error instanceof ValidationError || error.name === 'ValidationError' || error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error instanceof NotFoundError || error.name === 'NotFoundError') {
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
   * Ativa ou desativa uma conta fixa (toggle automático).
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da conta fixa.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Conta fixa atualizada em formato JSON.
   * @example
   * // PATCH /fixed-accounts/1/toggle
   * // Retorno: { "success": true, "data": { fixedAccount: {...} } }
   */
  async toggleFixedAccount(req, res) {
    try {
      const result = await this.service.toggleFixedAccount(req.userId, req.params.id);

      logger.info('Status da conta fixa alterado com sucesso', {
        user_id: req.userId,
        fixed_account_id: req.params.id,
        new_status: result.fixedAccount.is_active
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao alterar status da conta fixa', {
        error: error.message,
        user_id: req.userId,
        fixed_account_id: req.params.id
      });

      if (error instanceof NotFoundError || error.name === 'NotFoundError') {
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
   * Marca uma conta fixa como paga e cria uma transação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da conta fixa.
   * @param {Object} req.body - Dados do pagamento.
   * @param {string} req.body.payment_date - Data do pagamento (YYYY-MM-DD).
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Transação criada em formato JSON.
   * @example
   * // POST /fixed-accounts/1/pay
   * // Body: { "payment_date": "2024-01-15" }
   * // Retorno: { "success": true, "data": { transaction: {...} } }
   */
  async payFixedAccount(req, res) {
    try {
      const result = await this.service.payFixedAccount(
        req.userId,
        req.params.id,
        req.body
      );

      logger.info('Conta fixa paga com sucesso', {
        user_id: req.userId,
        fixed_account_id: req.params.id,
        transaction_id: result.transaction.id
      });

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao pagar conta fixa', {
        error: error.message,
        user_id: req.userId,
        fixed_account_id: req.params.id,
        payment_data: req.body
      });

      if (error instanceof ValidationError || error.name === 'ValidationError' || error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error instanceof NotFoundError || error.name === 'NotFoundError') {
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
   * Remove uma conta fixa (soft delete).
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da conta fixa.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Mensagem de confirmação.
   * @example
   * // DELETE /fixed-accounts/1
   * // Retorno: { "success": true, "data": { message: "Conta fixa removida com sucesso" } }
   */
  async deleteFixedAccount(req, res) {
    try {
      const result = await this.service.deleteFixedAccount(req.userId, req.params.id);

      logger.info('Conta fixa removida com sucesso', {
        user_id: req.userId,
        fixed_account_id: req.params.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao remover conta fixa', {
        error: error.message,
        user_id: req.userId,
        fixed_account_id: req.params.id
      });

      if (error instanceof NotFoundError || error.name === 'NotFoundError') {
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
   * Obtém estatísticas das contas fixas do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas em formato JSON.
   * @example
   * // GET /fixed-accounts/statistics
   * // Retorno: { "success": true, "data": { total: 10, totalAmount: 5000.00, ... } }
   */
  async getFixedAccountStatistics(req, res) {
    try {
      const result = await this.service.getFixedAccountStatistics(req.userId, req.query);

      logger.info('Estatísticas de contas fixas obtidas com sucesso', {
        user_id: req.userId
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao obter estatísticas de contas fixas', {
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

const FixedAccountService = require('../services/fixedAccountService');
module.exports = new FixedAccountController(FixedAccountService);
module.exports.FixedAccountController = FixedAccountController; 