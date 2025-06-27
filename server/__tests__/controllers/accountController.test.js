/**
 * Testes unitários para o AccountController
 * @author Lucas Santos
 */

const { ValidationError, NotFoundError, AppError } = require('../../utils/errors');

describe('AccountController', () => {
  let controller;
  let mockAccountService;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockAccountService = {
      createAccount: jest.fn(),
      getAccounts: jest.fn(),
      getAccount: jest.fn(),
      updateAccount: jest.fn(),
      deleteAccount: jest.fn()
    };

    controller = new (require('../../controllers/accountController'))(mockAccountService);

    mockReq = {
      user: { id: 1 },
      body: {},
      params: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Limpar mocks
    jest.clearAllMocks();
  });

  describe('createAccount', () => {
    it('deve criar uma nova conta com sucesso', async () => {
      const accountData = {
        bank_name: 'Banco Teste',
        account_type: 'corrente',
        balance: 1000,
        description: 'Conta teste'
      };

      const mockAccount = {
        id: 1,
        user_id: 1,
        ...accountData
      };

      mockReq.body = accountData;
      mockAccountService.createAccount.mockResolvedValue(mockAccount);

      await controller.createAccount(mockReq, mockRes);

      expect(mockAccountService.createAccount).toHaveBeenCalledWith(1, accountData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { accountId: mockAccount.id }
      });
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const accountData = { bank_name: '' };
      mockReq.body = accountData;
      
      // Mock do erro Zod
      const zodError = new Error('Nome do banco é obrigatório');
      zodError.name = 'ZodError';
      mockAccountService.createAccount.mockRejectedValue(zodError);

      await controller.createAccount(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Nome do banco é obrigatório'
      });
    });

    it('deve retornar erro 404 para conta não encontrada', async () => {
      const accountData = { bank_name: 'Banco Teste' };
      mockReq.body = accountData;
      
      const notFoundError = new AppError('Conta não encontrada', 404);
      mockAccountService.createAccount.mockRejectedValue(notFoundError);

      await controller.createAccount(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Conta não encontrada'
      });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      const accountData = { bank_name: 'Banco Teste' };
      mockReq.body = accountData;
      
      const internalError = new Error('Erro interno');
      mockAccountService.createAccount.mockRejectedValue(internalError);

      await controller.createAccount(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('getAccounts', () => {
    it('deve retornar todas as contas do usuário', async () => {
      const mockAccounts = [
        { id: 1, bank_name: 'Banco A', balance: 1000 },
        { id: 2, bank_name: 'Banco B', balance: 2000 }
      ];

      mockAccountService.getAccounts.mockResolvedValue({ accounts: mockAccounts, totalBalance: 3000 });

      await controller.getAccounts(mockReq, mockRes);

      expect(mockAccountService.getAccounts).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { accounts: mockAccounts, totalBalance: 3000 }
      });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      const internalError = new Error('Erro interno');
      mockAccountService.getAccounts.mockRejectedValue(internalError);

      await controller.getAccounts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('getAccount', () => {
    it('deve retornar uma conta específica', async () => {
      const mockAccount = {
        id: 1,
        user_id: 1,
        bank_name: 'Banco Teste',
        balance: 1000
      };

      mockReq.params = { id: 1 };
      mockAccountService.getAccount.mockResolvedValue(mockAccount);

      await controller.getAccount(mockReq, mockRes);

      expect(mockAccountService.getAccount).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccount
      });
    });

    it('deve retornar erro 404 quando conta não é encontrada', async () => {
      mockReq.params = { id: 999 };
      const notFoundError = new NotFoundError('Conta não encontrada');
      mockAccountService.getAccount.mockRejectedValue(notFoundError);

      await controller.getAccount(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Conta não encontrada'
      });
    });
  });

  describe('updateAccount', () => {
    it('deve atualizar uma conta com sucesso', async () => {
      const updateData = {
        bank_name: 'Novo Banco',
        account_type: 'poupança',
        balance: 2000
      };

      mockReq.params = { id: 1 };
      mockReq.body = updateData;
      mockAccountService.updateAccount.mockResolvedValue();

      await controller.updateAccount(mockReq, mockRes);

      expect(mockAccountService.updateAccount).toHaveBeenCalledWith(1, 1, updateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Conta atualizada com sucesso' }
      });
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const updateData = { bank_name: '' };
      mockReq.params = { id: 1 };
      mockReq.body = updateData;
      
      // Mock do erro Zod
      const zodError = new Error('Nome do banco é obrigatório');
      zodError.name = 'ZodError';
      mockAccountService.updateAccount.mockRejectedValue(zodError);

      await controller.updateAccount(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Nome do banco é obrigatório'
      });
    });
  });

  describe('deleteAccount', () => {
    it('deve excluir uma conta com sucesso', async () => {
      mockReq.params = { id: 1 };
      mockAccountService.deleteAccount.mockResolvedValue();

      await controller.deleteAccount(mockReq, mockRes);

      expect(mockAccountService.deleteAccount).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Conta excluída com sucesso' }
      });
    });

    it('deve retornar erro 404 quando conta não é encontrada', async () => {
      mockReq.params = { id: 999 };
      const notFoundError = new NotFoundError('Conta não encontrada');
      mockAccountService.deleteAccount.mockRejectedValue(notFoundError);

      await controller.deleteAccount(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Conta não encontrada'
      });
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas das contas', async () => {
      const mockAccounts = [
        { id: 1, balance: 1000 },
        { id: 2, balance: 2000 },
        { id: 3, balance: 3000 }
      ];

      mockAccountService.getAccounts.mockResolvedValue({ accounts: mockAccounts, totalBalance: 6000 });

      await controller.getStats(mockReq, mockRes);

      expect(mockAccountService.getAccounts).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          total_balance: 6000,
          account_count: 3,
          average_balance: 2000,
          highest_balance: 3000,
          lowest_balance: 1000
        }
      });
    });
  });

  describe('getCharts', () => {
    it('deve retornar dados de gráficos de distribuição de saldo', async () => {
      const mockAccounts = [
        { id: 1, description: 'Conta A', balance: 1000, account_type: 'corrente' },
        { id: 2, description: 'Conta B', balance: 2000, account_type: 'poupança' }
      ];

      mockReq.query = { type: 'balance' };
      mockAccountService.getAccounts.mockResolvedValue({ accounts: mockAccounts, totalBalance: 3000 });

      await controller.getCharts(mockReq, mockRes);

      expect(mockAccountService.getAccounts).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          balanceDistribution: [
            {
              id: 2,
              name: 'Conta B',
              balance: 2000,
              percentage: 66.67,
              type: 'poupança'
            },
            {
              id: 1,
              name: 'Conta A',
              balance: 1000,
              percentage: 33.33,
              type: 'corrente'
            }
          ],
          totalBalance: 3000
        }
      });
    });

    it('deve retornar dados de gráficos de distribuição por tipo', async () => {
      const mockAccounts = [
        { id: 1, balance: 1000, account_type: 'corrente' },
        { id: 2, balance: 2000, account_type: 'poupança' }
      ];

      mockReq.query = { type: 'type' };
      mockAccountService.getAccounts.mockResolvedValue({ accounts: mockAccounts, totalBalance: 3000 });

      await controller.getCharts(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          typeDistribution: [
            {
              type: 'poupança',
              count: 1,
              totalBalance: 2000,
              percentage: 66.67
            },
            {
              type: 'corrente',
              count: 1,
              totalBalance: 1000,
              percentage: 33.33
            }
          ],
          totalAccounts: 2,
          totalBalance: 3000
        }
      });
    });
  });

  describe('handleError', () => {
    it('deve tratar ValidationError corretamente', () => {
      const error = new ValidationError('Erro de validação');
      
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro de validação'
      });
    });

    it('deve tratar NotFoundError corretamente', () => {
      const error = new NotFoundError('Recurso não encontrado');
      
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Recurso não encontrado'
      });
    });

    it('deve tratar AppError com statusCode 404 corretamente', () => {
      const error = new AppError('Recurso não encontrado', 404);
      
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Recurso não encontrado'
      });
    });

    it('deve tratar erro genérico como 500', () => {
      const error = new Error('Erro interno');
      
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });
}); 