const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/accountController');
const accountService = require('../services/accountService');
const { auth } = require('../middlewares/auth');

// Criar instância do controller com injeção de dependência
const accountController = new AccountController(accountService);

router.use(auth);

router.post('/', accountController.createAccount.bind(accountController));
router.get('/', accountController.getAccounts.bind(accountController));
router.get('/stats', accountController.getStats.bind(accountController));
router.get('/charts', accountController.getCharts.bind(accountController));
router.get('/:id', accountController.getAccount.bind(accountController));
router.put('/:id', accountController.updateAccount.bind(accountController));
router.delete('/:id', accountController.deleteAccount.bind(accountController));

module.exports = router; 