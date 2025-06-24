import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

/**
 * Interface para dados completos do dashboard
 */
interface DashboardData {
  metrics: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyNet: number;
    incomeVariation: number;
    expensesVariation: number;
    topExpenseCategories: Array<{
      name: string;
      amount: number;
    }>;
    overdueAccounts: number;
    overdueAmount: number;
    projectedBalance: number;
    accountsCount: number;
  };
  charts: {
    balanceEvolution: Array<{
      month: string;
      income: number;
      expenses: number;
      net: number;
    }>;
    categoryDistribution: Array<{
      name: string;
      type: string;
      color: string;
      income: number;
      expenses: number;
    }>;
  };
  recentTransactions: Array<{
    id: number;
    description: string;
    amount: number;
    type: string;
    date: string;
    category: {
      name: string;
      type: string;
      color: string;
    } | null;
  }>;
  alerts: {
    overdueAccounts: Array<{
      id: number;
      description: string;
      amount: number;
      dueDate: string;
      daysOverdue: number;
    }>;
    upcomingAccounts: Array<{
      id: number;
      description: string;
      amount: number;
      dueDate: string;
      daysUntilDue: number;
    }>;
    unreadNotifications: Array<{
      id: number;
      title: string;
      message: string;
      type: string;
      createdAt: string;
    }>;
    lowBalanceAccounts: Array<{
      id: number;
      description: string;
      balance: number;
      threshold: number;
    }>;
    summary: {
      totalOverdue: number;
      totalUpcoming: number;
      totalUnread: number;
      totalLowBalance: number;
    };
  };
  timestamp: string;
}

/**
 * Interface para o estado do hook
 */
interface DashboardBatchState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * Interface para opções de carregamento
 */
interface LoadOptions {
  period?: string;
  days?: number;
  limit?: number;
  forceRefresh?: boolean;
}

/**
 * Hook para carregar todos os dados do dashboard em uma única requisição
 * Otimizado para reduzir o número de chamadas à API e evitar rate limiting
 * @returns Estado e funções para gerenciar dados do dashboard
 * @example
 * const { data, loading, error, refreshData } = useDashboardBatch();
 */
export function useDashboardBatch() {
  const [state, setState] = useState<DashboardBatchState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  /**
   * Carrega todos os dados do dashboard
   */
  const loadDashboardData = useCallback(async (options: LoadOptions = {}) => {
    const { period = 'month', days = 30, limit = 10, forceRefresh = false } = options;

    // Se já temos dados recentes e não é um refresh forçado, não carrega novamente
    if (state.data && !forceRefresh && state.lastUpdated) {
      const lastUpdate = new Date(state.lastUpdated);
      const now = new Date();
      const timeDiff = now.getTime() - lastUpdate.getTime();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutos

      if (timeDiff < fiveMinutes) {
        return;
      }
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      const response = await api.get('/dashboard/all', {
        params: { period, days, limit },
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      setState(prev => ({
        ...prev,
        data: response.data.data,
        loading: false,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      
      let errorMessage = 'Erro ao carregar dados do dashboard';
      
      // Type guards para tratar o erro adequadamente
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 429) {
          errorMessage = 'Muitas requisições. Aguarde um momento e tente novamente.';
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, [state.data, state.lastUpdated]);

  /**
   * Atualiza os dados do dashboard
   */
  const refreshData = useCallback((options: LoadOptions = {}) => {
    return loadDashboardData({ ...options, forceRefresh: true });
  }, [loadDashboardData]);

  /**
   * Limpa o erro
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Carrega dados na montagem do componente
   */
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    // Estado
    data: state.data,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // Funções
    loadDashboardData,
    refreshData,
    clearError
  };
} 