const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const dashboardController = require('../controllers/dashboardController');

/**
 * Rotas do Dashboard Principal
 * Fornece métricas consolidadas, dados para gráficos e alertas
 */

// Todas as rotas requerem autenticação
router.use(auth);

/**
 * @route GET /api/dashboard
 * @desc Obtém todos os dados do dashboard de uma vez (métricas, gráficos e alertas)
 * @access Private
 */
router.get('/', dashboardController.getDashboard);

/**
 * @route GET /api/dashboard/all
 * @desc Carrega todos os dados do dashboard em uma única requisição (otimizado para performance)
 * @access Private
 */
router.get('/all', dashboardController.getAllDashboardData);

/**
 * @route GET /api/dashboard/metrics
 * @desc Obtém métricas financeiras consolidadas para o dashboard
 * @access Private
 */
router.get('/metrics', dashboardController.getMetrics);

/**
 * @route GET /api/dashboard/charts
 * @desc Obtém dados para gráficos do dashboard
 * @access Private
 */
router.get('/charts', dashboardController.getCharts);

/**
 * @route GET /api/dashboard/alerts
 * @desc Obtém alertas e notificações para o dashboard
 * @access Private
 */
router.get('/alerts', dashboardController.getAlerts);

module.exports = router; 