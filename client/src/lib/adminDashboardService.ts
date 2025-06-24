import axios from './axios';

/**
 * Serviço para integração do dashboard administrativo com a API backend.
 * Fornece métodos para buscar métricas, alertas e logs de auditoria do sistema.
 * @module adminDashboardService
 */

/**
 * Busca as estatísticas globais do sistema.
 * @returns {Promise<Object>} Estatísticas do sistema (usuários, transações, contas, jobs, etc).
 * @example
 * const stats = await adminDashboardService.getSystemStats();
 */
export async function getSystemStats() {
  const { data } = await axios.get('/admin/dashboard/system-stats');
  return data;
}

/**
 * Busca as métricas de usuários administradores.
 * @returns {Promise<Object>} Métricas de usuários (novos, ativos, crescimento).
 * @example
 * const metrics = await adminDashboardService.getUserMetrics();
 */
export async function getUserMetrics() {
  const { data } = await axios.get('/admin/dashboard/user-metrics');
  return data;
}

/**
 * Busca os alertas do sistema.
 * @returns {Promise<Array>} Lista de alertas críticos, warnings e infos.
 * @example
 * const alerts = await adminDashboardService.getSystemAlerts();
 */
export async function getSystemAlerts() {
  const { data } = await axios.get('/admin/dashboard/alerts');
  return data;
}

/**
 * Busca os logs de auditoria do sistema.
 * @returns {Promise<Array>} Lista de logs de auditoria.
 * @example
 * const logs = await adminDashboardService.getAuditLogs();
 */
export async function getAuditLogs() {
  const { data } = await axios.get('/admin/dashboard/audit-logs');
  return data;
}

const adminDashboardService = {
  getSystemStats,
  getUserMetrics,
  getSystemAlerts,
  getAuditLogs,
};

export default adminDashboardService; 