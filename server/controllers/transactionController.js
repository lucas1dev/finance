/**
 * Controller para gerenciamento de transações
 * Responsável por receber requisições HTTP e delegar lógica para o service
 * @author Lucas Santos
 */

const transactionService = require('../services/transactionService');
const { createTransactionSchema, updateTransactionSchema } = require('../utils/validators');
const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');

const transactionController = {
  /**
   * Cria uma nova transação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da transação.
   * @param {number} req.body.account_id - ID da conta.
   * @param {number} req.body.category_id - ID da categoria (opcional).
   * @param {string} req.body.type - Tipo da transação (income/expense).
   * @param {number} req.body.amount - Valor da transação.
   * @param {string} req.body.description - Descrição da transação.
   * @param {string} req.body.date - Data da transação (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com dados da transação criada.
   * @throws {Error} Se a conta não for encontrada ou houver erro no banco.
   * @example
   * // POST /transactions
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "account_id": 1, "type": "income", "amount": 100, "description": "Salário" }
   * // Retorno: { "message": "Transação criada com sucesso", "transactionId": 1, "newBalance": 100 }
   */
  createTransaction: async (req, res, next) => {
    try {
      // Validar dados de entrada
      const validatedData = createTransactionSchema.parse(req.body);
      const userId = req.user.id;

      // Delegar lógica para o service
      const { transaction, newBalance } = await transactionService.createTransaction(userId, validatedData);

      res.status(201).json({
        message: 'Transação criada com sucesso',
        transactionId: transaction.id,
        newBalance,
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date
        }
      });
    } catch (error) {
      logger.error(`Erro ao criar transação: ${error.message}`, { userId: req.user.id, error });
      next(error);
    }
  },

  /**
   * Obtém a lista de transações do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.startDate - Data de início (opcional).
   * @param {string} req.query.endDate - Data de fim (opcional).
   * @param {string} req.query.type - Tipo da transação (opcional).
   * @param {number} req.query.category_id - ID da categoria (opcional).
   * @param {number} req.query.account_id - ID da conta (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de transações em formato JSON.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // GET /transactions?startDate=2024-01-01&endDate=2024-12-31&type=income
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: [{ id: 1, amount: 100, type: "income", description: "Salário" }, ...]
   */
  getTransactions: async (req, res, next) => {
    try {
      const userId = req.user.id;
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

      const transactions = await transactionService.getTransactions(userId, filters);

      res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      logger.error(`Erro ao buscar transações: ${error.message}`, { userId: req.user.id, error });
      next(error);
    }
  },

  /**
   * Obtém uma transação específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID da transação.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Transação em formato JSON.
   * @throws {Error} Se a transação não for encontrada ou houver erro no banco.
   * @example
   * // GET /transactions/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { id: 1, amount: 100, type: "income", description: "Salário" }
   */
  getTransaction: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const transaction = await transactionService.getTransaction(userId, id);

      if (!transaction) {
        throw new AppError('Transação não encontrada', 404);
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error(`Erro ao buscar transação: ${error.message}`, { userId: req.user.id, transactionId: req.params.id, error });
      next(error);
    }
  },

  /**
   * Atualiza uma transação existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID da transação.
   * @param {Object} req.body - Dados para atualização.
   * @param {string} req.body.type - Tipo da transação (opcional).
   * @param {number} req.body.amount - Valor da transação (opcional).
   * @param {number} req.body.category_id - ID da categoria (opcional).
   * @param {string} req.body.description - Descrição da transação (opcional).
   * @param {string} req.body.date - Data da transação (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se a transação não for encontrada ou houver erro no banco.
   * @example
   * // PUT /transactions/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "amount": 150, "description": "Salário atualizado" }
   * // Retorno: { "message": "Transação atualizada com sucesso", "newBalance": 150 }
   */
  updateTransaction: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Validar dados de entrada
      const validatedData = updateTransactionSchema.parse(req.body);

      // Delegar lógica para o service
      const { transaction, newBalance } = await transactionService.updateTransaction(userId, id, validatedData);

      res.json({
        message: 'Transação atualizada com sucesso',
        newBalance,
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date
        }
      });
    } catch (error) {
      logger.error(`Erro ao atualizar transação: ${error.message}`, { userId: req.user.id, transactionId: req.params.id, error });
      next(error);
    }
  },

  /**
   * Remove uma transação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID da transação.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se a transação não for encontrada ou houver erro no banco.
   * @example
   * // DELETE /transactions/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "message": "Transação removida com sucesso", "newBalance": 50 }
   */
  deleteTransaction: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { newBalance } = await transactionService.deleteTransaction(userId, id);

      res.json({
        message: 'Transação removida com sucesso',
        newBalance
      });
    } catch (error) {
      logger.error(`Erro ao remover transação: ${error.message}`, { userId: req.user.id, transactionId: req.params.id, error });
      next(error);
    }
  },

  /**
   * Obtém estatísticas de transações.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.period - Período (week/month/quarter/year).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas em formato JSON.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // GET /transactions/stats?period=month
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "totalIncome": 5000, "totalExpenses": 3000, "netAmount": 2000 }
   */
  getStats: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const period = req.query.period || 'month';

      const stats = await transactionService.getTransactionStats(userId, period);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Erro ao buscar estatísticas: ${error.message}`, { userId: req.user.id, error });
      next(error);
    }
  },

  /**
   * Obtém dados para gráficos de transações.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.chart - Tipo de gráfico (timeline/categories/trend).
   * @param {string} req.query.period - Período (week/month/quarter/year).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Dados do gráfico em formato JSON.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // GET /transactions/charts?chart=timeline&period=month
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "timeline": [{ "label": "01/01", "income": 100, "expenses": 50 }] }
   */
  getCharts: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { chart, period = 'month' } = req.query;

      let chartData;
      switch (chart) {
        case 'timeline':
          chartData = await transactionService.getTimelineData(userId, period);
          break;
        case 'categories':
          chartData = await transactionService.getCategoryChartData(userId, period);
          break;
        default:
          throw new AppError('Tipo de gráfico não suportado', 400);
      }

      res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      logger.error(`Erro ao buscar dados de gráfico: ${error.message}`, { userId: req.user.id, error });
      next(error);
    }
  }
};

module.exports = transactionController; 