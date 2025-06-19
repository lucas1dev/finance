const express = require('express');
const router = express.Router();
const { auth, requireTwoFactor } = require('../middlewares/auth');
const transactionController = require('../controllers/transactionController');

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas de transações
router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/categories', transactionController.getCategories);
router.get('/summary', transactionController.getSummary);
router.get('/balance', transactionController.getBalanceByPeriod);
router.get('/:id', transactionController.getTransaction);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router; 