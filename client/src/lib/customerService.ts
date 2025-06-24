import api from './axios';

/**
 * Interface para um cliente
 */
export interface Customer {
  id: number;
  user_id: number;
  name: string;
  documentType: 'CPF' | 'CNPJ';
  document: string;
  email?: string;
  phone?: string;
  status: 'ativo' | 'inativo' | 'pendente';
  created_at: string;
  updated_at: string;
  receivables_count?: number;
  total_receivables?: number;
  last_transaction?: string;
}

/**
 * Interface para criação de cliente
 */
export interface CreateCustomerData {
  name: string;
  documentType: 'CPF' | 'CNPJ';
  document: string;
  email?: string;
  phone?: string;
}

/**
 * Interface para atualização de cliente
 */
export interface UpdateCustomerData {
  name?: string;
  documentType?: 'CPF' | 'CNPJ';
  document?: string;
  email?: string;
  phone?: string;
  status?: 'ativo' | 'inativo' | 'pendente';
}

/**
 * Interface para estatísticas de clientes
 */
export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  pending_customers: number;
  total_receivables: number;
  average_receivables_per_customer: number;
  top_customers: Array<{
    id: number;
    name: string;
    total_receivables: number;
    receivables_count: number;
  }>;
  customers_by_status: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Interface para dados de gráfico de clientes
 */
export interface CustomerChartData {
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
 * Interface para filtros de clientes
 */
export interface CustomerFilters {
  search?: string;
  documentType?: 'CPF' | 'CNPJ';
  status?: 'ativo' | 'inativo' | 'pendente';
  start_date?: string;
  end_date?: string;
  min_receivables?: number;
  max_receivables?: number;
}

/**
 * Interface para paginação de clientes
 */
export interface CustomerPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Interface para resposta paginada de clientes
 */
export interface CustomerPaginatedResponse {
  customers: Customer[];
  pagination: CustomerPagination;
}

/**
 * Serviço para gerenciar clientes
 */
class CustomerService {
  /**
   * Busca todos os clientes do usuário autenticado
   * @param filters - Filtros opcionais para a busca
   * @returns Promise com lista de clientes
   */
  async getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
    try {
      console.log('🔍 Iniciando busca de clientes...');
      
      const params = new URLSearchParams();
      
      // Adicionar filtros se fornecidos
      if (filters) {
        if (filters.search) params.append('search', filters.search);
        if (filters.documentType) params.append('documentType', filters.documentType);
        if (filters.status) params.append('status', filters.status);
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.min_receivables) params.append('min_receivables', filters.min_receivables.toString());
        if (filters.max_receivables) params.append('max_receivables', filters.max_receivables.toString());
      }

      // Debug: verificar token
      const token = localStorage.getItem('token');
      console.log('Token disponível:', !!token);
      console.log('Token:', token ? token.substring(0, 20) + '...' : 'Nenhum');

      const url = `/customers?${params.toString()}`;
      console.log('🌐 Fazendo requisição para:', url);

      const response = await api.get(url);
      
      console.log('📡 Resposta recebida:', response);
      console.log('📄 Response status:', response.status);
      console.log('📄 Response data:', response.data);
      
