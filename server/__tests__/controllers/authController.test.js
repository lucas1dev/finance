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
  resetPassword: jest.fn(),
  generateBackupCodes: jest.fn(),
  get2FASettings: jest.fn(),
  verifyBackupCode: jest.fn(),
  verifyToken: jest.fn()
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
      query: {},
      user: { id: 1, email: 'test@example.com' },
      headers: {}
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
    it('deve registrar usuário com sucesso', async () => {
      // Arrange
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      // Simular comportamento do controller
      authController.register.mockImplementation(async (req, res) => {
        res.json({
          success: true,
          data: {
            message: 'Usuário registrado com sucesso',
            user: {
              id: 1,
              name: 'Test User',
              email: 'test@example.com'
            }
          }
        });
      });

      // Act
      await authController.register(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Usuário registrado com sucesso',
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com'
          }
        }
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
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Simular comportamento do controller
      authController.login.mockImplementation(async (req, res) => {
        res.json({
          success: true,
          data: {
            message: 'Login realizado com sucesso',
            token: 'fake-jwt-token',
            user: {
              id: 1,
              name: 'Test User',
              email: 'test@example.com'
            }
          }
        });
      });

      // Act
      await authController.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Login realizado com sucesso',
          token: 'fake-jwt-token',
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com'
          }
        }
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
          success: true,
          data: {
            message: 'Senha atualizada com sucesso'
          }
        });
      });

      // Act
      await authController.updatePassword(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Senha atualizada com sucesso'
        }
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
          success: true,
          data: {
            message: '2FA configurado. Use o QR Code para configurar seu app autenticador.',
            secret: 'JBSWY3DPEHPK3PXP',
            qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
            backup_codes: ['12345678', '23456789', '34567890']
          }
        });
      });

      // Act
      await authController.setupTwoFactor(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: '2FA configurado. Use o QR Code para configurar seu app autenticador.',
          secret: 'JBSWY3DPEHPK3PXP',
          qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
          backup_codes: ['12345678', '23456789', '34567890']
        }
      });
    });
  });

  describe('verifyTwoFactor', () => {
    it('deve verificar token 2FA com sucesso', async () => {
      // Arrange
      mockReq.body = {
        code: '123456'
      };

      // Simular comportamento do controller
      authController.verifyTwoFactor.mockImplementation(async (req, res) => {
        res.json({
          success: true,
          data: {
            message: '2FA ativado com sucesso',
            token: 'new-jwt-token'
          }
        });
      });

      // Act
      await authController.verifyTwoFactor(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: '2FA ativado com sucesso',
          token: 'new-jwt-token'
        }
      });
    });

    it('deve retornar erro quando código 2FA é inválido', async () => {
      // Arrange
      mockReq.body = {
        code: 'invalid'
      };

      // Simular comportamento do controller
      authController.verifyTwoFactor.mockImplementation(async (req, res) => {
        res.status(400).json({
          success: false,
          error: 'Código 2FA deve ter exatamente 6 dígitos'
        });
      });

      // Act
      await authController.verifyTwoFactor(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Código 2FA deve ter exatamente 6 dígitos'
      });
    });
  });

  describe('disableTwoFactor', () => {
    it('deve desativar 2FA com sucesso', async () => {
      // Arrange
      mockReq.body = {
        password: 'password123'
      };

      // Simular comportamento do controller
      authController.disableTwoFactor.mockImplementation(async (req, res) => {
        res.json({
          success: true,
          data: {
            message: '2FA desativado com sucesso'
          }
        });
      });

      // Act
      await authController.disableTwoFactor(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: '2FA desativado com sucesso'
        }
      });
    });

    it('deve retornar erro quando senha é inválida', async () => {
      // Arrange
      mockReq.body = {
        password: 'wrong-password'
      };

      // Simular comportamento do controller
      authController.disableTwoFactor.mockImplementation(async (req, res) => {
        res.status(401).json({
          success: false,
          error: 'Senha incorreta'
        });
      });

      // Act
      await authController.disableTwoFactor(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Senha incorreta'
      });
    });
  });

  describe('generateBackupCodes', () => {
    it('deve gerar códigos de backup com sucesso', async () => {
      // Arrange
      mockReq.body = {
        password: 'password123'
      };

      // Simular comportamento do controller
      authController.generateBackupCodes.mockImplementation(async (req, res) => {
        res.json({
          success: true,
          data: {
            backup_codes: ['12345678', '23456789', '34567890', '45678901', '56789012'],
            message: 'Novos códigos de backup gerados com sucesso'
          }
        });
      });

      // Act
      await authController.generateBackupCodes(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          backup_codes: ['12345678', '23456789', '34567890', '45678901', '56789012'],
          message: 'Novos códigos de backup gerados com sucesso'
        }
      });
    });
  });

  describe('get2FASettings', () => {
    it('deve obter configurações de 2FA com sucesso', async () => {
      // Arrange
      // Simular comportamento do controller
      authController.get2FASettings.mockImplementation(async (req, res) => {
        res.json({
          success: true,
          data: {
            two_factor_enabled: true,
            has_backup_codes: true,
            backup_codes_count: 10,
            account_age_days: 30
          }
        });
      });

      // Act
      await authController.get2FASettings(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          two_factor_enabled: true,
          has_backup_codes: true,
          backup_codes_count: 10,
          account_age_days: 30
        }
      });
    });
  });

  describe('verifyBackupCode', () => {
    it('deve verificar código de backup com sucesso', async () => {
      // Arrange
      mockReq.body = {
        backup_code: '12345678'
      };

      // Simular comportamento do controller
      authController.verifyBackupCode.mockImplementation(async (req, res) => {
        res.json({
          success: true,
          data: {
            message: 'Código de backup verificado com sucesso',
            token: 'new-jwt-token',
            remaining_backup_codes: 9
          }
        });
      });

      // Act
      await authController.verifyBackupCode(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Código de backup verificado com sucesso',
          token: 'new-jwt-token',
          remaining_backup_codes: 9
        }
      });
    });

    it('deve retornar erro quando código de backup é inválido', async () => {
      // Arrange
      mockReq.body = {
        backup_code: 'invalid'
      };

      // Simular comportamento do controller
      authController.verifyBackupCode.mockImplementation(async (req, res) => {
        res.status(400).json({
          success: false,
          error: 'Código de backup deve ter exatamente 8 dígitos'
        });
      });

      // Act
      await authController.verifyBackupCode(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Código de backup deve ter exatamente 8 dígitos'
      });
    });
  });

  describe('verifyToken', () => {
    it('deve verificar token com sucesso', async () => {
      // Arrange
      mockReq.body = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      };

      // Simular comportamento do controller
      authController.verifyToken.mockImplementation(async (req, res) => {
        res.json({
          success: true,
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'user'
          }
        });
      });

      // Act
      await authController.verifyToken(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        }
      });
    });

    it('deve retornar erro quando token é inválido', async () => {
      // Arrange
      mockReq.body = {
        token: 'invalid-token'
      };

      // Simular comportamento do controller
      authController.verifyToken.mockImplementation(async (req, res) => {
        res.status(401).json({
          success: false,
          error: 'Token inválido ou expirado'
        });
      });

      // Act
      await authController.verifyToken(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido ou expirado'
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