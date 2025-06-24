const express = require('express');
const fixedAccountJobController = require('../controllers/fixedAccountJobController');

// Permite injetar middlewares para facilitar testes
function createFixedAccountJobsRouter({ auth, adminAuth, requirePermission }) {
  const router = express.Router();

  /**
   * Wrapper para capturar erros assíncronos dos controllers
   * @param {Function} fn - Função do controller
   * @returns {Function} Função wrapped para Express
   */
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Aplica middleware de autenticação em todas as rotas
  router.use(auth || ((req, res, next) => next()));
  router.use(adminAuth || ((req, res, next) => next()));

  /**
   * @route POST /fixed-account-jobs/process
   * @desc Executa o processamento de contas fixas vencidas manualmente
   * @access Admin
   * @body {number} [userId] - ID do usuário específico (opcional)
   * @returns {Object} Resultado da execução do job
   */
  router.post('/process', 
    (requirePermission ? requirePermission('fixed-account-jobs', 'execute') : (req, res, next) => next()),
    asyncHandler(fixedAccountJobController.processOverdueAccounts)
  );

  /**
   * @route POST /fixed-account-jobs/notifications
   * @desc Cria notificações para contas fixas manualmente
   * @access Admin
   * @body {number} [userId] - ID do usuário específico (opcional)
   * @returns {Object} Resultado da execução do job
   */
  router.post('/notifications', 
    (requirePermission ? requirePermission('fixed-account-jobs', 'execute') : (req, res, next) => next()),
    asyncHandler(fixedAccountJobController.createNotifications)
  );

  /**
   * @route POST /fixed-account-jobs/run-all
   * @desc Executa todos os jobs de contas fixas manualmente
   * @access Admin
   * @body {number} [userId] - ID do usuário específico (opcional)
   * @returns {Object} Resultado da execução dos jobs
   */
  router.post('/run-all', 
    (requirePermission ? requirePermission('fixed-account-jobs', 'execute') : (req, res, next) => next()),
    asyncHandler(fixedAccountJobController.runAllJobs)
  );

  /**
   * @route GET /fixed-account-jobs/history
   * @desc Obtém o histórico de execuções dos jobs de contas fixas
   * @access Admin
   * @query {string} [jobName] - Nome do job para filtrar
   * @query {string} [status] - Status para filtrar (success, failed, running)
   * @query {string} [startDate] - Data de início (YYYY-MM-DD)
   * @query {string} [endDate] - Data de fim (YYYY-MM-DD)
   * @query {number} [page] - Página para paginação
   * @query {number} [limit] - Limite de itens por página
   * @returns {Object} Histórico de execuções
   */
  router.get('/history', 
    (requirePermission ? requirePermission('fixed-account-jobs', 'read') : (req, res, next) => next()),
    asyncHandler(fixedAccountJobController.getJobHistory)
  );

  /**
   * @route GET /fixed-account-jobs/stats
   * @desc Obtém estatísticas dos jobs de contas fixas
   * @access Admin
   * @query {string} [period] - Período para estatísticas (day, week, month)
   * @returns {Object} Estatísticas dos jobs
   */
  router.get('/stats', 
    (requirePermission ? requirePermission('fixed-account-jobs', 'read') : (req, res, next) => next()),
    asyncHandler(fixedAccountJobController.getJobStats)
  );

  /**
   * @route GET /fixed-account-jobs/config
   * @desc Obtém informações sobre a configuração dos jobs de contas fixas
   * @access Admin
   * @returns {Object} Configuração dos jobs
   */
  router.get('/config', 
    (requirePermission ? requirePermission('fixed-account-jobs', 'read') : (req, res, next) => next()),
    asyncHandler(fixedAccountJobController.getJobConfig)
  );

  return router;
}

// Exporta o router padrão para uso na aplicação
const { auth, adminAuth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionAuth');
module.exports = createFixedAccountJobsRouter({ auth, adminAuth, requirePermission });
// Exporta a função para testes
module.exports.createFixedAccountJobsRouter = createFixedAccountJobsRouter; 