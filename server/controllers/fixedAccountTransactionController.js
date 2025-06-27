/**
 * Controller para gerenciar lançamentos de contas fixas
 * Implementa endpoints para listar, pagar e modificar lançamentos
 */
const FixedAccountService = require('../services/fixedAccountService');
const { validateFixedAccountTransactionPayment } = require('../utils/validators');
const { logger } = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');

class FixedAccountTransactionController {
  /**
   * Lista lançamentos de conta fixa com filtros
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async listTransactions(req, res) {
    try {
      const userId = req.userId;
      const {
        status,
        category_id,
        supplier_id,
        due_date_from,
        due_date_to,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {
        user_id: userId,
        status,
        category_id: category_id ? parseInt(category_id) : undefined,
        supplier_id: supplier_id ? parseInt(supplier_id) : undefined,
        due_date_from,
        due_date_to,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await FixedAccountService.listFixedAccountTransactions(filters);

      logger.info(`Lançamentos de conta fixa listados para usuário ${userId}`, {
        user_id: userId,
        total: result.pagination.total,
        page: filters.page
      });

      return successResponse(res, {
        message: 'Lançamentos listados com sucesso',
        data: result.transactions,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Erro ao listar lançamentos de conta fixa', {
        error: error.message,
        user_id: req.userId
      });

      return errorResponse(res, {
        message: 'Erro ao listar lançamentos',
        error: error.message
      }, 500);
    }
  }

  /**
   * Registra pagamento de lançamentos de conta fixa
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async payTransactions(req, res) {
    try {
      const userId = req.userId;
      const paymentData = req.body;

      // Validar dados do pagamento
      const validation = validateFixedAccountTransactionPayment(paymentData);
      if (!validation.isValid) {
        return errorResponse(res, {
          message: 'Dados de pagamento inválidos',
          errors: validation.errors
        }, 400);
      }

      // Adicionar user_id aos dados
      paymentData.user_id = userId;

      const result = await FixedAccountService.payFixedAccountTransactions(paymentData);

      logger.info(`Pagamento de lançamentos de conta fixa registrado`, {
        user_id: userId,
        transaction_ids: paymentData.transaction_ids,
        total_amount: result.totalAmount,
        paid_count: result.paidTransactions.length
      });

      return successResponse(res, {
        message: 'Pagamento registrado com sucesso',
        data: {
          paidTransactions: result.paidTransactions,
          createdTransactions: result.createdTransactions,
          totalAmount: result.totalAmount
        }
      });

    } catch (error) {
      logger.error('Erro ao registrar pagamento de lançamentos', {
        error: error.message,
        user_id: req.userId,
        payment_data: req.body
      });

      return errorResponse(res, {
        message: 'Erro ao registrar pagamento',
        error: error.message
      }, 500);
    }
  }

  /**
   * Modifica um lançamento de conta fixa (sem refletir na conta fixa pai)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async updateTransaction(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const updateData = req.body;

      // Buscar o lançamento
      const { FixedAccountTransaction } = require('../models');
      const transaction = await FixedAccountTransaction.findOne({
        where: {
          id: parseInt(id),
          user_id: userId
        },
        include: [
          {
            model: require('../models').FixedAccount,
            as: 'fixedAccount'
          }
        ]
      });

      if (!transaction) {
        return errorResponse(res, {
          message: 'Lançamento não encontrado'
        }, 404);
      }

      // Verificar se o lançamento pode ser modificado
      if (transaction.status === 'paid') {
        return errorResponse(res, {
          message: 'Não é possível modificar um lançamento já pago'
        }, 400);
      }

      // Campos permitidos para modificação
      const allowedFields = ['observations', 'payment_method'];
      const fieldsToUpdate = {};

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          fieldsToUpdate[field] = updateData[field];
        }
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        return errorResponse(res, {
          message: 'Nenhum campo válido para atualização fornecido'
        }, 400);
      }

      // Atualizar o lançamento
      await transaction.update(fieldsToUpdate);

      logger.info(`Lançamento de conta fixa atualizado`, {
        user_id: userId,
        transaction_id: id,
        updated_fields: Object.keys(fieldsToUpdate)
      });

      return successResponse(res, {
        message: 'Lançamento atualizado com sucesso',
        data: transaction
      });

    } catch (error) {
      logger.error('Erro ao atualizar lançamento de conta fixa', {
        error: error.message,
        user_id: req.userId,
        transaction_id: req.params.id
      });

      return errorResponse(res, {
        message: 'Erro ao atualizar lançamento',
        error: error.message
      }, 500);
    }
  }

  /**
   * Busca um lançamento específico por ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getTransaction(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const { FixedAccountTransaction } = require('../models');
      const transaction = await FixedAccountTransaction.findOne({
        where: {
          id: parseInt(id),
          user_id: userId
        },
        include: [
          {
            model: require('../models').FixedAccount,
            as: 'fixedAccount',
            include: [
              { model: require('../models').Category, as: 'category' },
              { model: require('../models').Supplier, as: 'supplier' }
            ]
          },
          {
            model: require('../models').Transaction,
            as: 'transaction'
          }
        ]
      });

      if (!transaction) {
        return errorResponse(res, {
          message: 'Lançamento não encontrado'
        }, 404);
      }

      logger.info(`Lançamento de conta fixa consultado`, {
        user_id: userId,
        transaction_id: id
      });

      return successResponse(res, {
        message: 'Lançamento encontrado com sucesso',
        data: transaction
      });

    } catch (error) {
      logger.error('Erro ao buscar lançamento de conta fixa', {
        error: error.message,
        user_id: req.userId,
        transaction_id: req.params.id
      });

      return errorResponse(res, {
        message: 'Erro ao buscar lançamento',
        error: error.message
      }, 500);
    }
  }

  /**
   * Cancela um lançamento de conta fixa
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async cancelTransaction(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const { FixedAccountTransaction } = require('../models');
      const transaction = await FixedAccountTransaction.findOne({
        where: {
          id: parseInt(id),
          user_id: userId
        },
        include: [
          {
            model: require('../models').FixedAccount,
            as: 'fixedAccount'
          }
        ]
      });

      if (!transaction) {
        return errorResponse(res, {
          message: 'Lançamento não encontrado'
        }, 404);
      }

      // Verificar se o lançamento pode ser cancelado
      if (transaction.status === 'paid') {
        return errorResponse(res, {
          message: 'Não é possível cancelar um lançamento já pago'
        }, 400);
      }

      if (transaction.status === 'cancelled') {
        return errorResponse(res, {
          message: 'Lançamento já está cancelado'
        }, 400);
      }

      // Cancelar o lançamento
      await transaction.update({
        status: 'cancelled',
        observations: transaction.observations 
          ? `${transaction.observations}\n[CANCELADO em ${new Date().toISOString()}]`
          : `[CANCELADO em ${new Date().toISOString()}]`
      });

      logger.info(`Lançamento de conta fixa cancelado`, {
        user_id: userId,
        transaction_id: id
      });

      return successResponse(res, {
        message: 'Lançamento cancelado com sucesso',
        data: transaction
      });

    } catch (error) {
      logger.error('Erro ao cancelar lançamento de conta fixa', {
        error: error.message,
        user_id: req.userId,
        transaction_id: req.params.id
      });

      return errorResponse(res, {
        message: 'Erro ao cancelar lançamento',
        error: error.message
      }, 500);
    }
  }
}

module.exports = FixedAccountTransactionController; 