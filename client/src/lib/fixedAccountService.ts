import api from '@/lib/axios';

/**
 * Interface para uma conta fixa
 */
export interface FixedAccount {
  id: number;
  user_id: number;
  description: string;
  amount: number;
  periodicity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  category_id: number;
  supplier_id?: number;
  account_id?: number;
  payment_method?: 'card' | 'boleto' | 'automatic_debit';
  observations?: string;
  reminder_days: number;
  is_active: boolean;
  is_paid: boolean;
  next_due_date: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
    color: string;
  };
  supplier?: {
    id: number;
    name: string;
  };
  account?: {
    id: number;
    bank_name: string;
    account_type: string;
  };
}

/**
 * Interface para criação de conta fixa
 */
export interface CreateFixedAccountData {
  description: string;
  amount: number;
  periodicity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  category_id: number;
  supplier_id?: number;
  account_id?: number;
  payment_method?: 'card' | 'boleto' | 'automatic_debit';
  observations?: string;
  reminder_days?: number;
}

/**
 * Interface para atualização de conta fixa
 */
export interface UpdateFixedAccountData extends Partial<CreateFixedAccountData> {}

/**
 * Interface para filtros de busca
 */
export interface FixedAccountFilters {
  search?: string;
  periodicity?: string;
  category_id?: number;
  supplier_id?: number;
  is_active?: boolean;
  is_paid?: boolean;
  start_date?: string;
  end_date?: string;
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
 * Interface para estatísticas de contas fixas
 */
export interface FixedAccountStats {
  total: number;
  totalAmount: number;
  active: number;
  inactive: number;
  paid: number;
  unpaid: number;
  overdue: number;
  dueThisMonth: number;
  dueNextMonth: number;
  byPeriodicity: {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  byCategory: Record<string, {
    count: number;
    totalAmount: number;
    color: string;
  }>;
  bySupplier: Record<string, {
    count: number;
    totalAmount: number;
  }>;
  totalMonthlyValue: number;
  totalYearlyValue: number;
}

/**
 * Serviço para gerenciar contas fixas
 */
class FixedAccountService {
  /**
   * Obtém lista de contas fixas com filtros e paginação
   * @param filters - Filtros para a busca
   * @param pagination - Parâmetros de paginação
   * @returns Promise com contas fixas paginadas
   */
  async getFixedAccounts(
    filters: FixedAccountFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<FixedAccount>> {
    try {
      console.log('🔍 [FixedAccountService] Buscando contas fixas...');
      
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
      
      const response = await api.get(`/fixed-accounts?${params.toString()}`);
      
      // Se a resposta não for paginada, cria uma estrutura paginada
      if (response.data.success && Array.isArray(response.data.data)) {
        const data = response.data.data;
        return {
          data,
          pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || data.length,
            total: data.length,
            total_pages: 1
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ [FixedAccountService] Erro ao buscar contas fixas:', error);
      throw error;
    }
  }

  /**
   * Obtém uma conta fixa específica por ID
   * @param id - ID da conta fixa
   * @returns Promise com a conta fixa
   */
  async getFixedAccount(id: number): Promise<FixedAccount> {
    try {
      console.log(`🔍 [FixedAccountService] Buscando conta fixa ID: ${id}`);
      const response = await api.get(`/fixed-accounts/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`❌ [FixedAccountService] Erro ao buscar conta fixa ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cria uma nova conta fixa
   * @param data - Dados da conta fixa
   * @returns Promise com a conta fixa criada
   */
  async createFixedAccount(data: CreateFixedAccountData): Promise<FixedAccount> {
    try {
      console.log('🔍 [FixedAccountService] Criando conta fixa:', data);
      const response = await api.post('/fixed-accounts', data);
      console.log('✅ [FixedAccountService] Conta fixa criada:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [FixedAccountService] Erro ao criar conta fixa:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma conta fixa existente
   * @param id - ID da conta fixa
   * @param data - Dados para atualização
   * @returns Promise com a conta fixa atualizada
   */
  async updateFixedAccount(id: number, data: UpdateFixedAccountData): Promise<FixedAccount> {
    try {
      console.log(`🔍 [FixedAccountService] Atualizando conta fixa ID: ${id}`, data);
      const response = await api.put(`/fixed-accounts/${id}`, data);
      console.log('✅ [FixedAccountService] Conta fixa atualizada:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error(`❌ [FixedAccountService] Erro ao atualizar conta fixa ${id}:`, error);
      throw error;
    }
  }

  /**
   * Exclui uma conta fixa
   * @param id - ID da conta fixa
   * @returns Promise indicando sucesso
   */
  async deleteFixedAccount(id: number): Promise<void> {
    try {
      console.log(`🔍 [FixedAccountService] Excluindo conta fixa ID: ${id}`);
      await api.delete(`/fixed-accounts/${id}`);
      console.log('✅ [FixedAccountService] Conta fixa excluída com sucesso');
    } catch (error) {
      console.error(`❌ [FixedAccountService] Erro ao excluir conta fixa ${id}:`, error);
      throw error;
    }
  }

  /**
   * Ativa ou desativa uma conta fixa
   * @param id - ID da conta fixa
   * @param isActive - Status de ativação
   * @returns Promise com a conta fixa atualizada
   */
  async toggleFixedAccount(id: number, isActive: boolean): Promise<FixedAccount> {
    try {
      console.log(`🔍 [FixedAccountService] Alterando status da conta fixa ID: ${id} para: ${isActive}`);
      const response = await api.patch(`/fixed-accounts/${id}/toggle`, { is_active: isActive });
      console.log('✅ [FixedAccountService] Status da conta fixa alterado:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error(`❌ [FixedAccountService] Erro ao alterar status da conta fixa ${id}:`, error);
      throw error;
    }
  }

  /**
   * Marca uma conta fixa como paga
   * @param id - ID da conta fixa
   * @param paymentDate - Data do pagamento (opcional)
   * @returns Promise com a transação criada
   */
  async payFixedAccount(id: number, paymentDate?: string): Promise<any> {
    try {
      console.log(`🔍 [FixedAccountService] Marcando conta fixa ID: ${id} como paga`);
      const data = paymentDate ? { payment_date: paymentDate } : {};
      const response = await api.post(`/fixed-accounts/${id}/pay`, data);
      console.log('✅ [FixedAccountService] Conta fixa marcada como paga:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ [FixedAccountService] Erro ao marcar conta fixa ${id} como paga:`, error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas das contas fixas
   * @returns Promise com estatísticas
   */
  async getFixedAccountStats(): Promise<FixedAccountStats> {
    try {
      console.log('🔍 [FixedAccountService] Buscando estatísticas...');
      const response = await api.get('/fixed-accounts/statistics');
      console.log('✅ [FixedAccountService] Estatísticas obtidas:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [FixedAccountService] Erro ao buscar estatísticas:', error);
      // Retorna estatísticas vazias em caso de erro
      return {
        total: 0,
        totalAmount: 0,
        active: 0,
        inactive: 0,
        paid: 0,
        unpaid: 0,
        overdue: 0,
        dueThisMonth: 0,
        dueNextMonth: 0,
        byPeriodicity: {
          daily: 0,
          weekly: 0,
          monthly: 0,
          quarterly: 0,
          yearly: 0
        },
        byCategory: {},
        bySupplier: {},
        totalMonthlyValue: 0,
        totalYearlyValue: 0
      };
    }
  }

  /**
   * Exporta contas fixas para CSV
   * @param filters - Filtros para a exportação
   * @returns Promise com o blob do arquivo CSV
   */
  async exportFixedAccounts(filters: FixedAccountFilters = {}): Promise<Blob> {
    try {
      console.log('🔍 [FixedAccountService] Exportando contas fixas...');
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/fixed-accounts/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      console.log('✅ [FixedAccountService] Contas fixas exportadas');
      return response.data;
    } catch (error) {
      console.error('❌ [FixedAccountService] Erro ao exportar contas fixas:', error);
      throw error;
    }
  }

  /**
   * Obtém label da periodicidade
   * @param periodicity - Periodicidade
   * @returns Label em português
   */
  getPeriodicityLabel(periodicity: string): string {
    const labels: Record<string, string> = {
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual'
    };
    return labels[periodicity] || periodicity;
  }

  /**
   * Obtém label do método de pagamento
   * @param paymentMethod - Método de pagamento
   * @returns Label em português
   */
  getPaymentMethodLabel(paymentMethod: string): string {
    const labels: Record<string, string> = {
      card: 'Cartão',
      boleto: 'Boleto',
      automatic_debit: 'Débito Automático'
    };
    return labels[paymentMethod] || paymentMethod;
  }

  /**
   * Verifica se uma conta fixa está em atraso
   * @param nextDueDate - Próxima data de vencimento
   * @returns true se estiver em atraso
   */
  isOverdue(nextDueDate: string): boolean {
    const today = new Date();
    const dueDate = new Date(nextDueDate);
    return dueDate < today;
  }

  /**
   * Calcula dias em atraso
   * @param nextDueDate - Próxima data de vencimento
   * @returns Número de dias em atraso
   */
  calculateDaysOverdue(nextDueDate: string): number {
    const today = new Date();
    const dueDate = new Date(nextDueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Obtém cor do status
   * @param isPaid - Se está paga
   * @param isOverdue - Se está em atraso
   * @returns Classe CSS para cor
   */
  getStatusColor(isPaid: boolean, isOverdue: boolean): string {
    if (isPaid) return 'bg-green-100 text-green-800';
    if (isOverdue) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  }

  /**
   * Obtém label do status
   * @param isPaid - Se está paga
   * @param isOverdue - Se está em atraso
   * @returns Label do status
   */
  getStatusLabel(isPaid: boolean, isOverdue: boolean): string {
    if (isPaid) return 'Paga';
    if (isOverdue) return 'Em Atraso';
    return 'Pendente';
  }
}

export default new FixedAccountService(); 