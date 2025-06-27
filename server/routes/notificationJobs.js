/**
 * Rotas para gerenciar jobs de notificação.
 * Permite executar jobs manualmente e obter status dos jobs.
 * 
 * @module routes/notificationJobs
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { adminAuth } = require('../middlewares/adminAuth');
const notificationJobController = require('../controllers/notificationJobController');
const { auditJobAction } = require('../middlewares/auditMiddleware');

/**
 * @route POST /notifications/jobs/payment-check
 * @desc Executa apenas o job de verificação de pagamentos
 * @access Private
 */
router.post('/payment-check', auth, notificationJobController.runPaymentCheckJob);

/**
 * @route POST /notifications/jobs/general-reminders
 * @desc Executa apenas o job de lembretes gerais
 * @access Private
 */
router.post('/general-reminders', auth, notificationJobController.runGeneralRemindersJob);

/**
 * @route POST /notifications/jobs/cleanup
 * @desc Executa a limpeza de notificações antigas (apenas administradores)
 * @access Private (Admin)
 */
router.post('/cleanup', auth, adminAuth, notificationJobController.runCleanupJob);

/**
 * @route GET /notifications/jobs/history
 * @desc Obtém o histórico de execução dos jobs de notificação
 * @access Private (Admin)
 */
router.get('/history', auth, adminAuth, notificationJobController.getJobHistory);

/**
 * @route GET /notifications/jobs/stats
 * @desc Obtém estatísticas detalhadas dos jobs de notificação
 * @access Private (Admin)
 */
router.get('/stats', auth, adminAuth, notificationJobController.getJobStats);

/**
 * @route GET /notifications/jobs/stats/detailed
 * @desc Obtém estatísticas detalhadas por período
 * @access Private (Admin)
 */
router.get('/stats/detailed', auth, adminAuth, notificationJobController.getDetailedStats);

/**
 * @route GET /notifications/jobs/last-executions
 * @desc Obtém as últimas execuções dos jobs
 * @access Private (Admin)
 */
router.get('/last-executions', auth, adminAuth, notificationJobController.getLastExecutions);

/**
 * @route POST /notifications/jobs/run-payment-check
 * @desc Executa manualmente o job de verificação de pagamentos
 * @access Private (Admin)
 */
router.post('/run-payment-check', auth, adminAuth, auditJobAction('job_execution', 'payment_check'), notificationJobController.runPaymentCheckJob);

/**
 * @route POST /notifications/jobs/run-general-reminders
 * @desc Executa manualmente o job de lembretes gerais
 * @access Private (Admin)
 */
router.post('/run-general-reminders', auth, adminAuth, auditJobAction('job_execution', 'general_reminders'), notificationJobController.runGeneralRemindersJob);

/**
 * @route POST /notifications/jobs/run-cleanup
 * @desc Executa manualmente o job de limpeza de notificações
 * @access Private (Admin)
 */
router.post('/run-cleanup', auth, adminAuth, auditJobAction('job_execution', 'cleanup'), notificationJobController.runCleanupJob);

/**
 * @route POST /notifications/jobs/run-all
 * @desc Executa todos os jobs de notificação
 * @access Private (Admin)
 */
router.post('/run-all', auth, adminAuth, auditJobAction('job_execution', 'all_jobs'), notificationJobController.runAllJobs);

/**
 * @route POST /notifications/jobs/test-email
 * @desc Testa o envio de email de alerta
 * @access Private (Admin)
 */
router.post('/test-email', auth, adminAuth, auditJobAction('job_execution', 'test_email'), notificationJobController.testEmailAlert);

/**
 * @route GET /notifications/jobs/execution/:executionId
 * @desc Obtém detalhes de uma execução específica de job
 * @access Private (Admin)
 */
router.get('/execution/:executionId', auth, adminAuth, auditJobAction('job_execution', 'view_details'), notificationJobController.getJobExecutionDetails);

module.exports = router; 