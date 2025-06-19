const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { auth } = require('../middlewares/auth');

// Aplica o middleware de autenticação em todas as rotas
router.use(auth);

// Lista todos os fornecedores
router.get('/', supplierController.index);

// Busca um fornecedor específico
router.get('/:id', supplierController.show);

// Cria um novo fornecedor
router.post('/', supplierController.create);

// Atualiza um fornecedor
router.put('/:id', supplierController.update);

// Remove um fornecedor
router.delete('/:id', supplierController.delete);

module.exports = router; 