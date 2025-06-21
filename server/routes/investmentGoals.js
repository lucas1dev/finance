const express = require('express');
const router = express.Router();
const investmentGoalController = require('../controllers/investmentGoalController');
const { auth } = require('../middlewares/auth');

/**
 * Wrapper para capturar erros assíncronos dos controllers
 * @param {Function} fn - Função do controller
 * @returns {Function} Função wrapped para Express
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Rotas para gerenciamento de metas de investimento.
 * Todas as rotas requerem autenticação via JWT.
 */

// Aplica middleware de autenticação em todas as rotas
router.use(auth);

/**
 * @route POST /investment-goals
 * @desc Cria uma nova meta de investimento
 * @access Private
 * @body {string} title - Título da meta
 * @body {string} description - Descrição da meta
 * @body {number} target_amount - Valor alvo
 * @body {string} target_date - Data alvo (YYYY-MM-DD)
 * @body {number} current_amount - Valor atual (opcional)
 * @body {string} color - Cor da meta (opcional, formato #RRGGBB)
 * @body {number} category_id - ID da categoria (opcional)
 * @returns {Object} Meta criada
 */
router.post('/', asyncHandler(investmentGoalController.createInvestmentGoal));

/**
 * @route GET /investment-goals
 * @desc Lista todas as metas de investimento do usuário
 * @access Private
 * @query {string} status - Filtrar por status (ativa, concluida, cancelada)
 * @query {number} page - Página para paginação
 * @query {number} limit - Limite de itens por página
 * @returns {Object} Lista de metas com paginação
 */
router.get('/', asyncHandler(investmentGoalController.getInvestmentGoals));

/**
 * @route GET /investment-goals/statistics
 * @desc Obtém estatísticas das metas de investimento
 * @access Private
 * @returns {Object} Estatísticas das metas
 */
router.get('/statistics', asyncHandler(investmentGoalController.getInvestmentGoalStatistics));

/**
 * @route GET /investment-goals/:id
 * @desc Obtém uma meta de investimento específica
 * @access Private
 * @param {number} id - ID da meta
 * @returns {Object} Meta com progresso calculado
 */
router.get('/:id', asyncHandler(investmentGoalController.getInvestmentGoal));

/**
 * @route PUT /investment-goals/:id
 * @desc Atualiza uma meta de investimento
 * @access Private
 * @param {number} id - ID da meta
 * @body {string} title - Título da meta (opcional)
 * @body {string} description - Descrição da meta (opcional)
 * @body {number} target_amount - Valor alvo (opcional)
 * @body {string} target_date - Data alvo (opcional)
 * @body {number} current_amount - Valor atual (opcional)
 * @body {string} status - Status da meta (opcional)
 * @body {string} color - Cor da meta (opcional)
 * @body {number} category_id - ID da categoria (opcional)
 * @returns {Object} Meta atualizada
 */
router.put('/:id', asyncHandler(investmentGoalController.updateInvestmentGoal));

/**
 * @route PUT /investment-goals/:id/amount
 * @desc Atualiza o valor atual de uma meta
 * @access Private
 * @param {number} id - ID da meta
 * @body {number} current_amount - Valor atual
 * @returns {Object} Meta atualizada
 */
router.put('/:id/amount', asyncHandler(investmentGoalController.updateGoalAmount));

/**
 * @route PUT /investment-goals/:id/calculate
 * @desc Calcula automaticamente o valor atual da meta baseado nos investimentos
 * @access Private
 * @param {number} id - ID da meta
 * @returns {Object} Meta atualizada com valor calculado
 */
router.put('/:id/calculate', asyncHandler(investmentGoalController.calculateGoalAmount));

/**
 * @route DELETE /investment-goals/:id
 * @desc Exclui uma meta de investimento
 * @access Private
 * @param {number} id - ID da meta
 * @returns {Object} Mensagem de confirmação
 */
router.delete('/:id', asyncHandler(investmentGoalController.deleteInvestmentGoal));

module.exports = router; 