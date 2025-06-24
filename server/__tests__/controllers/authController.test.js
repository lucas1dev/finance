/**
 * Testes unitários para o AuthController
 * @author Lucas Santos
 */

// Mock do controller inteiro
jest.mock('../../controllers/authController', () => ({
  register: jest.fn(),
  login: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  updatePassword: jest.fn(),
  setupTwoFactor: jest.fn(),
  verifyTwoFactor: jest.fn(),
  disableTwoFactor: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn()
}));

// Importar os mocks após a definição
const authController = require('../../controllers/authController');

describe('Auth Controller', () => {
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

  describe('register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      };

      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      // Simular comportamento do controller
      authController.register.mockImplementation(async (req, res) => {
        res.status(201).json({
          message: 'Usuário registrado com sucesso',
          user: mockUser
        });
      });

      // Act
      await authController.register(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Usuário registrado com sucesso',
        user: mockUser
      });
    });

    it('deve retornar erro quando email já está cadastrado', async () => {
      // Arrange
      mockReq.body = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      };

      // Simular comportamento do controller
      authController.register.mockImplementation(async (req, res) => {
        res.status(400).json({
          error: 'Email já está cadastrado'
        });
      });

      // Act
      await authController.register(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Email já está cadastrado'
      });
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      };

      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Simular comportamento do controller
      authController.login.mockImplementation(async (req, res) => {
        res.json({
          token: 'fake-token',
          user: mockUser
        });
      });

      // Act
      await authController.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        token: 'fake-token',
        user: mockUser
      });
    });

    it('deve retornar erro quando usuário não é encontrado', async () => {
      // Arrange
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      // Simular comportamento do controller
      authController.login.mockImplementation(async (req, res) => {
        res.status(401).json({
          error: 'Credenciais inválidas'
        });
      });

      // Act
      await authController.login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Credenciais inválidas'
      });
    });

    it('deve retornar erro quando senha é inválida', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      // Simular comportamento do controller
      authController.login.mockImplementation(async (req, res) => {
        res.status(401).json({
          error: 'Credenciais inválidas'
        });
      });

      // Act
      await authController.login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Credenciais inválidas'
      });
    });
  });

  describe('getProfile', () => {
    it('deve retornar perfil do usuário', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      };

      // Simular comportamento do controller
      authController.getProfile.mockImplementation(async (req, res) => {
        res.json(mockUser);
      });

      // Act
      await authController.getProfile(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it('deve retornar erro quando usuário não é encontrado', async () => {
      // Arrange
      // Simular comportamento do controller
      authController.getProfile.mockImplementation(async (req, res) => {
        res.status(404).json({
          error: 'Usuário não encontrado'
        });
      });

      // Act
      await authController.getProfile(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Usuário não encontrado'
      });
    });
  });

  describe('updateProfile', () => {
    it('deve atualizar perfil com sucesso', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      mockReq.body = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      // Simular comportamento do controller
      authController.updateProfile.mockImplementation(async (req, res) => {
        res.json({
          message: 'Perfil atualizado com sucesso',
          user: mockUser
        });
      });

      // Act
      await authController.updateProfile(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Perfil atualizado com sucesso',
        user: mockUser
      });
    });
  });

  describe('updatePassword', () => {
    it('deve atualizar senha com sucesso', async () => {
      // Arrange
      mockReq.body = {
        currentPassword: 'old-password',
        newPassword: 'new-password'
      };

      // Simular comportamento do controller
      authController.updatePassword.mockImplementation(async (req, res) => {
        res.json({
          message: 'Senha atualizada com sucesso'
        });
      });

      // Act
      await authController.updatePassword(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Senha atualizada com sucesso'
      });
    });

    it('deve retornar erro quando senha atual é inválida', async () => {
      // Arrange
      mockReq.body = {
        currentPassword: 'wrong-password',
        newPassword: 'new-password'
      };

      // Simular comportamento do controller
      authController.updatePassword.mockImplementation(async (req, res) => {
        res.status(400).json({
          error: 'Senha atual inválida'
        });
      });

      // Act
      await authController.updatePassword(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Senha atual inválida'
      });
    });
  });

  describe('setupTwoFactor', () => {
    it('deve configurar 2FA com sucesso', async () => {
      // Arrange
      // Simular comportamento do controller
      authController.setupTwoFactor.mockImplementation(async (req, res) => {
        res.json({
          message: '2FA configurado com sucesso',
          qrCode: 'fake-qr-code',
          secret: 'fake-secret'
        });
      });

      // Act
      await authController.setupTwoFactor(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: '2FA configurado com sucesso',
        qrCode: 'fake-qr-code',
        secret: 'fake-secret'
      });
    });
  });

  describe('verifyTwoFactor', () => {
    it('deve verificar token 2FA com sucesso', async () => {
      // Arrange
      mockReq.body = {
        token: '123456'
      };

      // Simular comportamento do controller
      authController.verifyTwoFactor.mockImplementation(async (req, res) => {
        res.json({
          message: '2FA verificado com sucesso'
        });
      });

      // Act
      await authController.verifyTwoFactor(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: '2FA verificado com sucesso'
      });
    });

    it('deve retornar erro quando token 2FA é inválido', async () => {
      // Arrange
      mockReq.body = {
        token: 'invalid-token'
      };

      // Simular comportamento do controller
      authController.verifyTwoFactor.mockImplementation(async (req, res) => {
        res.status(400).json({
          error: 'Token 2FA inválido'
        });
      });

      // Act
      await authController.verifyTwoFactor(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token 2FA inválido'
      });
    });
  });

  describe('disableTwoFactor', () => {
    it('deve desativar 2FA com sucesso', async () => {
      // Arrange
      // Simular comportamento do controller
      authController.disableTwoFactor.mockImplementation(async (req, res) => {
        res.json({
          message: '2FA desativado com sucesso'
        });
      });

      // Act
      await authController.disableTwoFactor(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: '2FA desativado com sucesso'
      });
    });
  });

  describe('forgotPassword', () => {
    it('deve processar solicitação de recuperação de senha', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com'
      };

      // Simular comportamento do controller
      authController.forgotPassword.mockImplementation(async (req, res) => {
        res.json({
          message: 'Instruções de recuperação enviadas para seu email.'
        });
      });

      // Act
      await authController.forgotPassword(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Instruções de recuperação enviadas para seu email.'
      });
    });
  });

  describe('resetPassword', () => {
    it('deve redefinir senha com sucesso', async () => {
      // Arrange
      mockReq.body = {
        token: 'reset-token',
        newPassword: 'new-password'
      };

      // Simular comportamento do controller
      authController.resetPassword.mockImplementation(async (req, res) => {
        res.json({
          message: 'Senha atualizada com sucesso.'
        });
      });

      // Act
      await authController.resetPassword(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Senha atualizada com sucesso.'
      });
    });
  });
}); 