/**
 * Testes unitários para o controlador de autenticação.
 * @author AI
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const authController = require('../../controllers/authController');
const { User } = require('../../models');

// Mock das dependências
jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('jsonwebtoken');
jest.mock('bcrypt');
jest.mock('speakeasy');
jest.mock('qrcode');

describe('Auth Controller', () => {
  let mockReq;
  let mockRes;
  let mockUser;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: { id: 1 }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword',
      validatePassword: jest.fn(),
      update: jest.fn()
    };

    // Limpar todos os mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      // Arrange
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fake-token');

      // Act
      await authController.register(mockReq, mockRes);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(User.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Usuário registrado com sucesso',
        token: 'fake-token',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        }
      });
    });

    it('deve retornar erro quando email já está cadastrado', async () => {
      // Arrange
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      User.findOne.mockResolvedValue(mockUser);

      // Act
      await authController.register(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email já cadastrado' });
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      User.findOne.mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fake-token');

      // Act
      await authController.login(mockReq, mockRes);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockUser.validatePassword).toHaveBeenCalledWith('password123');
      expect(mockRes.json).toHaveBeenCalledWith({
        token: 'fake-token',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        }
      });
    });

    it('deve retornar erro quando usuário não é encontrado', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      User.findOne.mockResolvedValue(null);

      // Act
      await authController.login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Credenciais inválidas' });
    });

    it('deve retornar erro quando senha é inválida', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'wrong-password'
      };
      User.findOne.mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(false);

      // Act
      await authController.login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Credenciais inválidas' });
    });
  });

  describe('getProfile', () => {
    it('deve retornar perfil do usuário', async () => {
      // Arrange
      User.findByPk.mockResolvedValue(mockUser);

      // Act
      await authController.getProfile(mockReq, mockRes);

      // Assert
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: undefined
      });
    });

    it('deve retornar erro quando usuário não é encontrado', async () => {
      // Arrange
      User.findByPk.mockResolvedValue(null);

      // Act
      await authController.getProfile(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Usuário não encontrado' });
    });
  });

  describe('updateProfile', () => {
    it('deve atualizar perfil com sucesso', async () => {
      // Arrange
      mockReq.body = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };
      User.findByPk.mockResolvedValue(mockUser);
      mockUser.update.mockResolvedValue([1]);

      // Act
      await authController.updateProfile(mockReq, mockRes);

      // Assert
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.update).toHaveBeenCalledWith({
        name: 'Updated Name',
        email: 'updated@example.com'
      });
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Perfil atualizado com sucesso' });
    });
  });

  describe('updatePassword', () => {
    it('deve atualizar senha com sucesso', async () => {
      // Arrange
      mockReq.body = {
        currentPassword: 'old-password',
        newPassword: 'new-password'
      };
      User.findByPk.mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      mockUser.update.mockResolvedValue([1]);

      // Act
      await authController.updatePassword(mockReq, mockRes);

      // Assert
      expect(mockUser.validatePassword).toHaveBeenCalledWith('old-password');
      expect(mockUser.update).toHaveBeenCalledWith({ password: 'new-password' });
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Senha atualizada com sucesso' });
    });

    it('deve retornar erro quando senha atual é inválida', async () => {
      // Arrange
      mockReq.body = {
        currentPassword: 'wrong-password',
        newPassword: 'new-password'
      };
      User.findByPk.mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(false);

      // Act
      await authController.updatePassword(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Senha atual incorreta' });
    });
  });

  describe('setupTwoFactor', () => {
    it('deve configurar 2FA com sucesso', async () => {
      // Arrange
      const mockSecret = {
        base32: 'fake-secret',
        otpauth_url: 'fake-url'
      };
      speakeasy.generateSecret.mockReturnValue(mockSecret);
      qrcode.toDataURL.mockResolvedValue('fake-qrcode');
      User.findByPk.mockResolvedValue(mockUser);
      mockUser.update.mockResolvedValue([1]);

      // Act
      await authController.setupTwoFactor(mockReq, mockRes);

      // Assert
      expect(speakeasy.generateSecret).toHaveBeenCalled();
      expect(mockUser.update).toHaveBeenCalledWith({
        two_factor_secret: 'fake-secret',
        two_factor_enabled: true
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        secret: 'fake-secret',
        qrCode: 'fake-qrcode'
      });
    });
  });

  describe('verifyTwoFactor', () => {
    it('deve verificar token 2FA com sucesso', async () => {
      // Arrange
      mockReq.body = { token: '123456' };
      mockUser.two_factor_secret = 'fake-secret';
      User.findByPk.mockResolvedValue(mockUser);
      speakeasy.totp.verify.mockReturnValue(true);
      jwt.sign.mockReturnValue('new-token');

      // Act
      await authController.verifyTwoFactor(mockReq, mockRes);

      // Assert
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'fake-secret',
        encoding: 'base32',
        token: '123456'
      });
      expect(mockRes.json).toHaveBeenCalledWith({ token: 'new-token' });
    });

    it('deve retornar erro quando token 2FA é inválido', async () => {
      // Arrange
      mockReq.body = { token: '123456' };
      mockUser.two_factor_secret = 'fake-secret';
      User.findByPk.mockResolvedValue(mockUser);
      speakeasy.totp.verify.mockReturnValue(false);

      // Act
      await authController.verifyTwoFactor(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token 2FA inválido.' });
    });
  });

  describe('disableTwoFactor', () => {
    it('deve desativar 2FA com sucesso', async () => {
      // Arrange
      User.findByPk.mockResolvedValue(mockUser);
      mockUser.update.mockResolvedValue([1]);

      // Act
      await authController.disableTwoFactor(mockReq, mockRes);

      // Assert
      expect(mockUser.update).toHaveBeenCalledWith({
        two_factor_secret: null,
        two_factor_enabled: false
      });
      expect(mockRes.json).toHaveBeenCalledWith({ message: '2FA desativado com sucesso.' });
    });
  });

  describe('forgotPassword', () => {
    it('deve processar solicitação de recuperação de senha', async () => {
      // Arrange
      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockResolvedValue(mockUser);

      // Act
      await authController.forgotPassword(mockReq, mockRes);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Instruções de recuperação enviadas para seu email.'
      });
    });
  });

  describe('resetPassword', () => {
    it('deve redefinir senha com sucesso', async () => {
      // Arrange
      mockReq.body = {
        token: 'fake-token',
        newPassword: 'new-password'
      };
      User.findByPk.mockResolvedValue(mockUser);
      mockUser.update.mockResolvedValue([1]);

      // Act
      await authController.resetPassword(mockReq, mockRes);

      // Assert
      expect(mockUser.update).toHaveBeenCalledWith({ password: 'new-password' });
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Senha atualizada com sucesso.' });
    });
  });
}); 