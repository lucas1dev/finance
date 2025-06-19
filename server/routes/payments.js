const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { auth } = require('../middlewares/auth');

// Todas as rotas requerem autenticação
router.use(auth);

// Criar um novo pagamento para conta a receber
router.post('/receivables/:receivable_id/payments', PaymentController.create);

// Listar pagamentos de uma conta a receber
router.get('/receivables/:receivable_id/payments', PaymentController.listByReceivable);

// Criar um novo pagamento para conta a pagar
router.post('/payables/:payable_id/payments', PaymentController.create);

// Listar pagamentos de uma conta a pagar
router.get('/payables/:payable_id/payments', PaymentController.listByPayable);

// Excluir um pagamento
router.delete('/payments/:id', PaymentController.delete);

module.exports = router; 