import api from '@/lib/axios';

/**
 * Interface para uma conta
 */
export interface Account {
  id: number;
  user_id: number;
  bank_name: string;
  account_type: 'checking' | 'savings' | 'investment';
  balance: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para criação de conta
 */
export interface CreateAccountData {
  bank_name: string;
  account_type: 'checking' | 'savings' | 'investment';
  balance: number;
  description?: string;
}

/**
 * Interface para atualização de conta
 */
export interface UpdateAccountData {
  bank_name?: string;
  account_type?: 'checking' | 'savings' | 'investment';
  balance?: number;
  description?: string;
}

/**
 * Interface para transferência entre contas
 */
export interface TransferData {
  from_account_id: number;
  to_account_id: number;
  amount: number;
  description?: string;
  date: string;
}

/**
 * Interface para movimentação de conta
 */
export interface AccountMovement {
  id: number;
  account_id: number;
  type: 'transfer_in' | 'transfer_out' | 'transaction' | 'adjustment';
  amount: number;
  description: string;
  date: string;
  created_at: string;
  related_transaction_id?: number;
  related_transfer_id?: number;
}

/**
 * Interface para estatísticas de conta
 */
export interface AccountStats {
  total_balance: number;
  account_count: number;
  average_balance: number;
  highest_balance: number;
  lowest_balance: number;
}

/**
 * Interface para evolução de saldo
 */
export interface BalanceEvolution {
  date: string;
  balance: number;
  change: number;
}

/**
 * Serviço para gerenciar contas
 */
class AccountService {
  /**
   * Obtém lista de contas do usuário
   * @returns Promise com as contas
   */
  async getAccounts(): Promise<Account[]> {
    try {
      console.log('🔍 [AccountService] Buscando contas...');
      const response = await api.get('/accounts');
      console.log('✅ [AccountService] Resposta da API:', response.data);
      
      // A API pode retornar diretamente o array ou dentro de uma propriedade
      let accounts = response.data;
      if (response.data && response.data.accounts) {
        accounts = response.data.accounts;
      }
      
      // Validação da resposta
      if (!accounts || !Array.isArray(accounts)) {
        console.warn('⚠️ [AccountService] Resposta inválida, retornando array vazio');
        return [];
      }
      
      console.log(`📊 [AccountService] ${accounts.length} contas encontradas`);
      
      // Validação de cada conta
      const validAccounts = accounts.filter((account: any) => {
        const isValid = account && 
          typeof account.id === 'number' &&
          typeof account.bank_name === 'string' &&
          typeof account.account_type === 'string' &&
          (typeof account.balance === 'number' || typeof account.balance === 'string');
        
        if (!isValid) {
          console.warn('⚠️ [AccountService] Conta inválida:', account);
        }
        
        return isValid;
      });
      
      console.log(`✅ [AccountService] ${validAccounts.length} contas válidas retornadas`);
      return validAccounts;
    } catch (error) {
      console.error('❌ [AccountService] Erro ao buscar contas:', error);
      return [];
    }
  }

