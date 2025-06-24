/**
 * Middleware para permissões avançadas por recurso.
 * Permite restringir endpoints específicos baseado em permissões granulares.
 * 
 * @module middlewares/permissionAuth
 */

const { logger } = require('../utils/logger');
const { errorResponse } = require('../utils/response');

/**
 * Mapeamento de recursos para permissões necessárias.
 */
const RESOURCE_PERMISSIONS = {
  // Jobs e Configurações
  'jobs:read': ['admin'],
  'jobs:write': ['admin'],
  'jobs:execute': ['admin'],
  'jobs:configure': ['admin'],
  
  // Jobs de Contas Fixas
  'fixed-account-jobs:read': ['admin'],
  'fixed-account-jobs:execute': ['admin'],
  'fixed-account-jobs:configure': ['admin'],
  
  // Integridade de Dados
  'data-integrity:read': ['admin'],
  'data-integrity:write': ['admin'],
  'data-integrity:execute': ['admin'],
  
  // Auditoria
  'audit:read': ['admin'],
  'audit:export': ['admin'],
  
  // Usuários
  'users:read': ['admin'],
  'users:write': ['admin'],
  'users:delete': ['admin'],
  
  // Configurações do Sistema
  'system:configure': ['admin'],
  'system:maintenance': ['admin'],
  
  // Relatórios
  'reports:generate': ['admin'],
  'reports:export': ['admin'],
  
  // Notificações
  'notifications:read': ['admin', 'user'],
  'notifications:write': ['admin'],
  'notifications:delete': ['admin'],
  
  // Transações
  'transactions:read': ['admin', 'user'],
  'transactions:write': ['admin', 'user'],
  'transactions:delete': ['admin'],
  
  // Contas
  'accounts:read': ['admin', 'user'],
  'accounts:write': ['admin', 'user'],
  'accounts:delete': ['admin'],
  
  // Categorias
  'categories:read': ['admin', 'user'],
  'categories:write': ['admin', 'user'],
  'categories:delete': ['admin'],
  
  // Financiamentos
  'financings:read': ['admin', 'user'],
  'financings:write': ['admin', 'user'],
  'financings:delete': ['admin'],
  
  // Investimentos
  'investments:read': ['admin', 'user'],
  'investments:write': ['admin', 'user'],
  'investments:delete': ['admin']
};

/**
 * Verifica se um usuário tem permissão para um recurso específico.
 * @param {string} resource - Recurso a ser verificado.
 * @param {string} action - Ação a ser executada (read, write, delete, execute).
 * @param {Object} user - Usuário autenticado.
 * @returns {boolean} True se o usuário tem permissão.
 */
function hasPermission(resource, action, user) {
  if (!user || !user.role) {
    return false;
  }
  
  const permissionKey = `${resource}:${action}`;
  const allowedRoles = RESOURCE_PERMISSIONS[permissionKey];
  
  if (!allowedRoles) {
    logger.warn(`[PERMISSION] Permissão não definida: ${permissionKey}`);
    return false;
  }
  
  return allowedRoles.includes(user.role);
}

/**
 * Middleware para verificar permissões específicas.
 * @param {string} resource - Recurso a ser verificado.
 * @param {string} action - Ação a ser executada.
 * @returns {Function} Middleware Express.
 * @example
 * // app.get('/api/users', requirePermission('users', 'read'), userController.getUsers);
 */
function requirePermission(resource, action) {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        logger.warn(`[PERMISSION] Usuário não autenticado tentando acessar ${resource}:${action}`);
        return errorResponse(res, 401, 'Usuário não autenticado');
      }
      
      if (!hasPermission(resource, action, user)) {
        logger.warn(`[PERMISSION] Usuário ${user.id} (${user.role}) sem permissão para ${resource}:${action}`);
        return errorResponse(res, 403, 'Acesso negado: permissão insuficiente');
      }
      
      logger.info(`[PERMISSION] Usuário ${user.id} (${user.role}) autorizado para ${resource}:${action}`);
      next();
    } catch (error) {
      logger.error(`[PERMISSION] Erro ao verificar permissão ${resource}:${action}:`, error);
      return errorResponse(res, 500, 'Erro interno do servidor');
    }
  };
}

/**
 * Middleware para verificar múltiplas permissões (OR).
 * @param {Array} permissions - Array de permissões [resource, action].
 * @returns {Function} Middleware Express.
 * @example
 * // app.get('/api/data', requireAnyPermission([['data', 'read'], ['data', 'write']]), controller.getData);
 */
