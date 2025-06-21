/**
 * Rotas para gerenciar permissões de usuários.
 * 
 * @module routes/permissions
 */

const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { auth } = require('../middlewares/auth');
const { adminAuth } = require('../middlewares/adminAuth');

/**
 * @route GET /api/permissions
 * @desc Obtém todas as permissões disponíveis no sistema
 * @access Admin
 */
router.get('/', adminAuth, permissionController.getAllSystemPermissions);

/**
 * @route GET /api/permissions/me
 * @desc Obtém as permissões do usuário atual
 * @access Authenticated
 */
router.get('/me', auth, permissionController.getMyPermissions);

/**
 * @route GET /api/permissions/stats
 * @desc Obtém estatísticas de permissões por role
 * @access Admin
 */
router.get('/stats', adminAuth, permissionController.getPermissionStats);

/**
 * @route GET /api/permissions/users/:userId
 * @desc Obtém as permissões de um usuário específico
 * @access Admin ou próprio usuário
 */
router.get('/users/:userId', auth, permissionController.getUserSystemPermissions);

/**
 * @route GET /api/permissions/users/:userId/check
 * @desc Verifica se um usuário tem uma permissão específica
 * @access Admin ou próprio usuário
 */
router.get('/users/:userId/check', auth, permissionController.checkUserPermission);

/**
 * @route POST /api/permissions/check-multiple
 * @desc Verifica múltiplas permissões de uma vez
 * @access Authenticated
 */
router.post('/check-multiple', auth, permissionController.checkMultiplePermissions);

module.exports = router; 