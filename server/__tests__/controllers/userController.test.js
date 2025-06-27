/**
 * Testes unitários para UserController
 * Testa operações administrativas de gerenciamento de usuários
 */

let UserService;
let userController;

// Mock do UserService
jest.mock('../../services/userService', () => ({
  getUsers: jest.fn(),
  getUsersStats: jest.fn(),
  getUserById: jest.fn(),
  updateUserStatus: jest.fn(),
  updateUserRole: jest.fn(),
  deleteUser: jest.fn(),
  getUserStats: jest.fn()
}));

// Mock do logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('UserController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Importar após os mocks
    userController = require('../../controllers/userController');
    UserService = require('../../services/userService');
    
    // Limpar todos os mocks
    jest.clearAllMocks();
    
    // Mock do objeto de requisição
    mockReq = {
      query: {},
      params: {},
      body: {},
      userId: 1
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
      const mockResult = {
        users: [
          {
            id: 1,
            name: 'João Silva',
            email: 'joao@example.com',
            role: 'user',
            active: true,
            status: 'active',
            created_at: '2024-01-01T00:00:00.000Z',
            last_login: '2024-01-15T10:30:00.000Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      };

      mockReq.query = { page: 1, limit: 10 };
      UserService.getUsers.mockResolvedValue(mockResult);

      // Act
      await userController.getUsers(mockReq, mockRes);

      // Assert
      expect(UserService.getUsers).toHaveBeenCalledWith(mockReq.query);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should apply search filter correctly', async () => {
      // Arrange
      const mockResult = {
        users: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      };

      mockReq.query = { search: 'joao', page: 1, limit: 10 };
      UserService.getUsers.mockResolvedValue(mockResult);

      // Act
      await userController.getUsers(mockReq, mockRes);

      // Assert
      expect(UserService.getUsers).toHaveBeenCalledWith(mockReq.query);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Database error');
      UserService.getUsers.mockRejectedValue(error);

      // Act
      await userController.getUsers(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro ao buscar usuários'
      });
    });
  });

  describe('getUsersStats', () => {
    it('should return users statistics successfully', async () => {
      // Arrange
      const mockStats = {
        total: 100,
        active: 85,
        inactive: 15,
        newUsers: 10,
        adminUsers: 5,
        regularUsers: 95,
        recentActivityUsers: 70,
        growthRate: 15.5,
        period: 'month',
        periodStart: '2024-01-01T00:00:00.000Z'
      };

      mockReq.query = { period: 'month' };
      UserService.getUsersStats.mockResolvedValue(mockStats);

      // Act
      await userController.getUsersStats(mockReq, mockRes);

      // Assert
      expect(UserService.getUsersStats).toHaveBeenCalledWith(mockReq.query);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });
  });

  describe('getUser', () => {
    it('should return user details successfully', async () => {
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
      UserService.getUserById.mockResolvedValue(mockUser);

      // Act
      await userController.getUser(mockReq, mockRes);

      // Assert
      expect(UserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('should handle user not found', async () => {
      // Arrange
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      
      mockReq.params = { id: 999 };
      UserService.getUserById.mockRejectedValue(error);

      // Act
      await userController.getUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuário não encontrado'
      });
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status successfully', async () => {
      // Arrange
      const mockUpdatedUser = {
        id: 2,
        name: 'Maria Silva',
        email: 'maria@example.com',
        role: 'user',
        active: true,
        status: 'active'
      };

      mockReq.params = { id: 2 };
      mockReq.body = { active: true };
      UserService.updateUserStatus.mockResolvedValue(mockUpdatedUser);

      // Act
      await userController.updateUserStatus(mockReq, mockRes);

      // Assert
      expect(UserService.updateUserStatus).toHaveBeenCalledWith(2, true);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedUser,
        message: 'Usuário ativado com sucesso'
      });
    });

    it('should handle invalid active value', async () => {
      // Arrange
      mockReq.params = { id: 2 };
      mockReq.body = { active: 'invalid' };

      // Act
      await userController.updateUserStatus(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Campo "active" deve ser um valor booleano'
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      
      mockReq.params = { id: 999 };
      mockReq.body = { active: true };
      UserService.updateUserStatus.mockRejectedValue(error);

      // Act
      await userController.updateUserStatus(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuário não encontrado'
      });
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      // Arrange
      const mockUpdatedUser = {
        id: 2,
        name: 'Maria Silva',
        email: 'maria@example.com',
        role: 'admin',
        active: true,
        status: 'active'
      };

      mockReq.params = { id: 2 };
      mockReq.body = { role: 'admin' };
      UserService.updateUserRole.mockResolvedValue(mockUpdatedUser);

      // Act
      await userController.updateUserRole(mockReq, mockRes);

      // Assert
      expect(UserService.updateUserRole).toHaveBeenCalledWith(2, 'admin');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedUser,
        message: 'Role do usuário atualizado para "admin" com sucesso'
      });
    });

    it('should handle missing role field', async () => {
      // Arrange
      mockReq.params = { id: 2 };
      mockReq.body = {};

      // Act
      await userController.updateUserRole(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Campo "role" é obrigatório'
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Role inválido. Deve ser "admin" ou "user"');
      error.statusCode = 400;
      
      mockReq.params = { id: 2 };
      mockReq.body = { role: 'invalid' };
      UserService.updateUserRole.mockRejectedValue(error);

      // Act
      await userController.updateUserRole(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Role inválido. Deve ser "admin" ou "user"'
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      mockReq.params = { id: 2 };
      UserService.deleteUser.mockResolvedValue();

      // Act
      await userController.deleteUser(mockReq, mockRes);

      // Assert
      expect(UserService.deleteUser).toHaveBeenCalledWith(2);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuário excluído com sucesso'
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Não é possível excluir um usuário que possui dados associados');
      error.statusCode = 400;
      
      mockReq.params = { id: 2 };
      UserService.deleteUser.mockRejectedValue(error);

      // Act
      await userController.deleteUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Não é possível excluir um usuário que possui dados associados'
      });
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics successfully', async () => {
      // Arrange
      const mockStats = {
        success: true,
        data: {
          user: {
            id: 1,
            name: 'João Silva',
            email: 'joao@example.com',
            role: 'user',
            active: true
          },
          stats: {
            totalTransactions: 50,
            monthlyTransactions: 10,
            totalAccounts: 3,
            totalBalance: 1500.00,
            unreadNotifications: 5,
            monthlyIncome: 3000.00,
            monthlyExpenses: 1500.00,
            monthlyNet: 1500.00
          }
        },
        message: 'Estatísticas do usuário obtidas com sucesso'
      };

      mockReq.params = { id: 1 };
      UserService.getUserStats.mockResolvedValue(mockStats);

      // Act
      await userController.getUserStats(mockReq, mockRes);

      // Assert
      expect(UserService.getUserStats).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith(mockStats);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      
      mockReq.params = { id: 999 };
      UserService.getUserStats.mockRejectedValue(error);

      // Act
      await userController.getUserStats(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuário não encontrado'
      });
    });
  });
});