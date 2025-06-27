/**
 * Service para gerenciamento de autenticação e autorização
 * Implementa registro, login, recuperação de senha e gerenciamento de perfil
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');
const { User, UserSession } = require('../models');
const { sendPasswordResetEmail } = require('./emailService');
const { 
  registerUserSchema, 
  loginUserSchema, 
  updateProfileSchema, 
  updatePasswordSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} = require('../utils/validators');
const { ValidationError, NotFoundError, UnauthorizedError } = require('../utils/errors');
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
 * Service responsável por gerenciar autenticação e autorização.
 */
class AuthService {
  /**
   * Registra um novo usuário no sistema.
   * @param {Object} userData - Dados do usuário.
   * @param {string} userData.name - Nome do usuário.
   * @param {string} userData.email - Email do usuário.
   * @param {string} userData.password - Senha do usuário.
   * @returns {Promise<Object>} Dados do usuário criado e token.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {Error} Se o email já estiver cadastrado.
   */
  async registerUser(userData) {
    try {
      // Validar dados de entrada
      const validatedData = registerUserSchema.parse(userData);
      const { name, email, password } = validatedData;

      // Verificar se o email já está cadastrado
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new ValidationError('Email já cadastrado');
      }

      // Criar o usuário
      const user = await User.create({
        name,
        email,
        password
      });

      // Gerar token
      const token = generateToken(user.id);

      // Registrar sessão
      await UserSession.create({
        user_id: user.id,
        token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      });

      logger.info('Usuário registrado com sucesso', {
        user_id: user.id,
        email: user.email
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      };
    } catch (error) {
      logger.error('Erro ao registrar usuário', {
        error: error.message,
        email: userData.email
      });

      if (error.name === 'ValidationError' || error.name === 'ZodError') {
        throw error;
      }

      throw new Error('Erro ao registrar usuário');
    }
  }

