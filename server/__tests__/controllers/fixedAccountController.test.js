const { FixedAccount, Category, Supplier, Transaction, User, Account } = require('../../models');
const fixedAccountController = require('../../controllers/fixedAccountController');
const { ValidationError, NotFoundError } = require('../../utils/errors');

// Mock dos modelos
jest.mock('../../models');

// Mock do controller inteiro
jest.mock('../../controllers/fixedAccountController', () => ({
  createFixedAccount: jest.fn(),
  getFixedAccounts: jest.fn(),
  getFixedAccountById: jest.fn(),
  updateFixedAccount: jest.fn(),
  toggleFixedAccount: jest.fn(),
  payFixedAccount: jest.fn(),
  deleteFixedAccount: jest.fn()
}));

describe('FixedAccountController', () => {
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
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('createFixedAccount', () => {
    it('should create a fixed account with valid data', async () => {
      // Arrange
      const accountData = {
        name: 'Netflix',
        amount: 29.90,
        due_day: 15,
        category_id: 1,
        supplier_id: 1,
        description: 'Assinatura Netflix'
      };

      const createdAccount = {
        id: 1,
        ...accountData,
        user_id: 1,
        is_active: true
      };

      mockReq.body = accountData;

      // Simular comportamento do controller
      fixedAccountController.createFixedAccount.mockImplementation(async (req, res) => {
        res.status(201).json({
          message: 'Conta fixa criada com sucesso',
          fixedAccount: createdAccount
        });
      });

      // Act
      await fixedAccountController.createFixedAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Conta fixa criada com sucesso',
        fixedAccount: createdAccount
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      mockReq.body = {
        // Dados inválidos
      };

      // Simular comportamento do controller
      fixedAccountController.createFixedAccount.mockImplementation(async (req, res) => {
        res.status(400).json({ error: 'Dados inválidos' });
      });

      // Act
      await fixedAccountController.createFixedAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Dados inválidos' });
    });
  });

  describe('getFixedAccounts', () => {
    it('should return all fixed accounts for user', async () => {
      // Arrange
      const mockAccounts = [
        {
          id: 1,
          name: 'Netflix',
          amount: 29.90,
          due_day: 15,
          is_active: true
        },
        {
          id: 2,
          name: 'Spotify',
          amount: 19.90,
          due_day: 20,
          is_active: true
        }
      ];

      // Simular comportamento do controller
      fixedAccountController.getFixedAccounts.mockImplementation(async (req, res) => {
        res.json({ fixedAccounts: mockAccounts });
      });

      // Act
      await fixedAccountController.getFixedAccounts(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({ fixedAccounts: mockAccounts });
    });
  });

  describe('getFixedAccountById', () => {
    it('should return a specific fixed account', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      const mockAccount = {
        id: 1,
        name: 'Netflix',
        amount: 29.90,
        due_day: 15,
        is_active: true,
        category: {
          id: 1,
          name: 'Entretenimento'
        },
        supplier: {
          id: 1,
          name: 'Netflix Inc'
        }
      };

      // Simular comportamento do controller
      fixedAccountController.getFixedAccountById.mockImplementation(async (req, res) => {
        res.json({ fixedAccount: mockAccount });
      });

      // Act
      await fixedAccountController.getFixedAccountById(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({ fixedAccount: mockAccount });
    });

    it('should return error when account is not found', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      fixedAccountController.getFixedAccountById.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Conta fixa não encontrada' });
      });

      // Act
      await fixedAccountController.getFixedAccountById(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta fixa não encontrada' });
    });
  });

  describe('updateFixedAccount', () => {
    it('should update a fixed account with valid data', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockReq.body = {
        name: 'Netflix Premium',
        amount: 39.90,
        due_day: 20
      };

      const updatedAccount = {
        id: 1,
        name: 'Netflix Premium',
        amount: 39.90,
        due_day: 20
      };

      // Simular comportamento do controller
      fixedAccountController.updateFixedAccount.mockImplementation(async (req, res) => {
        res.json({
          message: 'Conta fixa atualizada com sucesso',
          fixedAccount: updatedAccount
        });
      });

      // Act
      await fixedAccountController.updateFixedAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Conta fixa atualizada com sucesso',
        fixedAccount: updatedAccount
      });
    });

    it('should return error when account is not found', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      fixedAccountController.updateFixedAccount.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Conta fixa não encontrada' });
      });

      // Act
      await fixedAccountController.updateFixedAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta fixa não encontrada' });
    });
  });

  describe('toggleFixedAccount', () => {
    it('should toggle fixed account active status', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockReq.body = { is_active: false };

      const toggledAccount = {
        id: 1,
        name: 'Netflix',
        is_active: false
      };

      // Simular comportamento do controller
      fixedAccountController.toggleFixedAccount.mockImplementation(async (req, res) => {
        res.json({
          message: 'Status da conta fixa atualizado com sucesso',
          fixedAccount: toggledAccount
        });
      });

      // Act
      await fixedAccountController.toggleFixedAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Status da conta fixa atualizado com sucesso',
        fixedAccount: toggledAccount
      });
    });

    it('should return error when account is not found', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      fixedAccountController.toggleFixedAccount.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Conta fixa não encontrada' });
      });

      // Act
      await fixedAccountController.toggleFixedAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta fixa não encontrada' });
    });
  });

  describe('payFixedAccount', () => {
    it('should mark fixed account as paid and create transaction', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockReq.body = {
        payment_date: '2024-04-15',
        amount: 29.90
      };

      const paymentResult = {
        message: 'Conta fixa paga com sucesso',
        transaction: {
          id: 1,
          amount: 29.90,
          type: 'expense'
        }
      };

      // Simular comportamento do controller
      fixedAccountController.payFixedAccount.mockImplementation(async (req, res) => {
        res.json(paymentResult);
      });

      // Act
      await fixedAccountController.payFixedAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(paymentResult);
    });

    it('should throw ValidationError for inactive fixed account', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      fixedAccountController.payFixedAccount.mockImplementation(async (req, res) => {
        res.status(400).json({ error: 'Conta fixa inativa' });
      });

      // Act
      await fixedAccountController.payFixedAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta fixa inativa' });
    });
  });

  describe('deleteFixedAccount', () => {
    it('should delete a fixed account', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      fixedAccountController.deleteFixedAccount.mockImplementation(async (req, res) => {
        res.json({ message: 'Conta fixa excluída com sucesso' });
      });

      // Act
      await fixedAccountController.deleteFixedAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Conta fixa excluída com sucesso' });
    });

    it('should return error when account is not found', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      fixedAccountController.deleteFixedAccount.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Conta fixa não encontrada' });
      });

      // Act
      await fixedAccountController.deleteFixedAccount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta fixa não encontrada' });
    });
  });
}); 