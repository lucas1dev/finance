/**
 * Serviço para gerenciamento de credores
 * @module creditorService
 * @author Lucas
 * 
 * @description
 * Serviço que implementa as operações CRUD para credores conforme
 * documentação da API OpenAPI. Apenas endpoints documentados são utilizados.
 */

import api from '@/lib/axios';

/**
 * Interface para um credor conforme schema da API
 */
export interface Creditor {
  id: number;
  user_id: number;
  name: string;
  document_type: 'CPF' | 'CNPJ';
  document_number: string;
  address: string;
  phone?: string;
  email: string;
  status: 'ativo' | 'inativo';
  observations?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para criação de credor
 */
export interface CreateCreditorData {
  name: string;
  document_type: 'CPF' | 'CNPJ';
  document_number: string;
  address: string;
  phone?: string;
  email: string;
  observations?: string;
}

/**
 * Interface para atualização de credor
 */
export interface UpdateCreditorData {
  name?: string;
  document_type?: 'CPF' | 'CNPJ';
  document_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: 'ativo' | 'inativo';
  observations?: string;
}

/**
 * Interface para filtros de credores
 */
export interface CreditorFilters {
  search?: string;
  document_type?: 'CPF' | 'CNPJ';
}

/**
 * Interface para paginação
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
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
 * Serviço para gerenciar credores
 * Implementa apenas os endpoints documentados na API OpenAPI
 */
class CreditorService {
  /**
   * Obtém lista de credores
   * @param filters - Filtros para a busca (opcional)
   * @param pagination - Parâmetros de paginação (opcional)
   * @returns Promise com credores
   * @throws {Error} Se houver erro na requisição
   * 
   * @example
   * // Buscar todos os credores
   * const creditors = await creditorService.getCreditors();
   * 
   * // Buscar com filtros
   * const creditors = await creditorService.getCreditors(
   *   { search: 'banco', document_type: 'CNPJ' },
   *   { page: 1, limit: 10 }
   * );
   */
  async getCreditors(
    filters: CreditorFilters = {},
    pagination: PaginationParams = {}
  ): Promise<Creditor[]> {
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
      
      const response = await api.get(`/creditors?${params.toString()}`);
      console.log('Resposta da API /creditors:', response);
      let responseData = response.data;
      // Se vier string, faz parse
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch (e) {
          console.error('Erro ao fazer parse do response.data:', e);
        }
      }
      // Se vier objeto com creditors
      if (responseData && typeof responseData === 'object') {
        if (Array.isArray(responseData.creditors)) {
          return responseData.creditors;
        }
        if (Array.isArray(responseData.data)) {
          return responseData.data;
        }
      }
      // Se vier array direto
      if (Array.isArray(responseData)) {
        return responseData;
      }
      // Caso não reconhecido, retorna array vazio
      return [];
    } catch (error) {
      console.error('Erro ao buscar credores:', error);
      throw error;
    }
  }

  /**
   * Obtém um credor específico por ID
   * @param id - ID do credor
   * @returns Promise com o credor
   * @throws {Error} Se houver erro na requisição ou credor não encontrado
   * 
   * @example
   * const creditor = await creditorService.getCreditor(1);
   */
  async getCreditor(id: number): Promise<Creditor> {
    try {
      const response = await api.get(`/creditors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar credor:', error);
      throw error;
    }
  }

  /**
   * Cria um novo credor
   * @param data - Dados do credor
   * @returns Promise com o credor criado
   * @throws {Error} Se houver erro na requisição ou dados inválidos
   * 
   * @example
   * const newCreditor = await creditorService.createCreditor({
   *   name: 'Banco XYZ',
   *   document_type: 'CNPJ',
   *   document_number: '12345678000199',
   *   email: 'contato@bancoxyz.com'
   * });
   */
  async createCreditor(data: CreateCreditorData): Promise<Creditor> {
    try {
      const response = await api.post('/creditors', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar credor:', error);
      throw error;
    }
  }

  /**
   * Atualiza um credor existente
   * @param id - ID do credor
   * @param data - Dados para atualização
   * @returns Promise com o credor atualizado
   * @throws {Error} Se houver erro na requisição ou credor não encontrado
   * 
   * @example
   * const updatedCreditor = await creditorService.updateCreditor(1, {
   *   name: 'Banco XYZ Atualizado',
   *   email: 'novo@bancoxyz.com'
   * });
   */
  async updateCreditor(id: number, data: UpdateCreditorData): Promise<Creditor> {
    try {
      const response = await api.put(`/creditors/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar credor:', error);
      throw error;
    }
  }

  /**
   * Exclui um credor
   * @param id - ID do credor
   * @returns Promise<void>
   * @throws {Error} Se houver erro na requisição ou credor não encontrado
   * 
   * @example
   * await creditorService.deleteCreditor(1);
   */
  async deleteCreditor(id: number): Promise<void> {
    try {
      await api.delete(`/creditors/${id}`);
    } catch (error) {
      console.error('Erro ao excluir credor:', error);
      throw error;
    }
  }

  /**
   * Valida CPF brasileiro
   * @param cpf - CPF a ser validado
   * @returns true se o CPF for válido, false caso contrário
   * 
   * @example
   * const isValid = creditorService.validateCPF('12345678909');
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
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    // Verifica se os dígitos verificadores estão corretos
    return parseInt(cleanCPF.charAt(9)) === digit1 && 
           parseInt(cleanCPF.charAt(10)) === digit2;
  }

  /**
   * Valida CNPJ brasileiro
   * @param cnpj - CNPJ a ser validado
   * @returns true se o CNPJ for válido, false caso contrário
   * 
   * @example
   * const isValid = creditorService.validateCNPJ('12345678000199');
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
    
    // Validação do segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    // Verifica se os dígitos verificadores estão corretos
    return parseInt(cleanCNPJ.charAt(12)) === digit1 && 
           parseInt(cleanCNPJ.charAt(13)) === digit2;
  }

  /**
   * Formata CPF para exibição (XXX.XXX.XXX-XX)
   * @param cpf - CPF a ser formatado
   * @returns CPF formatado
   * 
   * @example
   * const formatted = creditorService.formatCPF('12345678909');
   * // Retorna: '123.456.789-09'
   */
  formatCPF(cpf: string): string {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Formata CNPJ para exibição (XX.XXX.XXX/XXXX-XX)
   * @param cnpj - CNPJ a ser formatado
   * @returns CNPJ formatado
   * 
   * @example
   * const formatted = creditorService.formatCNPJ('12345678000199');
   * // Retorna: '12.345.678/0001-99'
   */
  formatCNPJ(cnpj: string): string {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
}

// Exporta uma instância única do serviço
const creditorService = new CreditorService();
export default creditorService; 