  /**
   * Realiza login do usuário no sistema.
   * @param {Object} credentials - Credenciais do usuário.
   * @param {string} credentials.email - Email do usuário.
   * @param {string} credentials.password - Senha do usuário.
   * @returns {Promise<Object>} Dados do usuário e token.
   * @throws {ValidationError} Se as credenciais forem inválidas.
   * @throws {UnauthorizedError} Se o usuário não for encontrado ou a senha for incorreta.
   */
  async loginUser(credentials) {
    try {
      // Validar dados de entrada
      const validatedData = loginUserSchema.parse(credentials);
      const { email, password } = validatedData;

      logger.info('Tentativa de login', { email });

      // Buscar usuário
      const user = await User.findOne({ where: { email } });
      if (!user) {
        logger.warn('Tentativa de login com usuário inexistente', { email });
        throw new UnauthorizedError('Credenciais inválidas');
      }

      // Validar senha
      const validPassword = await user.validatePassword(password);
      if (!validPassword) {
        logger.warn('Tentativa de login com senha incorreta', { email });
        throw new UnauthorizedError('Credenciais inválidas');
      }

      // Verificar se o usuário está ativo
      if (!user.active) {
        logger.warn('Tentativa de login com usuário inativo', { email });
        throw new UnauthorizedError('Conta desativada');
      }

      // Gerar token
      const token = generateToken(user.id);

      // Registrar sessão
      await UserSession.create({
        user_id: user.id,
        token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      });

      // Atualizar último login
      await user.update({ last_login: new Date() });

      logger.info('Login realizado com sucesso', {
        user_id: user.id,
        email: user.email
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      };
    } catch (error) {
      logger.error('Erro no login', {
        error: error.message,
        email: credentials.email
      });

      if (error.name === 'ValidationError' || error.name === 'UnauthorizedError' || error.name === 'ZodError') {
        throw error;
      }

      throw new Error('Erro ao fazer login');
    }
  }

  /**
   * Obtém o perfil do usuário.
   * @param {number} userId - ID do usuário.
   * @returns {Promise<Object>} Dados do perfil do usuário.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   */
  async getUserProfile(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      logger.info('Perfil do usuário obtido com sucesso', {
        user_id: userId
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        created_at: user.created_at,
        last_login: user.last_login
      };
    } catch (error) {
      logger.error('Erro ao buscar perfil do usuário', {
        error: error.message,
        user_id: userId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao buscar perfil');
    }
  }

  /**
   * Atualiza o perfil do usuário.
   * @param {number} userId - ID do usuário.
   * @param {Object} profileData - Dados para atualização.
   * @param {string} profileData.name - Nome do usuário (opcional).
   * @param {string} profileData.email - Email do usuário (opcional).
   * @returns {Promise<Object>} Dados do perfil atualizado.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   */
  async updateUserProfile(userId, profileData) {
    try {
      // Validar dados de entrada
      const validatedData = updateProfileSchema.parse(profileData);
      const { name, email } = validatedData;

      // Buscar usuário
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      // Verificar se o email já está em uso por outro usuário
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          throw new ValidationError('Email já está em uso');
        }
      }

      // Atualizar dados
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;

      await user.update(updateData);

      logger.info('Perfil do usuário atualizado com sucesso', {
        user_id: userId,
        updated_fields: Object.keys(updateData)
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
    } catch (error) {
      logger.error('Erro ao atualizar perfil do usuário', {
        error: error.message,
        user_id: userId,
        profile_data: profileData
      });

      if (error.name === 'ValidationError' || error.name === 'NotFoundError' || error.name === 'ZodError') {
        throw error;
      }

      throw new Error('Erro ao atualizar perfil');
    }
  }

  /**
   * Atualiza a senha do usuário.
   * @param {number} userId - ID do usuário.
   * @param {Object} passwordData - Dados da senha.
   * @param {string} passwordData.currentPassword - Senha atual.
   * @param {string} passwordData.newPassword - Nova senha.
   * @returns {Promise<Object>} Mensagem de sucesso.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   * @throws {UnauthorizedError} Se a senha atual for incorreta.
   */
  async updateUserPassword(userId, passwordData) {
    try {
      // Validar dados de entrada
      const validatedData = updatePasswordSchema.parse(passwordData);
      const { currentPassword, newPassword } = validatedData;

      // Buscar usuário
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      // Validar senha atual
      const validPassword = await user.validatePassword(currentPassword);
      if (!validPassword) {
        throw new UnauthorizedError('Senha atual incorreta');
      }

      // Atualizar senha
      await user.update({ password: newPassword });

      // Invalidar todas as sessões do usuário
      await UserSession.destroy({ where: { user_id: userId } });

      logger.info('Senha do usuário atualizada com sucesso', {
        user_id: userId
      });

      return { message: 'Senha atualizada com sucesso' };
    } catch (error) {
      logger.error('Erro ao atualizar senha do usuário', {
        error: error.message,
        user_id: userId
      });

      if (error.name === 'ValidationError' || error.name === 'NotFoundError' || error.name === 'UnauthorizedError' || error.name === 'ZodError') {
        throw error;
      }

      throw new Error('Erro ao atualizar senha');
    }
  }

  /**
   * Inicia o processo de recuperação de senha.
   * @param {Object} resetData - Dados para recuperação.
   * @param {string} resetData.email - Email do usuário.
   * @returns {Promise<Object>} Mensagem de sucesso.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   */
  async forgotPassword(resetData) {
    try {
      // Validar dados de entrada
      const validatedData = forgotPasswordSchema.parse(resetData);
      const { email } = validatedData;

      // Buscar usuário
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      // Gerar token de recuperação
      const resetToken = generateResetToken(user.id);

      // Enviar email de recuperação
      await sendPasswordResetEmail(user.email, resetToken);

      logger.info('Email de recuperação de senha enviado', {
        user_id: user.id,
        email: user.email
      });

      return { message: 'Email de recuperação enviado com sucesso' };
    } catch (error) {
      logger.error('Erro ao processar recuperação de senha', {
        error: error.message,
        email: resetData.email
      });

      if (error.name === 'ValidationError' || error.name === 'NotFoundError' || error.name === 'ZodError') {
        throw error;
      }

      throw new Error('Erro ao processar recuperação de senha');
    }
  }

  /**
   * Redefine a senha usando token de recuperação.
   * @param {Object} resetData - Dados para redefinição.
   * @param {string} resetData.token - Token de recuperação.
   * @param {string} resetData.newPassword - Nova senha.
   * @returns {Promise<Object>} Mensagem de sucesso.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {UnauthorizedError} Se o token for inválido ou expirado.
   */
  async resetPassword(resetData) {
    try {
      // Validar dados de entrada
      const validatedData = resetPasswordSchema.parse(resetData);
      const { token, newPassword } = validatedData;

      // Verificar token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        throw new UnauthorizedError('Token inválido ou expirado');
      }

      if (decoded.type !== 'password_reset') {
        throw new UnauthorizedError('Token inválido');
      }

      // Buscar usuário
      const user = await User.findByPk(decoded.id);
      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      // Atualizar senha
      await user.update({ password: newPassword });

      // Invalidar todas as sessões do usuário
      await UserSession.destroy({ where: { user_id: user.id } });

      logger.info('Senha redefinida com sucesso', {
        user_id: user.id
      });

      return { message: 'Senha redefinida com sucesso' };
    } catch (error) {
      logger.error('Erro ao redefinir senha', {
        error: error.message
      });

      if (error.name === 'ValidationError' || error.name === 'UnauthorizedError' || error.name === 'NotFoundError' || error.name === 'ZodError') {
        throw error;
      }

      throw new Error('Erro ao redefinir senha');
    }
  }

  /**
   * Realiza logout do usuário.
   * @param {number} userId - ID do usuário.
   * @param {string} token - Token da sessão.
   * @returns {Promise<Object>} Mensagem de sucesso.
   */
  async logoutUser(userId, token) {
    try {
      // Remover sessão específica
      await UserSession.destroy({
        where: {
          user_id: userId,
          token
        }
      });

      logger.info('Logout realizado com sucesso', {
        user_id: userId
      });

      return { message: 'Logout realizado com sucesso' };
    } catch (error) {
      logger.error('Erro ao realizar logout', {
        error: error.message,
        user_id: userId
      });

      throw new Error('Erro ao realizar logout');
    }
  }

  /**
   * Verifica se um token é válido.
   * @param {string} token - Token JWT.
   * @returns {Promise<Object>} Dados do usuário se o token for válido.
   * @throws {UnauthorizedError} Se o token for inválido ou expirado.
   */
  async verifyToken(token) {
    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar usuário
      const user = await User.findByPk(decoded.id);
      if (!user) {
        throw new UnauthorizedError('Usuário não encontrado');
      }

      // Verificar se o usuário está ativo
      if (!user.active) {
        throw new UnauthorizedError('Usuário inativo');
      }

      // Verificar se a sessão existe
      const session = await UserSession.findOne({
        where: {
          user_id: user.id,
          token,
          expires_at: { [require('sequelize').Op.gt]: new Date() }
        }
      });

      if (!session) {
        throw new UnauthorizedError('Sessão expirada');
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token inválido ou expirado');
      }

      if (error.name === 'UnauthorizedError') {
        throw error;
      }

      throw new Error('Erro ao verificar token');
    }
  }

  /**
   * Configura autenticação de dois fatores para o usuário.
   * @param {number} userId - ID do usuário.
   * @returns {Promise<Object>} Dados de configuração 2FA.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   * @throws {Error} Se houver erro na configuração.
   */
  async setupTwoFactor(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      // Gerar secret para TOTP
      const secret = speakeasy.generateSecret({
        name: `${process.env.TWO_FACTOR_ISSUER || 'FinanceApp'}:${user.email}`,
        issuer: process.env.TWO_FACTOR_ISSUER || 'FinanceApp'
      });

      // Gerar QR Code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      // Gerar códigos de backup
      const backupCodes = this.generateBackupCodes();

      // Atualizar usuário com secret temporário (ainda não ativado)
      await user.update({
        two_factor_secret: secret.base32,
        two_factor_enabled: false,
        backup_codes: JSON.stringify(backupCodes)
      });

      logger.info('2FA configurado com sucesso', {
        user_id: userId
      });

      return {
        secret: secret.base32,
        qr_code: qrCodeUrl,
        backup_codes: backupCodes,
        message: '2FA configurado. Use o QR Code para configurar seu app autenticador.'
      };
    } catch (error) {
      logger.error('Erro ao configurar 2FA', {
        error: error.message,
        user_id: userId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao configurar 2FA');
    }
  }

  /**
   * Verifica código 2FA e ativa a autenticação de dois fatores.
   * @param {number} userId - ID do usuário.
   * @param {string} code - Código TOTP de 6 dígitos.
   * @returns {Promise<Object>} Resultado da verificação.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   * @throws {ValidationError} Se o código for inválido.
   * @throws {Error} Se houver erro na verificação.
   */
  async verifyTwoFactor(userId, code) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      if (!user.two_factor_secret) {
        throw new ValidationError('2FA não foi configurado. Configure primeiro.');
      }

      // Verificar código TOTP
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: code,
        window: 2 // Permitir 2 períodos de tolerância (60 segundos)
      });

