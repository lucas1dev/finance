const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customerController');
const { auth } = require('../middlewares/auth');

// Todas as rotas requerem autenticação
router.use(auth);

// Listar todos os clientes
router.get('/', CustomerController.index);

// Buscar um cliente específico
router.get('/:id', CustomerController.show);

// Criar um novo cliente
router.post('/', CustomerController.create);

// Atualizar um cliente
router.put('/:id', CustomerController.update);

// Excluir um cliente
router.delete('/:id', CustomerController.delete);

// Buscar contas a receber de um cliente
router.get('/:id/receivables', CustomerController.getCustomerReceivables);

module.exports = router; 