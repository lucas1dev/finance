const express = require('express');
const router = express.Router();
const { auth, requireTwoFactor } = require('../middlewares/auth');
const TransactionController = require('../controllers/transactionController');
const transactionService = require('../services/transactionService');

// Instanciar o controller com injeção de dependência
const transactionController = new TransactionController(transactionService);

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas de transações
router.post('/', transactionController.createTransaction.bind(transactionController));
router.get('/', transactionController.getTransactions.bind(transactionController));
router.get('/stats', transactionController.getStats.bind(transactionController));
router.get('/charts', transactionController.getCharts.bind(transactionController));
router.get('/:id', transactionController.getTransaction.bind(transactionController));
router.put('/:id', transactionController.updateTransaction.bind(transactionController));
router.delete('/:id', transactionController.deleteTransaction.bind(transactionController));

module.exports = router; 