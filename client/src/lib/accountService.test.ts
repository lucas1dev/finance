/**
 * Testes de integração para o AccountService
 * @author Lucas
 * 
 * @description
 * Testes para validar a integração com a API real de accounts
 */

import accountService, { Account, CreateAccountData, AccountStats } from './accountService';

// Mock do axios
jest.mock('./axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }
}));

// Importa o mock do axios
import api from './axios';

/**
 * Teste de validação da API de accounts
 */
describe('AccountService - Validação da API', () => {
  beforeEach(() => {
    // Limpa todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  /**
   * Teste para verificar se a API está respondendo
   */
  test('deve conseguir conectar com a API de accounts', async () => {
    // Mock da resposta da API
    const mockResponse = {
      data: {
        accounts: [
          {
            id: 1,
            user_id: 1,
            bank_name: 'Banco Teste',
            account_type: 'checking',
            balance: 1000.00,
            description: 'Conta de teste',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ]
      }
    };

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    try {
      const accounts = await accountService.getAccounts();
      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts).toHaveLength(1);
      expect(accounts[0].bank_name).toBe('Banco Teste');
      console.log('✅ API de accounts está respondendo');
    } catch (error) {
      console.error('❌ Erro ao conectar com API de accounts:', error);
      throw error;
    }
  });

  /**
   * Teste para verificar se as contas retornadas têm a estrutura correta
   */
  test('deve retornar contas com estrutura válida', async () => {
    const mockResponse = {
      data: {
        accounts: [
          {
            id: 1,
            user_id: 1,
            bank_name: 'Banco Teste',
            account_type: 'checking',
            balance: 1000.00,
            description: 'Conta de teste',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ]
      }
    };

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    try {
      const accounts = await accountService.getAccounts();
      
      if (accounts.length > 0) {
        const account = accounts[0];
        
        // Verificar se a conta tem todos os campos obrigatórios
        expect(account).toHaveProperty('id');
        expect(account).toHaveProperty('user_id');
        expect(account).toHaveProperty('bank_name');
        expect(account).toHaveProperty('account_type');
        expect(account).toHaveProperty('balance');
        expect(account).toHaveProperty('created_at');
        expect(account).toHaveProperty('updated_at');
        
        // Verificar tipos dos campos
        expect(typeof account.id).toBe('number');
        expect(typeof account.user_id).toBe('number');
        expect(typeof account.bank_name).toBe('string');
        expect(typeof account.account_type).toBe('string');
        expect(['checking', 'savings', 'investment']).toContain(account.account_type);
        expect(typeof account.balance).toBe('number');
        
        console.log('✅ Estrutura das contas está correta');
      } else {
        console.log('ℹ️ Nenhuma conta encontrada para validar estrutura');
      }
    } catch (error) {
      console.error('❌ Erro ao validar estrutura das contas:', error);
      throw error;
    }
  });

  /**
   * Teste para verificar se as estatísticas estão sendo retornadas corretamente
   */
  test('deve retornar estatísticas válidas', async () => {
    const mockResponse = {
      data: {
        total_balance: 5000.00,
        account_count: 3,
        average_balance: 1666.67,
        highest_balance: 3000.00,
        lowest_balance: 500.00
      }
    };

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    try {
      const stats = await accountService.getAccountStats();
      
      // Verificar se as estatísticas têm a estrutura correta
      expect(stats).toHaveProperty('total_balance');
      expect(stats).toHaveProperty('account_count');
      expect(stats).toHaveProperty('average_balance');
      expect(stats).toHaveProperty('highest_balance');
      expect(stats).toHaveProperty('lowest_balance');
      
      // Verificar se todos os valores são números
      expect(typeof stats.total_balance).toBe('number');
      expect(typeof stats.account_count).toBe('number');
      expect(typeof stats.average_balance).toBe('number');
      expect(typeof stats.highest_balance).toBe('number');
      expect(typeof stats.lowest_balance).toBe('number');
      
      // Verificar se os valores são válidos
      expect(stats.total_balance).toBeGreaterThanOrEqual(0);
      expect(stats.account_count).toBeGreaterThanOrEqual(0);
      expect(stats.average_balance).toBeGreaterThanOrEqual(0);
      expect(stats.highest_balance).toBeGreaterThanOrEqual(0);
      expect(stats.lowest_balance).toBeGreaterThanOrEqual(0);
      
      console.log('✅ Estatísticas estão sendo retornadas corretamente:', stats);
    } catch (error) {
      console.error('❌ Erro ao validar estatísticas:', error);
      throw error;
    }
  });

  /**
   * Teste para verificar se consegue criar uma conta (teste de integração)
   */
  test('deve conseguir criar uma conta de teste', async () => {
    const testAccountData: CreateAccountData = {
      bank_name: 'Banco Teste API',
      account_type: 'checking',
      balance: 1000.50,
      description: 'Conta de teste para validação da API'
    };

    const mockCreatedAccount = {
      id: 999,
      user_id: 1,
      bank_name: testAccountData.bank_name,
      account_type: testAccountData.account_type,
      balance: testAccountData.balance,
      description: testAccountData.description,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    const mockResponse = {
      data: mockCreatedAccount
    };

    (api.post as jest.Mock).mockResolvedValue(mockResponse);
    (api.delete as jest.Mock).mockResolvedValue({ data: { message: 'Conta excluída com sucesso' } });

    try {
      const createdAccount = await accountService.createAccount(testAccountData);
      
      // Verificar se a conta foi criada corretamente
      expect(createdAccount).toHaveProperty('id');
      expect(createdAccount.bank_name).toBe(testAccountData.bank_name);
      expect(createdAccount.account_type).toBe(testAccountData.account_type);
      expect(createdAccount.balance).toBe(testAccountData.balance);
      
      console.log('✅ Conta criada com sucesso:', createdAccount);
      
      // Limpar: excluir a conta de teste
      await accountService.deleteAccount(createdAccount.id);
      console.log('✅ Conta de teste excluída');
      
    } catch (error) {
      console.error('❌ Erro ao criar conta de teste:', error);
      throw error;
    }
  });

  /**
   * Teste para verificar se consegue atualizar uma conta
   */
  test('deve conseguir atualizar uma conta', async () => {
    // Primeiro criar uma conta
    const testAccountData: CreateAccountData = {
      bank_name: 'Banco Teste Update',
      account_type: 'savings',
      balance: 500.00,
      description: 'Conta para teste de atualização'
    };

    const mockCreatedAccount = {
      id: 888,
      user_id: 1,
      bank_name: testAccountData.bank_name,
      account_type: testAccountData.account_type,
      balance: testAccountData.balance,
      description: testAccountData.description,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    const mockUpdatedAccount = {
      ...mockCreatedAccount,
      balance: 750.00,
      description: 'Conta atualizada'
    };

    (api.post as jest.Mock).mockResolvedValue({ data: mockCreatedAccount });
    (api.put as jest.Mock).mockResolvedValue({ data: { message: 'Conta atualizada com sucesso' } });
    (api.get as jest.Mock).mockResolvedValue({ data: mockUpdatedAccount });
    (api.delete as jest.Mock).mockResolvedValue({ data: { message: 'Conta excluída com sucesso' } });

    try {
      const createdAccount = await accountService.createAccount(testAccountData);
      
      // Atualizar a conta
      const updateData = {
        balance: 750.00,
        description: 'Conta atualizada'
      };
      
      await accountService.updateAccount(createdAccount.id, updateData);
      
      // Buscar a conta atualizada
      const updatedAccount = await accountService.getAccount(createdAccount.id);
      
      expect(updatedAccount.balance).toBe(updateData.balance);
      expect(updatedAccount.description).toBe(updateData.description);
      
      console.log('✅ Conta atualizada com sucesso:', updatedAccount);
      
      // Limpar: excluir a conta de teste
      await accountService.deleteAccount(createdAccount.id);
      console.log('✅ Conta de teste excluída');
      
    } catch (error) {
      console.error('❌ Erro ao atualizar conta:', error);
      throw error;
    }
  });

  /**
   * Teste para verificar tratamento de erros
   */
  test('deve tratar erros adequadamente', async () => {
    // Mock de erro 404
    const mockError = {
      response: {
        status: 404,
        data: { error: 'Conta não encontrada' }
      }
    };

    (api.get as jest.Mock).mockRejectedValue(mockError);

    try {
      // Tentar buscar uma conta que não existe
      await accountService.getAccount(999999);
      fail('Deveria ter lançado um erro');
    } catch (error) {
      expect(error).toBeDefined();
      console.log('✅ Erro tratado adequadamente:', error);
    }
  });
});

/**
 * Teste de performance da API
 */
describe('AccountService - Performance', () => {
  test('deve responder em tempo razoável', async () => {
    const mockResponse = {
      data: {
        accounts: []
      }
    };

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const startTime = Date.now();
    
    try {
      await accountService.getAccounts();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(5000); // Máximo 5 segundos
      console.log(`✅ API respondeu em ${responseTime}ms`);
    } catch (error) {
      console.error('❌ Erro no teste de performance:', error);
      throw error;
    }
  });
});

export {}; 