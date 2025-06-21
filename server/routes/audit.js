/**
 * Rotas para consulta de logs de auditoria.
 * Permite visualizar histórico de ações administrativas.
 * 
 * @module routes/audit
 */

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { auth } = require('../middlewares/auth');
const { adminAuth } = require('../middlewares/adminAuth');

/**
 * @route GET /api/audit/logs
 * @desc Obtém logs de auditoria
 * @access Admin
 */
router.get('/logs', auth, adminAuth, auditController.getAuditLogs);

/**
 * @route GET /api/audit/logs/:id
 * @desc Obtém um log de auditoria específico
 * @access Admin
 */
router.get('/logs/:id', auth, adminAuth, auditController.getAuditLogDetails);

/**
 * @route GET /api/audit/stats
 * @desc Obtém estatísticas de auditoria
 * @access Admin
 */
router.get('/stats', auth, adminAuth, auditController.getAuditStats);

/**
 * @route GET /audit/users/:userId/logs
 * @desc Obtém logs de auditoria de um usuário específico
 * @access Private (Admin)
 */
router.get('/users/:userId/logs', auth, adminAuth, auditController.getUserAuditLogs);

module.exports = router; 