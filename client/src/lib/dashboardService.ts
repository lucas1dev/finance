import api from './axios';

/**
 * Interface para métricas financeiras do dashboard
 */
export interface DashboardMetrics {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  cashFlow: number;
  pendingReceivables: number;
  pendingPayables: number;
  investmentTotal: number;
  financingTotal: number;
}

/**
 * Interface para dados de gráficos
 */
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

/**
 * Interface para transações recentes
 */
export interface RecentTransaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  date: string;
}

/**
 * Interface para alertas do dashboard
 */
export interface DashboardAlert {
  id: number;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  date: string;
}

/**
 * Interface para dados do dashboard
 */
export interface DashboardData {
  metrics: DashboardMetrics;
  recentTransactions: RecentTransaction[];
  alerts: DashboardAlert[];
  charts: {
    revenueExpense: ChartData;
    cashFlow: ChartData;
    categoryDistribution: ChartData;
    investmentDistribution: ChartData;
  };
}

/**
 * Serviço para gerenciar dados do dashboard
 */
class DashboardService {
  /**
   * Obtém todos os dados do dashboard
   * @returns Promise com os dados do dashboard
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas financeiras do dashboard
   * @returns Promise com as métricas financeiras
   */
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await api.get('/dashboard/metrics');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar métricas do dashboard:', error);
      throw error;
    }
  }

  /**
   * Obtém transações recentes
   * @param limit - Limite de transações a retornar
   * @returns Promise com as transações recentes
   */
  async getRecentTransactions(limit: number = 10): Promise<RecentTransaction[]> {
    try {
      const response = await api.get('/dashboard');
      const dashboardData = response.data;
      
      if (dashboardData.recentTransactions) {
        return dashboardData.recentTransactions.slice(0, limit);
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao buscar transações recentes:', error);
      throw error;
    }
  }

  /**
   * Obtém alertas do dashboard
   * @returns Promise com os alertas
   */
  async getAlerts(): Promise<DashboardAlert[]> {
    try {
      const response = await api.get('/dashboard/alerts');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar alertas do dashboard:', error);
      throw error;
    }
  }

  /**
   * Obtém dados para gráfico de receitas vs despesas
   * @param period - Período dos dados (month, quarter, year)
   * @returns Promise com os dados do gráfico
   */
  async getRevenueExpenseChart(period: string = 'month'): Promise<ChartData> {
    try {
      const response = await api.get('/dashboard/charts');
      const chartsData = response.data;
      
      if (chartsData.categoryDistribution) {
        const labels = chartsData.categoryDistribution.map((cat: any) => cat.name);
        const incomeData = chartsData.categoryDistribution.map((cat: any) => cat.income);
        const expenseData = chartsData.categoryDistribution.map((cat: any) => cat.expenses);
        
        return {
          labels,
          datasets: [
            {
              label: 'Receitas',
              data: incomeData,
              backgroundColor: chartsData.categoryDistribution.map((cat: any) => cat.color),
            },
            {
              label: 'Despesas',
              data: expenseData,
              backgroundColor: chartsData.categoryDistribution.map((cat: any) => cat.color),
            }
          ]
        };
      }
      
      return {
        labels: [],
        datasets: []
      };
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico de receitas vs despesas:', error);
      throw error;
    }
  }

  /**
   * Obtém dados para gráfico de fluxo de caixa
   * @param days - Número de dias para o gráfico
   * @returns Promise com os dados do gráfico
   */
  async getCashFlowChart(days: number = 30): Promise<ChartData> {
    try {
      const response = await api.get('/dashboard/charts');
      const chartsData = response.data;
      
      if (chartsData.balanceEvolution) {
        const labels = chartsData.balanceEvolution.map((month: any) => month.month);
        const balanceData = chartsData.balanceEvolution.map((month: any) => month.balance);
        
        return {
          labels,
          datasets: [
            {
              label: 'Saldo',
              data: balanceData,
              borderColor: '#3B82F6',
              fill: false,
            }
          ]
        };
      }
      
      return {
        labels: [],
        datasets: []
      };
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico de fluxo de caixa:', error);
      throw error;
    }
  }

  /**
   * Obtém dados para gráfico de distribuição por categoria
   * @param type - Tipo de transação (income, expense)
   * @returns Promise com os dados do gráfico
   */
  async getCategoryDistributionChart(type: 'income' | 'expense' = 'expense'): Promise<ChartData> {
    try {
      const response = await api.get('/dashboard/charts');
      const chartsData = response.data;
      
      if (chartsData.categoryDistribution) {
        const labels = chartsData.categoryDistribution.map((cat: any) => cat.name);
        const data = chartsData.categoryDistribution.map((cat: any) => 
          type === 'income' ? cat.income : cat.expenses
        );
        const colors = chartsData.categoryDistribution.map((cat: any) => cat.color);
        
        return {
          labels,
          datasets: [
            {
              label: type === 'income' ? 'Receitas' : 'Despesas',
              data,
              backgroundColor: colors,
            }
          ]
        };
      }
      
      return {
        labels: [],
        datasets: []
      };
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico de distribuição por categoria:', error);
      throw error;
    }
  }

  /**
   * Obtém dados para gráfico de distribuição de investimentos
   * @returns Promise com os dados do gráfico
   */
  async getInvestmentDistributionChart(): Promise<ChartData> {
    try {
      return {
        labels: [],
        datasets: []
      };
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico de distribuição de investimentos:', error);
      throw error;
    }
  }

  /**
   * Marca um alerta como lido
   * @param alertId - ID do alerta
   * @returns Promise indicando sucesso
   */
  async markAlertAsRead(alertId: number): Promise<void> {
    try {
      await api.put(`/dashboard/alerts/${alertId}/read`);
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de performance do sistema (apenas para admins)
   * @returns Promise com as estatísticas do sistema
   */
  async getSystemStats(): Promise<any> {
    try {
      const response = await api.get('/dashboard/system-stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas do sistema:', error);
      throw error;
    }
  }
}

export default new DashboardService(); 