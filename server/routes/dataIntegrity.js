/**
 * Rotas para validação de integridade dos dados do sistema.
 * Permite executar verificações, obter relatórios e estatísticas.
 *
 * @module routes/dataIntegrity
 */

const express = require('express');
const router = express.Router();
const dataIntegrityController = require('../controllers/dataIntegrityController');
const { auth } = require('../middlewares/auth');
const { adminAuth } = require('../middlewares/adminAuth');
const { requirePermission } = require('../middlewares/permissionAuth');

/**
 * @route POST /api/data-integrity/check
 * @desc Executa verificação completa de integridade
 * @access Admin
 */
router.post('/check',
  auth,
  adminAuth,
  requirePermission('data-integrity', 'execute'),
  dataIntegrityController.runIntegrityCheck
);

/**
 * @route GET /api/data-integrity/stats
 * @desc Obtém estatísticas de integridade
 * @access Admin
 */
router.get('/stats',
  auth,
  adminAuth,
  requirePermission('data-integrity', 'read'),
  dataIntegrityController.getIntegrityStats
);

/**
 * @route POST /api/data-integrity/check/orphaned-notifications
 * @desc Verifica notificações órfãs
 * @access Admin
 */
router.post('/check/orphaned-notifications',
  auth,
  adminAuth,
  requirePermission('data-integrity', 'execute'),
  dataIntegrityController.checkOrphanedNotifications
);

/**
 * @route POST /api/data-integrity/check/duplicate-notifications
 * @desc Verifica notificações duplicadas
 * @access Admin
 */
router.post('/check/duplicate-notifications',
  auth,
  adminAuth,
  requirePermission('data-integrity', 'execute'),
  dataIntegrityController.checkDuplicateNotifications
);

/**
 * @route POST /api/data-integrity/check/orphaned-transactions
 * @desc Verifica transações órfãs
 * @access Admin
 */
router.post('/check/orphaned-transactions',
  auth,
  adminAuth,
  requirePermission('data-integrity', 'execute'),
  dataIntegrityController.checkOrphanedTransactions
);

/**
 * @route GET /api/data-integrity/history
 * @desc Obtém histórico de verificações (simulado)
 * @access Admin
 */
router.get('/history',
  auth,
  adminAuth,
  requirePermission('data-integrity', 'read'),
  dataIntegrityController.getIntegrityHistory
);

/**
 * @route GET /api/data-integrity/config
 * @desc Obtém configurações de integridade
 * @access Admin
 */
router.get('/config',
  auth,
  adminAuth,
  requirePermission('data-integrity', 'read'),
  dataIntegrityController.getIntegrityConfig
);

module.exports = router; 