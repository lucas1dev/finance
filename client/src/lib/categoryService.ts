import api from './axios';

/**
 * Interface para uma categoria
 */
export interface Category {
  id: number;
  user_id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para criação de categoria
 */
export interface CreateCategoryData {
  name: string;
  type: 'income' | 'expense';
  color: string;
}

/**
 * Interface para atualização de categoria
 */
export interface UpdateCategoryData {
  name?: string;
  type?: 'income' | 'expense';
  color?: string;
}

/**
 * Interface para estatísticas de categoria
 */
export interface CategoryStats {
  category_id: number;
  category_name: string;
  category_color: string;
  total_amount: number;
  transaction_count: number;
  average_amount: number;
  percentage: number;
}

/**
 * Interface para dados de gráfico de categorias
 */
export interface CategoryChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

/**
 * Serviço para gerenciar categorias
 */
class CategoryService {
  /**
   * Obtém lista de categorias do usuário
   * @returns Promise com as categorias
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  }

  /**
   * Obtém categorias por tipo
   * @param type - Tipo da categoria (income ou expense)
   * @returns Promise com as categorias do tipo especificado
   */
  async getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
    try {
      const response = await api.get(`/categories?type=${type}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias por tipo:', error);
      return [];
    }
  }

  /**
   * Obtém uma categoria específica por ID
   * @param id - ID da categoria
   * @returns Promise com a categoria
   */
  async getCategory(id: number): Promise<Category> {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova categoria
   * @param data - Dados da categoria
   * @returns Promise com a categoria criada
   */
  async createCategory(data: CreateCategoryData): Promise<Category> {
    try {
      const response = await api.post('/categories', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma categoria existente
   * @param id - ID da categoria
   * @param data - Dados para atualização
   * @returns Promise com a categoria atualizada
   */
  async updateCategory(id: number, data: UpdateCategoryData): Promise<Category> {
    try {
      const response = await api.put(`/categories/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  }

  /**
   * Exclui uma categoria
   * @param id - ID da categoria
   * @returns Promise indicando sucesso
   */
  async deleteCategory(id: number): Promise<void> {
    try {
      await api.delete(`/categories/${id}`);
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas das categorias
   * @param type - Tipo de transação (income ou expense)
   * @param period - Período para as estatísticas (month, quarter, year)
   * @returns Promise com as estatísticas das categorias
   */
  async getCategoryStats(
    type: 'income' | 'expense' = 'expense',
    period: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<CategoryStats[]> {
    try {
      const response = await api.get(`/categories/stats?type=${type}&period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas das categorias:', error);
      throw error;
    }
  }

  /**
   * Obtém dados para gráfico de distribuição por categoria
   * @param type - Tipo de transação (income ou expense)
   * @param period - Período para o gráfico (month, quarter, year)
   * @returns Promise com os dados do gráfico
   */
  async getCategoryChartData(
    type: 'income' | 'expense' = 'expense',
    period: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<CategoryChartData> {
    try {
      const response = await api.get(`/categories/chart-data?type=${type}&period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico de categorias:', error);
      throw error;
    }
  }

  /**
   * Obtém categorias padrão do sistema
   * @returns Promise com as categorias padrão
   */
  async getDefaultCategories(): Promise<Category[]> {
    try {
      const response = await api.get('/categories/defaults');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias padrão:', error);
      throw error;
    }
  }

  /**
   * Restaura categorias padrão para o usuário
   * @returns Promise indicando sucesso
   */
  async restoreDefaultCategories(): Promise<void> {
    try {
      await api.post('/categories/restore-defaults');
    } catch (error) {
      console.error('Erro ao restaurar categorias padrão:', error);
      throw error;
    }
  }

  /**
   * Obtém transações de uma categoria específica
   * @param categoryId - ID da categoria
   * @param filters - Filtros para as transações
   * @returns Promise com as transações da categoria
   */
  async getCategoryTransactions(
    categoryId: number,
    filters: {
      start_date?: string;
      end_date?: string;
      limit?: number;
      page?: number;
    } = {}
  ): Promise<any> {
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
      console.error('Erro ao buscar transações da categoria:', error);
      throw error;
    }
  }

  /**
   * Obtém evolução de gastos por categoria
   * @param categoryId - ID da categoria
   * @param days - Número de dias para a evolução
   * @returns Promise com a evolução dos gastos
   */
  async getCategoryEvolution(categoryId: number, days: number = 30): Promise<any[]> {
    try {
      const response = await api.get(`/categories/${categoryId}/evolution?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar evolução da categoria:', error);
      throw error;
    }
  }

  /**
   * Obtém categorias mais utilizadas
   * @param limit - Limite de categorias a retornar
   * @param period - Período para análise (month, quarter, year)
   * @returns Promise com as categorias mais utilizadas
   */
  async getMostUsedCategories(
    limit: number = 10,
    period: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<CategoryStats[]> {
    try {
      const response = await api.get(`/categories/most-used?limit=${limit}&period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias mais utilizadas:', error);
      throw error;
    }
  }

  /**
   * Obtém categorias com maior gasto
   * @param limit - Limite de categorias a retornar
   * @param period - Período para análise (month, quarter, year)
   * @returns Promise com as categorias com maior gasto
   */
  async getHighestSpendingCategories(
    limit: number = 10,
    period: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<CategoryStats[]> {
    try {
      const response = await api.get(`/categories/highest-spending?limit=${limit}&period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias com maior gasto:', error);
      throw error;
    }
  }

  /**
   * Exporta estatísticas de categorias para CSV
   * @param type - Tipo de transação (income ou expense)
   * @param period - Período para as estatísticas (month, quarter, year)
   * @returns Promise com o arquivo CSV
   */
  async exportCategoryStats(
    type: 'income' | 'expense' = 'expense',
    period: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<Blob> {
    try {
      const response = await api.get(`/categories/export-stats?type=${type}&period=${period}`, {
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar estatísticas de categorias:', error);
      throw error;
    }
  }

  /**
   * Sugere categorias baseadas em transações anteriores
   * @param description - Descrição da transação
   * @param amount - Valor da transação
   * @returns Promise com sugestões de categorias
   */
  async suggestCategories(description: string, amount: number): Promise<Category[]> {
    try {
      const response = await api.post('/categories/suggest', {
        description,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao sugerir categorias:', error);
      throw error;
    }
  }
}

export default new CategoryService(); 