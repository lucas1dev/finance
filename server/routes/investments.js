const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');
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
 * Rotas para gerenciamento de investimentos.
 * Todas as rotas requerem autenticação via JWT.
 */

// Aplica middleware de autenticação em todas as rotas
router.use(auth);

/**
 * @route POST /investments
 * @desc Cria um novo investimento
 * @access Private
 * @body {string} investment_type - Tipo de investimento (acoes, fundos, titulos, criptomoedas, outros)
 * @body {string} asset_name - Nome do ativo
 * @body {string} ticker - Ticker do ativo (opcional)
 * @body {number} invested_amount - Valor investido
 * @body {number} quantity - Quantidade de ativos
 * @body {string} operation_date - Data da operação (YYYY-MM-DD)
 * @body {string} operation_type - Tipo de operação (compra, venda)
 * @body {string} broker - Corretora (opcional)
 * @body {string} observations - Observações (opcional)
 * @body {number} account_id - ID da conta
 * @body {number} category_id - ID da categoria (opcional)
 * @returns {Object} Investimento criado
 */
router.post('/', asyncHandler(investmentController.createInvestment));

/**
 * @route GET /investments
 * @desc Lista todos os investimentos do usuário
 * @access Private
 * @query {string} investment_type - Filtrar por tipo de investimento
 * @query {string} operation_type - Filtrar por tipo de operação
 * @query {string} status - Filtrar por status
 * @query {string} broker - Filtrar por corretora
 * @query {number} page - Página para paginação
 * @query {number} limit - Limite de itens por página
 * @returns {Object} Lista de investimentos com paginação
 */
router.get('/', asyncHandler(investmentController.getInvestments));

/**
 * @route GET /investments/statistics
 * @desc Obtém estatísticas dos investimentos
 * @access Private
 * @returns {Object} Estatísticas dos investimentos
 */
router.get('/statistics', asyncHandler(investmentController.getInvestmentStatistics));

/**
 * @route GET /investments/:id
 * @desc Obtém um investimento específico
 * @access Private
 * @param {number} id - ID do investimento
 * @returns {Object} Investimento
 */
router.get('/:id', asyncHandler(investmentController.getInvestment));

/**
 * @route PUT /investments/:id
 * @desc Atualiza um investimento
 * @access Private
 * @param {number} id - ID do investimento
 * @body {string} investment_type - Tipo de investimento (opcional)
 * @body {string} asset_name - Nome do ativo (opcional)
 * @body {string} ticker - Ticker do ativo (opcional)
 * @body {number} invested_amount - Valor investido (opcional)
 * @body {number} quantity - Quantidade de ativos (opcional)
 * @body {string} operation_date - Data da operação (opcional)
 * @body {string} operation_type - Tipo de operação (opcional)
 * @body {string} broker - Corretora (opcional)
 * @body {string} observations - Observações (opcional)
 * @body {string} status - Status do investimento (opcional)
 * @body {number} account_id - ID da conta (opcional)
 * @body {number} category_id - ID da categoria (opcional)
 * @returns {Object} Investimento atualizado
 */
router.put('/:id', asyncHandler(investmentController.updateInvestment));

/**
 * @route DELETE /investments/:id
 * @desc Exclui um investimento
 * @access Private
 * @param {number} id - ID do investimento
 * @returns {Object} Mensagem de confirmação
 */
router.delete('/:id', asyncHandler(investmentController.deleteInvestment));

module.exports = router; 