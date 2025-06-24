const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const categoryController = require('../controllers/categoryController');

router.use(auth);

router.get('/', categoryController.getCategories);
router.get('/stats', categoryController.getStats);
router.get('/charts', categoryController.getCharts);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router; 