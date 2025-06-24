/**
 * Serviço para gerenciamento de pagamentos de recebíveis
 * @module receivablePaymentService
 * @description Integração completa com a API para gerenciar pagamentos de contas a receber
 */

import api from './axios';

/**
 * Interface para um pagamento de recebível
 */
export interface ReceivablePayment {
  id: number;
  receivable_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
  account_id: number;
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  receivable?: {
    id: number;
    description: string;
    amount: number;
    due_date: string;
    status: string;
    customer?: {
      id: number;
      name: string;
      document: string;
      email?: string;
    };
    category?: {
      id: number;
      name: string;
      color: string;
    };
  };
  account?: {
    id: number;
    bank_name: string;
    account_type: string;
    balance: number;
  };
}

/**
 * Interface para criar um pagamento
 */
export interface CreateReceivablePaymentData {
  receivable_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
  account_id: number;
  reference?: string;
  notes?: string;
}

/**
 * Interface para atualizar um pagamento
 */
export interface UpdateReceivablePaymentData {
  amount?: number;
  payment_date?: string;
  payment_method?: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
  account_id?: number;
  reference?: string;
  notes?: string;
}

/**
 * Interface para filtros de pagamentos
 */
export interface ReceivablePaymentFilters {
  receivable_id?: number;
  customer_id?: number;
  category_id?: number;
  payment_method?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  account_id?: number;
}

/**
 * Interface para estatísticas de pagamentos
 */
export interface ReceivablePaymentStats {
  total_payments: number;
  total_amount: number;
  average_amount: number;
  payments_by_method: {
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }[];
  payments_by_month: {
    month: string;
    count: number;
    amount: number;
  }[];
  top_customers: {
    id: number;
    name: string;
    total_payments: number;
    total_amount: number;
  }[];
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
 * Serviço para gerenciar pagamentos de recebíveis
 */
class ReceivablePaymentService {
  /**
   * Obtém lista de pagamentos com filtros e paginação
   * @param filters - Filtros para a busca
   * @param pagination - Parâmetros de paginação
   * @returns Promise com pagamentos paginados
   */
  async getPayments(
    filters: ReceivablePaymentFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<ReceivablePayment>> {
    try {
      console.log('🔍 [ReceivablePaymentService] Buscando pagamentos com filtros:', filters);
      
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
      
      const response = await api.get(`/receivable-payments?${params.toString()}`);
      
      // O backend retorna um array simples, não paginado
      // Vamos simular a paginação no frontend
      const payments = Array.isArray(response.data) ? response.data : [];
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = payments.slice(startIndex, endIndex);
      
      console.log('✅ [ReceivablePaymentService] Pagamentos encontrados:', payments.length);
      
      return {
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: payments.length,
          total_pages: Math.ceil(payments.length / limit)
        }
      };
    } catch (error) {
      console.error('❌ [ReceivablePaymentService] Erro ao buscar pagamentos:', error);
      throw error;
    }
  }

