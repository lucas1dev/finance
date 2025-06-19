const express = require('express');
const router = express.Router();
const ReceivableController = require('../controllers/receivableController');
const { auth } = require('../middlewares/auth');

// Todas as rotas requerem autenticação
router.use(auth);

// Listar todas as contas a receber
router.get('/', ReceivableController.index);

// Buscar contas a vencer (deve vir antes de /:id)
router.get('/upcoming-due', ReceivableController.getUpcomingDue);

// Buscar contas vencidas (deve vir antes de /:id)
router.get('/overdue', ReceivableController.getOverdue);

// Buscar uma conta a receber específica
router.get('/:id', ReceivableController.show);

// Criar uma nova conta a receber
router.post('/', ReceivableController.store);

// Atualizar uma conta a receber
router.patch('/:id', ReceivableController.update);

// Excluir uma conta a receber
router.delete('/:id', ReceivableController.destroy);

// Listar pagamentos de uma conta a receber
router.get('/:id/payments', ReceivableController.getPayments);

// Registrar um pagamento
router.post('/:id/payments', ReceivableController.addPayment);

module.exports = router; 