      let responseData = response.data;
      // Se vier string, faz parse
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
          console.log('🔄 Parse de string realizado:', responseData);
        } catch (e) {
          console.error('❌ Erro ao fazer parse do response.data:', e);
        }
      }
      
      // Se vier objeto com customers
      if (responseData && typeof responseData === 'object') {
        if (Array.isArray(responseData.customers)) {
          console.log('✅ Retornando customers do objeto:', responseData.customers.length);
          return responseData.customers;
        }
        if (Array.isArray(responseData.data)) {
          console.log('✅ Retornando data do objeto:', responseData.data.length);
          return responseData.data;
        }
      }
      
      // Se vier array direto
      if (Array.isArray(responseData)) {
        console.log('✅ Retornando array direto:', responseData.length);
        return responseData;
      }
      
      // Caso não reconhecido, retorna array vazio
      console.log('⚠️ Formato não reconhecido, retornando array vazio');
      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('❌ Error response:', (error as any).response);
      }
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      // Retorna array vazio em caso de erro para não quebrar a aplicação
      return [];
    }
  }

  /**
   * Obtém clientes por status
   * @param status - Status dos clientes
   * @returns Promise com os clientes do status especificado
   */
  async getCustomersByStatus(status: 'ativo' | 'inativo' | 'pendente'): Promise<Customer[]> {
    try {
      const response = await api.get(`/customers?status=${status}`);
      return response.data.customers || response.data;
    } catch (error) {
      console.error('Erro ao buscar clientes por status:', error);
      throw error;
    }
  }

  /**
   * Obtém um cliente específico por ID
   * @param id - ID do cliente
   * @returns Promise com o cliente
   */
  async getCustomer(id: number): Promise<Customer> {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      throw error;
    }
  }

  /**
   * Cria um novo cliente
   * @param data - Dados do cliente
   * @returns Promise com o cliente criado
   */
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    try {
      const response = await api.post('/customers', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }

  /**
   * Atualiza um cliente existente
   * @param id - ID do cliente
   * @param data - Dados para atualização
   * @returns Promise com o cliente atualizado
   */
  async updateCustomer(id: number, data: UpdateCustomerData): Promise<Customer> {
    try {
      console.log('🔄 CustomerService.updateCustomer - ID:', id);
      console.log('🔄 CustomerService.updateCustomer - Dados:', data);
      
      const response = await api.put(`/customers/${id}`, data);
      
      console.log('✅ CustomerService.updateCustomer - Resposta:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ CustomerService.updateCustomer - Erro:', error);
      console.error('❌ CustomerService.updateCustomer - Response:', error.response?.data);
      throw error;
    }
  }

  /**
   * Exclui um cliente
   * @param id - ID do cliente
   * @returns Promise indicando sucesso
   */
  async deleteCustomer(id: number): Promise<void> {
    try {
      await api.delete(`/customers/${id}`);
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas dos clientes
   * @param period - Período para as estatísticas (month, quarter, year)
   * @returns Promise com as estatísticas dos clientes
   */
  async getCustomerStats(period: 'month' | 'quarter' | 'year' = 'month'): Promise<CustomerStats> {
    try {
      // Como o endpoint não existe no backend, retornamos dados mockados
      const customers = await this.getCustomers();
      
      const total_customers = customers.length;
      const active_customers = customers.filter(c => c.status === 'ativo').length;
      const inactive_customers = customers.filter(c => c.status === 'inativo').length;
      const pending_customers = customers.filter(c => c.status === 'pendente').length;
      
      const total_receivables = customers.reduce((sum, c) => sum + (c.total_receivables || 0), 0);
      const average_receivables_per_customer = total_customers > 0 ? total_receivables / total_customers : 0;
      
      const top_customers = customers
        .filter(c => c.total_receivables && c.total_receivables > 0)
        .sort((a, b) => (b.total_receivables || 0) - (a.total_receivables || 0))
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.name,
          total_receivables: c.total_receivables || 0,
          receivables_count: c.receivables_count || 0
        }));
      
      const customers_by_status = [
        { status: 'ativo', count: active_customers, percentage: total_customers > 0 ? (active_customers / total_customers) * 100 : 0 },
        { status: 'inativo', count: inactive_customers, percentage: total_customers > 0 ? (inactive_customers / total_customers) * 100 : 0 },
        { status: 'pendente', count: pending_customers, percentage: total_customers > 0 ? (pending_customers / total_customers) * 100 : 0 }
      ];
      
      return {
        total_customers,
        active_customers,
        inactive_customers,
        pending_customers,
        total_receivables,
        average_receivables_per_customer,
        top_customers,
        customers_by_status
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas dos clientes:', error);
      throw error;
    }
  }

  /**
   * Obtém dados para gráfico de distribuição por status
   * @returns Promise com os dados do gráfico
   */
  async getCustomerStatusChartData(): Promise<CustomerChartData> {
    try {
      const customers = await this.getCustomers();
      
      const statusCounts = customers.reduce((acc, customer) => {
        acc[customer.status] = (acc[customer.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const labels = Object.keys(statusCounts);
      const data = Object.values(statusCounts);
      const colors = ['#10B981', '#EF4444', '#F59E0B', '#6B7280'];
      
      return {
        labels,
        datasets: [{
          label: 'Clientes por Status',
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length),
          borderWidth: 1
        }]
      };
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico de status:', error);
      throw error;
    }
  }

  /**
   * Obtém dados para gráfico de recebíveis por cliente
   * @param limit - Limite de clientes para o gráfico
   * @returns Promise com os dados do gráfico
   */
  async getCustomerReceivablesChartData(limit: number = 10): Promise<CustomerChartData> {
    try {
      const customers = await this.getCustomers();
      
      const customersWithReceivables = customers
        .filter(c => c.total_receivables && c.total_receivables > 0)
        .sort((a, b) => (b.total_receivables || 0) - (a.total_receivables || 0))
        .slice(0, limit);
      
      const labels = customersWithReceivables.map(c => c.name);
      const data = customersWithReceivables.map(c => c.total_receivables || 0);
      
      return {
        labels,
        datasets: [{
          label: 'Recebíveis por Cliente',
          data,
          backgroundColor: Array(labels.length).fill('#3B82F6'),
          borderColor: Array(labels.length).fill('#1D4ED8'),
          borderWidth: 1
        }]
      };
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico de recebíveis:', error);
      throw error;
    }
  }

  /**
   * Obtém top clientes por recebíveis
   * @param limit - Limite de clientes
   * @param period - Período para análise
   * @returns Promise com os top clientes
   */
  async getTopCustomersByReceivables(
    limit: number = 10,
    period: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<Customer[]> {
    try {
      const customers = await this.getCustomers();
      
      return customers
        .filter(c => c.total_receivables && c.total_receivables > 0)
        .sort((a, b) => (b.total_receivables || 0) - (a.total_receivables || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar top clientes:', error);
      throw error;
    }
  }

  /**
   * Obtém clientes com recebíveis vencidos
   * @param days - Número de dias de vencimento
   * @returns Promise com os clientes com recebíveis vencidos
   */
  async getCustomersWithOverdueReceivables(days: number = 30): Promise<Customer[]> {
    try {
      // Como não temos dados de vencimento no modelo atual, retornamos array vazio
      return [];
    } catch (error) {
      console.error('Erro ao buscar clientes com recebíveis vencidos:', error);
      throw error;
    }
  }

  /**
   * Obtém histórico de transações de um cliente
   * @param customerId - ID do cliente
   * @param filters - Filtros opcionais
   * @returns Promise com o histórico de transações
   */
  async getCustomerTransactionHistory(
    customerId: number,
    filters: {
      start_date?: string;
      end_date?: string;
      limit?: number;
      page?: number;
    } = {}
  ): Promise<any> {
    try {
      // Como o endpoint não existe no backend, retornamos array vazio
      return [];
    } catch (error) {
      console.error('Erro ao buscar histórico de transações:', error);
      throw error;
    }
  }

  /**
   * Obtém recebíveis de um cliente
   * @param customerId - ID do cliente
   * @param filters - Filtros opcionais
   * @returns Promise com os recebíveis do cliente
   */
  async getCustomerReceivables(
    customerId: number,
    filters: {
      status?: string;
      start_date?: string;
      end_date?: string;
      limit?: number;
      page?: number;
    } = {}
  ): Promise<any> {
    try {
      // Como o endpoint não existe no backend, retornamos array vazio
      return [];
    } catch (error) {
      console.error('Erro ao buscar recebíveis do cliente:', error);
      throw error;
    }
  }

  /**
   * Exporta dados dos clientes
   * @param filters - Filtros opcionais
   * @param format - Formato de exportação (csv, xlsx)
   * @returns Promise com o arquivo de exportação
   */
  async exportCustomers(
    filters?: CustomerFilters,
    format: 'csv' | 'xlsx' = 'csv'
  ): Promise<Blob> {
    try {
      const customers = await this.getCustomers(filters);
      
      // Criar CSV manualmente
      const headers = ['ID', 'Nome', 'Tipo Documento', 'Documento', 'Email', 'Telefone'];
      const rows = customers.map(c => [
        c.id,
        c.name,
        c.documentType,
        c.document,
        c.email || '',
        c.phone || ''
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      return new Blob([csvContent], { type: 'text/csv' });
    } catch (error) {
      console.error('Erro ao exportar clientes:', error);
      throw error;
    }
  }

  /**
   * Busca clientes por termo de busca
   * @param searchTerm - Termo de busca
   * @param limit - Limite de resultados
   * @returns Promise com os clientes encontrados
   */
  async searchCustomers(searchTerm: string, limit: number = 10): Promise<Customer[]> {
    try {
      const customers = await this.getCustomers();
      
      return customers
        .filter(customer =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.document.includes(searchTerm) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.includes(searchTerm)
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
  }

  /**
   * Valida CPF
   * @param cpf - CPF para validar
   * @returns true se o CPF for válido
   */
  validateCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  }

  /**
   * Valida CNPJ
   * @param cnpj - CNPJ para validar
   * @returns true se o CNPJ for válido
   */
  validateCNPJ(cnpj: string): boolean {
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (cleanCNPJ.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Validação do primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
    
    // Validação do segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;
    
    return true;
  }

  /**
   * Formata CPF
   * @param cpf - CPF para formatar
   * @returns CPF formatado
   */
  formatCPF(cpf: string): string {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Formata CNPJ
   * @param cnpj - CNPJ para formatar
   * @returns CNPJ formatado
   */
  formatCNPJ(cnpj: string): string {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
}

export default new CustomerService(); 