  /**
   * Obtém uma conta específica por ID
   * @param id - ID da conta
   * @returns Promise com a conta
   */
  async getAccount(id: number): Promise<Account> {
    try {
      console.log(`🔍 [AccountService] Buscando conta ID: ${id}`);
      const response = await api.get(`/accounts/${id}`);
      console.log('✅ [AccountService] Conta encontrada:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ [AccountService] Erro ao buscar conta ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cria uma nova conta
   * @param data - Dados da conta
   * @returns Promise com a conta criada
   */
  async createAccount(data: CreateAccountData): Promise<Account> {
    try {
      console.log('🔍 [AccountService] Criando conta:', data);
      const response = await api.post('/accounts', data);
      console.log('✅ [AccountService] Conta criada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [AccountService] Erro ao criar conta:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma conta existente
   * @param id - ID da conta
   * @param data - Dados para atualização
   * @returns Promise com a conta atualizada
   */
  async updateAccount(id: number, data: UpdateAccountData): Promise<Account> {
    try {
      console.log(`🔍 [AccountService] Atualizando conta ID: ${id}`, data);
      const response = await api.put(`/accounts/${id}`, data);
      console.log('✅ [AccountService] Conta atualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ [AccountService] Erro ao atualizar conta ${id}:`, error);
      throw error;
    }
  }

  /**
   * Exclui uma conta
   * @param id - ID da conta
   * @returns Promise indicando sucesso
   */
  async deleteAccount(id: number): Promise<void> {
    try {
      console.log(`🔍 [AccountService] Excluindo conta ID: ${id}`);
      await api.delete(`/accounts/${id}`);
      console.log('✅ [AccountService] Conta excluída com sucesso');
    } catch (error) {
      console.error(`❌ [AccountService] Erro ao excluir conta ${id}:`, error);
      throw error;
    }
  }

  /**
   * Realiza transferência entre contas
   * @param data - Dados da transferência
   * @returns Promise com a transferência realizada
   */
  async transferBetweenAccounts(data: TransferData): Promise<any> {
    try {
      console.log('🔍 [AccountService] Realizando transferência:', data);
      const response = await api.post('/accounts/transfer', data);
      console.log('✅ [AccountService] Transferência realizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [AccountService] Erro ao realizar transferência:', error);
      throw error;
    }
  }

  /**
   * Obtém movimentações de uma conta
   * @param accountId - ID da conta
   * @param filters - Filtros para as movimentações
   * @returns Promise com as movimentações
   */
  async getAccountMovements(
    accountId: number,
    filters: {
      start_date?: string;
      end_date?: string;
      type?: string;
      limit?: number;
    } = {}
  ): Promise<AccountMovement[]> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      console.log(`🔍 [AccountService] Buscando movimentações da conta ${accountId}`);
      const response = await api.get(`/accounts/${accountId}/movements?${params.toString()}`);
      console.log('✅ [AccountService] Movimentações encontradas:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ [AccountService] Erro ao buscar movimentações da conta ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Obtém evolução do saldo de uma conta
   * @param accountId - ID da conta
   * @param days - Número de dias para a evolução
   * @returns Promise com a evolução do saldo
   */
  async getBalanceEvolution(accountId: number, days: number = 30): Promise<BalanceEvolution[]> {
    try {
      console.log(`🔍 [AccountService] Buscando evolução do saldo da conta ${accountId}`);
      const response = await api.get(`/accounts/${accountId}/balance-evolution?days=${days}`);
      console.log('✅ [AccountService] Evolução do saldo:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ [AccountService] Erro ao buscar evolução do saldo da conta ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas das contas
   * @returns Promise com as estatísticas
   */
  async getAccountStats(): Promise<AccountStats> {
    try {
      console.log('🔍 [AccountService] Buscando estatísticas das contas...');
      const response = await api.get('/accounts/stats');
      console.log('✅ [AccountService] Estatísticas obtidas:', response.data);
      
      // Validação da resposta
      if (!response.data) {
        console.warn('⚠️ [AccountService] Resposta de estatísticas vazia');
        return {
          total_balance: 0,
          account_count: 0,
          average_balance: 0,
          highest_balance: 0,
          lowest_balance: 0
        };
      }
      
      // Garantir que todos os campos são números
      const stats = {
        total_balance: Number(response.data.total_balance) || 0,
        account_count: Number(response.data.account_count) || 0,
        average_balance: Number(response.data.average_balance) || 0,
        highest_balance: Number(response.data.highest_balance) || 0,
        lowest_balance: Number(response.data.lowest_balance) || 0
      };
      
      console.log('✅ [AccountService] Estatísticas validadas:', stats);
      return stats;
    } catch (error) {
      console.error('❌ [AccountService] Erro ao buscar estatísticas das contas:', error);
      // Retornar estatísticas padrão em caso de erro
      return {
        total_balance: 0,
        account_count: 0,
        average_balance: 0,
        highest_balance: 0,
        lowest_balance: 0
      };
    }
  }

  /**
   * Ajusta o saldo de uma conta
   * @param accountId - ID da conta
   * @param newBalance - Novo saldo
   * @param reason - Motivo do ajuste
   * @returns Promise com a conta atualizada
   */
  async adjustBalance(accountId: number, newBalance: number, reason: string): Promise<Account> {
    try {
      const response = await api.put(`/accounts/${accountId}/adjust-balance`, {
        new_balance: newBalance,
        reason: reason
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao ajustar saldo da conta:', error);
      throw error;
    }
  }

  /**
   * Obtém contas por tipo
   * @param type - Tipo da conta
   * @returns Promise com as contas do tipo especificado
   */
  async getAccountsByType(type: Account['account_type']): Promise<Account[]> {
    try {
      const response = await api.get(`/accounts?type=${type}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar contas por tipo:', error);
      throw error;
    }
  }

  /**
   * Obtém saldo consolidado de todas as contas
   * @returns Promise com o saldo consolidado
   */
  async getConsolidatedBalance(): Promise<{ total_balance: number; accounts: Account[] }> {
    try {
      const response = await api.get('/accounts/consolidated-balance');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar saldo consolidado:', error);
      throw error;
    }
  }

  /**
   * Exporta movimentações de uma conta para CSV
   * @param accountId - ID da conta
   * @param filters - Filtros para a exportação
   * @returns Promise com o arquivo CSV
   */
  async exportAccountMovements(
    accountId: number,
    filters: {
      start_date?: string;
      end_date?: string;
      type?: string;
    } = {}
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/accounts/${accountId}/export-movements?${params.toString()}`, {
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar movimentações da conta:', error);
      throw error;
    }
  }

  /**
   * Obtém histórico de transferências de uma conta
   * @param accountId - ID da conta
   * @param filters - Filtros para o histórico
   * @returns Promise com o histórico de transferências
   */
  async getTransferHistory(
    accountId: number,
    filters: {
      start_date?: string;
      end_date?: string;
      direction?: 'in' | 'out';
      limit?: number;
    } = {}
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/accounts/${accountId}/transfer-history?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar histórico de transferências:', error);
      throw error;
    }
  }
}

export default new AccountService(); 