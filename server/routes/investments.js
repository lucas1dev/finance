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
 * GET /investments/statistics
 * Obtém estatísticas dos investimentos.
 * @returns {Object} Estatísticas gerais, por tipo e por corretora
 */
router.get('/statistics', asyncHandler(investmentController.getInvestmentStatistics));

/**
 * GET /investments/positions
 * Lista todas as posições ativas disponíveis para venda.
 * @query {string} investment_type - Filtrar por tipo de investimento (opcional)
 * @query {string} broker - Filtrar por corretora (opcional)
 * @query {string} asset_name - Buscar por nome do ativo (opcional)
 * @query {string} ticker - Buscar por ticker (opcional)
 * @query {number} page - Página (padrão: 1)
 * @query {number} limit - Limite por página (padrão: 10)
 * @returns {Object} Lista de posições ativas com paginação
 */
router.get('/positions', asyncHandler(investmentController.getActivePositions));

/**
 * POST /investments/positions/:assetName/sell
 * Vende um ativo existente.
 * @param {string} assetName - Nome do ativo
 * @body {number} quantity - Quantidade a ser vendida
 * @body {number} unit_price - Preço unitário de venda
 * @body {string} operation_date - Data da operação (YYYY-MM-DD)
 * @body {number} account_id - ID da conta que receberá o valor
 * @body {string} broker - Corretora
 * @body {string} observations - Observações (opcional)
 * @returns {Object} Venda registrada com transação
 */
router.post('/positions/:assetName/sell', asyncHandler(investmentController.sellAsset));

/**
 * POST /investments/positions/:assetName/:ticker/sell
 * Vende um ativo existente com ticker específico.
 * @param {string} assetName - Nome do ativo
 * @param {string} ticker - Ticker do ativo
 * @body {number} quantity - Quantidade a ser vendida
 * @body {number} unit_price - Preço unitário de venda
 * @body {string} operation_date - Data da operação (YYYY-MM-DD)
 * @body {number} account_id - ID da conta que receberá o valor
 * @body {string} broker - Corretora
 * @body {string} observations - Observações (opcional)
 * @returns {Object} Venda registrada com transação
 */
router.post('/positions/:assetName/:ticker/sell', asyncHandler(investmentController.sellAsset));

/**
 * GET /investments/positions/:assetName
 * Obtém a posição detalhada de um ativo específico.
 * @param {string} assetName - Nome do ativo
 * @returns {Object} Posição detalhada do ativo com histórico de operações
 */
router.get('/positions/:assetName', asyncHandler(investmentController.getAssetPosition));

/**
 * GET /investments/positions/:assetName/:ticker
 * Obtém a posição detalhada de um ativo específico com ticker.
 * @param {string} assetName - Nome do ativo
 * @param {string} ticker - Ticker do ativo
 * @returns {Object} Posição detalhada do ativo com histórico de operações
 */
router.get('/positions/:assetName/:ticker', asyncHandler(investmentController.getAssetPosition));

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