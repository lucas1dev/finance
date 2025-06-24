const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { auth } = require('../middlewares/auth');

router.use(auth);

router.post('/', accountController.createAccount);
router.get('/', accountController.getAccounts);
router.get('/stats', accountController.getStats);
router.get('/charts', accountController.getCharts);
router.get('/:id', accountController.getAccount);
router.put('/:id', accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

module.exports = router; 