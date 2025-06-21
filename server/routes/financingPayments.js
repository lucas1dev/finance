/**
 * Rotas para gerenciamento de Pagamentos de Financiamentos (FinancingPayments)
 * Implementa endpoints CRUD e funcionalidades especiais com integração de transações
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const {
  createFinancingPayment,
  listFinancingPayments,
  getFinancingPayment,
  updateFinancingPayment,
  deleteFinancingPayment,
  payInstallment,
  registerEarlyPayment
} = require('../controllers/financingPaymentController');

/**
 * @swagger
 * /financing-payments:
 *   post:
 *     summary: Cria um novo pagamento de financiamento
 *     tags: [FinancingPayments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - financing_id
 *               - account_id
 *               - installment_number
 *               - payment_amount
 *               - principal_amount
 *               - interest_amount
 *               - payment_date
 *               - payment_method
 *             properties:
 *               financing_id:
 *                 type: integer
 *                 description: ID do financiamento
 *               account_id:
 *                 type: integer
 *                 description: ID da conta
 *               installment_number:
 *                 type: integer
 *                 minimum: 1
 *                 description: Número da parcela
 *               payment_amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Valor total do pagamento
 *               principal_amount:
 *                 type: number
 *                 minimum: 0
 *                 description: Valor da amortização
 *               interest_amount:
 *                 type: number
 *                 minimum: 0
 *                 description: Valor dos juros
 *               payment_date:
 *                 type: string
 *                 format: date
 *                 description: Data do pagamento
 *               payment_method:
 *                 type: string
 *                 enum: [boleto, debito_automatico, cartao, pix, transferencia]
 *                 description: Método de pagamento
 *               payment_type:
 *                 type: string
 *                 enum: [parcela, parcial, antecipado]
 *                 default: parcela
 *                 description: Tipo de pagamento
 *               observations:
 *                 type: string
 *                 description: Observações do pagamento
 *     responses:
 *       201:
 *         description: Pagamento registrado com sucesso
 *       400:
 *         description: Dados inválidos ou parcela já paga
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Financiamento ou conta não encontrado
 */
router.post('/', auth, createFinancingPayment);

/**
 * @swagger
 * /financing-payments:
 *   get:
 *     summary: Lista todos os pagamentos do usuário
 *     tags: [FinancingPayments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 10
 *         description: Limite de itens por página
 *       - in: query
 *         name: financing_id
 *         schema:
 *           type: integer
 *         description: Filtrar por financiamento
 *       - in: query
 *         name: account_id
 *         schema:
 *           type: integer
 *         description: Filtrar por conta
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [boleto, debito_automatico, cartao, pix, transferencia]
 *         description: Filtrar por método de pagamento
 *       - in: query
 *         name: payment_type
 *         schema:
 *           type: string
 *           enum: [parcela, parcial, antecipado]
 *         description: Filtrar por tipo de pagamento
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pago, pendente, atrasado]
 *         description: Filtrar por status
 *       - in: query
 *         name: payment_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de pagamento a partir de
 *       - in: query
 *         name: payment_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de pagamento até
 *     responses:
 *       200:
 *         description: Lista de pagamentos
 *       401:
 *         description: Não autorizado
 */
router.get('/', auth, listFinancingPayments);

/**
 * @swagger
 * /financing-payments/{id}:
 *   get:
 *     summary: Obtém um pagamento específico
 *     tags: [FinancingPayments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pagamento
 *     responses:
 *       200:
 *         description: Dados do pagamento
 *       404:
 *         description: Pagamento não encontrado
 *       401:
 *         description: Não autorizado
 */
router.get('/:id', auth, getFinancingPayment);

/**
 * @swagger
 * /financing-payments/{id}:
 *   put:
 *     summary: Atualiza um pagamento
 *     tags: [FinancingPayments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pagamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_date:
 *                 type: string
 *                 format: date
 *                 description: Data do pagamento
 *               payment_method:
 *                 type: string
 *                 enum: [boleto, debito_automatico, cartao, pix, transferencia]
 *                 description: Método de pagamento
 *               status:
 *                 type: string
 *                 enum: [pago, pendente, atrasado]
 *                 description: Status do pagamento
 *               observations:
 *                 type: string
 *                 description: Observações do pagamento
 *     responses:
 *       200:
 *         description: Pagamento atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Pagamento não encontrado
 *       401:
 *         description: Não autorizado
 */
router.put('/:id', auth, updateFinancingPayment);

/**
 * @swagger
 * /financing-payments/{id}:
 *   delete:
 *     summary: Remove um pagamento
 *     tags: [FinancingPayments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pagamento
 *     responses:
 *       200:
 *         description: Pagamento removido com sucesso
 *       404:
 *         description: Pagamento não encontrado
 *       400:
 *         description: Não é possível remover pagamento com transação vinculada
 *       401:
 *         description: Não autorizado
 */
router.delete('/:id', auth, deleteFinancingPayment);

/**
 * @swagger
 * /financings/{financingId}/installments/{installmentNumber}/pay:
 *   post:
 *     summary: Registra pagamento de uma parcela específica
 *     tags: [FinancingPayments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: financingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do financiamento
 *       - in: path
 *         name: installmentNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número da parcela
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_id
 *               - payment_amount
 *               - payment_date
 *               - payment_method
 *             properties:
 *               account_id:
 *                 type: integer
 *                 description: ID da conta
 *               payment_amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Valor do pagamento
 *               payment_date:
 *                 type: string
 *                 format: date
 *                 description: Data do pagamento
 *               payment_method:
 *                 type: string
 *                 enum: [boleto, debito_automatico, cartao, pix, transferencia]
 *                 description: Método de pagamento
 *               observations:
 *                 type: string
 *                 description: Observações do pagamento
 *     responses:
 *       201:
 *         description: Parcela paga com sucesso
 *       400:
 *         description: Dados inválidos ou valor insuficiente
 *       404:
 *         description: Financiamento não encontrado
 *       401:
 *         description: Não autorizado
 */
router.post('/financings/:financingId/installments/:installmentNumber/pay', auth, payInstallment);

/**
 * @swagger
 * /financings/{financingId}/early-payment:
 *   post:
 *     summary: Registra pagamento antecipado
 *     tags: [FinancingPayments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: financingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do financiamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_id
 *               - payment_amount
 *               - payment_date
 *               - payment_method
 *             properties:
 *               account_id:
 *                 type: integer
 *                 description: ID da conta
 *               payment_amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Valor do pagamento antecipado
 *               payment_date:
 *                 type: string
 *                 format: date
 *                 description: Data do pagamento
 *               payment_method:
 *                 type: string
 *                 enum: [boleto, debito_automatico, cartao, pix, transferencia]
 *                 description: Método de pagamento
 *               observations:
 *                 type: string
 *                 description: Observações do pagamento
 *     responses:
 *       201:
 *         description: Pagamento antecipado registrado com sucesso
 *       400:
 *         description: Dados inválidos ou valor inválido
 *       404:
 *         description: Financiamento não encontrado
 *       401:
 *         description: Não autorizado
 */
router.post('/financings/:financingId/early-payment', auth, registerEarlyPayment);

module.exports = router; 