      if (!verified) {
        throw new ValidationError('Código 2FA inválido');
      }

      // Ativar 2FA
      await user.update({
        two_factor_enabled: true
      });

      // Gerar novo token JWT
      const token = generateToken(user.id);

      logger.info('2FA verificado e ativado com sucesso', {
        user_id: userId
      });

      return {
        message: '2FA ativado com sucesso',
        token
      };
    } catch (error) {
      logger.error('Erro ao verificar 2FA', {
        error: error.message,
        user_id: userId
      });

      if (error.name === 'NotFoundError' || error.name === 'ValidationError') {
        throw error;
      }

      throw new Error('Erro ao verificar 2FA');
    }
  }

  /**
   * Desativa autenticação de dois fatores.
   * @param {number} userId - ID do usuário.
   * @param {string} password - Senha atual do usuário.
   * @returns {Promise<Object>} Resultado da desativação.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   * @throws {UnauthorizedError} Se a senha for incorreta.
   * @throws {Error} Se houver erro na desativação.
   */
  async disableTwoFactor(userId, password) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      // Verificar senha atual
      const validPassword = await user.validatePassword(password);
      if (!validPassword) {
        throw new UnauthorizedError('Senha incorreta');
      }

      // Desativar 2FA
      await user.update({
        two_factor_secret: null,
        two_factor_enabled: false,
        backup_codes: null
      });

      logger.info('2FA desativado com sucesso', {
        user_id: userId
      });

      return {
        message: '2FA desativado com sucesso'
      };
    } catch (error) {
      logger.error('Erro ao desativar 2FA', {
        error: error.message,
        user_id: userId
      });

      if (error.name === 'NotFoundError' || error.name === 'UnauthorizedError') {
        throw error;
      }

      throw new Error('Erro ao desativar 2FA');
    }
  }

  /**
   * Gera novos códigos de backup para 2FA.
   * @param {number} userId - ID do usuário.
   * @param {string} password - Senha atual do usuário.
   * @returns {Promise<Object>} Novos códigos de backup.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   * @throws {UnauthorizedError} Se a senha for incorreta.
   * @throws {Error} Se houver erro na geração.
   */
  async generateBackupCodes(userId, password) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      // Verificar senha atual
      const validPassword = await user.validatePassword(password);
      if (!validPassword) {
        throw new UnauthorizedError('Senha incorreta');
      }

      if (!user.two_factor_enabled) {
        throw new ValidationError('2FA não está ativado');
      }

      // Gerar novos códigos de backup
      const backupCodes = this.generateBackupCodes();

      // Atualizar usuário
      await user.update({
        backup_codes: JSON.stringify(backupCodes)
      });

      logger.info('Novos códigos de backup gerados', {
        user_id: userId
      });

      return {
        backup_codes: backupCodes,
        message: 'Novos códigos de backup gerados com sucesso'
      };
    } catch (error) {
      logger.error('Erro ao gerar códigos de backup', {
        error: error.message,
        user_id: userId
      });

      if (error.name === 'NotFoundError' || error.name === 'UnauthorizedError' || error.name === 'ValidationError') {
        throw error;
      }

      throw new Error('Erro ao gerar códigos de backup');
    }
  }

  /**
   * Obtém configurações de 2FA do usuário.
   * @param {number} userId - ID do usuário.
   * @returns {Promise<Object>} Configurações de 2FA.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   */
  async get2FASettings(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: [
          'id',
          'two_factor_enabled',
          'two_factor_secret',
          'backup_codes',
          'created_at'
        ]
      });

      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      const backupCodes = user.backup_codes ? JSON.parse(user.backup_codes) : [];

      return {
        two_factor_enabled: user.two_factor_enabled,
        has_backup_codes: backupCodes.length > 0,
        backup_codes_count: backupCodes.length,
        account_age_days: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
      };
    } catch (error) {
      logger.error('Erro ao buscar configurações de 2FA', {
        error: error.message,
        user_id: userId
      });

      if (error.name === 'NotFoundError') {
        throw error;
      }

      throw new Error('Erro ao buscar configurações de 2FA');
    }
  }

  /**
   * Verifica código de backup para recuperação de acesso.
   * @param {number} userId - ID do usuário.
   * @param {string} backupCode - Código de backup.
   * @returns {Promise<Object>} Resultado da verificação.
   * @throws {NotFoundError} Se o usuário não for encontrado.
   * @throws {ValidationError} Se o código for inválido.
   */
  async verifyBackupCode(userId, backupCode) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      if (!user.two_factor_enabled) {
        throw new ValidationError('2FA não está ativado');
      }

      const backupCodes = user.backup_codes ? JSON.parse(user.backup_codes) : [];
      
      // Verificar se o código existe
      const codeIndex = backupCodes.indexOf(backupCode);
      if (codeIndex === -1) {
        throw new ValidationError('Código de backup inválido');
      }

      // Remover código usado
      backupCodes.splice(codeIndex, 1);
      await user.update({
        backup_codes: JSON.stringify(backupCodes)
      });

      // Gerar novo token JWT
      const token = generateToken(user.id);

      logger.info('Código de backup verificado com sucesso', {
        user_id: userId
      });

      return {
        message: 'Código de backup verificado com sucesso',
        token,
        remaining_backup_codes: backupCodes.length
      };
    } catch (error) {
      logger.error('Erro ao verificar código de backup', {
        error: error.message,
        user_id: userId
      });

      if (error.name === 'NotFoundError' || error.name === 'ValidationError') {
        throw error;
      }

      throw new Error('Erro ao verificar código de backup');
    }
  }

  /**
   * Gera códigos de backup únicos.
   * @returns {Array<string>} Array com 10 códigos de backup.
   */
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      // Gerar código de 8 dígitos
      const code = crypto.randomInt(10000000, 99999999).toString();
      codes.push(code);
    }
    return codes;
  }
}

module.exports = new AuthService(); 