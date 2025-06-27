const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');
const { User } = require('../models');
const { sendPasswordResetEmail } = require('../services/emailService');
const { 
  registerUserSchema, 
  loginUserSchema, 
  updateProfileSchema, 
  updatePasswordSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  verifyTwoFactorSchema,
  disableTwoFactorSchema,
  generateBackupCodesSchema,
  verifyBackupCodeSchema,
  verifyTokenSchema
} = require('../utils/validators');
const AuthService = require('../services/authService');
const { logger } = require('../utils/logger');

/**
 * Gera um token JWT para o usuário especificado.
 * @param {number} userId - ID do usuário.
 * @returns {string} Token JWT assinado.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * Gera um token de recuperação de senha.
 * @param {number} userId - ID do usuário.
 * @returns {string} Token de recuperação.
 */
const generateResetToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // Token expira em 1 hora
  );
};

/**
 * Controller para gerenciamento de autenticação e autorização
 * Implementa registro, login, recuperação de senha e gerenciamento de perfil
 */
class AuthController {
  /**
   * Registra um novo usuário no sistema.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados do usuário.
   * @param {string} req.body.name - Nome do usuário.
   * @param {string} req.body.email - Email do usuário.
   * @param {string} req.body.password - Senha do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com token e dados do usuário criado.
   * @example
   * // POST /auth/register
   * // Body: { "name": "João", "email": "joao@example.com", "password": "123456" }
   * // Retorno: { "success": true, "data": { "user": {...}, "token": "..." }, "message": "Usuário registrado com sucesso" }
   */
  async register(req, res) {
    try {
      const result = await AuthService.registerUser(req.body);

      logger.info('Usuário registrado com sucesso', {
        user_id: result.user.id,
        email: result.user.email
      });

      return res.status(201).json({
        success: true,
        data: result,
        message: 'Usuário registrado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao registrar usuário', {
        error: error.message,
        email: req.body.email
      });

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao registrar usuário'
      });
    }
  }

  /**
   * Realiza login do usuário no sistema.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Credenciais do usuário.
   * @param {string} req.body.email - Email do usuário.
   * @param {string} req.body.password - Senha do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com token e dados do usuário.
   * @example
   * // POST /auth/login
   * // Body: { "email": "joao@example.com", "password": "123456" }
   * // Retorno: { "success": true, "data": { "user": {...}, "token": "..." } }
   */
  async login(req, res) {
    try {
      const result = await AuthService.loginUser(req.body);

      logger.info('Login realizado com sucesso', {
        user_id: result.user.id,
        email: result.user.email
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro no login', {
        error: error.message,
        email: req.body.email
      });

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao fazer login'
      });
    }
  }

  /**
   * Retorna o perfil do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com dados do perfil do usuário.
   * @example
   * // GET /auth/profile
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "success": true, "data": { "id": 1, "name": "João", "email": "joao@example.com", "role": "user" } }
   */
  async getProfile(req, res) {
    try {
      const result = await AuthService.getUserProfile(req.user.id);

      logger.info('Perfil do usuário obtido com sucesso', {
        user_id: req.user.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao buscar perfil do usuário', {
        error: error.message,
        user_id: req.user.id
      });

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar perfil'
      });
    }
  }

  /**
   * Atualiza o perfil do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados para atualização.
   * @param {string} req.body.name - Nome do usuário (opcional).
   * @param {string} req.body.email - Email do usuário (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @example
   * // PUT /auth/profile
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "name": "João Silva", "email": "joao.silva@example.com" }
   * // Retorno: { "success": true, "data": {...}, "message": "Perfil atualizado com sucesso" }
   */
  async updateProfile(req, res) {
    try {
      const result = await AuthService.updateUserProfile(req.user.id, req.body);

      logger.info('Perfil do usuário atualizado com sucesso', {
        user_id: req.user.id,
        updated_fields: Object.keys(req.body)
      });

      return res.json({
        success: true,
        data: result,
        message: 'Perfil atualizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar perfil do usuário', {
        error: error.message,
        user_id: req.user.id,
        profile_data: req.body
      });

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar perfil'
      });
    }
  }

  /**
   * Atualiza a senha do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da senha.
   * @param {string} req.body.currentPassword - Senha atual.
   * @param {string} req.body.newPassword - Nova senha.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @example
   * // PUT /auth/password
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "currentPassword": "123456", "newPassword": "654321" }
   * // Retorno: { "success": true, "data": { "message": "Senha atualizada com sucesso" } }
   */
  async updatePassword(req, res) {
    try {
      const result = await AuthService.updateUserPassword(req.user.id, req.body);

      logger.info('Senha do usuário atualizada com sucesso', {
        user_id: req.user.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao atualizar senha do usuário', {
        error: error.message,
        user_id: req.user.id
      });

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar senha'
      });
    }
  }

  /**
   * Inicia o processo de recuperação de senha.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados para recuperação.
   * @param {string} req.body.email - Email do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @example
   * // POST /auth/forgot-password
   * // Body: { "email": "joao@example.com" }
   * // Retorno: { "success": true, "data": { "message": "Email de recuperação enviado com sucesso" } }
   */
  async forgotPassword(req, res) {
    try {
      const result = await AuthService.forgotPassword(req.body);

      logger.info('Email de recuperação de senha enviado', {
        email: req.body.email
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao processar recuperação de senha', {
        error: error.message,
        email: req.body.email
      });

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao processar recuperação de senha'
      });
    }
  }

  /**
   * Redefine a senha usando token de recuperação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados para redefinição.
   * @param {string} req.body.token - Token de recuperação.
   * @param {string} req.body.newPassword - Nova senha.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @example
   * // POST /auth/reset-password
   * // Body: { "token": "...", "newPassword": "654321" }
   * // Retorno: { "success": true, "data": { "message": "Senha redefinida com sucesso" } }
   */
  async resetPassword(req, res) {
    try {
      const result = await AuthService.resetPassword(req.body);

      logger.info('Senha redefinida com sucesso');

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao redefinir senha', {
        error: error.message
      });

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao redefinir senha'
      });
    }
  }

  /**
   * Realiza logout do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @example
   * // POST /auth/logout
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "success": true, "data": { "message": "Logout realizado com sucesso" } }
   */
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const result = await AuthService.logoutUser(req.user.id, token);

      logger.info('Logout realizado com sucesso', {
        user_id: req.user.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao realizar logout', {
        error: error.message,
        user_id: req.user.id
      });

      return res.status(500).json({
        success: false,
        error: 'Erro ao realizar logout'
      });
    }
  }

  /**
   * Configura autenticação de dois fatores para o usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com dados de configuração 2FA.
   * @example
   * // POST /auth/2fa/setup
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "success": true, "data": { "qr_code": "...", "secret": "...", "backup_codes": [...] } }
   */
  async setupTwoFactor(req, res) {
    try {
      const result = await AuthService.setupTwoFactor(req.user.id);

      logger.info('2FA configurado com sucesso', {
        user_id: req.user.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao configurar 2FA', {
        error: error.message,
        user_id: req.user.id
      });

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao configurar 2FA'
      });
    }
  }

  /**
   * Verifica código 2FA e ativa a autenticação de dois fatores.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.body - Dados da verificação.
   * @param {string} req.body.code - Código TOTP de 6 dígitos.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com resultado da verificação.
   * @example
   * // POST /auth/2fa/verify
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "code": "123456" }
   * // Retorno: { "success": true, "data": { "message": "2FA ativado com sucesso", "token": "..." } }
   */
  async verifyTwoFactor(req, res) {
    try {
      // Validar dados de entrada
      const validatedData = verifyTwoFactorSchema.parse(req.body);
      const { code } = validatedData;

      const result = await AuthService.verifyTwoFactor(req.user.id, code);

      logger.info('2FA verificado e ativado com sucesso', {
        user_id: req.user.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao verificar 2FA', {
        error: error.message,
        user_id: req.user.id
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.errors[0].message
        });
      }

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar 2FA'
      });
    }
  }

  /**
   * Desativa autenticação de dois fatores.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.body - Dados da desativação.
   * @param {string} req.body.password - Senha atual do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com resultado da desativação.
   * @example
   * // POST /auth/2fa/disable
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "password": "senha123" }
   * // Retorno: { "success": true, "data": { "message": "2FA desativado com sucesso" } }
   */
  async disableTwoFactor(req, res) {
    try {
      // Validar dados de entrada
      const validatedData = disableTwoFactorSchema.parse(req.body);
      const { password } = validatedData;

      const result = await AuthService.disableTwoFactor(req.user.id, password);

      logger.info('2FA desativado com sucesso', {
        user_id: req.user.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao desativar 2FA', {
        error: error.message,
        user_id: req.user.id
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.errors[0].message
        });
      }

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao desativar 2FA'
      });
    }
  }

  /**
   * Gera novos códigos de backup para 2FA.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.body - Dados para geração.
   * @param {string} req.body.password - Senha atual do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com novos códigos de backup.
   * @example
   * // POST /auth/2fa/backup-codes
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "password": "senha123" }
   * // Retorno: { "success": true, "data": { "backup_codes": [...], "message": "..." } }
   */
  async generateBackupCodes(req, res) {
    try {
      // Validar dados de entrada
      const validatedData = generateBackupCodesSchema.parse(req.body);
      const { password } = validatedData;

      const result = await AuthService.generateBackupCodes(req.user.id, password);

      logger.info('Novos códigos de backup gerados', {
        user_id: req.user.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao gerar códigos de backup', {
        error: error.message,
        user_id: req.user.id
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.errors[0].message
        });
      }

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao gerar códigos de backup'
      });
    }
  }

  /**
   * Obtém configurações de 2FA do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com configurações de 2FA.
   * @example
   * // GET /auth/2fa/settings
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "success": true, "data": { "two_factor_enabled": true, "has_backup_codes": true, ... } }
   */
  async get2FASettings(req, res) {
    try {
      const result = await AuthService.get2FASettings(req.user.id);

      logger.info('Configurações de 2FA obtidas com sucesso', {
        user_id: req.user.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao buscar configurações de 2FA', {
        error: error.message,
        user_id: req.user.id
      });

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar configurações de 2FA'
      });
    }
  }

  /**
   * Verifica código de backup para recuperação de acesso.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {Object} req.body - Dados da verificação.
   * @param {string} req.body.backup_code - Código de backup.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com resultado da verificação.
   * @example
   * // POST /auth/2fa/backup-verify
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "backup_code": "12345678" }
   * // Retorno: { "success": true, "data": { "message": "Código verificado", "token": "...", "remaining_backup_codes": 9 } }
   */
  async verifyBackupCode(req, res) {
    try {
      // Validar dados de entrada
      const validatedData = verifyBackupCodeSchema.parse(req.body);
      const { backup_code } = validatedData;

      const result = await AuthService.verifyBackupCode(req.user.id, backup_code);

      logger.info('Código de backup verificado com sucesso', {
        user_id: req.user.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao verificar código de backup', {
        error: error.message,
        user_id: req.user.id
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.errors[0].message
        });
      }

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar código de backup'
      });
    }
  }

  /**
   * Verifica se um token JWT é válido.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados do token.
   * @param {string} req.body.token - Token JWT.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com dados do usuário.
   * @example
   * // POST /auth/verify-token
   * // Body: { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
   * // Retorno: { "success": true, "data": { "id": 1, "name": "User", "email": "user@example.com" } }
   */
  async verifyToken(req, res) {
    try {
      // Validar dados de entrada
      const validatedData = verifyTokenSchema.parse(req.body);
      const { token } = validatedData;

      const result = await AuthService.verifyToken(token);

      logger.info('Token verificado com sucesso');

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao verificar token', {
        error: error.message
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: error.errors[0].message
        });
      }

      if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar token'
      });
    }
  }
}

module.exports = new AuthController(); 