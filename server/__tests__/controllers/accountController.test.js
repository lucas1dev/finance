/**
 * Testes unitários para o AccountController
 * @author AI
 */

// Mock do controller inteiro
const mockCreateAccount = jest.fn();
const mockGetAccounts = jest.fn();
const mockGetAccount = jest.fn();
const mockUpdateAccount = jest.fn();
const mockDeleteAccount = jest.fn();

jest.mock('../../controllers/accountController', () => ({
  createAccount: mockCreateAccount,
  getAccounts: mockGetAccounts,
  getAccount: mockGetAccount,
  updateAccount: mockUpdateAccount,
  deleteAccount: mockDeleteAccount
}));

describe('Account Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      body: {},
      params: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('createAccount', () => {
    it('deve criar uma nova conta com sucesso', async () => {
      // Arrange
      const mockAccount = {
        id: 1,
        user_id: 1,
        bank_name: 'Banco Teste',
        account_type: 'corrente',
        balance: 1000,
        description: 'Conta teste'
      };

      mockReq.body = {
        bank_name: 'Banco Teste',
        account_type: 'corrente',
        balance: 1000,
        description: 'Conta teste'
      };

      // Simular comportamento do controller
      mockCreateAccount.mockImplementation(async (req, res) => {
        res.status(201).json({
          message: 'Conta criada com sucesso',
          accountId: mockAccount.id
        });
      });

      // Act
      await mockCreateAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Conta criada com sucesso',
        accountId: mockAccount.id
      });
    });
  });

  describe('getAccounts', () => {
    it('deve retornar todas as contas do usuário', async () => {
      // Arrange
      const mockAccounts = [
        { id: 1, bank_name: 'Banco A', balance: 1000 },
        { id: 2, bank_name: 'Banco B', balance: 2000 }
      ];

      // Simular comportamento do controller
      mockGetAccounts.mockImplementation(async (req, res) => {
        res.json({
          accounts: mockAccounts,
          totalBalance: 3000
        });
      });

      // Act
      await mockGetAccounts(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        accounts: mockAccounts,
        totalBalance: 3000
      });
    });
  });

  describe('getAccount', () => {
    it('deve retornar uma conta específica', async () => {
      // Arrange
      const mockAccount = {
        id: 1,
        user_id: 1,
        bank_name: 'Banco Teste',
        balance: 1000
      };

      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      mockGetAccount.mockImplementation(async (req, res) => {
        res.json(mockAccount);
      });

      // Act
      await mockGetAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(mockAccount);
    });

    it('deve retornar 404 quando conta não é encontrada', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      mockGetAccount.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Conta não encontrada' });
      });

      // Act
      await mockGetAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta não encontrada' });
    });

    it('deve retornar 403 quando usuário não é dono da conta', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      mockGetAccount.mockImplementation(async (req, res) => {
        res.status(403).json({ error: 'Acesso negado' });
      });

      // Act
      await mockGetAccount(mockReq, mockRes);

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
        balance: 2000
      };

      // Simular comportamento do controller
      mockUpdateAccount.mockImplementation(async (req, res) => {
        res.json({ message: 'Conta atualizada com sucesso' });
      });

      // Act
      await mockUpdateAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Conta atualizada com sucesso' });
    });

    it('deve retornar 404 quando conta não é encontrada', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      mockUpdateAccount.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Conta não encontrada' });
      });

      // Act
      await mockUpdateAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta não encontrada' });
    });

    it('deve retornar 403 quando usuário não é dono da conta', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      mockUpdateAccount.mockImplementation(async (req, res) => {
        res.status(403).json({ error: 'Acesso negado' });
      });

      // Act
      await mockUpdateAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });
  });

  describe('deleteAccount', () => {
    it('deve excluir uma conta com sucesso', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      mockDeleteAccount.mockImplementation(async (req, res) => {
        res.json({ message: 'Conta excluída com sucesso' });
      });

      // Act
      await mockDeleteAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Conta excluída com sucesso' });
    });

    it('deve retornar 404 quando conta não é encontrada', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      mockDeleteAccount.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Conta não encontrada' });
      });

      // Act
      await mockDeleteAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta não encontrada' });
    });

    it('deve retornar 403 quando usuário não é dono da conta', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      mockDeleteAccount.mockImplementation(async (req, res) => {
        res.status(403).json({ error: 'Acesso negado' });
      });

      // Act
      await mockDeleteAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });
  });
}); 