function requireAnyPermission(permissions) {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        logger.warn(`[PERMISSION] Usuário não autenticado tentando acessar múltiplas permissões`);
        return errorResponse(res, 401, 'Usuário não autenticado');
      }
      
      const hasAnyPermission = permissions.some(([resource, action]) => 
        hasPermission(resource, action, user)
      );
      
      if (!hasAnyPermission) {
        logger.warn(`[PERMISSION] Usuário ${user.id} (${user.role}) sem permissão para qualquer uma das ações`);
        return errorResponse(res, 403, 'Acesso negado: permissão insuficiente');
      }
      
      logger.info(`[PERMISSION] Usuário ${user.id} (${user.role}) autorizado para pelo menos uma das permissões`);
      next();
    } catch (error) {
      logger.error(`[PERMISSION] Erro ao verificar múltiplas permissões:`, error);
      return errorResponse(res, 500, 'Erro interno do servidor');
    }
  };
}

/**
 * Middleware para verificar todas as permissões (AND).
 * @param {Array} permissions - Array de permissões [resource, action].
 * @returns {Function} Middleware Express.
 * @example
 * // app.post('/api/data', requireAllPermissions([['data', 'read'], ['data', 'write']]), controller.createData);
 */
function requireAllPermissions(permissions) {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        logger.warn(`[PERMISSION] Usuário não autenticado tentando acessar múltiplas permissões`);
        return errorResponse(res, 401, 'Usuário não autenticado');
      }
      
      const hasAllPermissions = permissions.every(([resource, action]) => 
        hasPermission(resource, action, user)
      );
      
      if (!hasAllPermissions) {
        logger.warn(`[PERMISSION] Usuário ${user.id} (${user.role}) sem todas as permissões necessárias`);
        return errorResponse(res, 403, 'Acesso negado: permissão insuficiente');
      }
      
      logger.info(`[PERMISSION] Usuário ${user.id} (${user.role}) autorizado para todas as permissões`);
      next();
    } catch (error) {
      logger.error(`[PERMISSION] Erro ao verificar todas as permissões:`, error);
      return errorResponse(res, 500, 'Erro interno do servidor');
    }
  };
}

/**
 * Middleware para verificar se o usuário é proprietário do recurso.
 * @param {string} resourceField - Campo que contém o ID do proprietário.
 * @param {Function} getResourceOwner - Função para obter o proprietário do recurso.
 * @returns {Function} Middleware Express.
 * @example
 * // app.put('/api/accounts/:id', requireOwnership('user_id', getAccountOwner), accountController.updateAccount);
 */
function requireOwnership(resourceField, getResourceOwner) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        logger.warn(`[PERMISSION] Usuário não autenticado tentando acessar recurso`);
        return errorResponse(res, 401, 'Usuário não autenticado');
      }
      
      // Admin pode acessar qualquer recurso
      if (user.role === 'admin') {
        logger.info(`[PERMISSION] Admin ${user.id} autorizado para acessar recurso`);
        return next();
      }
      
      const resourceId = req.params.id || req.body[resourceField];
      if (!resourceId) {
        logger.warn(`[PERMISSION] ID do recurso não fornecido`);
        return errorResponse(res, 400, 'ID do recurso é obrigatório');
      }
      
      const ownerId = await getResourceOwner(resourceId);
      if (!ownerId) {
        logger.warn(`[PERMISSION] Recurso ${resourceId} não encontrado`);
        return errorResponse(res, 404, 'Recurso não encontrado');
      }
      
      if (ownerId !== user.id) {
        logger.warn(`[PERMISSION] Usuário ${user.id} tentando acessar recurso do usuário ${ownerId}`);
        return errorResponse(res, 403, 'Acesso negado: recurso não pertence ao usuário');
      }
      
      logger.info(`[PERMISSION] Usuário ${user.id} autorizado para acessar seu próprio recurso`);
      next();
    } catch (error) {
      logger.error(`[PERMISSION] Erro ao verificar propriedade do recurso:`, error);
      return errorResponse(res, 500, 'Erro interno do servidor');
    }
  };
}

/**
 * Obtém todas as permissões disponíveis.
 * @returns {Object} Mapeamento de permissões.
 */
function getAllPermissions() {
  return RESOURCE_PERMISSIONS;
}

/**
 * Obtém permissões de um usuário específico.
 * @param {Object} user - Usuário.
 * @returns {Array} Lista de permissões do usuário.
 */
function getUserPermissions(user) {
  if (!user || !user.role) {
    return [];
  }
  
  const userPermissions = [];
  
  Object.entries(RESOURCE_PERMISSIONS).forEach(([permission, roles]) => {
    if (roles.includes(user.role)) {
      userPermissions.push(permission);
    }
  });
  
  return userPermissions;
}

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireOwnership,
  hasPermission,
  getAllPermissions,
  getUserPermissions,
  RESOURCE_PERMISSIONS
}; 