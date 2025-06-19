/**
 * Testes unitários para o controlador de contas.
 * @author AI
 */
const accountController = require('../../controllers/accountController');
const { Account } = require('../../models');

// Mock do modelo Account
jest.mock('../../models', () => ({
  Account: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}));

describe('Account Controller', () => {
  let mockReq;
  let mockRes;
  let mockAccount;

  beforeEach(() => {
    mockReq = {
      user: { id: 1 },
      body: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockAccount = {
      id: 1,
      user_id: 1,
      bank_name: 'Banco Teste',
      account_type: 'corrente',
      balance: 1000,
      description: 'Conta teste',
      update: jest.fn(),
      destroy: jest.fn()
    };

    // Limpar todos os mocks
    jest.clearAllMocks();
  });

  describe('createAccount', () => {
    it('deve criar uma nova conta com sucesso', async () => {
      // Arrange
      mockReq.body = {
        bank_name: 'Banco Teste',
        account_type: 'corrente',
        balance: 1000,
        description: 'Conta teste'
      };
      Account.create.mockResolvedValue(mockAccount);

      // Act
      await accountController.createAccount(mockReq, mockRes);

      // Assert
      expect(Account.create).toHaveBeenCalledWith({
        user_id: 1,
        bank_name: 'Banco Teste',
        account_type: 'corrente',
        balance: 1000,
        description: 'Conta teste'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Conta criada com sucesso',
        accountId: 1
      });
    });
  });

  describe('getAccounts', () => {
    it('deve retornar todas as contas do usuário', async () => {
      // Arrange
      const mockAccounts = [
        { ...mockAccount, balance: 1000 },
        { ...mockAccount, id: 2, balance: 2000 }
      ];
      Account.findAll.mockResolvedValue(mockAccounts);

      // Act
      await accountController.getAccounts(mockReq, mockRes);

      // Assert
      expect(Account.findAll).toHaveBeenCalledWith({
        where: { user_id: 1 }
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        accounts: mockAccounts,
        totalBalance: 3000
      });
    });
  });

  describe('getAccount', () => {
    it('deve retornar uma conta específica', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      Account.findByPk.mockResolvedValue(mockAccount);

      // Act
      await accountController.getAccount(mockReq, mockRes);

      // Assert
      expect(Account.findByPk).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith(mockAccount);
    });

    it('deve retornar 404 quando conta não é encontrada', async () => {
      // Arrange
      mockReq.params = { id: 999 };
      Account.findByPk.mockResolvedValue(null);

      // Act
      await accountController.getAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta não encontrada' });
    });

    it('deve retornar 403 quando usuário não é dono da conta', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockAccount.user_id = 2;
      Account.findByPk.mockResolvedValue(mockAccount);

      // Act
      await accountController.getAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });
  });

  describe('updateAccount', () => {
    it('deve atualizar uma conta com sucesso', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockReq.body = {
        bank_name: 'Novo Banco',
        account_type: 'poupança',
        balance: 2000,
        description: 'Nova descrição'
      };
      Account.findByPk.mockResolvedValue(mockAccount);
      mockAccount.update.mockResolvedValue([1]);

      // Act
      await accountController.updateAccount(mockReq, mockRes);

      // Assert
      expect(Account.findByPk).toHaveBeenCalledWith(1);
      expect(mockAccount.update).toHaveBeenCalledWith({
        bank_name: 'Novo Banco',
        account_type: 'poupança',
        balance: 2000,
        description: 'Nova descrição'
      });
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Conta atualizada com sucesso' });
    });

    it('deve retornar 404 quando conta não é encontrada', async () => {
      // Arrange
      mockReq.params = { id: 999 };
      Account.findByPk.mockResolvedValue(null);

      // Act
      await accountController.updateAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta não encontrada' });
    });

    it('deve retornar 403 quando usuário não é dono da conta', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockAccount.user_id = 2;
      Account.findByPk.mockResolvedValue(mockAccount);

      // Act
      await accountController.updateAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });
  });

  describe('deleteAccount', () => {
    it('deve excluir uma conta com sucesso', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      Account.findByPk.mockResolvedValue(mockAccount);
      mockAccount.destroy.mockResolvedValue(1);

      // Act
      await accountController.deleteAccount(mockReq, mockRes);

      // Assert
      expect(Account.findByPk).toHaveBeenCalledWith(1);
      expect(mockAccount.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Conta excluída com sucesso' });
    });

    it('deve retornar 404 quando conta não é encontrada', async () => {
      // Arrange
      mockReq.params = { id: 999 };
      Account.findByPk.mockResolvedValue(null);

      // Act
      await accountController.deleteAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta não encontrada' });
    });

    it('deve retornar 403 quando usuário não é dono da conta', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockAccount.user_id = 2;
      Account.findByPk.mockResolvedValue(mockAccount);

      // Act
      await accountController.deleteAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });
  });
}); 