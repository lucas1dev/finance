import { useState, useEffect, useCallback } from 'react';
import dashboardService, { DashboardMetrics, ChartData, RecentTransaction, DashboardAlert } from '../lib/dashboardService';

/**
 * Interface para o estado do hook
 */
interface FinancialMetricsState {
  metrics: DashboardMetrics | null;
  charts: {
    revenueExpense: ChartData | null;
    cashFlow: ChartData | null;
    categoryDistribution: ChartData | null;
    investmentDistribution: ChartData | null;
  };
  recentTransactions: RecentTransaction[];
  alerts: DashboardAlert[];
  loading: boolean;
  error: string | null;
}

/**
 * Interface para opções de atualização
 */
interface UpdateOptions {
  refreshMetrics?: boolean;
  refreshCharts?: boolean;
  refreshTransactions?: boolean;
  refreshAlerts?: boolean;
}

/**
 * Hook customizado para gerenciar métricas financeiras
 * @returns Objeto com estado e funções para gerenciar métricas financeiras
 */
export const useFinancialMetrics = () => {
  const [state, setState] = useState<FinancialMetricsState>({
    metrics: null,
    charts: {
      revenueExpense: null,
      cashFlow: null,
      categoryDistribution: null,
      investmentDistribution: null,
    },
    recentTransactions: [],
    alerts: [],
    loading: false,
    error: null,
  });

  /**
   * Carrega métricas financeiras
   */
  const loadMetrics = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const metrics = await dashboardService.getMetrics();
      setState(prev => ({ ...prev, metrics, loading: false }));
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erro ao carregar métricas' 
      }));
    }
  }, []);

  /**
   * Carrega dados de gráficos
   */
  const loadCharts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [revenueExpense, cashFlow, categoryDistribution, investmentDistribution] = await Promise.all([
        dashboardService.getRevenueExpenseChart('month'),
        dashboardService.getCashFlowChart(30),
        dashboardService.getCategoryDistributionChart('expense'),
        dashboardService.getInvestmentDistributionChart(),
      ]);

      setState(prev => ({
        ...prev,
        charts: {
          revenueExpense,
          cashFlow,
          categoryDistribution,
          investmentDistribution,
        },
        loading: false,
      }));
    } catch (error) {
      console.error('Erro ao carregar gráficos:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erro ao carregar gráficos' 
      }));
    }
  }, []);

  /**
   * Carrega transações recentes
   */
  const loadRecentTransactions = useCallback(async (limit: number = 10) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const transactions = await dashboardService.getRecentTransactions(limit);
      setState(prev => ({ ...prev, recentTransactions: transactions, loading: false }));
    } catch (error) {
      console.error('Erro ao carregar transações recentes:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erro ao carregar transações recentes' 
      }));
    }
  }, []);

  /**
   * Carrega alertas do dashboard
   */
  const loadAlerts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const alerts = await dashboardService.getAlerts();
      setState(prev => ({ ...prev, alerts, loading: false }));
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erro ao carregar alertas' 
      }));
    }
  }, []);

  /**
   * Carrega todos os dados do dashboard
   */
  const loadAllData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [metrics, transactions, alerts] = await Promise.all([
        dashboardService.getMetrics(),
        dashboardService.getRecentTransactions(10),
        dashboardService.getAlerts(),
      ]);

      const [revenueExpense, cashFlow, categoryDistribution, investmentDistribution] = await Promise.all([
        dashboardService.getRevenueExpenseChart('month'),
        dashboardService.getCashFlowChart(30),
        dashboardService.getCategoryDistributionChart('expense'),
        dashboardService.getInvestmentDistributionChart(),
      ]);

      setState(prev => ({
        ...prev,
        metrics,
        charts: {
          revenueExpense,
          cashFlow,
          categoryDistribution,
          investmentDistribution,
        },
        recentTransactions: transactions,
        alerts,
        loading: false,
      }));
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erro ao carregar dados do dashboard' 
      }));
    }
  }, []);

  /**
   * Atualiza dados específicos
   */
  const updateData = useCallback(async (options: UpdateOptions = {}) => {
    const {
      refreshMetrics = false,
      refreshCharts = false,
      refreshTransactions = false,
      refreshAlerts = false,
    } = options;

    const promises: Promise<any>[] = [];

    if (refreshMetrics) {
      promises.push(loadMetrics());
    }

    if (refreshCharts) {
      promises.push(loadCharts());
    }

    if (refreshTransactions) {
      promises.push(loadRecentTransactions());
    }

    if (refreshAlerts) {
      promises.push(loadAlerts());
    }

    if (promises.length > 0) {
      try {
        await Promise.all(promises);
      } catch (error) {
        console.error('Erro ao atualizar dados:', error);
      }
    }
  }, [loadMetrics, loadCharts, loadRecentTransactions, loadAlerts]);

  /**
   * Marca um alerta como lido
   */
  const markAlertAsRead = useCallback(async (alertId: number) => {
    try {
      await dashboardService.markAlertAsRead(alertId);
      // Remove o alerta da lista local
      setState(prev => ({
        ...prev,
        alerts: prev.alerts.filter(alert => alert.id !== alertId),
      }));
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
    }
  }, []);

  /**
   * Atualiza gráfico de receitas vs despesas
   */
  const updateRevenueExpenseChart = useCallback(async (period: string = 'month') => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const chartData = await dashboardService.getRevenueExpenseChart(period);
      setState(prev => ({
        ...prev,
        charts: { ...prev.charts, revenueExpense: chartData },
        loading: false,
      }));
    } catch (error) {
      console.error('Erro ao atualizar gráfico de receitas vs despesas:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erro ao atualizar gráfico' 
      }));
    }
  }, []);

  /**
   * Atualiza gráfico de fluxo de caixa
   */
  const updateCashFlowChart = useCallback(async (days: number = 30) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const chartData = await dashboardService.getCashFlowChart(days);
      setState(prev => ({
        ...prev,
        charts: { ...prev.charts, cashFlow: chartData },
        loading: false,
      }));
    } catch (error) {
      console.error('Erro ao atualizar gráfico de fluxo de caixa:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erro ao atualizar gráfico' 
      }));
    }
  }, []);

  /**
   * Atualiza gráfico de distribuição por categoria
   */
  const updateCategoryDistributionChart = useCallback(async (type: 'income' | 'expense' = 'expense') => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const chartData = await dashboardService.getCategoryDistributionChart(type);
      setState(prev => ({
        ...prev,
        charts: { ...prev.charts, categoryDistribution: chartData },
        loading: false,
      }));
    } catch (error) {
      console.error('Erro ao atualizar gráfico de distribuição por categoria:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erro ao atualizar gráfico' 
      }));
    }
  }, []);

  /**
   * Limpa erros
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Carrega dados iniciais quando o hook é montado
   */
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    // Estado
    ...state,
    
    // Funções
    loadMetrics,
    loadCharts,
    loadRecentTransactions,
    loadAlerts,
    loadAllData,
    updateData,
    markAlertAsRead,
    updateRevenueExpenseChart,
    updateCashFlowChart,
    updateCategoryDistributionChart,
    clearError,
  };
}; 