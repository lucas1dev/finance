/**
 * Middleware para auditoria de ações administrativas.
 * Registra todas as ações sensíveis realizadas por administradores.
 * 
 * @module middlewares/auditMiddleware
 */

const { AuditLog } = require('../models');
const { logger } = require('../utils/logger');

/**
 * Cria um log de auditoria.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @param {string} action - Tipo de ação realizada.
 * @param {string} resource - Recurso afetado.
 * @param {number} resourceId - ID do recurso (opcional).
 * @param {Object} details - Detalhes adicionais (opcional).
 * @param {string} status - Status da ação (success, failure, partial).
 * @param {string} errorMessage - Mensagem de erro (opcional).
 * @param {number} executionTime - Tempo de execução em ms (opcional).
 * @returns {Promise<void>}
 */
async function createAuditLog(req, res, action, resource, resourceId = null, details = null, status = 'success', errorMessage = null, executionTime = null) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return; // Só audita ações de administradores
    }

    const auditData = {
      userId: req.user.id,
      userEmail: req.user.email,
      action,
      resource,
      resourceId,
      details: details ? JSON.stringify(details) : null,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      status,
      errorMessage,
      executionTime,
      createdAt: new Date()
    };

    await AuditLog.create(auditData);

    logger.info(`[AUDIT] ${action} em ${resource} por ${req.user.email}`, {
      userId: req.user.id,
      resourceId,
      status,
      executionTime
    });

  } catch (error) {
    logger.error('Erro ao criar log de auditoria:', error);
    // Não falha a requisição por erro de auditoria
  }
}

/**
 * Middleware para auditar ações de jobs.
 * @param {string} action - Tipo de ação (ex: 'job_execution').
 * @param {string} resource - Recurso afetado (ex: 'notifications').
 * @returns {Function} Middleware Express.
 */
function auditJobAction(action, resource) {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Capturar resposta original
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseBody = null;
    let statusCode = null;
    
    // Interceptar resposta
    res.send = function(data) {
      responseBody = data;
      statusCode = res.statusCode;
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      responseBody = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };
    
    try {
      await next();
      
      const executionTime = Date.now() - startTime;
      const status = statusCode >= 200 && statusCode < 300 ? 'success' : 'failure';
      const errorMessage = status === 'failure' ? (responseBody?.message || 'Erro desconhecido') : null;
      
      await createAuditLog(
        req, 
        res, 
        action, 
        resource, 
        null, 
        { 
          method: req.method,
          url: req.originalUrl,
          statusCode,
          responseBody: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)
        },
        status,
        errorMessage,
        executionTime
      );
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      await createAuditLog(
        req, 
        res, 
        action, 
        resource, 
        null, 
        { 
          method: req.method,
          url: req.originalUrl,
          error: error.message
        },
        'failure',
        error.message,
        executionTime
      );
      
      throw error;
    }
  };
}

/**
 * Middleware para auditar exclusões de dados.
 * @param {string} resource - Recurso afetado.
 * @returns {Function} Middleware Express.
 */
function auditDeletion(resource) {
  return async (req, res, next) => {
    const startTime = Date.now();
    const resourceId = req.params.id || req.body.id;
    
    try {
      await next();
      
      const executionTime = Date.now() - startTime;
      const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
      
      await createAuditLog(
        req, 
        res, 
        'data_deletion', 
        resource, 
        resourceId, 
        { 
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode
        },
        status,
        null,
        executionTime
      );
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      await createAuditLog(
        req, 
        res, 
        'data_deletion', 
        resource, 
        resourceId, 
        { 
          method: req.method,
          url: req.originalUrl,
          error: error.message
        },
        'failure',
        error.message,
        executionTime
      );
      
      throw error;
    }
  };
}

/**
 * Middleware para auditar alterações de configuração.
 * @param {string} resource - Recurso de configuração.
 * @returns {Function} Middleware Express.
 */
function auditConfigChange(resource) {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    try {
      await next();
      
      const executionTime = Date.now() - startTime;
      const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
      
      await createAuditLog(
        req, 
        res, 
        'config_change', 
        resource, 
        null, 
        { 
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          changes: req.body
        },
        status,
        null,
        executionTime
      );
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      await createAuditLog(
        req, 
        res, 
        'config_change', 
        resource, 
        null, 
        { 
          method: req.method,
          url: req.originalUrl,
          error: error.message,
          attemptedChanges: req.body
        },
        'failure',
        error.message,
        executionTime
      );
      
      throw error;
    }
  };
}

/**
 * Função utilitária para criar log de auditoria manual.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @param {string} action - Tipo de ação.
 * @param {string} resource - Recurso afetado.
 * @param {Object} options - Opções adicionais.
 * @returns {Promise<void>}
 */
async function logAuditEvent(req, res, action, resource, options = {}) {
  const {
    resourceId = null,
    details = null,
    status = 'success',
    errorMessage = null,
    executionTime = null
  } = options;
  
  await createAuditLog(req, res, action, resource, resourceId, details, status, errorMessage, executionTime);
}

module.exports = {
  createAuditLog,
  auditJobAction,
  auditDeletion,
  auditConfigChange,
  logAuditEvent
}; 