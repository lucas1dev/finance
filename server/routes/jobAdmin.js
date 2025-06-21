/**
 * Rotas para painel administrativo de jobs.
 * 
 * @module routes/jobAdmin
 */

const express = require('express');
const router = express.Router();
const jobAdminController = require('../controllers/jobAdminController');
const { adminAuth } = require('../middlewares/adminAuth');
const { requirePermission } = require('../middlewares/permissionAuth');

/**
 * @route GET /api/job-admin/dashboard
 * @desc Obtém o painel administrativo completo de jobs
 * @access Admin com permissão jobs:read
 */
router.get('/dashboard', adminAuth, requirePermission('jobs', 'read'), jobAdminController.getAdminDashboard);

/**
 * @route POST /api/job-admin/jobs/:jobName/pause
 * @desc Pausa um job específico
 * @access Admin com permissão jobs:write
 */
router.post('/jobs/:jobName/pause', adminAuth, requirePermission('jobs', 'write'), jobAdminController.pauseJob);

/**
 * @route POST /api/job-admin/jobs/:jobName/resume
 * @desc Retoma um job pausado
 * @access Admin com permissão jobs:write
 */
router.post('/jobs/:jobName/resume', adminAuth, requirePermission('jobs', 'write'), jobAdminController.resumeJob);

/**
 * @route POST /api/job-admin/jobs/:jobName/execute
 * @desc Executa um job manualmente
 * @access Admin com permissão jobs:execute
 */
router.post('/jobs/:jobName/execute', adminAuth, requirePermission('jobs', 'execute'), jobAdminController.executeJobManually);

/**
 * @route GET /api/job-admin/executions/:executionId
 * @desc Obtém detalhes de uma execução específica
 * @access Admin com permissão jobs:read
 */
router.get('/executions/:executionId', adminAuth, requirePermission('jobs', 'read'), jobAdminController.getExecutionDetails);

/**
 * @route POST /api/job-admin/users/:userId/reprocess
 * @desc Reprocessa notificações de um usuário específico
 * @access Admin com permissão jobs:execute
 */
router.post('/users/:userId/reprocess', adminAuth, requirePermission('jobs', 'execute'), jobAdminController.reprocessUserNotifications);

/**
 * @route GET /api/job-admin/jobs/:jobName/stats
 * @desc Obtém estatísticas detalhadas de um job específico
 * @access Admin com permissão jobs:read
 */
router.get('/jobs/:jobName/stats', adminAuth, requirePermission('jobs', 'read'), jobAdminController.getJobDetailedStats);

module.exports = router; 