import api from './axios';

/**
 * Interface para uma transação
 */
export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: number;
  account_id: number;
  date: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
    color: string;
    type: 'income' | 'expense';
  };
  account?: {
    id: number;
    name: string;
    type: string;
  };
}

/**
 * Interface para criação de transação
 */
export interface CreateTransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: number;
  account_id: number;
  date: string;
}

/**
 * Interface para atualização de transação
 */
export interface UpdateTransactionData {
  description?: string;
  amount?: number;
  type?: 'income' | 'expense';
  category_id?: number;
  account_id?: number;
  date?: string;
}

/**
 * Interface para filtros de transação
 */
export interface TransactionFilters {
  start_date?: string;
  end_date?: string;
  category_id?: number;
  account_id?: number;
  type?: 'income' | 'expense';
  min_amount?: number;
  max_amount?: number;
  search?: string;
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
 * Interface para estatísticas de transações
 */
export interface TransactionStats {
  total_income: number;
  total_expenses: number;
  net_amount: number;
  transaction_count: number;
  average_amount: number;
}

/**
 * Serviço para gerenciar transações
 */
class TransactionService {
  /**
   * Obtém lista de transações com filtros e paginação
   * @param filters - Filtros para as transações
   * @param pagination - Parâmetros de paginação
   * @returns Promise com transações paginadas
   */
  async getTransactions(
    filters: TransactionFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      const params = new URLSearchParams();
      
      // Adiciona filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      // Adiciona parâmetros de paginação
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/transactions?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }
  }

  /**
   * Obtém uma transação específica por ID
   * @param id - ID da transação
   * @returns Promise com a transação
   */
  async getTransaction(id: number): Promise<Transaction> {
    try {
      const response = await api.get(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova transação
   * @param data - Dados da transação
   * @returns Promise com a transação criada
   */
  async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    try {
      const response = await api.post('/transactions', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma transação existente
   * @param id - ID da transação
   * @param data - Dados para atualização
   * @returns Promise com a transação atualizada
   */
  async updateTransaction(id: number, data: UpdateTransactionData): Promise<Transaction> {
    try {
      const response = await api.put(`/transactions/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw error;
    }
  }

  /**
   * Exclui uma transação
   * @param id - ID da transação
   * @returns Promise indicando sucesso
   */
  async deleteTransaction(id: number): Promise<void> {
    try {
      await api.delete(`/transactions/${id}`);
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas das transações
   * @param filters - Filtros para as estatísticas
   * @returns Promise com as estatísticas
   */
  async getTransactionStats(filters: TransactionFilters = {}): Promise<TransactionStats> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/transactions/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de transações:', error);
      throw error;
    }
  }

  /**
   * Importa transações via CSV
   * @param file - Arquivo CSV
   * @returns Promise com o resultado da importação
   */
  async importTransactions(file: File): Promise<{ success: number; errors: number; details: string[] }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/transactions/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao importar transações:', error);
      throw error;
    }
  }

  /**
   * Exporta transações para CSV
   * @param filters - Filtros para a exportação
   * @returns Promise com o arquivo CSV
   */
  async exportTransactions(filters: TransactionFilters = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/transactions/export?${params.toString()}`, {
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar transações:', error);
      throw error;
    }
  }

  /**
   * Duplica uma transação
   * @param id - ID da transação a ser duplicada
   * @returns Promise com a nova transação
   */
  async duplicateTransaction(id: number): Promise<Transaction> {
    try {
      const response = await api.post(`/transactions/${id}/duplicate`);
      return response.data;
    } catch (error) {
      console.error('Erro ao duplicar transação:', error);
      throw error;
    }
  }

  /**
   * Obtém transações por categoria
   * @param categoryId - ID da categoria
   * @param filters - Filtros adicionais
   * @returns Promise com as transações da categoria
   */
  async getTransactionsByCategory(
    categoryId: number,
    filters: Omit<TransactionFilters, 'category_id'> = {}
  ): Promise<Transaction[]> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/categories/${categoryId}/transactions?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar transações por categoria:', error);
      throw error;
    }
  }

  /**
   * Obtém transações por conta
   * @param accountId - ID da conta
   * @param filters - Filtros adicionais
   * @returns Promise com as transações da conta
   */
  async getTransactionsByAccount(
    accountId: number,
    filters: Omit<TransactionFilters, 'account_id'> = {}
  ): Promise<Transaction[]> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/accounts/${accountId}/transactions?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar transações por conta:', error);
      throw error;
    }
  }
}

export default new TransactionService(); 