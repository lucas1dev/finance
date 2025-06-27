const { Receivable, Transaction, Payment, Category, Account, Customer } = require('../models');
const { createReceivableSchema, updateReceivableSchema, createReceivablePaymentSchema } = require('../utils/validators');
const { Op } = require('sequelize');
const receivableService = require('../services/receivableService');

/**
 * Controlador responsável por gerenciar contas a receber.
 * Permite criar, listar, atualizar e excluir contas a receber, além de gerenciar pagamentos.
 */
class ReceivableController {
  /**
   * Lista todas as contas a receber do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de contas a receber em formato JSON.
   */
  async index(req, res) {
    try {
      const receivables = await receivableService.listReceivables(req.user.id);
      
      res.json({
        success: true,
        data: receivables
      });
    } catch (error) {
      console.error('Erro ao buscar contas a receber:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar contas a receber',
        details: error.message
      });
    }
  }

  /**
   * Retorna os detalhes de uma conta a receber específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} req.params.id - ID da conta a receber.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Detalhes da conta a receber em formato JSON.
   */
  async show(req, res) {
    try {
      const receivable = await receivableService.getReceivableById(req.user.id, req.params.id);
      
      res.json({
        success: true,
        data: receivable
      });
    } catch (error) {
      console.error('Erro ao buscar conta a receber:', error);
      
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar conta a receber'
      });
    }
  }

  /**
   * Cria uma nova conta a receber para o usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da conta a receber.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Conta a receber criada em formato JSON.
   */
  async store(req, res) {
    try {
      const receivable = await receivableService.createReceivable(req.user.id, req.body);
      
      res.status(201).json({
        success: true,
        data: receivable
      });
    } catch (error) {
      console.error('Erro ao criar conta a receber:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos'
        });
      }
      
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro ao criar conta a receber'
      });
    }
  }

  /**
   * Atualiza uma conta a receber existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados para atualização.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Conta a receber atualizada em formato JSON.
   */
  async update(req, res) {
    try {
      const receivable = await receivableService.updateReceivable(req.user.id, req.params.id, req.body);
      
      res.json({
        success: true,
        data: receivable
      });
    } catch (error) {
      console.error('Erro ao atualizar conta a receber:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos'
        });
      }
      
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro ao atualizar conta a receber'
      });
    }
  }

  /**
   * Exclui uma conta a receber específica do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} req.params.id - ID da conta a receber.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<void>} Resposta vazia com status 204.
   */
  async destroy(req, res) {
    try {
      await receivableService.deleteReceivable(req.user.id, req.params.id);
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir conta a receber:', error);
      
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro ao excluir conta a receber',
        details: error.message
      });
    }
  }

  /**
   * Lista todos os pagamentos de uma conta a receber específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} req.params.id - ID da conta a receber.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Array>} Lista de pagamentos em formato JSON.
   */
  async getPayments(req, res) {
    try {
      const payments = await receivableService.getPayments(req.user.id, req.params.id);
      
      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar pagamentos'
      });
    }
  }

  /**
   * Adiciona um pagamento a uma conta a receber.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados do pagamento.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Pagamento criado e novo saldo da conta em formato JSON.
   */
  async addPayment(req, res) {
    try {
      const result = await receivableService.addPayment(req.user.id, req.params.id, req.body);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erro ao adicionar pagamento:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos'
        });
      }
      
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro ao adicionar pagamento',
        details: error.message
      });
    }
  }

  /**
   * Lista contas a receber que vencem nos próximos 30 dias.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de contas a vencer em formato JSON.
   */
  async getUpcomingDue(req, res) {
    try {
      const receivables = await receivableService.getUpcomingDue(req.user.id);
      
      res.json({
        success: true,
        data: receivables
      });
    } catch (error) {
      console.error('Erro ao buscar contas a vencer:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar contas a vencer'
      });
    }
  }

  /**
   * Lista contas a receber vencidas.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de contas vencidas em formato JSON.
   */
  async getOverdue(req, res) {
    try {
      const receivables = await receivableService.getOverdue(req.user.id);
      
      res.json({
        success: true,
        data: receivables
      });
    } catch (error) {
      console.error('Erro ao buscar contas vencidas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar contas vencidas'
      });
    }
  }
}

const receivableController = new ReceivableController();

module.exports = {
  index: receivableController.index.bind(receivableController),
  show: receivableController.show.bind(receivableController),
  store: receivableController.store.bind(receivableController),
  update: receivableController.update.bind(receivableController),
  destroy: receivableController.destroy.bind(receivableController),
  getPayments: receivableController.getPayments.bind(receivableController),
  addPayment: receivableController.addPayment.bind(receivableController),
  getUpcomingDue: receivableController.getUpcomingDue.bind(receivableController),
  getOverdue: receivableController.getOverdue.bind(receivableController)
}; 