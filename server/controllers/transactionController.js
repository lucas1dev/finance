/**
 * Controller para gerenciamento de transações
 * Responsável por receber requisições HTTP e delegar lógica para o service
 * @author Lucas Santos
 */

const { logger } = require('../utils/logger');
const { ValidationError, NotFoundError, AppError } = require('../utils/errors');

/**
 * Controlador responsável por gerenciar transações.
 * Delega toda a lógica de negócio para o TransactionService.
 */
class TransactionController {
  /**
   * Construtor do controller.
   * @param {Object} transactionService - Service para gerenciar transações.
   */
  constructor(transactionService) {
    this.transactionService = transactionService;
  }

  /**
   * Método helper para tratar erros de forma consistente
   * @param {Error} error - Erro capturado
   * @param {Object} res - Objeto de resposta Express
   * @returns {Object} Resposta JSON com erro apropriado
   */
  handleError(error, res) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (error instanceof NotFoundError || (error instanceof AppError && error.statusCode === 404)) {
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

  /**
   * Cria uma nova transação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da transação.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com dados da transação criada.
   */
  async createTransaction(req, res) {
    try {
      const result = await this.transactionService.createTransaction(req.userId, req.body);

      logger.info('Transação criada com sucesso', {
        user_id: req.userId,
        transaction_id: result.transaction.id
      });

      return res.status(201).json({
        success: true,
        data: {
          transaction: result.transaction,
          newBalance: result.newBalance
        },
        message: 'Transação criada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar transação', {
        error: error.message,
        user_id: req.userId
      });

      return this.handleError(error, res);
    }
  }

  /**
   * Obtém a lista de transações do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de transações em formato JSON.
   */
  async getTransactions(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        type: req.query.type,
        category_id: req.query.category_id,
        account_id: req.query.account_id
      };

      // Remover filtros undefined
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) delete filters[key];
      });

      const transactions = await this.transactionService.getTransactions(req.userId, filters);

      logger.info('Transações listadas com sucesso', {
        user_id: req.userId,
        total_transactions: transactions.length
      });

      return res.json({
        success: true,
        data: {
          transactions,
          count: transactions.length
        }
      });
    } catch (error) {
      logger.error('Erro ao listar transações', {
        error: error.message,
        user_id: req.userId
      });

      return this.handleError(error, res);
    }
  }

  /**
   * Obtém uma transação específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID da transação.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Transação em formato JSON.
   */
  async getTransaction(req, res) {
    try {
      const transaction = await this.transactionService.getTransaction(req.userId, req.params.id);

      logger.info('Transação obtida com sucesso', {
        user_id: req.userId,
        transaction_id: req.params.id
      });

      return res.json({
        success: true,
        data: { transaction }
      });
    } catch (error) {
      logger.error('Erro ao obter transação', {
        error: error.message,
        user_id: req.userId,
        transaction_id: req.params.id
      });

      return this.handleError(error, res);
    }
  }

  /**
   * Atualiza uma transação existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID da transação.
   * @param {Object} req.body - Dados para atualização.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   */
  async updateTransaction(req, res) {
    try {
      const result = await this.transactionService.updateTransaction(req.userId, req.params.id, req.body);

      logger.info('Transação atualizada com sucesso', {
        user_id: req.userId,
        transaction_id: req.params.id
      });

      return res.json({
        success: true,
        data: {
          transaction: result.transaction,
          newBalance: result.newBalance
        },
        message: 'Transação atualizada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar transação', {
        error: error.message,
        user_id: req.userId,
        transaction_id: req.params.id
      });

      return this.handleError(error, res);
    }
  }

  /**
   * Remove uma transação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID da transação.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   */
  async deleteTransaction(req, res) {
    try {
      const result = await this.transactionService.deleteTransaction(req.userId, req.params.id);

      logger.info('Transação removida com sucesso', {
        user_id: req.userId,
        transaction_id: req.params.id
      });

      return res.json({
        success: true,
        data: {
          newBalance: result.newBalance
        },
        message: 'Transação removida com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao remover transação', {
        error: error.message,
        user_id: req.userId,
        transaction_id: req.params.id
      });

      return this.handleError(error, res);
    }
  }

  /**
   * Obtém estatísticas de transações.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas em formato JSON.
   */
  async getStats(req, res) {
    try {
      const period = req.query.period || 'month';
      const stats = await this.transactionService.getTransactionStats(req.userId, period);

      logger.info('Estatísticas de transações obtidas com sucesso', {
        user_id: req.userId,
        period
      });

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erro ao obter estatísticas de transações', {
        error: error.message,
        user_id: req.userId
      });

      return this.handleError(error, res);
    }
  }

  /**
   * Obtém dados para gráficos de transações.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Dados do gráfico em formato JSON.
   */
  async getCharts(req, res) {
    try {
      const { chart, period = 'month' } = req.query;

      let chartData;
      switch (chart) {
        case 'timeline':
          chartData = await this.transactionService.getTimelineData(req.userId, period);
          break;
        case 'categories':
          chartData = await this.transactionService.getCategoryChartData(req.userId, period);
          break;
        default:
          throw new ValidationError('Tipo de gráfico não suportado');
      }

      logger.info('Dados de gráfico obtidos com sucesso', {
        user_id: req.userId,
        chart_type: chart,
        period
      });

      return res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      logger.error('Erro ao obter dados de gráfico', {
        error: error.message,
        user_id: req.userId,
        chart: req.query.chart
      });

      return this.handleError(error, res);
    }
  }
}

module.exports = TransactionController; 