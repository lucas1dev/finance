/**
 * Controller para gerenciar permissões de usuários.
 * Permite visualizar e gerenciar permissões granulares.
 * 
 * @module controllers/permissionController
 */

const { logger } = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');
const { getAllPermissions, getUserPermissions, hasPermission } = require('../middlewares/permissionAuth');

/**
 * Obtém todas as permissões disponíveis no sistema.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Lista de todas as permissões.
 * @example
 * // GET /api/permissions
 * // Retorno: { permissions: {...}, totalPermissions: 45 }
 */
async function getAllSystemPermissions(req, res) {
  try {
    const permissions = getAllPermissions();
    const totalPermissions = Object.keys(permissions).length;
    
    // Agrupar permissões por recurso
    const groupedPermissions = {};
    Object.entries(permissions).forEach(([permission, roles]) => {
      const [resource, action] = permission.split(':');
      if (!groupedPermissions[resource]) {
        groupedPermissions[resource] = {};
      }
      groupedPermissions[resource][action] = roles;
    });
    
    logger.info('[PERMISSION] Todas as permissões do sistema obtidas com sucesso');
    
    return successResponse(res, 200, 'Permissões do sistema obtidas com sucesso', {
      permissions: groupedPermissions,
      totalPermissions,
      totalResources: Object.keys(groupedPermissions).length
    });
  } catch (error) {
    logger.error('[PERMISSION] Erro ao obter permissões do sistema:', error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Obtém as permissões de um usuário específico.
 * @param {Object} req - Objeto de requisição Express.
 * @param {number} req.params.userId - ID do usuário.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Permissões do usuário.
 * @example
 * // GET /api/permissions/users/123
 * // Retorno: { permissions: [...], role: "admin", totalPermissions: 45 }
 */
async function getUserSystemPermissions(req, res) {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário atual tem permissão para ver permissões de outros usuários
    const currentUser = req.user;
    if (currentUser.id !== parseInt(userId) && currentUser.role !== 'admin') {
      return errorResponse(res, 403, 'Acesso negado: não autorizado para ver permissões de outros usuários');
    }
    
    // Buscar usuário no banco (simulado)
    const User = require('../models/User');
    const user = await User.findByPk(userId);
    
    if (!user) {
      return errorResponse(res, 404, 'Usuário não encontrado');
    }
    
    const permissions = getUserPermissions(user);
    const totalPermissions = permissions.length;
    
    logger.info(`[PERMISSION] Permissões do usuário ${userId} obtidas com sucesso`);
    
    return successResponse(res, 200, 'Permissões do usuário obtidas com sucesso', {
      userId: parseInt(userId),
      role: user.role,
      permissions,
      totalPermissions
    });
  } catch (error) {
    logger.error(`[PERMISSION] Erro ao obter permissões do usuário ${req.params.userId}:`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Verifica se um usuário tem uma permissão específica.
 * @param {Object} req - Objeto de requisição Express.
 * @param {number} req.params.userId - ID do usuário.
 * @param {string} req.query.resource - Recurso a ser verificado.
 * @param {string} req.query.action - Ação a ser verificada.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado da verificação.
 * @example
 * // GET /api/permissions/users/123/check?resource=users&action=read
 * // Retorno: { hasPermission: true, resource: "users", action: "read" }
 */
async function checkUserPermission(req, res) {
  try {
    const { userId } = req.params;
    const { resource, action } = req.query;
    
    if (!resource || !action) {
      return errorResponse(res, 400, 'resource e action são obrigatórios');
    }
    
    // Verificar se o usuário atual tem permissão para verificar permissões de outros usuários
    const currentUser = req.user;
    if (currentUser.id !== parseInt(userId) && currentUser.role !== 'admin') {
      return errorResponse(res, 403, 'Acesso negado: não autorizado para verificar permissões de outros usuários');
    }
    
    // Buscar usuário no banco (simulado)
    const User = require('../models/User');
    const user = await User.findByPk(userId);
    
    if (!user) {
      return errorResponse(res, 404, 'Usuário não encontrado');
    }
    
    const userHasPermission = hasPermission(resource, action, user);
    
    logger.info(`[PERMISSION] Verificação de permissão ${resource}:${action} para usuário ${userId}: ${userHasPermission}`);
    
    return successResponse(res, 200, 'Verificação de permissão concluída', {
      userId: parseInt(userId),
      resource,
      action,
      hasPermission: userHasPermission,
      role: user.role
    });
  } catch (error) {
    logger.error(`[PERMISSION] Erro ao verificar permissão do usuário ${req.params.userId}:`, error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Obtém as permissões do usuário atual.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Permissões do usuário atual.
 * @example
 * // GET /api/permissions/me
 * // Retorno: { permissions: [...], role: "admin", totalPermissions: 45 }
 */
async function getMyPermissions(req, res) {
  try {
    const user = req.user;
    
    if (!user) {
      return errorResponse(res, 401, 'Usuário não autenticado');
    }
    
    const permissions = getUserPermissions(user);
    const totalPermissions = permissions.length;
    
    logger.info(`[PERMISSION] Permissões do usuário atual ${user.id} obtidas com sucesso`);
    
    return successResponse(res, 200, 'Suas permissões obtidas com sucesso', {
      userId: user.id,
      role: user.role,
      permissions,
      totalPermissions
    });
  } catch (error) {
    logger.error('[PERMISSION] Erro ao obter permissões do usuário atual:', error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Obtém estatísticas de permissões por role.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Estatísticas de permissões.
 * @example
 * // GET /api/permissions/stats
 * // Retorno: { stats: {...}, totalPermissions: 45, totalRoles: 2 }
 */
async function getPermissionStats(req, res) {
  try {
    const permissions = getAllPermissions();
    const totalPermissions = Object.keys(permissions).length;
    
    // Contar permissões por role
    const roleStats = {};
    Object.values(permissions).forEach(roles => {
      roles.forEach(role => {
        if (!roleStats[role]) {
          roleStats[role] = 0;
        }
        roleStats[role]++;
      });
    });
    
    // Contar recursos únicos
    const resources = new Set();
    Object.keys(permissions).forEach(permission => {
      const [resource] = permission.split(':');
      resources.add(resource);
    });
    
    // Contar ações únicas
    const actions = new Set();
    Object.keys(permissions).forEach(permission => {
      const [, action] = permission.split(':');
      actions.add(action);
    });
    
    logger.info('[PERMISSION] Estatísticas de permissões obtidas com sucesso');
    
    return successResponse(res, 200, 'Estatísticas de permissões obtidas com sucesso', {
      stats: {
        byRole: roleStats,
        totalResources: resources.size,
        totalActions: actions.size,
        resources: Array.from(resources),
        actions: Array.from(actions)
      },
      totalPermissions,
      totalRoles: Object.keys(roleStats).length
    });
  } catch (error) {
    logger.error('[PERMISSION] Erro ao obter estatísticas de permissões:', error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

/**
 * Verifica múltiplas permissões de uma vez.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Array} req.body.permissions - Array de permissões [resource, action].
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resultado das verificações.
 * @example
 * // POST /api/permissions/check-multiple
 * // Body: { "permissions": [["users", "read"], ["users", "write"]] }
 * // Retorno: { results: [{ resource: "users", action: "read", hasPermission: true }, ...] }
 */
async function checkMultiplePermissions(req, res) {
  try {
    const { permissions } = req.body;
    const user = req.user;
    
    if (!user) {
      return errorResponse(res, 401, 'Usuário não autenticado');
    }
    
    if (!permissions || !Array.isArray(permissions)) {
      return errorResponse(res, 400, 'permissions deve ser um array');
    }
    
    const results = permissions.map(([resource, action]) => ({
      resource,
      action,
      hasPermission: hasPermission(resource, action, user)
    }));
    
    const totalChecked = results.length;
    const totalGranted = results.filter(r => r.hasPermission).length;
    
    logger.info(`[PERMISSION] Verificação de ${totalChecked} permissões para usuário ${user.id}: ${totalGranted} concedidas`);
    
    return successResponse(res, 200, 'Verificação de múltiplas permissões concluída', {
      userId: user.id,
      role: user.role,
      results,
      summary: {
        totalChecked,
        totalGranted,
        totalDenied: totalChecked - totalGranted
      }
    });
  } catch (error) {
    logger.error('[PERMISSION] Erro ao verificar múltiplas permissões:', error);
    return errorResponse(res, 500, 'Erro interno do servidor');
  }
}

module.exports = {
  getAllSystemPermissions,
  getUserSystemPermissions,
  checkUserPermission,
  getMyPermissions,
  getPermissionStats,
  checkMultiplePermissions
}; 