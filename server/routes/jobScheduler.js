/**
 * Rotas para gerenciar configurações dinâmicas dos jobs cron.
 * 
 * @module routes/jobScheduler
 */

const express = require('express');
const router = express.Router();
const jobSchedulerController = require('../controllers/jobSchedulerController');
const { adminAuth } = require('../middlewares/adminAuth');
const { requirePermission } = require('../middlewares/permissionAuth');

/**
 * @route GET /api/job-scheduler/configs
 * @desc Obtém todas as configurações de jobs cron
 * @access Admin com permissão jobs:configure
 */
router.get('/configs', adminAuth, requirePermission('jobs', 'configure'), jobSchedulerController.getAllJobConfigs);

/**
 * @route GET /api/job-scheduler/configs/:jobName
 * @desc Obtém a configuração de um job específico
 * @access Admin com permissão jobs:configure
 */
router.get('/configs/:jobName', adminAuth, requirePermission('jobs', 'configure'), jobSchedulerController.getJobConfig);

/**
 * @route PUT /api/job-scheduler/configs/:jobName
 * @desc Atualiza a configuração de um job
 * @access Admin com permissão jobs:configure
 */
router.put('/configs/:jobName', adminAuth, requirePermission('jobs', 'configure'), jobSchedulerController.updateJobConfig);

/**
 * @route GET /api/job-scheduler/status
 * @desc Obtém o status atual de todos os jobs
 * @access Admin com permissão jobs:read
 */
router.get('/status', adminAuth, requirePermission('jobs', 'read'), jobSchedulerController.getJobsStatus);

/**
 * @route GET /api/job-scheduler/status/:jobName
 * @desc Obtém o status de um job específico
 * @access Admin com permissão jobs:read
 */
router.get('/status/:jobName', adminAuth, requirePermission('jobs', 'read'), jobSchedulerController.getJobStatus);

/**
 * @route POST /api/job-scheduler/jobs/:jobName/stop
 * @desc Para um job específico
 * @access Admin
 */
router.post('/jobs/:jobName/stop', adminAuth, jobSchedulerController.stopJob);

/**
 * @route POST /api/job-scheduler/jobs/stop-all
 * @desc Para todos os jobs ativos
 * @access Admin
 */
router.post('/jobs/stop-all', adminAuth, jobSchedulerController.stopAllJobs);

/**
 * @route POST /api/job-scheduler/configs/:jobName/enable
 * @desc Habilita um job
 * @access Admin com permissão jobs:configure
 */
router.post('/configs/:jobName/enable', adminAuth, requirePermission('jobs', 'configure'), jobSchedulerController.enableJob);

/**
 * @route POST /api/job-scheduler/configs/:jobName/disable
 * @desc Desabilita um job
 * @access Admin com permissão jobs:configure
 */
router.post('/configs/:jobName/disable', adminAuth, requirePermission('jobs', 'configure'), jobSchedulerController.disableJob);

/**
 * @route POST /api/job-scheduler/validate-cron
 * @desc Valida uma expressão cron
 * @access Admin com permissão jobs:configure
 */
router.post('/validate-cron', adminAuth, requirePermission('jobs', 'configure'), jobSchedulerController.validateCronExpression);

/**
 * @route GET /api/job-scheduler/examples
 * @desc Obtém exemplos de expressões cron
 * @access Admin com permissão jobs:configure
 */
router.get('/examples', adminAuth, requirePermission('jobs', 'configure'), jobSchedulerController.getCronExamples);

module.exports = router; 