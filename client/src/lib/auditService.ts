import axios from './axios';

/**
 * Interface para logs de auditoria
 */
export interface AuditLog {
  id: string;
  userId: number;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  status?: 'success' | 'error';
}

/**
 * Interface para filtros de auditoria
 */
export interface AuditFilters {
  search?: string;
  userId?: number;
  action?: string;
  resource?: string;
  status?: 'success' | 'error';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Interface para resposta da API de auditoria
 */
export interface AuditResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Interface para estatísticas de auditoria
 */
export interface AuditStats {
  totalLogs: number;
  logsToday: number;
  logsThisWeek: number;
  logsThisMonth: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userName: string; count: number }>;
  errorRate: number;
  successRate: number;
}

/**
 * Serviço para gerenciar logs de auditoria
 * @author Lucas
 */
const auditService = {
  /**
   * Busca logs de auditoria com filtros
   * @param {AuditFilters} filters - Filtros para a busca
   * @returns {Promise<AuditResponse>} Lista de logs e metadados
   * @throws {Error} Se houver erro na requisição
   * @example
   * // Buscar todos os logs
   * const logs = await auditService.getLogs({});
   * 
   * // Buscar logs de um usuário específico
   * const userLogs = await auditService.getLogs({ userId: 123 });
   * 
   * // Buscar logs de erro
   * const errorLogs = await auditService.getLogs({ status: 'error' });
   */
  async getLogs(filters: AuditFilters = {}): Promise<AuditResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.userId) params.append('userId', filters.userId.toString());
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

      const response = await axios.get(`/audit?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      throw new Error('Erro ao buscar logs de auditoria');
    }
  },

  /**
   * Busca estatísticas de auditoria
   * @param {string} period - Período para as estatísticas (today, week, month, year)
   * @returns {Promise<AuditStats>} Estatísticas de auditoria
   * @throws {Error} Se houver erro na requisição
   * @example
   * // Buscar estatísticas do mês
   * const stats = await auditService.getStats('month');
   */
  async getStats(period: string = 'month'): Promise<AuditStats> {
    try {
      const response = await axios.get(`/audit/stats?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de auditoria:', error);
      throw new Error('Erro ao buscar estatísticas de auditoria');
    }
  },

  /**
   * Busca log de auditoria por ID
   * @param {string} logId - ID do log
   * @returns {Promise<AuditLog>} Log de auditoria
   * @throws {Error} Se houver erro na requisição
   * @example
   * // Buscar log específico
   * const log = await auditService.getLogById('123');
   */
  async getLogById(logId: string): Promise<AuditLog> {
    try {
      const response = await axios.get(`/audit/${logId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar log de auditoria:', error);
      throw new Error('Erro ao buscar log de auditoria');
    }
  },

  /**
   * Exporta relatório de auditoria
   * @param {AuditFilters} filters - Filtros para o relatório
   * @param {string} format - Formato do relatório (csv, pdf, xlsx)
   * @returns {Promise<Blob>} Arquivo do relatório
   * @throws {Error} Se houver erro na requisição
   * @example
   * // Exportar relatório CSV
   * const report = await auditService.exportReport({ status: 'error' }, 'csv');
   * 
   * // Download do arquivo
   * const url = window.URL.createObjectURL(report);
   * const a = document.createElement('a');
   * a.href = url;
   * a.download = 'audit-report.csv';
   * a.click();
   */
  async exportReport(filters: AuditFilters = {}, format: string = 'csv'): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.userId) params.append('userId', filters.userId.toString());
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      params.append('format', format);

      const response = await axios.get(`/audit/export?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar relatório de auditoria:', error);
      throw new Error('Erro ao exportar relatório de auditoria');
    }
  },

  /**
   * Busca ações disponíveis para filtro
   * @returns {Promise<string[]>} Lista de ações únicas
   * @throws {Error} Se houver erro na requisição
   * @example
   * // Buscar ações disponíveis
   * const actions = await auditService.getAvailableActions();
   */
  async getAvailableActions(): Promise<string[]> {
    try {
      const response = await axios.get('/audit/actions');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar ações disponíveis:', error);
      throw new Error('Erro ao buscar ações disponíveis');
    }
  },

  /**
   * Busca recursos disponíveis para filtro
   * @returns {Promise<string[]>} Lista de recursos únicos
   * @throws {Error} Se houver erro na requisição
   * @example
   * // Buscar recursos disponíveis
   * const resources = await auditService.getAvailableResources();
   */
  async getAvailableResources(): Promise<string[]> {
    try {
      const response = await axios.get('/audit/resources');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recursos disponíveis:', error);
      throw new Error('Erro ao buscar recursos disponíveis');
    }
  },

  /**
   * Busca usuários que geraram logs para filtro
   * @returns {Promise<Array<{id: number, name: string, email: string}>>} Lista de usuários
   * @throws {Error} Se houver erro na requisição
   * @example
   * // Buscar usuários com logs
   * const users = await auditService.getUsersWithLogs();
   */
  async getUsersWithLogs(): Promise<Array<{id: number, name: string, email: string}>> {
    try {
      const response = await axios.get('/audit/users');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuários com logs:', error);
      throw new Error('Erro ao buscar usuários com logs');
    }
  },

  /**
   * Limpa logs antigos (apenas para administradores)
   * @param {string} olderThan - Data limite (ISO string)
   * @returns {Promise<{deletedCount: number}>} Número de logs deletados
   * @throws {Error} Se houver erro na requisição
   * @example
   * // Limpar logs mais antigos que 1 ano
   * const result = await auditService.cleanOldLogs('2024-01-01');
   */
  async cleanOldLogs(olderThan: string): Promise<{deletedCount: number}> {
    try {
      const response = await axios.delete(`/audit/clean?olderThan=${olderThan}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
      throw new Error('Erro ao limpar logs antigos');
    }
  },

  /**
   * Busca alertas de segurança baseados nos logs
   * @returns {Promise<Array<{id: string, type: string, message: string, severity: string, timestamp: string}>>} Alertas de segurança
   * @throws {Error} Se houver erro na requisição
   * @example
   * // Buscar alertas de segurança
   * const alerts = await auditService.getSecurityAlerts();
   */
  async getSecurityAlerts(): Promise<Array<{id: string, type: string, message: string, severity: string, timestamp: string}>> {
    try {
      const response = await axios.get('/audit/security-alerts');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar alertas de segurança:', error);
      throw new Error('Erro ao buscar alertas de segurança');
    }
  },
};

export default auditService; 