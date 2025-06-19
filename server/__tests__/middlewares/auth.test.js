/**
 * Testes unitários para o middleware de autenticação.
 * @author AI
 */
const jwt = require('jsonwebtoken');
const { auth, requireTwoFactor } = require('../../middlewares/auth');
const { User } = require('../../models');

// Configurar variável de ambiente para testes
process.env.JWT_SECRET = 'test-secret';

// Mock do modelo User
jest.mock('../../models', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      header: jest.fn(),
      user: null,
      token: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('auth', () => {
    it('deve autenticar usuário com token válido', async () => {
      // Arrange
      const mockUser = { id: 1, name: 'Test User' };
      const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'test-secret');
      mockReq.header.mockReturnValue(`Bearer ${token}`);
      User.findByPk.mockResolvedValue(mockUser);

      // Act
      await auth(mockReq, mockRes, nextFunction);

      // Assert
      expect(mockReq.user).toBe(mockUser);
      expect(mockReq.token).toBe(token);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando token não é fornecido', async () => {
      // Arrange
      mockReq.header.mockReturnValue(null);

      // Act
      await auth(mockReq, mockRes, nextFunction);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Por favor, autentique-se.' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando token é inválido', async () => {
      // Arrange
      mockReq.header.mockReturnValue('Bearer invalid-token');

      // Act
      await auth(mockReq, mockRes, nextFunction);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Por favor, autentique-se.' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando usuário não é encontrado', async () => {
      // Arrange
      const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'test-secret');
      mockReq.header.mockReturnValue(`Bearer ${token}`);
      User.findByPk.mockResolvedValue(null);

      // Act
      await auth(mockReq, mockRes, nextFunction);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Por favor, autentique-se.' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireTwoFactor', () => {
    it('deve permitir acesso quando 2FA não está habilitado', async () => {
      // Arrange
      mockReq.user = { two_factor_enabled: false };

      // Act
      await requireTwoFactor(mockReq, mockRes, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('deve permitir acesso quando 2FA está habilitado e verificado', async () => {
      // Arrange
      mockReq.user = { 
        two_factor_enabled: true,
        two_factor_verified: true
      };

      // Act
      await requireTwoFactor(mockReq, mockRes, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('deve retornar 403 quando 2FA está habilitado mas não verificado', async () => {
      // Arrange
      mockReq.user = {
        two_factor_enabled: true,
        two_factor_verified: false
      };

      // Act
      await requireTwoFactor(mockReq, mockRes, nextFunction);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Autenticação de dois fatores necessária.' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('deve retornar 500 quando ocorre um erro', async () => {
      // Arrange
      mockReq.user = null; // Isso causará um erro

      // Act
      await requireTwoFactor(mockReq, mockRes, nextFunction);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro ao verificar autenticação de dois fatores.' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
}); 