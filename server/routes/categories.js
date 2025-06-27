const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const categoryService = require('../services/categoryService');
const { auth } = require('../middlewares/auth');

// Criar instância do controller com injeção de dependência
const categoryController = new CategoryController(categoryService);

router.use(auth);

router.get('/', categoryController.getCategories.bind(categoryController));
router.get('/stats', categoryController.getStats.bind(categoryController));
router.get('/charts', categoryController.getCharts.bind(categoryController));
router.post('/', categoryController.createCategory.bind(categoryController));
router.put('/:id', categoryController.updateCategory.bind(categoryController));
router.delete('/:id', categoryController.deleteCategory.bind(categoryController));
router.get('/:id', categoryController.getCategoryById.bind(categoryController));

module.exports = router; 