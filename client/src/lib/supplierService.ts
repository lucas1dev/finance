/**
 * Serviço para gerenciamento de fornecedores
 * @module supplierService
 * @author Lucas
 */

import api from '@/lib/axios';

/**
 * Interface para um fornecedor
 */
export interface Supplier {
  id: number;
  user_id: number;
  name: string;
  document_type: 'CPF' | 'CNPJ';
  document_number: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'ativo' | 'inativo' | 'pendente';
  created_at: string;
  updated_at: string;
  payables_count?: number;
  total_payables?: number;
  last_transaction?: string;
}

/**
 * Interface para criação de fornecedor
 */
export interface CreateSupplierData {
  name: string;
  document_type: 'CPF' | 'CNPJ';
  document_number: string;
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Interface para atualização de fornecedor
 */
export interface UpdateSupplierData {
  name?: string;
  document_type?: 'CPF' | 'CNPJ';
  document_number?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'ativo' | 'inativo' | 'pendente';
}

/**
 * Interface para estatísticas de fornecedores
 */
export interface SupplierStats {
  total_suppliers: number;
  active_suppliers: number;
  inactive_suppliers: number;
  pending_suppliers: number;
  total_payables: number;
  average_payables_per_supplier: number;
  top_suppliers: {
    id: number;
    name: string;
    total_payables: number;
    payables_count: number;
  }[];
  suppliers_by_status: {
    status: string;
    count: number;
    percentage: number;
  }[];
}

/**
 * Interface para filtros de fornecedores
 */
export interface SupplierFilters {
  search?: string;
  document_type?: 'CPF' | 'CNPJ';
  status?: 'ativo' | 'inativo' | 'pendente';
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
 * Serviço para gerenciar fornecedores
 */
class SupplierService {
  /**
   * Obtém lista de fornecedores com filtros e paginação
   * @param filters - Filtros para a busca
   * @param pagination - Parâmetros de paginação
   * @returns Promise com fornecedores paginados
   */
  async getSuppliers(
    filters: SupplierFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Supplier>> {
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
      
      const response = await api.get(`/suppliers?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      throw error;
    }
  }

  /**
   * Obtém um fornecedor específico por ID
   * @param id - ID do fornecedor
   * @returns Promise com o fornecedor
   */
  async getSupplier(id: number): Promise<Supplier> {
    try {
      const response = await api.get(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar fornecedor:', error);
      throw error;
    }
  }

  /**
   * Cria um novo fornecedor
   * @param data - Dados do fornecedor
   * @returns Promise com o fornecedor criado
   */
  async createSupplier(data: CreateSupplierData): Promise<Supplier> {
    try {
      const response = await api.post('/suppliers', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      throw error;
    }
  }

  /**
   * Atualiza um fornecedor existente
   * @param id - ID do fornecedor
   * @param data - Dados para atualização
   * @returns Promise com o fornecedor atualizado
   */
  async updateSupplier(id: number, data: UpdateSupplierData): Promise<Supplier> {
    try {
      const response = await api.put(`/suppliers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      throw error;
    }
  }

  /**
   * Exclui um fornecedor
   * @param id - ID do fornecedor
   * @returns Promise indicando sucesso
   */
  async deleteSupplier(id: number): Promise<void> {
    try {
      await api.delete(`/suppliers/${id}`);
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas dos fornecedores
   * @param period - Período para as estatísticas
   * @returns Promise com estatísticas
   */
  async getSupplierStats(period: 'month' | 'quarter' | 'year' = 'month'): Promise<SupplierStats> {
    try {
      const response = await api.get(`/suppliers/stats?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas dos fornecedores:', error);
      throw error;
    }
  }

  /**
   * Exporta dados dos fornecedores
   * @param filters - Filtros para exportação
   * @returns Promise com blob dos dados
   */
  async exportSuppliers(filters: SupplierFilters = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/suppliers/export?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar fornecedores:', error);
      throw error;
    }
  }

  /**
   * Valida CPF
   * @param cpf - CPF para validar
   * @returns true se válido, false caso contrário
   */
  validateCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validar primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF[9])) return false;
    
    // Validar segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF[10])) return false;
    
    return true;
  }

  /**
   * Valida CNPJ
   * @param cnpj - CNPJ para validar
   * @returns true se válido, false caso contrário
   */
  validateCNPJ(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Validar primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights1[i];
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCNPJ[12])) return false;
    
    // Validar segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights2[i];
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleanCNPJ[13])) return false;
    
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

export default new SupplierService(); 