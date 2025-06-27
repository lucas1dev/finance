const payableService = require('../services/payableService');

/**
 * Controlador responsável por gerenciar contas a pagar.
 * Delega a lógica de negócio para o payableService.
 */
class PayableController {
  /**
   * Lista todas as contas a pagar do usuário autenticado, com opção de filtro por status.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} [req.query.status] - Status para filtrar ('pending' ou 'paid').
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de contas a pagar em formato JSON.
   */
  async index(req, res) {
    try {
      const { status } = req.query;
      const payables = await payableService.listPayables(req.user.id, status);
      
      res.json({
        success: true,
        data: payables
      });
    } catch (error) {
      console.error('Erro ao buscar contas a pagar:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar contas a pagar',
        details: error.message
      });
    }
  }

  /**
   * Retorna os detalhes de uma conta a pagar específica do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} req.params.id - ID da conta a pagar.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Detalhes da conta a pagar em formato JSON.
   */
  async show(req, res) {
    try {
      const payable = await payableService.getPayableById(req.user.id, req.params.id);
      
      res.json({
        success: true,
        data: payable
      });
    } catch (error) {
      console.error('Erro ao buscar conta a pagar:', error);
      
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar conta a pagar'
      });
    }
  }

  /**
   * Cria uma nova conta a pagar para o usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da conta a pagar.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Conta a pagar criada em formato JSON.
   */
  async create(req, res) {
    try {
      const payable = await payableService.createPayable(req.user.id, req.body);
      
      res.status(201).json({
        success: true,
        data: payable
      });
    } catch (error) {
      console.error('Erro ao criar conta a pagar:', error);
      
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
        error: 'Erro ao criar conta a pagar'
      });
    }
  }

  /**
   * Atualiza uma conta a pagar existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados para atualização.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Conta a pagar atualizada em formato JSON.
   */
  async update(req, res) {
    try {
      const payable = await payableService.updatePayable(req.user.id, req.params.id, req.body);
      
      res.json({
        success: true,
        data: payable
      });
    } catch (error) {
      console.error('Erro ao atualizar conta a pagar:', error);
      
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
        error: 'Erro ao atualizar conta a pagar'
      });
    }
  }

  /**
   * Exclui uma conta a pagar específica do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} req.params.id - ID da conta a pagar.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<void>} Resposta vazia com status 204.
   */
  async delete(req, res) {
    try {
      await payableService.deletePayable(req.user.id, req.params.id);
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir conta a pagar:', error);
      
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro ao excluir conta a pagar',
        details: error.message
      });
    }
  }

  /**
   * Lista todos os pagamentos de uma conta a pagar específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} req.params.id - ID da conta a pagar.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Array>} Lista de pagamentos em formato JSON.
   */
  async getPayments(req, res) {
    try {
      const payments = await payableService.getPayments(req.user.id, req.params.id);
      
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
   * Adiciona um pagamento a uma conta a pagar.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados do pagamento.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Pagamento criado e novo saldo da conta em formato JSON.
   */
  async addPayment(req, res) {
    try {
      const result = await payableService.addPayment(req.user.id, req.params.id, req.body);
      
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
   * Lista contas a pagar que vencem nos próximos 30 dias.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de contas a vencer em formato JSON.
   */
  async getUpcomingDue(req, res) {
    try {
      const payables = await payableService.getUpcomingDue(req.user.id);
      
      res.json({
        success: true,
        data: payables
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
   * Lista contas a pagar vencidas.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de contas vencidas em formato JSON.
   */
  async getOverdue(req, res) {
    try {
      const payables = await payableService.getOverdue(req.user.id);
      
      res.json({
        success: true,
        data: payables
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

const payableController = new PayableController();

module.exports = {
  index: payableController.index.bind(payableController),
  show: payableController.show.bind(payableController),
  create: payableController.create.bind(payableController),
  update: payableController.update.bind(payableController),
  delete: payableController.delete.bind(payableController),
  getPayments: payableController.getPayments.bind(payableController),
  addPayment: payableController.addPayment.bind(payableController),
  getUpcomingDue: payableController.getUpcomingDue.bind(payableController),
  getOverdue: payableController.getOverdue.bind(payableController)
};