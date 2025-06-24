/**
 * Serviço para gerenciamento de recebíveis
 * @module receivableService
 * @author Lucas
 */

import api from '@/lib/axios';

/**
 * Interface para um recebível
 */
export interface Receivable {
  id: number;
  user_id: number;
  customer_id: number;
  customer_name?: string;
  category_id?: number;
  category_name?: string;
  amount: number;
  due_date: string;
  description?: string;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  remaining_amount: number;
  invoice_number?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
  payments?: ReceivablePayment[];
}

/**
 * Interface para pagamento de recebível
 */
export interface ReceivablePayment {
  id: number;
  receivable_id: number;
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
  created_at: string;
}

/**
 * Interface para criação de recebível
 */
export interface CreateReceivableData {
  customer_id: number;
  category_id?: number;
  amount: number;
  due_date: string;
  description?: string;
  invoice_number?: string;
  payment_terms?: string;
}

/**
 * Interface para atualização de recebível
 */
export interface UpdateReceivableData {
  customer_id?: number;
  category_id?: number;
  amount?: number;
  due_date?: string;
  description?: string;
  status?: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  invoice_number?: string;
  payment_terms?: string;
}

/**
 * Interface para criação de pagamento
 */
export interface CreatePaymentData {
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
  account_id: number;
  description?: string;
}

/**
 * Interface para estatísticas de recebíveis
 */
export interface ReceivableStats {
  total_receivables: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  overdue_count: number;
  average_days_to_pay: number;
  top_customers: {
    id: number;
    name: string;
    total_receivables: number;
    receivables_count: number;
  }[];
  receivables_by_status: {
    status: string;
    count: number;
    amount: number;
    percentage: number;
  }[];
  receivables_by_month: {
    month: string;
    count: number;
    amount: number;
  }[];
}

/**
 * Interface para filtros de recebíveis
 */
