/**
 * Rotas para gerenciamento de lançamentos de contas fixas
 */
const express = require('express');
const router = express.Router();
const FixedAccountTransactionController = require('../controllers/fixedAccountTransactionController');
const { auth } = require('../middlewares/auth');
const { apiRateLimiter } = require('../middlewares/rateLimiter');

/**
 * @swagger
 * components:
 *   schemas:
 *     FixedAccountTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do lançamento
 *         fixed_account_id:
 *           type: integer
 *           description: ID da conta fixa
 *         user_id:
 *           type: integer
 *           description: ID do usuário
 *         due_date:
 *           type: string
 *           format: date
 *           description: Data de vencimento
 *         amount:
 *           type: number
 *           format: float
 *           description: Valor do lançamento
 *         status:
 *           type: string
 *           enum: [pending, paid, overdue, cancelled]
 *           description: Status do lançamento
 *         payment_date:
 *           type: string
 *           format: date
 *           description: Data do pagamento
 *         payment_method:
 *           type: string
 *           enum: [card, boleto, automatic_debit, pix, transfer]
 *           description: Método de pagamento
 *         observations:
 *           type: string
 *           description: Observações
 *         transaction_id:
 *           type: integer
 *           description: ID da transação financeira criada
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         fixedAccount:
 *           $ref: '#/components/schemas/FixedAccount'
 *         transaction:
 *           $ref: '#/components/schemas/Transaction'
 *     
 *     FixedAccountTransactionPayment:
 *       type: object
 *       required:
 *         - transaction_ids
 *         - payment_date
 *         - account_id
 *       properties:
 *         transaction_ids:
 *           type: array
 *           items:
 *             type: integer
 *           description: IDs dos lançamentos a serem pagos
 *         payment_date:
 *           type: string
 *           format: date
 *           description: Data do pagamento
 *         payment_method:
 *           type: string
 *           enum: [card, boleto, automatic_debit, pix, transfer]
 *           description: Método de pagamento
 *         observations:
 *           type: string
 *           description: Observações do pagamento
 *         account_id:
 *           type: integer
 *           description: ID da conta bancária
 */

/**
 * @swagger
 * /api/fixed-account-transactions:
 *   get:
 *     summary: Lista lançamentos de conta fixa
 *     tags: [Fixed Account Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, overdue, cancelled]
 *         description: Filtrar por status
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filtrar por categoria
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: integer
 *         description: Filtrar por fornecedor
 *       - in: query
 *         name: due_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de vencimento inicial
 *       - in: query
 *         name: due_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de vencimento final
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de lançamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FixedAccountTransaction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', auth, apiRateLimiter, FixedAccountTransactionController.listTransactions);

/**
 * @swagger
 * /api/fixed-account-transactions/pay:
 *   post:
 *     summary: Registra pagamento de lançamentos
 *     tags: [Fixed Account Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FixedAccountTransactionPayment'
 *     responses:
 *       200:
 *         description: Pagamento registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     paidTransactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FixedAccountTransaction'
 *                     createdTransactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     totalAmount:
 *                       type: number
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/pay', auth, apiRateLimiter, FixedAccountTransactionController.payTransactions);

/**
 * @swagger
 * /api/fixed-account-transactions/{id}:
 *   get:
 *     summary: Busca um lançamento específico
 *     tags: [Fixed Account Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do lançamento
 *     responses:
 *       200:
 *         description: Lançamento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/FixedAccountTransaction'
 *       404:
 *         description: Lançamento não encontrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', auth, apiRateLimiter, FixedAccountTransactionController.getTransaction);

/**
 * @swagger
 * /api/fixed-account-transactions/{id}:
 *   put:
 *     summary: Modifica um lançamento
 *     tags: [Fixed Account Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do lançamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_method:
 *                 type: string
 *                 enum: [card, boleto, automatic_debit, pix, transfer]
 *               observations:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lançamento atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/FixedAccountTransaction'
 *       400:
 *         description: Dados inválidos ou lançamento já pago
 *       404:
 *         description: Lançamento não encontrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', auth, apiRateLimiter, FixedAccountTransactionController.updateTransaction);

/**
 * @swagger
 * /api/fixed-account-transactions/{id}/cancel:
 *   post:
 *     summary: Cancela um lançamento
 *     tags: [Fixed Account Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do lançamento
 *     responses:
 *       200:
 *         description: Lançamento cancelado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/FixedAccountTransaction'
 *       400:
 *         description: Lançamento já pago ou cancelado
 *       404:
 *         description: Lançamento não encontrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/cancel', auth, apiRateLimiter, FixedAccountTransactionController.cancelTransaction);

module.exports = router; 