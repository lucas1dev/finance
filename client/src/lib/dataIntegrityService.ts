/**
 * Serviço de Integridade de Dados
 * @author Lucas
 *
 * @description
 * Serviço responsável por todas as operações relacionadas à integridade de dados,
 * incluindo verificações, problemas, correções e relatórios.
 */

import api from './axios';

// Tipos de dados
export interface IntegrityCheck {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  lastRun: string;
  nextRun: string;
  issues: number;
  critical: number;
  warnings: number;
  autoFix: boolean;
  enabled: boolean;
  schedule?: string;
  timeout?: number;
}

export interface IntegrityIssue {
  id: number;
  checkId: number;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affectedRecords: number;
  suggestedFix: string;
  createdAt: string;
  fixed: boolean;
  fixedAt?: string;
  fixedBy?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  metadata?: Record<string, any>;
}

export interface IntegrityReport {
  totalChecks: number;
  activeChecks: number;
  totalIssues: number;
  criticalIssues: number;
  warningIssues: number;
  fixedIssues: number;
  lastWeek: {
    checksRun: number;
    issuesFound: number;
    issuesFixed: number;
    successRate: number;
  };
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  trends: {
    date: string;
    issues: number;
    fixed: number;
  }[];
}

export interface RunCheckResponse {
  success: boolean;
  checkId: number;
  issuesFound: number;
  executionTime: number;
  message: string;
}

export interface FixIssueResponse {
  success: boolean;
  issueId: number;
  fixedRecords: number;
  message: string;
}

/**
 * Serviço de Integridade de Dados
 */
class DataIntegrityService {
  private baseUrl = '/admin/data-integrity';

  /**
   * Busca todas as verificações de integridade
   * @returns {Promise<IntegrityCheck[]>} Lista de verificações
   */
  async getChecks(): Promise<IntegrityCheck[]> {
    try {
      const response = await api.get(`${this.baseUrl}/checks`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar verificações:', error);
      throw new Error('Falha ao carregar verificações de integridade');
    }
  }

  /**
   * Busca uma verificação específica
   * @param {number} checkId - ID da verificação
   * @returns {Promise<IntegrityCheck>} Verificação
   */
  async getCheck(checkId: number): Promise<IntegrityCheck> {
    try {
      const response = await api.get(`${this.baseUrl}/checks/${checkId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar verificação:', error);
      throw new Error('Falha ao carregar verificação');
    }
  }

  /**
   * Executa uma verificação de integridade
   * @param {number} checkId - ID da verificação
   * @returns {Promise<RunCheckResponse>} Resultado da execução
   */
  async runCheck(checkId: number): Promise<RunCheckResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/checks/${checkId}/run`);
      return response.data;
    } catch (error) {
      console.error('Erro ao executar verificação:', error);
      throw new Error('Falha ao executar verificação');
    }
  }

  /**
   * Executa todas as verificações ativas
   * @returns {Promise<RunCheckResponse[]>} Resultados das execuções
   */
  async runAllChecks(): Promise<RunCheckResponse[]> {
    try {
      const response = await api.post(`${this.baseUrl}/checks/run-all`);
      return response.data;
    } catch (error) {
      console.error('Erro ao executar todas as verificações:', error);
      throw new Error('Falha ao executar verificações');
    }
  }

  /**
   * Ativa/desativa uma verificação
   * @param {number} checkId - ID da verificação
   * @param {boolean} enabled - Status desejado
   * @returns {Promise<IntegrityCheck>} Verificação atualizada
   */
  async toggleCheck(checkId: number, enabled: boolean): Promise<IntegrityCheck> {
    try {
      const response = await api.patch(`${this.baseUrl}/checks/${checkId}`, {
        enabled
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao alterar status da verificação:', error);
      throw new Error('Falha ao alterar status da verificação');
    }
  }

  /**
   * Busca todos os problemas de integridade
   * @param {Object} filters - Filtros opcionais
   * @returns {Promise<IntegrityIssue[]>} Lista de problemas
   */
  async getIssues(filters?: {
    type?: string;
    severity?: string;
    category?: string;
    fixed?: boolean;
    checkId?: number;
  }): Promise<IntegrityIssue[]> {
    try {
      const response = await api.get(`${this.baseUrl}/issues`, { params: filters });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar problemas:', error);
      throw new Error('Falha ao carregar problemas de integridade');
    }
  }

  /**
   * Busca um problema específico
   * @param {number} issueId - ID do problema
   * @returns {Promise<IntegrityIssue>} Problema
   */
  async getIssue(issueId: number): Promise<IntegrityIssue> {
    try {
      const response = await api.get(`${this.baseUrl}/issues/${issueId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar problema:', error);
      throw new Error('Falha ao carregar problema');
    }
  }

  /**
   * Corrige automaticamente um problema
   * @param {number} issueId - ID do problema
   * @returns {Promise<FixIssueResponse>} Resultado da correção
   */
  async fixIssue(issueId: number): Promise<FixIssueResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/issues/${issueId}/fix`);
      return response.data;
    } catch (error) {
      console.error('Erro ao corrigir problema:', error);
      throw new Error('Falha ao corrigir problema');
    }
  }

  /**
   * Corrige múltiplos problemas automaticamente
   * @param {number[]} issueIds - IDs dos problemas
   * @returns {Promise<FixIssueResponse[]>} Resultados das correções
   */
  async fixMultipleIssues(issueIds: number[]): Promise<FixIssueResponse[]> {
    try {
      const response = await api.post(`${this.baseUrl}/issues/fix-multiple`, {
        issueIds
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao corrigir problemas:', error);
      throw new Error('Falha ao corrigir problemas');
    }
  }

  /**
   * Busca relatórios de integridade
   * @param {Object} params - Parâmetros do relatório
   * @returns {Promise<IntegrityReport>} Relatório
   */
  async getReport(params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<IntegrityReport> {
    try {
      const response = await api.get(`${this.baseUrl}/reports`, { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
      throw new Error('Falha ao carregar relatório');
    }
  }

  /**
   * Busca estatísticas resumidas
   * @returns {Promise<IntegrityReport>} Estatísticas
   */
  async getStats(): Promise<IntegrityReport> {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error('Falha ao carregar estatísticas');
    }
  }

  /**
   * Configura uma verificação
   * @param {number} checkId - ID da verificação
   * @param {Object} config - Configuração
   * @returns {Promise<IntegrityCheck>} Verificação atualizada
   */
  async configureCheck(checkId: number, config: {
    schedule?: string;
    timeout?: number;
    autoFix?: boolean;
    enabled?: boolean;
  }): Promise<IntegrityCheck> {
    try {
      const response = await api.put(`${this.baseUrl}/checks/${checkId}/config`, config);
      return response.data;
    } catch (error) {
      console.error('Erro ao configurar verificação:', error);
      throw new Error('Falha ao configurar verificação');
    }
  }

  /**
   * Exporta relatório em diferentes formatos
   * @param {string} format - Formato (csv, pdf, xlsx)
   * @param {Object} params - Parâmetros do relatório
   * @returns {Promise<Blob>} Arquivo do relatório
   */
  async exportReport(format: 'csv' | 'pdf' | 'xlsx', params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<Blob> {
    try {
      const response = await api.get(`${this.baseUrl}/reports/export`, {
        params: { ...params, format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      throw new Error('Falha ao exportar relatório');
    }
  }
}

export const dataIntegrityService = new DataIntegrityService();
export default dataIntegrityService; 