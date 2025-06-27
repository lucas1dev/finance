const { Transaction, Account, Category, FixedAccount, Notification, InvestmentGoal } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../utils/errors');
const { successResponse } = require('../utils/response');
const cacheService = require('../services/cacheService');
const DashboardService = require('../services/dashboardService');
const { logger } = require('../utils/logger');

/**
 * Controller para endpoints do Dashboard Principal
 * Fornece métricas consolidadas, dados para gráficos e alertas
 */
class DashboardController {
  /**
   * Obtém métricas financeiras consolidadas para o dashboard.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Métricas consolidadas em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/dashboard/metrics
   * // Retorno: { totalBalance: 15000, monthlyIncome: 5000, monthlyExpenses: 3000, ... }
   */
  async getMetrics(req, res) {
    try {
      const metrics = await DashboardService.getMetrics(req.userId);

      logger.info('Métricas do dashboard obtidas com sucesso', {
        user_id: req.userId
      });

      return res.json({
        success: true,
        data: metrics,
        message: 'Métricas do dashboard obtidas com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao obter métricas do dashboard', {
        error: error.message,
        user_id: req.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Erro ao obter métricas do dashboard'
      });
    }
  }

  /**
   * Obtém dados para gráficos do dashboard.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Dados para gráficos em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/dashboard/charts
   * // Retorno: { balanceEvolution: [...], categoryDistribution: [...], ... }
   */
  async getCharts(req, res) {
    try {
      const charts = await DashboardService.getCharts(req.userId);

      logger.info('Dados de gráficos obtidos com sucesso', {
        user_id: req.userId
      });

      return res.json({
        success: true,
        data: charts,
        message: 'Dados de gráficos obtidos com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao obter dados de gráficos', {
        error: error.message,
        user_id: req.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Erro ao obter dados de gráficos'
      });
    }
  }

  /**
   * Obtém alertas e notificações para o dashboard.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Alertas e notificações em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/dashboard/alerts
   * // Retorno: { overdueAccounts: [...], lowBalance: [...], ... }
   */
  async getAlerts(req, res) {
    try {
      const alerts = await DashboardService.getAlerts(req.userId);

      logger.info('Alertas do dashboard obtidos com sucesso', {
        user_id: req.userId,
        total_alerts: alerts.totalAlerts,
        total_notifications: alerts.totalUnreadNotifications
      });

      return res.json({
        success: true,
        data: alerts,
        message: 'Alertas do dashboard obtidos com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao obter alertas do dashboard', {
        error: error.message,
        user_id: req.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Erro ao obter alertas do dashboard'
      });
    }
  }

  /**
   * Obtém todos os dados do dashboard de uma vez.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Todos os dados do dashboard em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/dashboard
   * // Retorno: { metrics: {...}, charts: {...}, alerts: {...} }
   */
  async getDashboard(req, res) {
    try {
      const dashboardData = await DashboardService.getAllDashboardData(req.userId);

      logger.info('Dados completos do dashboard obtidos com sucesso', {
        user_id: req.userId
      });

      return res.json({
        success: true,
        data: dashboardData,
        message: 'Dados do dashboard obtidos com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao obter dados completos do dashboard', {
        error: error.message,
        user_id: req.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Erro ao obter dados do dashboard'
      });
    }
  }

  /**
   * Obtém todos os dados do dashboard de uma vez (endpoint alternativo).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Todos os dados do dashboard em formato JSON.
   */
  async getAllDashboardData(req, res) {
    try {
      const dashboardData = await DashboardService.getAllDashboardData(req.userId);

      logger.info('Dados completos do dashboard obtidos com sucesso', {
        user_id: req.userId
      });

      return res.json({
        success: true,
        data: dashboardData,
        message: 'Dados completos do dashboard obtidos com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao obter dados completos do dashboard', {
        error: error.message,
        user_id: req.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Erro ao obter dados completos do dashboard'
      });
    }
  }
}

module.exports = new DashboardController(); 