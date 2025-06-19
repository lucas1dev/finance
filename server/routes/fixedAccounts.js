const express = require('express');
const router = express.Router();
const fixedAccountController = require('../controllers/fixedAccountController');
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
 * Rotas para gerenciamento de contas fixas.
 * Todas as rotas requerem autenticação via JWT.
 */

// Aplica middleware de autenticação em todas as rotas
router.use(auth);

/**
 * @route POST /fixed-accounts
 * @desc Cria uma nova conta fixa
 * @access Private
 * @body {string} description - Descrição da conta fixa
 * @body {number} amount - Valor da conta fixa
 * @body {string} periodicity - Periodicidade (daily, weekly, monthly, quarterly, yearly)
 * @body {string} start_date - Data de início (YYYY-MM-DD)
 * @body {number} category_id - ID da categoria
 * @body {number} [supplier_id] - ID do fornecedor (opcional)
 * @body {string} [payment_method] - Método de pagamento (opcional)
 * @body {string} [observations] - Observações (opcional)
 * @body {number} [reminder_days] - Dias de antecedência para lembretes (padrão: 3)
 * @returns {Object} Conta fixa criada
 */
router.post('/', asyncHandler(fixedAccountController.createFixedAccount));

/**
 * @route GET /fixed-accounts
 * @desc Lista todas as contas fixas do usuário
 * @access Private
 * @returns {Array} Lista de contas fixas
 */
router.get('/', asyncHandler(fixedAccountController.getFixedAccounts));

/**
 * @route GET /fixed-accounts/:id
 * @desc Obtém uma conta fixa específica por ID
 * @access Private
 * @param {number} id - ID da conta fixa
 * @returns {Object} Conta fixa
 */
router.get('/:id', asyncHandler(fixedAccountController.getFixedAccountById));

/**
 * @route PUT /fixed-accounts/:id
 * @desc Atualiza uma conta fixa existente
 * @access Private
 * @param {number} id - ID da conta fixa
 * @body {string} [description] - Nova descrição
 * @body {number} [amount] - Novo valor
 * @body {string} [periodicity] - Nova periodicidade
 * @body {string} [start_date] - Nova data de início
 * @body {number} [category_id] - Nova categoria
 * @body {number} [supplier_id] - Novo fornecedor
 * @body {string} [payment_method] - Novo método de pagamento
 * @body {string} [observations] - Novas observações
 * @body {number} [reminder_days] - Novos dias de lembretes
 * @returns {Object} Conta fixa atualizada
 */
router.put('/:id', asyncHandler(fixedAccountController.updateFixedAccount));

/**
 * @route PATCH /fixed-accounts/:id/toggle
 * @desc Ativa ou desativa uma conta fixa
 * @access Private
 * @param {number} id - ID da conta fixa
 * @body {boolean} is_active - Status de ativação
 * @returns {Object} Conta fixa atualizada
 */
router.patch('/:id/toggle', asyncHandler(fixedAccountController.toggleFixedAccount));

/**
 * @route POST /fixed-accounts/:id/pay
 * @desc Marca uma conta fixa como paga e cria uma transação
 * @access Private
 * @param {number} id - ID da conta fixa
 * @body {string} [payment_date] - Data do pagamento (YYYY-MM-DD)
 * @returns {Object} Transação criada
 */
router.post('/:id/pay', asyncHandler(fixedAccountController.payFixedAccount));

/**
 * @route DELETE /fixed-accounts/:id
 * @desc Remove uma conta fixa
 * @access Private
 * @param {number} id - ID da conta fixa
 * @returns {Object} Mensagem de confirmação
 */
router.delete('/:id', asyncHandler(fixedAccountController.deleteFixedAccount));

module.exports = router; 