  /**
   * Obtém um pagamento específico
   * @param id - ID do pagamento
   * @returns Promise com os detalhes do pagamento
   */
  async getPayment(id: number): Promise<ReceivablePayment> {
    try {
      console.log(`🔍 [ReceivablePaymentService] Buscando pagamento ID: ${id}`);
      const response = await api.get(`/receivable-payments/${id}`);
      console.log('✅ [ReceivablePaymentService] Pagamento encontrado:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ [ReceivablePaymentService] Erro ao buscar pagamento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cria um novo pagamento
   * @param data - Dados do pagamento
   * @returns Promise com o pagamento criado
   */
  async createPayment(data: CreateReceivablePaymentData): Promise<ReceivablePayment> {
    try {
      console.log('🔍 [ReceivablePaymentService] Criando pagamento:', data);
      const response = await api.post('/receivable-payments', data);
      console.log('✅ [ReceivablePaymentService] Pagamento criado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [ReceivablePaymentService] Erro ao criar pagamento:', error);
      throw error;
    }
  }

  /**
   * Atualiza um pagamento existente
   * @param id - ID do pagamento
   * @param data - Dados para atualização
   * @returns Promise com o pagamento atualizado
   */
  async updatePayment(id: number, data: UpdateReceivablePaymentData): Promise<ReceivablePayment> {
    try {
      console.log(`🔍 [ReceivablePaymentService] Atualizando pagamento ID: ${id}`, data);
      const response = await api.patch(`/receivable-payments/${id}`, data);
      console.log('✅ [ReceivablePaymentService] Pagamento atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ [ReceivablePaymentService] Erro ao atualizar pagamento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove um pagamento
   * @param id - ID do pagamento
   * @returns Promise vazio
   */
  async deletePayment(id: number): Promise<void> {
    try {
      console.log(`🔍 [ReceivablePaymentService] Removendo pagamento ID: ${id}`);
      await api.delete(`/receivable-payments/${id}`);
      console.log('✅ [ReceivablePaymentService] Pagamento removido com sucesso');
    } catch (error) {
      console.error(`❌ [ReceivablePaymentService] Erro ao remover pagamento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtém pagamentos de um recebível específico
   * @param receivableId - ID do recebível
   * @returns Promise com lista de pagamentos
   */
  async getPaymentsByReceivable(receivableId: number): Promise<ReceivablePayment[]> {
    try {
      console.log(`🔍 [ReceivablePaymentService] Buscando pagamentos do recebível ID: ${receivableId}`);
      const response = await api.get(`/receivables/${receivableId}/payments`);
      console.log('✅ [ReceivablePaymentService] Pagamentos encontrados:', response.data.length);
      return response.data;
    } catch (error) {
      console.error(`❌ [ReceivablePaymentService] Erro ao buscar pagamentos do recebível ${receivableId}:`, error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de pagamentos
   * @param period - Período para as estatísticas
   * @returns Promise com estatísticas
   */
  async getPaymentStats(period: 'month' | 'quarter' | 'year' = 'month'): Promise<ReceivablePaymentStats> {
    try {
      console.log(`🔍 [ReceivablePaymentService] Buscando estatísticas do período: ${period}`);
      const response = await api.get(`/receivable-payments/stats?period=${period}`);
      console.log('✅ [ReceivablePaymentService] Estatísticas obtidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [ReceivablePaymentService] Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  /**
   * Exporta pagamentos para CSV
   * @param filters - Filtros para exportação
   * @returns Promise com o arquivo CSV
   */
  async exportPayments(filters: ReceivablePaymentFilters = {}): Promise<Blob> {
    try {
      console.log('🔍 [ReceivablePaymentService] Exportando pagamentos:', filters);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/receivable-payments/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      console.log('✅ [ReceivablePaymentService] Pagamentos exportados com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ [ReceivablePaymentService] Erro ao exportar pagamentos:', error);
      throw error;
    }
  }

  /**
   * Calcula dias de atraso
   * @param dueDate - Data de vencimento
   * @returns Número de dias de atraso
   */
  calculateDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Verifica se está vencido
   * @param dueDate - Data de vencimento
   * @returns True se estiver vencido
   */
  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  /**
   * Formata valor monetário
   * @param value - Valor a ser formatado
   * @returns String formatada
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata data
   * @param date - Data a ser formatada
   * @returns String formatada
   */
  formatDate(date: string): string {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  }

  /**
   * Obtém label do status
   * @param status - Status do pagamento
   * @returns Label formatado
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      paid: 'Pago',
      partially_paid: 'Parcialmente Pago',
      pending: 'Pendente',
      overdue: 'Vencido'
    };
    return labels[status] || status;
  }

  /**
   * Obtém cor do status
   * @param status - Status do pagamento
   * @returns Cor para o badge
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtém label do método de pagamento
   * @param method - Método de pagamento
   * @returns Label formatado
   */
  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: 'Dinheiro',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      pix: 'PIX',
      bank_transfer: 'Transferência Bancária'
    };
    return labels[method] || method;
  }
}

// Instância única do serviço
const receivablePaymentService = new ReceivablePaymentService();

export default receivablePaymentService; 