import axios from './axios';

/**
 * Interface para uma conta a pagar
 */
export interface Payable {
  id: number;
  user_id: number;
  supplier_id: number;
  category_id?: number;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: string;
  payment_method?: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
  notes?: string;
  remaining_amount: number;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: number;
    name: string;
    document: string;
    email?: string;
    phone?: string;
  };
  category?: {
    id: number;
    name: string;
    color: string;
  };
  payments?: Payment[];
}

/**
 * Interface para um pagamento
 */
export interface Payment {
  id: number;
  payable_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para criar uma conta a pagar
 */
export interface CreatePayableData {
  supplier_id: number;
  category_id?: number;
  description: string;
  amount: number;
  due_date: string;
  notes?: string;
}

/**
 * Interface para atualizar uma conta a pagar
 */
export interface UpdatePayableData {
  supplier_id?: number;
  category_id?: number;
  description?: string;
  amount?: number;
  due_date?: string;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
}

/**
 * Interface para adicionar um pagamento
 */
export interface AddPaymentData {
  payable_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
  account_id: number;
  notes?: string;
}

/**
 * Interface para filtros de busca
 */
export interface PayableFilters {
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  supplier_id?: number;
  category_id?: number;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

/**
 * Serviço para gerenciar contas a pagar
 */
class PayableService {
  /**
   * Lista todas as contas a pagar do usuário
   * @param filters - Filtros opcionais para a busca
   * @returns Promise com a lista de contas a pagar
   */
  async getPayables(filters?: PayableFilters): Promise<Payable[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.supplier_id) params.append('supplier_id', filters.supplier_id.toString());
    if (filters?.category_id) params.append('category_id', filters.category_id.toString());
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.min_amount) params.append('min_amount', filters.min_amount.toString());
    if (filters?.max_amount) params.append('max_amount', filters.max_amount.toString());

    const response = await axios.get(`/payables?${params.toString()}`);
    return response.data;
  }

  /**
   * Busca uma conta a pagar específica
   * @param id - ID da conta a pagar
   * @returns Promise com os detalhes da conta a pagar
   */
  async getPayable(id: number): Promise<Payable> {
    const response = await axios.get(`/payables/${id}`);
    return response.data;
  }

  /**
   * Cria uma nova conta a pagar
   * @param data - Dados da conta a pagar
   * @returns Promise com a conta a pagar criada
   */
  async createPayable(data: CreatePayableData): Promise<Payable> {
    const response = await axios.post('/payables', data);
    return response.data;
  }

  /**
   * Atualiza uma conta a pagar existente
   * @param id - ID da conta a pagar
   * @param data - Dados para atualização
   * @returns Promise com a conta a pagar atualizada
   */
  async updatePayable(id: number, data: UpdatePayableData): Promise<Payable> {
    const response = await axios.patch(`/payables/${id}`, data);
    return response.data;
  }

  /**
   * Remove uma conta a pagar
   * @param id - ID da conta a pagar
   * @returns Promise vazio
   */
  async deletePayable(id: number): Promise<void> {
    await axios.delete(`/payables/${id}`);
  }

  /**
   * Lista pagamentos de uma conta a pagar
   * @param id - ID da conta a pagar
   * @returns Promise com a lista de pagamentos
   */
  async getPayments(id: number): Promise<Payment[]> {
    const response = await axios.get(`/payables/${id}/payments`);
    return response.data;
  }

  /**
   * Adiciona um pagamento a uma conta a pagar
   * @param id - ID da conta a pagar
   * @param data - Dados do pagamento
   * @returns Promise com o pagamento criado
   */
  async addPayment(id: number, data: AddPaymentData): Promise<Payment> {
    const paymentData = {
      ...data,
      payable_id: id
    };
    const response = await axios.post(`/payables/${id}/payments`, paymentData);
    return response.data;
  }

  /**
   * Busca contas a vencer nos próximos dias
   * @param days - Número de dias para buscar (padrão: 30)
   * @returns Promise com a lista de contas a vencer
   */
  async getUpcomingDue(days: number = 30): Promise<Payable[]> {
    const response = await axios.get(`/payables/upcoming-due?days=${days}`);
    return response.data;
  }

  /**
   * Busca contas vencidas
   * @returns Promise com a lista de contas vencidas
   */
  async getOverdue(): Promise<Payable[]> {
    const response = await axios.get('/payables/overdue');
    return response.data;
  }

  /**
   * Calcula estatísticas das contas a pagar
   * @returns Promise com as estatísticas
   */
  async getStatistics(): Promise<{
    total_pending: number;
    total_paid: number;
    total_overdue: number;
    total_amount: number;
    pending_amount: number;
    paid_amount: number;
    overdue_amount: number;
  }> {
    const payables = await this.getPayables();
    
    const stats = payables.reduce((acc, payable) => {
      const amount = parseFloat(payable.amount.toString());
      const remaining = parseFloat(payable.remaining_amount.toString());
      
      acc.total_amount += amount;
      
      if (payable.status === 'pending') {
        acc.total_pending++;
        acc.pending_amount += remaining;
      } else if (payable.status === 'paid') {
        acc.total_paid++;
        acc.paid_amount += amount;
      } else if (payable.status === 'overdue') {
        acc.total_overdue++;
        acc.overdue_amount += remaining;
      }
      
      return acc;
    }, {
      total_pending: 0,
      total_paid: 0,
      total_overdue: 0,
      total_amount: 0,
      pending_amount: 0,
      paid_amount: 0,
      overdue_amount: 0
    });

    return stats;
  }
}

export default new PayableService(); 