/**
 * Testes unitários para o AccountController
 * @author Lucas Santos
 */

// Mock do service
jest.mock('../../services/accountService', () => ({
  createAccount: jest.fn(),
  getAccounts: jest.fn(),
  getAccount: jest.fn(),
  updateAccount: jest.fn(),
  deleteAccount: jest.fn()
}));

// Mock dos schemas de validação
jest.mock('../../utils/validators', () => ({
  createAccountSchema: {
    parse: jest.fn()
  },
  updateAccountSchema: {
    parse: jest.fn()
  }
}));

// Mock dos erros
jest.mock('../../utils/errors', () => ({
  AppError: jest.fn()
}));

let accountService;
let createAccountSchema, updateAccountSchema;
let AppError;

describe('Account Controller', () => {
  let mockReq, mockRes, mockNext, accountController;

  beforeEach(() => {
    // Limpar cache do require para garantir mocks limpos
    jest.resetModules();
    delete require.cache[require.resolve('../../controllers/accountController')];
    delete require.cache[require.resolve('../../utils/validators')];
    delete require.cache[require.resolve('../../services/accountService')];
    delete require.cache[require.resolve('../../utils/errors')];
    
    // Reimportar módulos com mocks limpos
    accountController = require('../../controllers/accountController');
    accountService = require('../../services/accountService');
    const validators = require('../../utils/validators');
    const errors = require('../../utils/errors');
    
    createAccountSchema = validators.createAccountSchema;
    updateAccountSchema = validators.updateAccountSchema;
    AppError = errors.AppError;

    // Limpar todos os mocks
    jest.clearAllMocks();

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

    mockNext = jest.fn();
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
      createAccountSchema.parse.mockReturnValue(accountData);
      accountService.createAccount.mockResolvedValue(mockAccount);

      await accountController.createAccount(mockReq, mockRes, mockNext);

      expect(createAccountSchema.parse).toHaveBeenCalledWith(accountData);
      expect(accountService.createAccount).toHaveBeenCalledWith(1, accountData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { accountId: mockAccount.id }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro de validação', async () => {
      const accountData = { bank_name: '' };
      mockReq.body = accountData;
      createAccountSchema.parse.mockImplementation(() => {
        throw new Error('Nome do banco é obrigatório');
      });

      await accountController.createAccount(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('deve retornar erro do service', async () => {
      const accountData = { bank_name: 'Banco Teste' };
      mockReq.body = accountData;
      createAccountSchema.parse.mockReturnValue(accountData);
      accountService.createAccount.mockRejectedValue(new Error('Erro interno'));

      await accountController.createAccount(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('getAccounts', () => {
    it('deve retornar todas as contas do usuário', async () => {
      const mockAccounts = [
        { id: 1, bank_name: 'Banco A', balance: 1000 },
        { id: 2, bank_name: 'Banco B', balance: 2000 }
      ];

      accountService.getAccounts.mockResolvedValue(mockAccounts);

      await accountController.getAccounts(mockReq, mockRes, mockNext);

      expect(accountService.getAccounts).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccounts
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro do service', async () => {
      accountService.getAccounts.mockRejectedValue(new Error('Erro interno'));

      await accountController.getAccounts(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockRes.json).not.toHaveBeenCalled();
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
      accountService.getAccount.mockResolvedValue(mockAccount);

      await accountController.getAccount(mockReq, mockRes, mockNext);

      expect(accountService.getAccount).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccount
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando conta não é encontrada', async () => {
      mockReq.params = { id: 999 };
      accountService.getAccount.mockRejectedValue(new AppError('Conta não encontrada', 404));

      await accountController.getAccount(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockRes.json).not.toHaveBeenCalled();
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
      updateAccountSchema.parse.mockReturnValue(updateData);
      accountService.updateAccount.mockResolvedValue();

      await accountController.updateAccount(mockReq, mockRes, mockNext);

      expect(updateAccountSchema.parse).toHaveBeenCalledWith(updateData);
      expect(accountService.updateAccount).toHaveBeenCalledWith(1, 1, updateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Conta atualizada com sucesso'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro de validação', async () => {
      const updateData = { bank_name: '' };
      mockReq.params = { id: 1 };
      mockReq.body = updateData;
      updateAccountSchema.parse.mockImplementation(() => {
        throw new Error('Nome do banco é obrigatório');
      });

      await accountController.updateAccount(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando conta não é encontrada', async () => {
      const updateData = { bank_name: 'Novo Banco' };
      mockReq.params = { id: 999 };
      mockReq.body = updateData;
      updateAccountSchema.parse.mockReturnValue(updateData);
      accountService.updateAccount.mockRejectedValue(new AppError('Conta não encontrada', 404));

      await accountController.updateAccount(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('deleteAccount', () => {
    it('deve deletar uma conta com sucesso', async () => {
      mockReq.params = { id: 1 };
      accountService.deleteAccount.mockResolvedValue();

      await accountController.deleteAccount(mockReq, mockRes, mockNext);

      expect(accountService.deleteAccount).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Conta excluída com sucesso'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando conta não é encontrada', async () => {
      mockReq.params = { id: 999 };
      accountService.deleteAccount.mockRejectedValue(new AppError('Conta não encontrada', 404));

      await accountController.deleteAccount(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
}); 