export interface ReceivableFilters {
  search?: string;
  customer_id?: number;
  category_id?: number;
  status?: 'pending' | 'partially_paid' | 'paid' | 'overdue';
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
 * Serviço para gerenciar recebíveis
 */
class ReceivableService {
  /**
   * Obtém lista de recebíveis com filtros e paginação
   * @param filters - Filtros para a busca
   * @param pagination - Parâmetros de paginação
   * @returns Promise com recebíveis paginados
   */
  async getReceivables(
    filters: ReceivableFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Receivable>> {
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
      
      const response = await api.get(`/receivables?${params.toString()}`);
      
      // O backend retorna um array simples, não paginado
      // Vamos simular a paginação no frontend
      const receivables = Array.isArray(response.data) ? response.data : [];
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = receivables.slice(startIndex, endIndex);
      
      return {
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: receivables.length,
          total_pages: Math.ceil(receivables.length / limit)
        }
      };
    } catch (error) {
      console.error('Erro ao buscar recebíveis:', error);
      // Retorna dados vazios em caso de erro
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 0
        }
      };
    }
  }

  /**
   * Obtém um recebível específico por ID
   * @param id - ID do recebível
   * @returns Promise com o recebível
   */
  async getReceivable(id: number): Promise<Receivable> {
    try {
      const response = await api.get(`/receivables/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recebível:', error);
      throw error;
    }
  }

  /**
   * Cria um novo recebível
   * @param data - Dados do recebível
   * @returns Promise com o recebível criado
   */
  async createReceivable(data: CreateReceivableData): Promise<Receivable> {
    try {
      const response = await api.post('/receivables', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar recebível:', error);
      throw error;
    }
  }

  /**
   * Atualiza um recebível existente
   * @param id - ID do recebível
   * @param data - Dados para atualização
   * @returns Promise com o recebível atualizado
   */
  async updateReceivable(id: number, data: UpdateReceivableData): Promise<Receivable> {
    try {
      const response = await api.put(`/receivables/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar recebível:', error);
      throw error;
    }
  }

  /**
   * Exclui um recebível
   * @param id - ID do recebível
   * @returns Promise indicando sucesso
   */
  async deleteReceivable(id: number): Promise<void> {
    try {
      await api.delete(`/receivables/${id}`);
    } catch (error) {
      console.error('Erro ao excluir recebível:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status de um recebível
   * @param id - ID do recebível
   * @param status - Novo status
   * @returns Promise com o recebível atualizado
   */
  async updateReceivableStatus(id: number, status: 'pending' | 'partially_paid' | 'paid' | 'overdue'): Promise<Receivable> {
    try {
      const response = await api.patch(`/receivables/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar status do recebível:', error);
      throw error;
    }
  }

  /**
   * Registra um pagamento para um recebível
   * @param receivableId - ID do recebível
   * @param data - Dados do pagamento
   * @returns Promise com o pagamento criado
   */
  async addPayment(receivableId: number, data: CreatePaymentData): Promise<ReceivablePayment> {
    try {
      console.log('🔍 ReceivableService.addPayment - Dados enviados:', JSON.stringify(data, null, 2));
      
      const response = await api.post(`/receivables/${receivableId}/payments`, data);
      
      console.log('✅ ReceivableService.addPayment - Resposta:', JSON.stringify(response.data, null, 2));
      return response.data.payment;
    } catch (error: any) {
      console.error('❌ ReceivableService.addPayment - Erro:', error);
      
      if (error.response?.data?.details) {
        const details = error.response.data.details;
        const messages = details.map((detail: any) => `${detail.field}: ${detail.message}`).join(', ');
        throw new Error(`Dados inválidos: ${messages}`);
      }
      
      throw new Error(error.response?.data?.error || 'Erro ao registrar pagamento');
    }
  }

  /**
   * Obtém pagamentos de um recebível
   * @param receivableId - ID do recebível
   * @returns Promise com lista de pagamentos
   */
  async getReceivablePayments(receivableId: number): Promise<ReceivablePayment[]> {
    try {
      const response = await api.get(`/receivables/${receivableId}/payments`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pagamentos do recebível:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas dos recebíveis
   * @param period - Período para as estatísticas
   * @returns Promise com estatísticas
   */
  async getReceivableStats(period: 'month' | 'quarter' | 'year' = 'month'): Promise<ReceivableStats> {
    try {
      const response = await api.get(`/receivables/stats?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas dos recebíveis:', error);
      // Retorna estatísticas vazias em caso de erro
      return {
        total_receivables: 0,
        total_amount: 0,
        paid_amount: 0,
        pending_amount: 0,
        overdue_amount: 0,
        overdue_count: 0,
        average_days_to_pay: 0,
        top_customers: [],
        receivables_by_status: [],
        receivables_by_month: []
      };
    }
  }

  /**
   * Exporta dados dos recebíveis
   * @param filters - Filtros para exportação
   * @returns Promise com blob dos dados
   */
  async exportReceivables(filters: ReceivableFilters = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/receivables/export?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar recebíveis:', error);
      throw error;
    }
  }

  /**
   * Calcula dias em atraso
   * @param dueDate - Data de vencimento
   * @returns Número de dias em atraso
   */
  calculateDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Verifica se um recebível está em atraso
   * @param dueDate - Data de vencimento
   * @returns true se em atraso, false caso contrário
   */
  isOverdue(dueDate: string): boolean {
    return this.calculateDaysOverdue(dueDate) > 0;
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
   * Obtém label do status
   * @param status - Status do recebível
   * @returns Label do status
   */
  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendente',
      partially_paid: 'Parcialmente Pago',
      paid: 'Pago',
      overdue: 'Em Atraso'
    };
    return statusMap[status] || status;
  }

  /**
   * Obtém cor do status
   * @param status - Status do recebível
   * @returns Classe CSS da cor
   */
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      pending: 'text-yellow-600',
      partially_paid: 'text-blue-600',
      paid: 'text-green-600',
      overdue: 'text-red-600'
    };
    return colorMap[status] || 'text-gray-600';
  }
}

export default new ReceivableService(); 