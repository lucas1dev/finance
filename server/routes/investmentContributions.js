const express = require('express');
const router = express.Router();
const { defaultController: investmentContributionController } = require('../controllers/investmentContributionController');
const authMiddleware = require('../middlewares/auth');

/**
 * Wrapper para capturar erros assíncronos dos controllers
 * @param {Function} fn - Função do controller
 * @returns {Function} Função wrapped para Express
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Rotas para gerenciar aportes de investimentos.
 * Todas as rotas requerem autenticação JWT.
 */

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware.auth);

/**
 * POST /investment-contributions
 * Cria um novo aporte para um investimento.
 * @body {number} investment_id - ID do investimento
 * @body {string} contribution_date - Data do aporte (YYYY-MM-DD)
 * @body {number} amount - Valor total do aporte
 * @body {number} quantity - Quantidade de ativos
 * @body {number} unit_price - Preço unitário
 * @body {string} broker - Corretora (opcional)
 * @body {string} observations - Observações (opcional)
 * @returns {Object} Aporte criado
 */
router.post('/', asyncHandler(investmentContributionController.createContribution));

/**
 * GET /investment-contributions
 * Lista todos os aportes do usuário com filtros e paginação.
 * @query {number} investment_id - Filtrar por investimento (opcional)
 * @query {string} broker - Filtrar por corretora (opcional)
 * @query {string} start_date - Data inicial (opcional)
 * @query {string} end_date - Data final (opcional)
 * @query {number} page - Página (padrão: 1)
 * @query {number} limit - Limite por página (padrão: 10)
 * @returns {Object} Lista de aportes com paginação e estatísticas
 */
router.get('/', asyncHandler(investmentContributionController.getContributions));

/**
 * GET /investment-contributions/statistics
 * Calcula estatísticas dos aportes do usuário.
 * @returns {Object} Estatísticas gerais, por investimento e por corretora
 */
router.get('/statistics', asyncHandler(investmentContributionController.getContributionStatistics));

/**
 * GET /investment-contributions/investment/:investmentId
 * Lista todos os aportes de um investimento específico.
 * IMPORTANTE: Esta rota deve vir ANTES da rota /:id para evitar conflitos.
 * @param {number} investmentId - ID do investimento
 * @returns {Object} Lista de aportes do investimento com resumo
 */
router.get('/investment/:investmentId', asyncHandler(investmentContributionController.getContributionsByInvestment));

/**
 * GET /investment-contributions/:id
 * Busca um aporte específico por ID.
 * @param {number} id - ID do aporte
 * @returns {Object} Dados do aporte
 */
router.get('/:id', asyncHandler(investmentContributionController.getContribution));

/**
 * PUT /investment-contributions/:id
 * Atualiza um aporte existente.
 * @param {number} id - ID do aporte
 * @body {string} contribution_date - Data do aporte (opcional)
 * @body {number} amount - Valor total do aporte (opcional)
 * @body {number} quantity - Quantidade de ativos (opcional)
 * @body {number} unit_price - Preço unitário (opcional)
 * @body {string} broker - Corretora (opcional)
 * @body {string} observations - Observações (opcional)
 * @returns {Object} Aporte atualizado
 */
router.put('/:id', asyncHandler(investmentContributionController.updateContribution));

/**
 * DELETE /investment-contributions/:id
 * Exclui um aporte.
 * @param {number} id - ID do aporte
 * @returns {Object} Confirmação de exclusão
 */
router.delete('/:id', asyncHandler(investmentContributionController.deleteContribution));

module.exports = router; 