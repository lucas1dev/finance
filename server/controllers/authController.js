const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { User } = require('../models');

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
      const { name, email, password } = req.body;

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
          email: user.email
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
      const { email, password } = req.body;
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
          email: user.email
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

  updateProfile: async (req, res) => {
    try {
      const { name, email } = req.body;
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

  updatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
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

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      // Aqui você implementaria a lógica de envio de email com token de recuperação
      // Por enquanto, apenas retornamos uma mensagem
      res.json({ message: 'Instruções de recuperação enviadas para seu email.' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao processar recuperação de senha.' });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Aqui você implementaria a verificação do token de recuperação
      // Por enquanto, apenas atualizamos a senha
      await user.update({ password: newPassword });
      res.json({ message: 'Senha atualizada com sucesso.' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao redefinir senha.' });
    }
  }
};

module.exports = authController; 