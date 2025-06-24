/**
 * Serviço para gerenciamento de investimentos
 * @module investmentService
 * @author Lucas
 */

import api from '@/lib/axios';

/**
 * Interface para um investimento
 */
export interface Investment {
  id: number;
  user_id: number;
  name: string;
  type: 'stocks' | 'bonds' | 'funds' | 'crypto' | 'real_estate' | 'other';
  amount: number;
  current_value: number;
  purchase_date: string;
  purchase_price: number;
  current_price?: number;
  quantity?: number;
  broker?: string;
  description?: string;
  status: 'active' | 'sold' | 'pending';
  created_at: string;
  updated_at: string;
  transactions?: InvestmentTransaction[];
}

/**
 * Interface para transação de investimento
 */
export interface InvestmentTransaction {
  id: number;
  investment_id: number;
  type: 'buy' | 'sell' | 'dividend' | 'interest' | 'fee';
  amount: number;
  quantity?: number;
  price?: number;
  date: string;
  description?: string;
  created_at: string;
}

/**
 * Interface para criação de investimento
 */
export interface CreateInvestmentData {
  name: string;
  type: 'stocks' | 'bonds' | 'funds' | 'crypto' | 'real_estate' | 'other';
  amount: number;
  purchase_date: string;
  purchase_price: number;
  quantity?: number;
  broker?: string;
  description?: string;
}

/**
 * Interface para atualização de investimento
 */
export interface UpdateInvestmentData {
  name?: string;
  type?: 'stocks' | 'bonds' | 'funds' | 'crypto' | 'real_estate' | 'other';
  current_value?: number;
  current_price?: number;
  quantity?: number;
  broker?: string;
  description?: string;
  status?: 'active' | 'sold' | 'pending';
}

/**
 * Interface para criação de transação
 */
export interface CreateTransactionData {
  type: 'buy' | 'sell' | 'dividend' | 'interest' | 'fee';
  amount: number;
  quantity?: number;
  price?: number;
  date: string;
  description?: string;
}

/**
 * Interface para estatísticas de investimentos
 */
export interface InvestmentStats {
  total_investments: number;
  total_invested: number;
  total_current_value: number;
  total_profit_loss: number;
  total_profit_loss_percentage: number;
  investments_by_type: {
    type: string;
    count: number;
    amount: number;
    percentage: number;
  }[];
  top_performers: {
    id: number;
    name: string;
    profit_loss: number;
    profit_loss_percentage: number;
  }[];
  monthly_performance: {
    month: string;
    invested: number;
    current_value: number;
    profit_loss: number;
  }[];
}

/**
 * Interface para filtros de investimentos
 */
