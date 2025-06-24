import { useState, useEffect, useCallback } from 'react';
import dashboardService, { ChartData } from '../lib/dashboardService';

/**
 * Dados para gráfico de receitas vs despesas
 */
interface RevenueExpenseData {
  revenues: Array<{
    category: string;
    amount: number;
    color: string;
  }>;
  expenses: Array<{
    category: string;
    amount: number;
    color: string;
  }>;
  monthly: Array<{
    month: string;
    revenue: number;
    expense: number;
  }>;
}

/**
 * Dados para gráfico de fluxo de caixa
 */
interface CashFlowData {
  daily: Array<{
    date: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  monthly: Array<{
    month: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  projection: Array<{
    date: string;
    projectedBalance: number;
  }>;
}

/**
 * Dados para gráfico de distribuição de investimentos
 */
interface InvestmentDistributionData {
  investments: Array<{
    name: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  total: number;
}

/**
 * Estado do hook de dados de gráficos
 */
interface ChartDataState {
  revenueExpense: ChartData | null;
  cashFlow: ChartData | null;
  investmentDistribution: ChartData | null;
  loading: {
    revenueExpense: boolean;
    cashFlow: boolean;
    investmentDistribution: boolean;
  };
  error: {
    revenueExpense: string | null;
    cashFlow: string | null;
    investmentDistribution: string | null;
  };
}

/**
 * Hook para gerenciar dados de gráficos com cache e atualização automática.
 * Fornece dados para gráficos de receitas vs despesas, fluxo de caixa e distribuição de investimentos.
 * @returns Estado e funções para gerenciar dados de gráficos
 * @example
 * const { revenueExpense, cashFlow, loading, error, refreshData } = useChartData();
 */
export function useChartData() {
  const [state, setState] = useState<ChartDataState>({
    revenueExpense: null,
    cashFlow: null,
    investmentDistribution: null,
    loading: {
      revenueExpense: false,
      cashFlow: false,
      investmentDistribution: false
    },
    error: {
      revenueExpense: null,
      cashFlow: null,
      investmentDistribution: null
    }
  });

  /**
   * Carrega dados de receitas vs despesas
   */
  const loadRevenueExpenseData = useCallback(async () => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, revenueExpense: true },
      error: { ...prev.error, revenueExpense: null }
    }));

    try {
      const data = await dashboardService.getRevenueExpenseChart();
      setState(prev => ({
        ...prev,
        revenueExpense: data,
        loading: { ...prev.loading, revenueExpense: false }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, revenueExpense: false },
        error: { 
          ...prev.error, 
          revenueExpense: error instanceof Error ? error.message : 'Erro ao carregar dados de receitas vs despesas'
        }
      }));
    }
  }, []);

  /**
   * Carrega dados de fluxo de caixa
   */
  const loadCashFlowData = useCallback(async () => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, cashFlow: true },
      error: { ...prev.error, cashFlow: null }
    }));

    try {
      const data = await dashboardService.getCashFlowChart();
      setState(prev => ({
        ...prev,
        cashFlow: data,
        loading: { ...prev.loading, cashFlow: false }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, cashFlow: false },
        error: { 
          ...prev.error, 
          cashFlow: error instanceof Error ? error.message : 'Erro ao carregar dados de fluxo de caixa'
        }
      }));
    }
  }, []);

  /**
   * Carrega dados de distribuição de investimentos
   */
  const loadInvestmentDistributionData = useCallback(async () => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, investmentDistribution: true },
      error: { ...prev.error, investmentDistribution: null }
    }));

    try {
      const data = await dashboardService.getInvestmentDistributionChart();
      setState(prev => ({
        ...prev,
        investmentDistribution: data,
        loading: { ...prev.loading, investmentDistribution: false }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, investmentDistribution: false },
        error: { 
          ...prev.error, 
          investmentDistribution: error instanceof Error ? error.message : 'Erro ao carregar dados de investimentos'
        }
      }));
    }
  }, []);

  /**
   * Carrega todos os dados de gráficos
   */
  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadRevenueExpenseData(),
      loadCashFlowData(),
      loadInvestmentDistributionData()
    ]);
  }, [loadRevenueExpenseData, loadCashFlowData, loadInvestmentDistributionData]);

  /**
   * Atualiza dados específicos
   */
  const refreshData = useCallback((type?: 'revenueExpense' | 'cashFlow' | 'investmentDistribution') => {
    if (!type) {
      return loadAllData();
    }

    switch (type) {
      case 'revenueExpense':
        return loadRevenueExpenseData();
      case 'cashFlow':
        return loadCashFlowData();
      case 'investmentDistribution':
        return loadInvestmentDistributionData();
    }
  }, [loadAllData, loadRevenueExpenseData, loadCashFlowData, loadInvestmentDistributionData]);

  /**
   * Carrega dados na montagem do componente
   */
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    // Dados
    revenueExpense: state.revenueExpense,
    cashFlow: state.cashFlow,
    investmentDistribution: state.investmentDistribution,
    
    // Estados de loading
    loading: state.loading,
    
    // Estados de erro
    error: state.error,
    
    // Funções
    refreshData,
    loadRevenueExpenseData,
    loadCashFlowData,
    loadInvestmentDistributionData,
    loadAllData
  };
} 