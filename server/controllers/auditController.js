/**
 * Controller para consulta de logs de auditoria.
 * Permite visualizar histórico de ações administrativas.
 * 
 * @module controllers/auditController
 */

const { AuditLog, User } = require('../models');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Obtém logs de auditoria com paginação e filtros.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Lista de logs paginada.
 */
async function getAuditLogs(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      resource,
      status,
      startDate,
      endDate
    } = req.query;

    const whereClause = {};

    // Filtros
    if (userId) whereClause.userId = userId;
    if (action) whereClause.action = action;
    if (resource) whereClause.resource = resource;
    if (status) whereClause.status = status;

    // Filtro por data
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      status: 'success',
      data: {
        logs: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar logs de auditoria:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Obtém estatísticas de auditoria.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Estatísticas de auditoria.
 */
async function getAuditStats(req, res) {
  try {
    const { period = '30d' } = req.query;
    
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalActions, successActions, failureActions, uniqueUsers] = await Promise.all([
      AuditLog.count({
        where: {
          createdAt: { [Op.gte]: startDate }
        }
      }),
      AuditLog.count({
        where: {
          status: 'success',
          createdAt: { [Op.gte]: startDate }
        }
      }),
      AuditLog.count({
        where: {
          status: 'failure',
          createdAt: { [Op.gte]: startDate }
        }
      }),
      AuditLog.count({
        distinct: true,
        col: 'userId',
        where: {
          createdAt: { [Op.gte]: startDate }
        }
      })
    ]);

    // Ações por tipo
    const actionsByType = await AuditLog.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        'action',
        [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'count']
      ],
      group: ['action'],
      order: [[AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'DESC']]
    });

    // Recursos mais afetados
    const resourcesByType = await AuditLog.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        'resource',
        [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'count']
      ],
      group: ['resource'],
      order: [[AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'DESC']]
    });

    const successRate = totalActions > 0 ? (successActions / totalActions) : 0;

    res.json({
      status: 'success',
      data: {
        period,
        totalActions,
        successActions,
        failureActions,
        successRate: Math.round(successRate * 100) / 100,
        uniqueUsers,
        actionsByType: actionsByType.map(item => ({
          action: item.action,
          count: parseInt(item.getDataValue('count'))
        })),
        resourcesByType: resourcesByType.map(item => ({
          resource: item.resource,
          count: parseInt(item.getDataValue('count'))
        }))
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas de auditoria:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Obtém detalhes de um log específico.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Detalhes do log.
 */
async function getAuditLogDetails(req, res) {
  try {
    const { id } = req.params;

    const log = await AuditLog.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role']
      }]
    });

    if (!log) {
      return res.status(404).json({
        status: 'error',
        message: 'Log de auditoria não encontrado'
      });
    }

    res.json({
      status: 'success',
      data: log
    });
  } catch (error) {
    logger.error('Erro ao buscar detalhes do log de auditoria:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

/**
 * Obtém logs de auditoria de um usuário específico.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Logs do usuário.
 */
async function getUserAuditLogs(req, res) {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await AuditLog.findAndCountAll({
      where: { userId: parseInt(userId) },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      status: 'success',
      data: {
        logs: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar logs de auditoria do usuário:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
  }
}

module.exports = {
  getAuditLogs,
  getAuditStats,
  getAuditLogDetails,
  getUserAuditLogs
}; 