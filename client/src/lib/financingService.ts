/**
 * Serviço para gerenciamento de financiamentos
 * @author Lucas
 */

import axios from './axios';

/**
 * Interface para um financiamento
 */
export interface Financing {
  id: number;
  user_id: number;
  creditor_id: number;
  financing_type: 'hipoteca' | 'emprestimo_pessoal' | 'veiculo' | 'outros';
  total_amount: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  description?: string;
  contract_number?: string;
  payment_method: 'boleto' | 'debito_automatico' | 'cartao' | 'pix';
  observations?: string;
  amortization_method: 'SAC' | 'Price';
  status: 'ativo' | 'quitado' | 'inadimplente';
  remaining_balance: number;
  created_at: string;
  updated_at: string;
  creditor?: {
    id: number;
    name: string;
    document_type: string;
    document_number: string;
  };
}

/**
 * Interface para criação de financiamento
 */
export interface CreateFinancing {
  creditor_id: number;
  financing_type: 'hipoteca' | 'emprestimo_pessoal' | 'veiculo' | 'outros';
  total_amount: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  description?: string;
  contract_number?: string;
  payment_method: 'boleto' | 'debito_automatico' | 'cartao' | 'pix';
  observations?: string;
  amortization_method: 'SAC' | 'Price';
}

/**
 * Interface para atualização de financiamento
 */
export interface UpdateFinancing {
  creditor_id?: number;
  financing_type?: 'hipoteca' | 'emprestimo_pessoal' | 'veiculo' | 'outros';
  total_amount?: number;
  interest_rate?: number;
  term_months?: number;
  start_date?: string;
  description?: string;
  contract_number?: string;
  payment_method?: 'boleto' | 'debito_automatico' | 'cartao' | 'pix';
  observations?: string;
  amortization_method?: 'SAC' | 'Price';
  status?: 'ativo' | 'quitado' | 'inadimplente';
}

/**
 * Interface para estatísticas de financiamentos
 */
export interface FinancingStats {
  total_financings: number;
  active_financings: number;
  paid_financings: number;
  defaulted_financings: number;
  total_borrowed: number;
  total_remaining: number;
  total_paid: number;
  average_interest_rate: number;
  financings_by_type: {
    hipoteca: number;
    emprestimo_pessoal: number;
    veiculo: number;
    outros: number;
  };
  financings_by_status: {
    ativo: number;
    quitado: number;
    inadimplente: number;
  };
  financings_by_method: {
    SAC: number;
    Price: number;
  };
}

/**
 * Interface para tabela de amortização
 */
export interface AmortizationTable {
  installment: number;
  payment_date: string;
  payment_amount: number;
  principal_amount: number;
  interest_amount: number;
  remaining_balance: number;
}

/**
 * Interface para simulação de pagamento antecipado
 */
export interface EarlyPaymentSimulation {
  current_balance: number;
  payment_amount: number;
  new_balance: number;
  interest_saved: number;
  new_installments: number;
  new_payment_amount: number;
}

/**
 * Interface para pagamento de financiamento
 */
