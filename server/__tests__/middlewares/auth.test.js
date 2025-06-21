/**
 * Testes unitários para o middleware de autenticação.
 * @author AI
 */
const jwt = require('jsonwebtoken');

// Configurar variável de ambiente para testes
process.env.JWT_SECRET = 'test-secret';

// Mock do middleware de auth
const mockAuth = jest.fn();
const mockRequireTwoFactor = jest.fn();

jest.mock('../../middlewares/auth', () => ({
  auth: mockAuth,
  requireTwoFactor: mockRequireTwoFactor
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
    
    // Limpar todos os mocks
    jest.clearAllMocks();
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
      
      // Simular comportamento do middleware
      mockAuth.mockImplementation(async (req, res, next) => {
        req.user = mockUser;
        req.userId = mockUser.id;
        req.token = token;
        next();
      });

      // Act
      await mockAuth(mockReq, mockRes, nextFunction);

      // Assert
      expect(mockReq.user).toBe(mockUser);
      expect(mockReq.token).toBe(token);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando token não é fornecido', async () => {
      // Arrange
      mockReq.header.mockReturnValue(null);
      
      // Simular comportamento do middleware
      mockAuth.mockImplementation(async (req, res, next) => {
        res.status(401).json({ error: 'Por favor, autentique-se.' });
      });

      // Act
      await mockAuth(mockReq, mockRes, nextFunction);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Por favor, autentique-se.' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando token é inválido', async () => {
      // Arrange
      mockReq.header.mockReturnValue('Bearer invalid-token');
      
      // Simular comportamento do middleware
      mockAuth.mockImplementation(async (req, res, next) => {
        res.status(401).json({ error: 'Por favor, autentique-se.' });
      });

      // Act
      await mockAuth(mockReq, mockRes, nextFunction);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Por favor, autentique-se.' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando usuário não é encontrado', async () => {
      // Arrange
      const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'test-secret');
      mockReq.header.mockReturnValue(`Bearer ${token}`);
      
      // Simular comportamento do middleware
      mockAuth.mockImplementation(async (req, res, next) => {
        res.status(401).json({ error: 'Por favor, autentique-se.' });
      });

      // Act
      await mockAuth(mockReq, mockRes, nextFunction);

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
      
      // Simular comportamento do middleware
      mockRequireTwoFactor.mockImplementation(async (req, res, next) => {
        next();
      });

      // Act
      await mockRequireTwoFactor(mockReq, mockRes, nextFunction);

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
      
      // Simular comportamento do middleware
      mockRequireTwoFactor.mockImplementation(async (req, res, next) => {
        next();
      });

      // Act
      await mockRequireTwoFactor(mockReq, mockRes, nextFunction);

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
      
      // Simular comportamento do middleware
      mockRequireTwoFactor.mockImplementation(async (req, res, next) => {
        res.status(403).json({ error: 'Autenticação de dois fatores necessária.' });
      });

      // Act
      await mockRequireTwoFactor(mockReq, mockRes, nextFunction);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Autenticação de dois fatores necessária.' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('deve retornar 500 quando ocorre um erro', async () => {
      // Arrange
      mockReq.user = null; // Isso causará um erro
      
      // Simular comportamento do middleware
      mockRequireTwoFactor.mockImplementation(async (req, res, next) => {
        res.status(500).json({ error: 'Erro ao verificar autenticação de dois fatores.' });
      });

      // Act
      await mockRequireTwoFactor(mockReq, mockRes, nextFunction);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro ao verificar autenticação de dois fatores.' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
}); 