export interface InvestmentFilters {
  search?: string;
  type?: 'stocks' | 'bonds' | 'funds' | 'crypto' | 'real_estate' | 'other';
  status?: 'active' | 'sold' | 'pending';
  broker?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

/**
 * Interface para paginação
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Interface para resposta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Serviço para gerenciar investimentos
 */
class InvestmentService {
  /**
   * Obtém lista de investimentos com filtros e paginação
   * @param filters - Filtros para a busca
   * @param pagination - Parâmetros de paginação
   * @returns Promise com investimentos paginados
   */
  async getInvestments(
    filters: InvestmentFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Investment>> {
    try {
      const params = new URLSearchParams();
      
      // Adicionar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      // Adicionar parâmetros de paginação
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/investments?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar investimentos:', error);
      throw error;
    }
  }

  /**
   * Obtém um investimento específico por ID
   * @param id - ID do investimento
   * @returns Promise com o investimento
   */
  async getInvestment(id: number): Promise<Investment> {
    try {
      const response = await api.get(`/investments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar investimento:', error);
      throw error;
    }
  }

  /**
   * Cria um novo investimento
   * @param data - Dados do investimento
   * @returns Promise com o investimento criado
   */
  async createInvestment(data: CreateInvestmentData): Promise<Investment> {
    try {
      const response = await api.post('/investments', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar investimento:', error);
      throw error;
    }
  }

  /**
   * Atualiza um investimento existente
   * @param id - ID do investimento
   * @param data - Dados para atualização
   * @returns Promise com o investimento atualizado
   */
  async updateInvestment(id: number, data: UpdateInvestmentData): Promise<Investment> {
    try {
      const response = await api.put(`/investments/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar investimento:', error);
      throw error;
    }
  }

  /**
   * Exclui um investimento
   * @param id - ID do investimento
   * @returns Promise indicando sucesso
   */
  async deleteInvestment(id: number): Promise<void> {
    try {
      await api.delete(`/investments/${id}`);
    } catch (error) {
      console.error('Erro ao excluir investimento:', error);
      throw error;
    }
  }

  /**
   * Registra uma transação para um investimento
   * @param investmentId - ID do investimento
   * @param data - Dados da transação
   * @returns Promise com a transação criada
   */
  async addTransaction(investmentId: number, data: CreateTransactionData): Promise<InvestmentTransaction> {
    try {
      const response = await api.post(`/investments/${investmentId}/transactions`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar transação:', error);
      throw error;
    }
  }

  /**
   * Obtém transações de um investimento
   * @param investmentId - ID do investimento
   * @returns Promise com lista de transações
   */
  async getInvestmentTransactions(investmentId: number): Promise<InvestmentTransaction[]> {
    try {
      const response = await api.get(`/investments/${investmentId}/transactions`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar transações do investimento:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas dos investimentos
   * @param period - Período para as estatísticas
   * @returns Promise com estatísticas
   */
  async getInvestmentStats(period: 'month' | 'quarter' | 'year' = 'month'): Promise<InvestmentStats> {
    try {
      const response = await api.get(`/investments/stats?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas dos investimentos:', error);
      throw error;
    }
  }

  /**
   * Exporta dados dos investimentos
   * @param filters - Filtros para exportação
   * @returns Promise com blob dos dados
   */
  async exportInvestments(filters: InvestmentFilters = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/investments/export?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar investimentos:', error);
      throw error;
    }
  }

  /**
   * Calcula lucro/prejuízo de um investimento
   * @param investment - Investimento para calcular
   * @returns Lucro/prejuízo em valor e porcentagem
   */
  calculateProfitLoss(investment: Investment): { value: number; percentage: number } {
    const profitLoss = investment.current_value - investment.amount;
    const percentage = investment.amount > 0 ? (profitLoss / investment.amount) * 100 : 0;
    
    return {
      value: profitLoss,
      percentage: percentage
    };
  }

  /**
   * Calcula rentabilidade anualizada
   * @param investment - Investimento para calcular
   * @returns Rentabilidade anualizada em porcentagem
   */
  calculateAnnualizedReturn(investment: Investment): number {
    const purchaseDate = new Date(investment.purchase_date);
    const currentDate = new Date();
    const years = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (years <= 0) return 0;
    
    const totalReturn = (investment.current_value / investment.amount) - 1;
    const annualizedReturn = Math.pow(1 + totalReturn, 1 / years) - 1;
    
    return annualizedReturn * 100;
  }

  /**
   * Formata valor monetário
   * @param value - Valor para formatar
   * @returns Valor formatado
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata data
   * @param date - Data para formatar
   * @returns Data formatada
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  /**
   * Obtém label do tipo de investimento
   * @param type - Tipo do investimento
   * @returns Label do tipo
   */
  getTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      stocks: 'Ações',
      bonds: 'Títulos',
      funds: 'Fundos',
      crypto: 'Criptomoedas',
      real_estate: 'Imóveis',
      other: 'Outros'
    };
    return typeMap[type] || type;
  }

  /**
   * Obtém label do status
   * @param status - Status do investimento
   * @returns Label do status
   */
  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      active: 'Ativo',
      sold: 'Vendido',
      pending: 'Pendente'
    };
    return statusMap[status] || status;
  }

  /**
   * Obtém cor do status
   * @param status - Status do investimento
   * @returns Classe CSS da cor
   */
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      active: 'text-green-600',
      sold: 'text-blue-600',
      pending: 'text-yellow-600'
    };
    return colorMap[status] || 'text-gray-600';
  }

  /**
   * Obtém cor baseada no lucro/prejuízo
   * @param profitLoss - Valor do lucro/prejuízo
   * @returns Classe CSS da cor
   */
  getProfitLossColor(profitLoss: number): string {
    if (profitLoss > 0) return 'text-green-600';
    if (profitLoss < 0) return 'text-red-600';
    return 'text-gray-600';
  }
}

export default new InvestmentService(); 