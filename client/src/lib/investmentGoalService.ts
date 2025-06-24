/**
 * Serviço para gerenciamento de metas de investimento
 * @author Lucas
 */

import axios from './axios';

/**
 * Interface para uma meta de investimento
 */
export interface InvestmentGoal {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  status: 'ativa' | 'concluida' | 'cancelada';
  color?: string;
  category_id?: number;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para criação de meta de investimento
 */
export interface CreateInvestmentGoal {
  title: string;
  description?: string;
  target_amount: number;
  target_date: string;
  current_amount?: number;
  color?: string;
  category_id?: number;
}

/**
 * Interface para atualização de meta de investimento
 */
export interface UpdateInvestmentGoal {
  title?: string;
  description?: string;
  target_amount?: number;
  target_date?: string;
  current_amount?: number;
  status?: 'ativa' | 'concluida' | 'cancelada';
  color?: string;
  category_id?: number;
}

/**
 * Interface para resposta paginada
 */
export interface PaginatedResponse<T> {
  goals: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Interface para estatísticas de metas
 */
export interface InvestmentGoalStats {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  cancelled_goals: number;
  total_target_amount: number;
  total_current_amount: number;
  average_progress: number;
  goals_by_status: {
    ativa: number;
    concluida: number;
    cancelada: number;
  };
  goals_by_category: Array<{
    category_id: number;
    category_name: string;
    count: number;
    total_target: number;
    total_current: number;
  }>;
}

/**
 * Serviço para metas de investimento
 */
const investmentGoalService = {
  /**
   * Lista todas as metas de investimento do usuário
   * @param params - Parâmetros de filtro e paginação
   * @returns Lista paginada de metas
   */
  async getGoals(params?: {
    status?: 'ativa' | 'concluida' | 'cancelada';
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<InvestmentGoal>> {
    const response = await axios.get('/investment-goals', { params });
    return response.data;
  },

  /**
   * Obtém uma meta específica por ID
   * @param id - ID da meta
   * @returns Dados da meta
   */
  async getGoal(id: number): Promise<InvestmentGoal> {
    const response = await axios.get(`/investment-goals/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova meta de investimento
   * @param goal - Dados da meta
   * @returns Meta criada
   */
  async createGoal(goal: CreateInvestmentGoal): Promise<InvestmentGoal> {
    const response = await axios.post('/investment-goals', goal);
    return response.data;
  },

  /**
   * Atualiza uma meta existente
   * @param id - ID da meta
   * @param goal - Dados para atualização
   * @returns Meta atualizada
   */
  async updateGoal(id: number, goal: UpdateInvestmentGoal): Promise<InvestmentGoal> {
    const response = await axios.put(`/investment-goals/${id}`, goal);
    return response.data;
  },

  /**
   * Exclui uma meta
   * @param id - ID da meta
   * @returns Confirmação de exclusão
   */
  async deleteGoal(id: number): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`/investment-goals/${id}`);
    return response.data;
  },

  /**
   * Atualiza apenas o valor atual de uma meta
   * @param id - ID da meta
   * @param current_amount - Novo valor atual
   * @returns Meta atualizada
   */
  async updateAmount(id: number, current_amount: number): Promise<InvestmentGoal> {
    const response = await axios.put(`/investment-goals/${id}/amount`, { current_amount });
    return response.data;
  },

  /**
   * Calcula automaticamente o valor atual da meta baseado nos investimentos
   * @param id - ID da meta
   * @returns Meta com valor calculado
   */
  async calculateAmount(id: number): Promise<InvestmentGoal> {
    const response = await axios.put(`/investment-goals/${id}/calculate`);
    return response.data;
  },

  /**
   * Obtém estatísticas das metas de investimento
   * @returns Estatísticas detalhadas
   */
  async getStats(): Promise<InvestmentGoalStats> {
    const response = await axios.get('/investment-goals/statistics');
    return response.data;
  },

  /**
   * Marca uma meta como concluída
   * @param id - ID da meta
   * @returns Meta atualizada
   */
  async completeGoal(id: number): Promise<InvestmentGoal> {
    return this.updateGoal(id, { status: 'concluida' });
  },

  /**
   * Marca uma meta como cancelada
   * @param id - ID da meta
   * @returns Meta atualizada
   */
  async cancelGoal(id: number): Promise<InvestmentGoal> {
    return this.updateGoal(id, { status: 'cancelada' });
  },

  /**
   * Reativa uma meta cancelada
   * @param id - ID da meta
   * @returns Meta atualizada
   */
  async reactivateGoal(id: number): Promise<InvestmentGoal> {
    return this.updateGoal(id, { status: 'ativa' });
  },

  /**
   * Calcula o progresso de uma meta
   * @param current - Valor atual
   * @param target - Valor alvo
   * @returns Percentual de progresso
   */
  calculateProgress(current: number, target: number): number {
    if (target <= 0) return 0;
    const progress = (current / target) * 100;
    return Math.min(Math.max(progress, 0), 100);
  },

  /**
   * Verifica se uma meta está próxima do vencimento
   * @param targetDate - Data alvo
   * @param daysThreshold - Dias de antecedência (padrão: 30)
   * @returns Se está próxima do vencimento
   */
  isNearDeadline(targetDate: string, daysThreshold: number = 30): boolean {
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= daysThreshold && diffDays > 0;
  },

  /**
   * Verifica se uma meta está vencida
   * @param targetDate - Data alvo
   * @returns Se está vencida
   */
  isOverdue(targetDate: string): boolean {
    const target = new Date(targetDate);
    const now = new Date();
    return target < now;
  },

  /**
   * Obtém o status de uma meta baseado no progresso e data
   * @param goal - Meta de investimento
   * @returns Status calculado
   */
  getGoalStatus(goal: InvestmentGoal): {
    status: 'on_track' | 'behind' | 'ahead' | 'completed' | 'overdue';
    message: string;
  } {
    const { current_amount, target_amount, target_date, status } = goal;
    
    if (status === 'concluida') {
      return { status: 'completed', message: 'Meta concluída!' };
    }
    
    if (status === 'cancelada') {
      return { status: 'behind', message: 'Meta cancelada' };
    }

    const progress = this.calculateProgress(current_amount, target_amount);
    const isOverdue = this.isOverdue(target_date);
    const isNearDeadline = this.isNearDeadline(target_date);

    if (progress >= 100) {
      return { status: 'completed', message: 'Meta atingida!' };
    }

    if (isOverdue) {
      return { status: 'overdue', message: 'Meta vencida' };
    }

    if (isNearDeadline && progress < 80) {
      return { status: 'behind', message: 'Atenção: prazo próximo' };
    }

    if (progress >= 80) {
      return { status: 'ahead', message: 'Excelente progresso!' };
    }

    return { status: 'on_track', message: 'No caminho certo' };
  },

  /**
   * Formata valor monetário
   * @param value - Valor a ser formatado
   * @returns Valor formatado
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  },

  /**
   * Formata percentual
   * @param value - Valor a ser formatado
   * @returns Percentual formatado
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  },

  /**
   * Formata data
   * @param date - Data a ser formatada
   * @returns Data formatada
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  },

  /**
   * Calcula dias restantes até a data alvo
   * @param targetDate - Data alvo
   * @returns Dias restantes
   */
  getDaysRemaining(targetDate: string): number {
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Obtém cor baseada no progresso
   * @param progress - Percentual de progresso
   * @returns Cor em formato hexadecimal
   */
  getProgressColor(progress: number): string {
    if (progress >= 100) return '#10B981'; // Verde
    if (progress >= 80) return '#3B82F6'; // Azul
    if (progress >= 60) return '#F59E0B'; // Amarelo
    if (progress >= 40) return '#F97316'; // Laranja
    return '#EF4444'; // Vermelho
  },

  /**
   * Valida dados de uma meta
   * @param goal - Dados da meta
   * @returns Erros de validação
   */
  validateGoal(goal: CreateInvestmentGoal | UpdateInvestmentGoal): string[] {
    const errors: string[] = [];

    if ('title' in goal && (!goal.title || goal.title.trim().length < 3)) {
      errors.push('Título deve ter pelo menos 3 caracteres');
    }

    if ('target_amount' in goal && goal.target_amount !== undefined && (goal.target_amount <= 0)) {
      errors.push('Valor alvo deve ser maior que zero');
    }

    if ('target_date' in goal && goal.target_date) {
      const targetDate = new Date(goal.target_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (targetDate < today) {
        errors.push('Data alvo não pode ser no passado');
      }
    }

    if ('current_amount' in goal && goal.current_amount !== undefined && goal.current_amount < 0) {
      errors.push('Valor atual não pode ser negativo');
    }

    return errors;
  }
};

export default investmentGoalService; 