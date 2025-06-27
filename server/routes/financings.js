/**
 * Rotas para gerenciamento de Financiamentos (Financings)
 * Implementa endpoints CRUD, cálculos e simulações com autenticação
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const financingController = require('../controllers/financingController');

/**
 * @swagger
 * /financings:
 *   post:
 *     summary: Cria um novo financiamento
 *     tags: [Financings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - creditor_id
 *               - financing_type
 *               - total_amount
 *               - interest_rate
 *               - term_months
 *               - start_date
 *               - amortization_method
 *             properties:
 *               creditor_id:
 *                 type: integer
 *                 description: ID do credor
 *               financing_type:
 *                 type: string
 *                 enum: [hipoteca, emprestimo_pessoal, veiculo, outros]
 *                 description: Tipo de financiamento
 *               total_amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Valor total financiado
 *               interest_rate:
 *                 type: number
 *                 minimum: 0
 *                 description: Taxa de juros anual (decimal)
 *               term_months:
 *                 type: integer
 *                 minimum: 1
 *                 description: Prazo em meses
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Data de início do financiamento
 *               description:
 *                 type: string
 *                 description: Descrição do financiamento
 *               contract_number:
 *                 type: string
 *                 description: Número do contrato
 *               payment_method:
 *                 type: string
 *                 enum: [boleto, debito_automatico, cartao, pix]
 *                 description: Método de pagamento
 *               observations:
 *                 type: string
 *                 description: Observações adicionais
 *               amortization_method:
 *                 type: string
 *                 enum: [SAC, Price]
 *                 description: Método de amortização
 *     responses:
 *       201:
 *         description: Financiamento criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Credor não encontrado
 */
router.post('/', auth, financingController.create.bind(financingController));

/**
 * @swagger
 * /financings:
 *   get:
 *     summary: Lista todos os financiamentos do usuário
 *     tags: [Financings]
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
 *         name: financing_type
 *         schema:
 *           type: string
 *           enum: [hipoteca, emprestimo_pessoal, veiculo, outros]
 *         description: Filtrar por tipo de financiamento
 *       - in: query
 *         name: creditor_id
 *         schema:
 *           type: integer
 *         description: Filtrar por credor
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativo, quitado, inadimplente]
 *         description: Filtrar por status
 *       - in: query
 *         name: amortization_method
 *         schema:
 *           type: string
 *           enum: [SAC, Price]
 *         description: Filtrar por método de amortização
 *       - in: query
 *         name: start_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início a partir de
 *       - in: query
 *         name: start_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início até
 *     responses:
 *       200:
 *         description: Lista de financiamentos
 *       401:
 *         description: Não autorizado
 */
router.get('/', auth, financingController.list.bind(financingController));

/**
 * @swagger
 * /financings/{id}:
 *   get:
 *     summary: Obtém um financiamento específico
 *     tags: [Financings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do financiamento
 *     responses:
 *       200:
 *         description: Dados do financiamento
 *       404:
 *         description: Financiamento não encontrado
 *       401:
 *         description: Não autorizado
 */
router.get('/:id', auth, financingController.getById.bind(financingController));

/**
 * @swagger
 * /financings/{id}:
 *   put:
 *     summary: Atualiza um financiamento
 *     tags: [Financings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               description:
 *                 type: string
 *                 description: Descrição do financiamento
 *               contract_number:
 *                 type: string
 *                 description: Número do contrato
 *               payment_method:
 *                 type: string
 *                 enum: [boleto, debito_automatico, cartao, pix]
 *                 description: Método de pagamento
 *               observations:
 *                 type: string
 *                 description: Observações adicionais
 *               status:
 *                 type: string
 *                 enum: [ativo, quitado, inadimplente]
 *                 description: Status do financiamento
 *               total_amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Valor total financiado
 *               interest_rate:
 *                 type: number
 *                 minimum: 0
 *                 description: Taxa de juros anual
 *               term_months:
 *                 type: integer
 *                 minimum: 1
 *                 description: Prazo em meses
 *               amortization_method:
 *                 type: string
 *                 enum: [SAC, Price]
 *                 description: Método de amortização
 *     responses:
 *       200:
 *         description: Financiamento atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Financiamento não encontrado
 *       401:
 *         description: Não autorizado
 */
router.put('/:id', auth, financingController.update.bind(financingController));

/**
 * @swagger
 * /financings/{id}:
 *   delete:
 *     summary: Remove um financiamento
 *     tags: [Financings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do financiamento
 *     responses:
 *       200:
 *         description: Financiamento removido com sucesso
 *       404:
 *         description: Financiamento não encontrado
 *       400:
 *         description: Não é possível remover financiamento com pagamentos
 *       401:
 *         description: Não autorizado
 */
router.delete('/:id', auth, financingController.delete.bind(financingController));

/**
 * @swagger
 * /financings/{id}/amortization:
 *   get:
 *     summary: Obtém a tabela de amortização de um financiamento
 *     tags: [Financings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do financiamento
 *     responses:
 *       200:
 *         description: Tabela de amortização
 *       404:
 *         description: Financiamento não encontrado
 *       401:
 *         description: Não autorizado
 */
router.get('/:id/amortization', auth, financingController.getAmortizationTable.bind(financingController));

/**
 * @swagger
 * /financings/{id}/simulate-early-payment:
 *   post:
 *     summary: Simula o pagamento antecipado de um financiamento
 *     tags: [Financings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - early_payment_amount
 *               - payment_date
 *             properties:
 *               early_payment_amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Valor do pagamento antecipado
 *               payment_date:
 *                 type: string
 *                 format: date
 *                 description: Data do pagamento antecipado
 *     responses:
 *       200:
 *         description: Simulação realizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Financiamento não encontrado
 *       401:
 *         description: Não autorizado
 */
router.post('/:id/simulate-early-payment', auth, financingController.simulateEarlyPayment.bind(financingController));

/**
 * @swagger
 * /financings/statistics:
 *   get:
 *     summary: Obtém estatísticas dos financiamentos
 *     tags: [Financings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas dos financiamentos
 *       401:
 *         description: Não autorizado
 */
router.get('/statistics', auth, financingController.getStatistics.bind(financingController));

module.exports = router; 