export interface FinancingPayment {
  id: number;
  user_id: number;
  financing_id: number;
  account_id: number;
  installment_number: number;
  payment_amount: number;
  principal_amount: number;
  interest_amount: number;
  payment_date: string;
  payment_method: 'boleto' | 'debito_automatico' | 'cartao' | 'pix' | 'transferencia';
  payment_type: 'parcela' | 'parcial' | 'antecipado';
  status: 'pago' | 'pendente' | 'atrasado';
  observations?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para criação de pagamento
 */
export interface CreateFinancingPayment {
  financing_id: number;
  account_id: number;
  installment_number: number;
  payment_amount: number;
  principal_amount: number;
  interest_amount: number;
  payment_date: string;
  payment_method: 'boleto' | 'debito_automatico' | 'cartao' | 'pix' | 'transferencia';
  payment_type?: 'parcela' | 'parcial' | 'antecipado';
  observations?: string;
}

/**
 * Serviço de financiamentos
 */
const financingService = {
  /**
   * Lista todos os financiamentos do usuário
   * @param params - Parâmetros de filtro e paginação
   * @returns Lista de financiamentos com paginação
   */
  async getFinancings(params: {
    page?: number;
    limit?: number;
    financing_type?: string;
    creditor_id?: number;
    status?: string;
    amortization_method?: string;
    start_date_from?: string;
    start_date_to?: string;
  } = {}): Promise<{ financings: Financing[]; pagination: any }> {
    const response = await axios.get('/financings', { params });
    return response.data;
  },

  /**
   * Obtém estatísticas dos financiamentos
   * @returns Estatísticas dos financiamentos
   */
  async getStats(): Promise<FinancingStats> {
    const response = await axios.get('/financings/statistics');
    return response.data;
  },

  /**
   * Obtém um financiamento específico
   * @param id - ID do financiamento
   * @returns Dados do financiamento
   */
  async getFinancing(id: number): Promise<Financing> {
    const response = await axios.get(`/financings/${id}`);
    return response.data;
  },

  /**
   * Cria um novo financiamento
   * @param financing - Dados do financiamento
   * @returns Financiamento criado
   */
  async createFinancing(financing: CreateFinancing): Promise<Financing> {
    const response = await axios.post('/financings', financing);
    return response.data;
  },

  /**
   * Atualiza um financiamento existente
   * @param id - ID do financiamento
   * @param financing - Dados para atualização
   * @returns Financiamento atualizado
   */
  async updateFinancing(id: number, financing: UpdateFinancing): Promise<Financing> {
    const response = await axios.put(`/financings/${id}`, financing);
    return response.data;
  },

  /**
   * Exclui um financiamento
   * @param id - ID do financiamento
   * @returns Confirmação de exclusão
   */
  async deleteFinancing(id: number): Promise<void> {
    await axios.delete(`/financings/${id}`);
  },

  /**
   * Obtém a tabela de amortização de um financiamento
   * @param id - ID do financiamento
   * @returns Tabela de amortização
   */
  async getAmortizationTable(id: number): Promise<AmortizationTable[]> {
    const response = await axios.get(`/financings/${id}/amortization-table`);
    return response.data;
  },

  /**
   * Simula pagamento antecipado
   * @param id - ID do financiamento
   * @param paymentAmount - Valor do pagamento
   * @returns Simulação do pagamento antecipado
   */
  async simulateEarlyPayment(id: number, paymentAmount: number): Promise<EarlyPaymentSimulation> {
    const response = await axios.post(`/financings/${id}/early-payment-simulation`, {
      payment_amount: paymentAmount,
    });
    return response.data;
  },

  /**
   * Lista pagamentos de um financiamento
   * @param params - Parâmetros de filtro e paginação
   * @returns Lista de pagamentos
   */
  async getPayments(params: {
    page?: number;
    limit?: number;
    financing_id?: number;
    account_id?: number;
    payment_method?: string;
    payment_type?: string;
    status?: string;
    payment_date_from?: string;
    payment_date_to?: string;
  } = {}): Promise<{ payments: FinancingPayment[]; pagination: any }> {
    const response = await axios.get('/financing-payments', { params });
    return response.data;
  },

  /**
   * Cria um novo pagamento
   * @param payment - Dados do pagamento
   * @returns Pagamento criado
   */
  async createPayment(payment: CreateFinancingPayment): Promise<FinancingPayment> {
    const response = await axios.post('/financing-payments', payment);
    return response.data;
  },

  /**
   * Obtém um pagamento específico
   * @param id - ID do pagamento
   * @returns Dados do pagamento
   */
  async getPayment(id: number): Promise<FinancingPayment> {
    const response = await axios.get(`/financing-payments/${id}`);
    return response.data;
  },

  /**
   * Atualiza um pagamento
   * @param id - ID do pagamento
   * @param payment - Dados para atualização
   * @returns Pagamento atualizado
   */
  async updatePayment(id: number, payment: Partial<CreateFinancingPayment>): Promise<FinancingPayment> {
    const response = await axios.put(`/financing-payments/${id}`, payment);
    return response.data;
  },

  /**
   * Exclui um pagamento
   * @param id - ID do pagamento
   * @returns Confirmação de exclusão
   */
  async deletePayment(id: number): Promise<void> {
    await axios.delete(`/financing-payments/${id}`);
  },

  /**
   * Marca uma parcela como paga
   * @param id - ID do pagamento
   * @returns Confirmação de pagamento
   */
  async payInstallment(id: number): Promise<void> {
    await axios.post(`/financing-payments/${id}/pay`);
  },

  /**
   * Registra pagamento antecipado
   * @param payment - Dados do pagamento antecipado
   * @returns Pagamento registrado
   */
  async registerEarlyPayment(payment: CreateFinancingPayment): Promise<FinancingPayment> {
    const response = await axios.post('/financing-payments/early-payment', payment);
    return response.data;
  },

  /**
   * Valida dados de um financiamento
   * @param financing - Dados do financiamento
   * @returns Erros de validação
   */
  validateFinancing(financing: CreateFinancing | UpdateFinancing): string[] {
    const errors: string[] = [];

    if ('total_amount' in financing && financing.total_amount !== undefined && financing.total_amount <= 0) {
      errors.push('Valor total deve ser maior que zero');
    }

    if ('interest_rate' in financing && financing.interest_rate !== undefined && financing.interest_rate < 0) {
      errors.push('Taxa de juros não pode ser negativa');
    }

    if ('term_months' in financing && financing.term_months !== undefined && financing.term_months <= 0) {
      errors.push('Prazo deve ser maior que zero');
    }

    if ('start_date' in financing && financing.start_date) {
      const startDate = new Date(financing.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        errors.push('Data de início não pode ser no passado');
      }
    }

    return errors;
  },

  /**
   * Valida dados de um pagamento
   * @param payment - Dados do pagamento
   * @returns Erros de validação
   */
  validatePayment(payment: CreateFinancingPayment): string[] {
    const errors: string[] = [];

    if (payment.payment_amount <= 0) {
      errors.push('Valor do pagamento deve ser maior que zero');
    }

    if (payment.principal_amount < 0) {
      errors.push('Valor da amortização não pode ser negativo');
    }

    if (payment.interest_amount < 0) {
      errors.push('Valor dos juros não pode ser negativo');
    }

    if (payment.installment_number <= 0) {
      errors.push('Número da parcela deve ser maior que zero');
    }

    const paymentDate = new Date(payment.payment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (paymentDate < today) {
      errors.push('Data do pagamento não pode ser no passado');
    }

    return errors;
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
    return `${value.toFixed(2)}%`;
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
   * Calcula valor da parcela (SAC)
   * @param principal - Valor principal
   * @param interestRate - Taxa de juros mensal
   * @param termMonths - Prazo em meses
   * @param installment - Número da parcela
   * @returns Valor da parcela
   */
  calculateSACInstallment(principal: number, interestRate: number, termMonths: number, installment: number): number {
    const monthlyRate = interestRate / 100 / 12;
    const principalInstallment = principal / termMonths;
    const remainingBalance = principal - (principalInstallment * (installment - 1));
    const interestInstallment = remainingBalance * monthlyRate;
    return principalInstallment + interestInstallment;
  },

  /**
   * Calcula valor da parcela (Price)
   * @param principal - Valor principal
   * @param interestRate - Taxa de juros mensal
   * @param termMonths - Prazo em meses
   * @returns Valor da parcela
   */
  calculatePriceInstallment(principal: number, interestRate: number, termMonths: number): number {
    const monthlyRate = interestRate / 100 / 12;
    if (monthlyRate === 0) return principal / termMonths;
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
  },

  /**
   * Obtém status do financiamento
   * @param financing - Dados do financiamento
   * @returns Status e mensagem
   */
  getFinancingStatus(financing: Financing): { status: string; message: string; color: string } {
    if (financing.status === 'quitado') {
      return { status: 'quitado', message: 'Financiamento quitado', color: '#10B981' };
    }
    
    if (financing.status === 'inadimplente') {
      return { status: 'inadimplente', message: 'Financiamento em inadimplência', color: '#EF4444' };
    }
    
    const remainingPercentage = (financing.remaining_balance / financing.total_amount) * 100;
    
    if (remainingPercentage <= 10) {
      return { status: 'quase_quitado', message: 'Quase quitado', color: '#F59E0B' };
    }
    
    return { status: 'ativo', message: 'Financiamento ativo', color: '#3B82F6' };
  },

  /**
   * Obtém tipo de financiamento formatado
   * @param type - Tipo do financiamento
   * @returns Tipo formatado
   */
  getFinancingTypeLabel(type: string): string {
    const types = {
      hipoteca: 'Hipoteca',
      emprestimo_pessoal: 'Empréstimo Pessoal',
      veiculo: 'Financiamento de Veículo',
      outros: 'Outros',
    };
    return types[type as keyof typeof types] || type;
  },

  /**
   * Obtém método de pagamento formatado
   * @param method - Método de pagamento
   * @returns Método formatado
   */
  getPaymentMethodLabel(method: string): string {
    const methods = {
      boleto: 'Boleto',
      debito_automatico: 'Débito Automático',
      cartao: 'Cartão',
      pix: 'PIX',
      transferencia: 'Transferência',
    };
    return methods[method as keyof typeof methods] || method;
  },

  /**
   * Obtém método de amortização formatado
   * @param method - Método de amortização
   * @returns Método formatado
   */
  getAmortizationMethodLabel(method: string): string {
    const methods = {
      SAC: 'Sistema de Amortização Constante (SAC)',
      Price: 'Sistema Price',
    };
    return methods[method as keyof typeof methods] || method;
  },
};

export default financingService; 