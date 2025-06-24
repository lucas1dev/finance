/**
 * Hooks para Integridade de Dados
 * @author Lucas
 *
 * @description
 * Hooks customizados para gerenciar estado e operações de integridade de dados.
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import dataIntegrityService, {
  IntegrityCheck,
  IntegrityIssue,
  IntegrityReport,
  RunCheckResponse,
  FixIssueResponse
} from '@/lib/dataIntegrityService';

/**
 * Hook para gerenciar verificações de integridade
 * @returns {Object} Estado e funções para verificações
 */
export function useIntegrityChecks() {
  const [checks, setChecks] = useState<IntegrityCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runningChecks, setRunningChecks] = useState<Set<number>>(new Set());

  const fetchChecks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataIntegrityService.getChecks();
      setChecks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar verificações';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const runCheck = useCallback(async (checkId: number) => {
    try {
      setRunningChecks(prev => new Set(prev).add(checkId));
      const result = await dataIntegrityService.runCheck(checkId);
      
      // Atualiza a verificação na lista
      setChecks(prev => prev.map(check => 
        check.id === checkId 
          ? { 
              ...check, 
              status: 'completed',
              lastRun: new Date().toISOString(),
              issues: result.issuesFound,
              critical: Math.floor(result.issuesFound * 0.6), // Mock
              warnings: Math.floor(result.issuesFound * 0.4) // Mock
            }
          : check
      ));

      toast.success(result.message || 'Verificação concluída com sucesso');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao executar verificação';
      toast.error(message);
      throw err;
    } finally {
      setRunningChecks(prev => {
        const newSet = new Set(prev);
        newSet.delete(checkId);
        return newSet;
      });
    }
  }, []);

  const runAllChecks = useCallback(async () => {
    try {
      setLoading(true);
      const results = await dataIntegrityService.runAllChecks();
      
      // Atualiza todas as verificações
      setChecks(prev => prev.map(check => {
        const result = results.find(r => r.checkId === check.id);
        if (result) {
          return {
            ...check,
            status: 'completed',
            lastRun: new Date().toISOString(),
            issues: result.issuesFound,
            critical: Math.floor(result.issuesFound * 0.6),
            warnings: Math.floor(result.issuesFound * 0.4)
          };
        }
        return check;
      }));

      toast.success(`${results.length} verificações executadas com sucesso`);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao executar verificações';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleCheck = useCallback(async (checkId: number, enabled: boolean) => {
    try {
      const updatedCheck = await dataIntegrityService.toggleCheck(checkId, enabled);
      setChecks(prev => prev.map(check => 
        check.id === checkId ? updatedCheck : check
      ));
      
      toast.success(`Verificação ${enabled ? 'ativada' : 'desativada'} com sucesso`);
      return updatedCheck;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar status da verificação';
      toast.error(message);
      throw err;
    }
  }, []);

  const configureCheck = useCallback(async (checkId: number, config: {
    schedule?: string;
    timeout?: number;
    autoFix?: boolean;
    enabled?: boolean;
  }) => {
    try {
      const updatedCheck = await dataIntegrityService.configureCheck(checkId, config);
      setChecks(prev => prev.map(check => 
        check.id === checkId ? updatedCheck : check
      ));
      
      toast.success('Configuração atualizada com sucesso');
      return updatedCheck;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao configurar verificação';
      toast.error(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchChecks();
  }, [fetchChecks]);

  return {
    checks,
    loading,
    error,
    runningChecks,
    fetchChecks,
    runCheck,
    runAllChecks,
    toggleCheck,
    configureCheck
  };
}

/**
 * Hook para gerenciar problemas de integridade
 * @returns {Object} Estado e funções para problemas
 */
export function useIntegrityIssues() {
  const [issues, setIssues] = useState<IntegrityIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    type?: string;
    severity?: string;
    category?: string;
    fixed?: boolean;
    checkId?: number;
  }>({});

  const fetchIssues = useCallback(async (newFilters?: typeof filters) => {
    try {
      setLoading(true);
      setError(null);
      const currentFilters = newFilters || filters;
      const data = await dataIntegrityService.getIssues(currentFilters);
      setIssues(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar problemas';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fixIssue = useCallback(async (issueId: number) => {
    try {
      const result = await dataIntegrityService.fixIssue(issueId);
      
      // Atualiza o problema na lista
      setIssues(prev => prev.map(issue => 
        issue.id === issueId 
          ? { 
              ...issue, 
              fixed: true,
              fixedAt: new Date().toISOString(),
              fixedBy: 'Sistema'
            }
          : issue
      ));

      toast.success(result.message || 'Problema corrigido automaticamente');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao corrigir problema';
      toast.error(message);
      throw err;
    }
  }, []);

  const fixMultipleIssues = useCallback(async (issueIds: number[]) => {
    try {
      setLoading(true);
      const results = await dataIntegrityService.fixMultipleIssues(issueIds);
      
      // Atualiza os problemas corrigidos
      setIssues(prev => prev.map(issue => 
        issueIds.includes(issue.id)
          ? { 
              ...issue, 
              fixed: true,
              fixedAt: new Date().toISOString(),
              fixedBy: 'Sistema'
            }
          : issue
      ));

      const successCount = results.filter(r => r.success).length;
      toast.success(`${successCount} problemas corrigidos automaticamente`);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao corrigir problemas';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFilters = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    fetchIssues(newFilters);
  }, [fetchIssues]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return {
    issues,
    loading,
    error,
    filters,
    fetchIssues,
    fixIssue,
    fixMultipleIssues,
    updateFilters
  };
}

/**
 * Hook para gerenciar relatórios de integridade
 * @returns {Object} Estado e funções para relatórios
 */
export function useIntegrityReports() {
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [stats, setStats] = useState<IntegrityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataIntegrityService.getReport(params);
      setReport(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar relatório';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataIntegrityService.getStats();
      setStats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar estatísticas';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportReport = useCallback(async (format: 'csv' | 'pdf' | 'xlsx', params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
  }) => {
    try {
      const blob = await dataIntegrityService.exportReport(format, params);
      
      // Cria link para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-integridade-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Relatório exportado em ${format.toUpperCase()}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao exportar relatório';
      toast.error(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    report,
    stats,
    loading,
    error,
    fetchReport,
    fetchStats,
    exportReport
  };
}

/**
 * Hook para gerenciar notificações em tempo real
 * @returns {Object} Estado e funções para notificações
 */
export function useIntegrityNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>>([]);

  const addNotification = useCallback((notification: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
  }) => {
    const newNotification = {
      id: Date.now().toString(),
      ...notification,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Mostra toast
    toast[notification.type](notification.message, {
      description: notification.title
    });
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      read: true
    })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
} 