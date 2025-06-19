const express = require('express');
const router = express.Router();
const payableController = require('../controllers/payableController');
const { auth } = require('../middlewares/auth');

// Aplica o middleware de autenticação em todas as rotas
router.use(auth);

// Lista todas as contas a pagar
router.get('/', payableController.index);

// Busca contas a vencer nos próximos dias (deve vir antes de /:id)
router.get('/upcoming-due', payableController.getUpcomingDue);

// Busca contas vencidas (deve vir antes de /:id)
router.get('/overdue', payableController.getOverdue);

// Busca uma conta a pagar específica
router.get('/:id', payableController.show);

// Cria uma nova conta a pagar
router.post('/', payableController.create);

// Atualiza uma conta a pagar
router.patch('/:id', payableController.update);

// Remove uma conta a pagar
router.delete('/:id', payableController.delete);

// Lista pagamentos de uma conta a pagar
router.get('/:id/payments', payableController.getPayments);

// Adiciona um pagamento a uma conta a pagar
router.post('/:id/payments', payableController.addPayment);

module.exports = router; 