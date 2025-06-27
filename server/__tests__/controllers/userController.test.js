/**
 * Testes unitários para UserController
 * Testa operações administrativas de gerenciamento de usuários
 */

let User, Transaction, Account, Notification;
let createUserSchema, updateUserSchema;
let successResponse, AppError;
let userController;

// Mock dos models Sequelize
jest.mock('../../models', () => ({
  User: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Transaction: {
    count: jest.fn(),
    findOne: jest.fn()
  },
  Account: {
    count: jest.fn(),
    findAll: jest.fn()
  },
  Notification: {
    count: jest.fn()
  }
}));

// Mock dos validadores
jest.mock('../../utils/validators', () => ({
  createUserSchema: {
    parse: jest.fn()
  },
  updateUserSchema: {
    parse: jest.fn()
  }
}));

// Mock dos utilitários
jest.mock('../../utils/response', () => ({
  successResponse: jest.fn()
}));

// Mock dos erros
jest.mock('../../utils/errors', () => ({
  AppError: jest.fn()
}));

describe('UserController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Importar após os mocks
    userController = require('../../controllers/userController');
    ({ User, Transaction, Account, Notification } = require('../../models'));
    ({ createUserSchema, updateUserSchema } = require('../../utils/validators'));
    ({ successResponse } = require('../../utils/response'));
    ({ AppError } = require('../../utils/errors'));
    
    // Limpar todos os mocks
    jest.clearAllMocks();
    
    // Mock do objeto de requisição
    mockReq = {
      query: {},
      params: {},
      body: {},
      user: { id: 1, role: 'admin' }
    };

    // Mock do objeto de resposta
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getUsers', () => {
    it('should return users list with pagination successfully', async () => {
      // Arrange
      const mockUsers = [
        {
          id: 1,
          name: 'João Silva',
          email: 'joao@example.com',
          role: 'user',
          active: true,
          created_at: '2024-01-01T00:00:00.000Z',
          last_login: '2024-01-15T10:30:00.000Z',
          toJSON: () => ({
            id: 1,
            name: 'João Silva',
            email: 'joao@example.com',
            role: 'user',
            active: true,
            created_at: '2024-01-01T00:00:00.000Z',
            last_login: '2024-01-15T10:30:00.000Z'
          })
        }
      ];

      mockReq.query = { page: 1, limit: 10 };
      
      User.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockUsers
      });

      // Act
      await userController.getUsers(mockReq, mockRes);

      // Assert
      expect(User.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        attributes: ['id', 'name', 'email', 'role', 'active', 'created_at', 'last_login'],
        order: [['created_at', 'DESC']],
        limit: 10,
        offset: 0
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        users: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: 'João Silva',
            email: 'joao@example.com',
            status: 'active'
          })
        ]),
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      });
    });

    it('should apply search filter correctly', async () => {
      // Arrange
      mockReq.query = { search: 'joao', page: 1, limit: 10 };
      
      User.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: []
      });

      // Act
      await userController.getUsers(mockReq, mockRes);

      // Assert
      expect(User.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [require('sequelize').Op.or]: [
            { name: { [require('sequelize').Op.like]: '%joao%' } },
            { email: { [require('sequelize').Op.like]: '%joao%' } }
          ]
        },
        attributes: ['id', 'name', 'email', 'role', 'active', 'created_at', 'last_login'],
        order: [['created_at', 'DESC']],
        limit: 10,
        offset: 0
      });
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics successfully', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com',
        role: 'user',
        active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        last_login: '2024-01-15T10:30:00.000Z'
      };

      mockReq.params = { id: 1 };
      
      User.findByPk.mockResolvedValue(mockUser);
      Transaction.count.mockResolvedValue(50);
      Account.count.mockResolvedValue(3);
      Notification.count.mockResolvedValue(10);
      Transaction.findOne.mockResolvedValue({ created_at: '2024-01-15T10:30:00.000Z' });
      Account.findAll.mockResolvedValue([
        { balance: '1000.00' },
        { balance: '500.00' }
      ]);

      // Act
      await userController.getUserStats(mockReq, mockRes);

      // Assert
      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: ['id', 'name', 'email', 'role', 'active', 'created_at', 'last_login']
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: 1,
              name: 'João Silva'
            }),
            stats: expect.objectContaining({
              transactions: expect.any(Object),
              accounts: expect.any(Object),
              notifications: expect.any(Object)
            })
          })
        })
      );
    });
  });

  describe('updateUserStatus', () => {
    it('should return success for activate user', async () => {
      // Arrange
      const mockUser = {
        id: 2,
        name: 'Maria Silva',
        email: 'maria@example.com',
        active: false,
        update: jest.fn().mockResolvedValue()
      };

      mockReq.params = { id: 2 };
      mockReq.body = { status: 'active' };
      
      User.findByPk.mockResolvedValue(mockUser);

      // Act
      await userController.updateUserStatus(mockReq, mockRes);

      // Assert
      expect(User.findByPk).toHaveBeenCalledWith(2);
      expect(mockUser.update).toHaveBeenCalledWith({ active: true });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Status do usuário atualizado com sucesso',
        userId: 2,
        newStatus: 'active'
      });
    });

    it('should return success for deactivate user', async () => {
      // Arrange
      const mockUser = {
        id: 2,
        name: 'Maria Silva',
        email: 'maria@example.com',
        active: true,
        update: jest.fn().mockResolvedValue()
      };

      mockReq.params = { id: 2 };
      mockReq.body = { status: 'inactive' };
      
      User.findByPk.mockResolvedValue(mockUser);

      // Act
      await userController.updateUserStatus(mockReq, mockRes);

      // Assert
      expect(mockUser.update).toHaveBeenCalledWith({ active: false });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Status do usuário atualizado com sucesso',
        userId: 2,
        newStatus: 'inactive'
      });
    });

    it('should return error when trying to deactivate own account', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        active: true
      };

      mockReq.params = { id: 1 };
      mockReq.body = { status: 'inactive' };
      mockReq.user = { id: 1 };
      
      User.findByPk.mockResolvedValue(mockUser);

      // Act
      await userController.updateUserStatus(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Não é possível desativar sua própria conta'
      });
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      // Arrange
      const mockUser = {
        id: 2,
        name: 'Maria Silva',
        email: 'maria@example.com',
        role: 'user',
        update: jest.fn().mockResolvedValue()
      };

      mockReq.params = { id: 2 };
      mockReq.body = { role: 'admin' };
      
      User.findByPk.mockResolvedValue(mockUser);

      // Act
      await userController.updateUserRole(mockReq, mockRes);

      // Assert
      expect(User.findByPk).toHaveBeenCalledWith(2);
      expect(mockUser.update).toHaveBeenCalledWith({ role: 'admin' });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Role do usuário atualizado com sucesso',
        userId: 2,
        newRole: 'admin'
      });
    });

    it('should return error when trying to change own role', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      };

      mockReq.params = { id: 1 };
      mockReq.body = { role: 'user' };
      mockReq.user = { id: 1 };
      
      User.findByPk.mockResolvedValue(mockUser);

      // Act
      await userController.updateUserRole(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Não é possível alterar seu próprio role'
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully when no associated data', async () => {
      // Arrange
      const mockUser = {
        id: 2,
        name: 'Maria Silva',
        email: 'maria@example.com',
        destroy: jest.fn().mockResolvedValue()
      };

      mockReq.params = { id: 2 };
      mockReq.user = { id: 1 };
      
      User.findByPk.mockResolvedValue(mockUser);
      Transaction.count.mockResolvedValue(0);
      Account.count.mockResolvedValue(0);

      // Act
      await userController.deleteUser(mockReq, mockRes);

      // Assert
      expect(User.findByPk).toHaveBeenCalledWith(2);
      expect(Transaction.count).toHaveBeenCalledWith({ where: { user_id: 2 } });
      expect(Account.count).toHaveBeenCalledWith({ where: { user_id: 2 } });
      expect(mockUser.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Usuário excluído com sucesso',
        userId: 2
      });
    });

    it('should return error when user has associated data', async () => {
      // Arrange
      const mockUser = {
        id: 2,
        name: 'Maria Silva',
        email: 'maria@example.com'
      };

      mockReq.params = { id: 2 };
      mockReq.user = { id: 1 };
      
      User.findByPk.mockResolvedValue(mockUser);
      Transaction.count.mockResolvedValue(5);
      Account.count.mockResolvedValue(2);

      // Act
      await userController.deleteUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Não é possível excluir usuário com dados associados',
        details: {
          transactions: 5,
          accounts: 2
        }
      });
    });

    it('should return error when trying to delete own account', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com'
      };

      mockReq.params = { id: 1 };
      mockReq.user = { id: 1 };
      
      User.findByPk.mockResolvedValue(mockUser);

      // Act
      await userController.deleteUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Não é possível excluir sua própria conta'
      });
    });
  });
}); 