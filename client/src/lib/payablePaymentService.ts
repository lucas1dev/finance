/**
 * Serviço para gerenciamento de pagamentos de pagáveis
 * @module payablePaymentService
 * @description Integração completa com a API para gerenciar pagamentos de contas a pagar
 */

import api from './axios';

/**
 * Interface para um pagamento de pagável
 */
export interface PayablePayment {
  id: number;
  payable_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
  account_id: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  payable?: {
    id: number;
    description: string;
    amount: number;
    due_date: string;
    status: string;
    supplier?: {
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
export interface CreatePayablePaymentData {
  payable_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
  account_id: number;
  notes?: string;
}

/**
 * Interface para atualizar um pagamento
 */
export interface UpdatePayablePaymentData {
  amount?: number;
  payment_date?: string;
  payment_method?: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
  account_id?: number;
  notes?: string;
}

/**
 * Interface para filtros de pagamentos
 */
export interface PayablePaymentFilters {
  payable_id?: number;
  supplier_id?: number;
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
export interface PayablePaymentStats {
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
  top_suppliers: {
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
 * Serviço para gerenciar pagamentos de pagáveis
 */
class PayablePaymentService {
  /**
   * Obtém lista de pagamentos com filtros e paginação
   * @param filters - Filtros para a busca
   * @param pagination - Parâmetros de paginação
   * @returns Promise com pagamentos paginados
   */
  async getPayments(
    filters: PayablePaymentFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<PayablePayment>> {
    try {
      console.log('🔍 [PayablePaymentService] Buscando pagamentos com filtros:', filters);
      
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
      
      const response = await api.get(`/payments?${params.toString()}`);
      
      // O backend retorna um array simples, não paginado
      // Vamos simular a paginação no frontend
      const payments = Array.isArray(response.data) ? response.data : [];
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = payments.slice(startIndex, endIndex);
      
      console.log('✅ [PayablePaymentService] Pagamentos encontrados:', payments.length);
      
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
      console.error('❌ [PayablePaymentService] Erro ao buscar pagamentos:', error);
      throw error;
    }
  }

  /**
   * Obtém um pagamento específico
   * @param id - ID do pagamento
   * @returns Promise com os detalhes do pagamento
   */
  async getPayment(id: number): Promise<PayablePayment> {
    try {
      console.log(`🔍 [PayablePaymentService] Buscando pagamento ID: ${id}`);
      const response = await api.get(`/payments/${id}`);
      console.log('✅ [PayablePaymentService] Pagamento encontrado:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ [PayablePaymentService] Erro ao buscar pagamento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cria um novo pagamento
   * @param data - Dados do pagamento
   * @returns Promise com o pagamento criado
   */
  async createPayment(data: CreatePayablePaymentData): Promise<PayablePayment> {
    try {
      console.log('🔍 [PayablePaymentService] Criando pagamento:', data);
      const response = await api.post('/payments', data);
      console.log('✅ [PayablePaymentService] Pagamento criado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [PayablePaymentService] Erro ao criar pagamento:', error);
      throw error;
    }
  }

  /**
   * Atualiza um pagamento existente
   * @param id - ID do pagamento
   * @param data - Dados para atualização
   * @returns Promise com o pagamento atualizado
   */
  async updatePayment(id: number, data: UpdatePayablePaymentData): Promise<PayablePayment> {
    try {
      console.log(`🔍 [PayablePaymentService] Atualizando pagamento ID: ${id}`, data);
      const response = await api.patch(`/payments/${id}`, data);
      console.log('✅ [PayablePaymentService] Pagamento atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ [PayablePaymentService] Erro ao atualizar pagamento ${id}:`, error);
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
      console.log(`🔍 [PayablePaymentService] Removendo pagamento ID: ${id}`);
      await api.delete(`/payments/${id}`);
      console.log('✅ [PayablePaymentService] Pagamento removido com sucesso');
    } catch (error) {
      console.error(`❌ [PayablePaymentService] Erro ao remover pagamento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtém pagamentos de uma conta a pagar específica
   * @param payableId - ID da conta a pagar
   * @returns Promise com lista de pagamentos
   */
  async getPaymentsByPayable(payableId: number): Promise<PayablePayment[]> {
    try {
      console.log(`🔍 [PayablePaymentService] Buscando pagamentos da conta a pagar ID: ${payableId}`);
      const response = await api.get(`/payables/${payableId}/payments`);
      console.log('✅ [PayablePaymentService] Pagamentos encontrados:', response.data.length);
      return response.data;
    } catch (error) {
      console.error(`❌ [PayablePaymentService] Erro ao buscar pagamentos da conta a pagar ${payableId}:`, error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de pagamentos
   * @param period - Período para as estatísticas
   * @returns Promise com estatísticas
   */
  async getPaymentStats(period: 'month' | 'quarter' | 'year' = 'month'): Promise<PayablePaymentStats> {
    try {
      console.log(`🔍 [PayablePaymentService] Buscando estatísticas do período: ${period}`);
      const response = await api.get(`/payments/stats?period=${period}`);
      console.log('✅ [PayablePaymentService] Estatísticas obtidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [PayablePaymentService] Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  /**
   * Exporta pagamentos para CSV
   * @param filters - Filtros para exportação
   * @returns Promise com o arquivo CSV
   */
  async exportPayments(filters: PayablePaymentFilters = {}): Promise<Blob> {
    try {
      console.log('🔍 [PayablePaymentService] Exportando pagamentos:', filters);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/payments/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      console.log('✅ [PayablePaymentService] Pagamentos exportados com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ [PayablePaymentService] Erro ao exportar pagamentos:', error);
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
      pending: 'Pendente',
      overdue: 'Vencido',
      cancelled: 'Cancelado'
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
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
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
const payablePaymentService = new PayablePaymentService();

export default payablePaymentService; 