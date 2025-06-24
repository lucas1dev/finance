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
  resetPasswordSchema 
} = require('../utils/validators');

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

const authController = {
  /**
   * Registra um novo usuário no sistema.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados do usuário.
   * @param {string} req.body.name - Nome do usuário.
   * @param {string} req.body.email - Email do usuário.
   * @param {string} req.body.password - Senha do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com token e dados do usuário criado.
   * @throws {Error} Se o email já estiver cadastrado ou houver erro no banco.
   * @example
   * // POST /auth/register
   * // Body: { "name": "João", "email": "joao@example.com", "password": "123456" }
   * // Retorno: { "message": "Usuário registrado com sucesso", "token": "...", "user": {...} }
   */
  register: async (req, res) => {
    try {
      // Validar dados de entrada
      const validatedData = registerUserSchema.parse(req.body);
      const { name, email, password } = validatedData;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const user = await User.create({
        name,
        email,
        password
      });

      const token = generateToken(user.id);

      res.status(201).json({
        message: 'Usuário registrado com sucesso',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
  },

  /**
   * Realiza login do usuário no sistema.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Credenciais do usuário.
   * @param {string} req.body.email - Email do usuário.
   * @param {string} req.body.password - Senha do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com token e dados do usuário.
   * @throws {Error} Se as credenciais forem inválidas ou houver erro no banco.
   * @example
   * // POST /auth/login
   * // Body: { "email": "joao@example.com", "password": "123456" }
   * // Retorno: { "token": "...", "user": {...} }
   */
  login: async (req, res) => {
    try {
      // Validar dados de entrada
      const validatedData = loginUserSchema.parse(req.body);
      const { email, password } = validatedData;
      
      console.log('[LOGIN] Tentando login para:', email);

      const user = await User.findOne({ where: { email } });
      if (!user) {
        console.log('[LOGIN] Usuário não encontrado:', email);
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      console.log('[LOGIN] Usuário encontrado:', user.email);

      const validPassword = await user.validatePassword(password);
      if (!validPassword) {
        console.log('[LOGIN] Senha inválida para:', email);
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      console.log('[LOGIN] Senha válida para:', email);

      const token = generateToken(user.id);
      console.log('[LOGIN] Token gerado para:', email);
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('[LOGIN] Erro no login:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  },

  /**
   * Retorna o perfil do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com dados do perfil do usuário.
   * @throws {Error} Se o usuário não for encontrado ou houver erro no banco.
   * @example
   * // GET /auth/profile
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "id": 1, "name": "João", "email": "joao@example.com", "role": "user" }
   */
  getProfile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  },

  /**
   * Atualiza o perfil do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados para atualização.
   * @param {string} req.body.name - Nome do usuário (opcional).
   * @param {string} req.body.email - Email do usuário (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se o usuário não for encontrado ou houver erro no banco.
   * @example
   * // PUT /auth/profile
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "name": "João Silva", "email": "joao.silva@example.com" }
   * // Retorno: { "message": "Perfil atualizado com sucesso" }
   */
  updateProfile: async (req, res) => {
    try {
      // Validar dados de entrada
      const validatedData = updateProfileSchema.parse(req.body);
      const { name, email } = validatedData;
      
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await user.update({ name, email });
      res.json({ message: 'Perfil atualizado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  },

  /**
   * Atualiza a senha do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados para atualização de senha.
   * @param {string} req.body.currentPassword - Senha atual.
   * @param {string} req.body.newPassword - Nova senha.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se a senha atual for incorreta ou houver erro no banco.
   * @example
   * // PUT /auth/password
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "currentPassword": "123456", "newPassword": "654321" }
   * // Retorno: { "message": "Senha atualizada com sucesso" }
   */
  updatePassword: async (req, res) => {
    try {
      // Validar dados de entrada
      const validatedData = updatePasswordSchema.parse(req.body);
      const { currentPassword, newPassword } = validatedData;
      
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const validPassword = await user.validatePassword(currentPassword);
      if (!validPassword) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }

      await user.update({ password: newPassword });
      res.json({ message: 'Senha atualizada com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar senha' });
    }
  },

  setupTwoFactor: async (req, res) => {
    try {
      const secret = speakeasy.generateSecret({
        name: `FinanceApp:${req.user.email}`
      });

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await user.update({
        two_factor_secret: secret.base32,
        two_factor_enabled: true
      });
      
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
      res.json({ secret: secret.base32, qrCode: qrCodeUrl });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao configurar 2FA.' });
    }
  },

  verifyTwoFactor: async (req, res) => {
    try {
      const { token } = req.body;
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token
      });

      if (!verified) {
        return res.status(400).json({ error: 'Token 2FA inválido.' });
      }

      const newToken = generateToken(user.id);
      res.json({ token: newToken });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao verificar 2FA.' });
    }
  },

  disableTwoFactor: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await user.update({
        two_factor_secret: null,
        two_factor_enabled: false
      });
      
      res.json({ message: '2FA desativado com sucesso.' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao desativar 2FA.' });
    }
  },

  /**
   * Processa solicitação de recuperação de senha.
   * Gera um token de recuperação e envia email com link para reset.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da requisição.
   * @param {string} req.body.email - Email do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se o usuário não for encontrado ou houver erro no envio de email.
   * @example
   * // POST /auth/forgot-password
   * // Body: { "email": "joao@example.com" }
   * // Retorno: { "message": "Instruções de recuperação enviadas para seu email." }
   */
  forgotPassword: async (req, res) => {
    try {
      // Validar dados de entrada (sem validar formato de email para manter compatibilidade)
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }
      
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      // Gerar token de recuperação
      const resetToken = generateResetToken(user.id);
      
      // URL base da aplicação frontend
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      try {
        // Enviar email de recuperação
        const emailSent = await sendPasswordResetEmail(user.email, user.name, resetUrl);

        if (!emailSent) {
          // Se o email não foi enviado, ainda retorna sucesso para não expor informações
          console.warn('Email de recuperação não foi enviado, mas retornando sucesso para segurança');
        }
      } catch (emailError) {
        // Se houver erro no envio de email, ainda retorna sucesso para não expor informações
        console.warn('Erro ao enviar email de recuperação:', emailError.message);
      }

      res.json({ message: 'Instruções de recuperação enviadas para seu email.' });
    } catch (error) {
      console.error('Erro ao processar recuperação de senha:', error);
      res.status(500).json({ error: 'Erro ao processar recuperação de senha.' });
    }
  },

  /**
   * Redefine a senha do usuário usando token de recuperação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da requisição.
   * @param {string} req.body.token - Token de recuperação.
   * @param {string} req.body.newPassword - Nova senha.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se o token for inválido ou houver erro ao atualizar senha.
   * @example
   * // POST /auth/reset-password
   * // Body: { "token": "jwt_token", "newPassword": "nova_senha123" }
   * // Retorno: { "message": "Senha atualizada com sucesso." }
   */
  resetPassword: async (req, res) => {
    try {
      // Validar dados de entrada
      const validatedData = resetPasswordSchema.parse(req.body);
      const { token, newPassword } = validatedData;
      
      // Verificar e decodificar o token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar se é um token de recuperação de senha
        if (decoded.type !== 'password_reset') {
          return res.status(400).json({ error: 'Token inválido para recuperação de senha.' });
        }
      } catch (error) {
        return res.status(400).json({ error: 'Token inválido ou expirado.' });
      }

      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Atualizar a senha
      await user.update({ password: newPassword });
      
      res.json({ message: 'Senha atualizada com sucesso.' });
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      res.status(500).json({ error: 'Erro ao redefinir senha.' });
    }
  }
};

module.exports = authController; 