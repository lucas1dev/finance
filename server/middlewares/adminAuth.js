/**
 * Middleware para autorização de administradores.
 * Verifica se o usuário autenticado tem papel de administrador.
 * 
 * @module middlewares/adminAuth
 */

const { User } = require('../models');
const { errorResponse } = require('../utils/response');
const { ForbiddenError } = require('../utils/errors');

/**
 * Middleware para verificar se o usuário é administrador.
 * Deve ser usado após o middleware de autenticação (auth).
 * 
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @param {Function} next - Função next do Express.
 * @returns {Promise<void>}
 * @example
 * // Rota protegida apenas para administradores
 * router.get('/admin/users', auth, adminAuth, adminController.listUsers);
 */
const adminAuth = async (req, res, next) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.userId) {
      return errorResponse(res, 'Usuário não autenticado', 401);
    }

    // Buscar usuário no banco para verificar o papel
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return errorResponse(res, 'Usuário não encontrado', 404);
    }

    // Verificar se o usuário é administrador
    if (user.role !== 'admin') {
      throw new ForbiddenError('Acesso negado. Apenas administradores podem acessar este recurso.');
    }

    // Adicionar informações do usuário admin à requisição
    req.user = user;
    req.isAdmin = true;

    next();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResponse(res, error.message, 403);
    }
    
    console.error('Erro no middleware de autorização admin:', error);
    return errorResponse(res, 'Erro interno do servidor', 500);
  }
};

/**
 * Middleware opcional para verificar se o usuário é administrador.
 * Não bloqueia a requisição se não for admin, apenas adiciona flag.
 * 
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @param {Function} next - Função next do Express.
 * @returns {Promise<void>}
 * @example
 * // Rota que funciona para todos, mas tem funcionalidades extras para admin
 * router.get('/users', auth, optionalAdminAuth, userController.listUsers);
 */
const optionalAdminAuth = async (req, res, next) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.userId) {
      req.isAdmin = false;
      return next();
    }

    // Buscar usuário no banco para verificar o papel
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      req.isAdmin = false;
      return next();
    }

    // Adicionar informações do usuário à requisição
    req.user = user;
    req.isAdmin = user.role === 'admin';

    next();
  } catch (error) {
    console.error('Erro no middleware de autorização admin opcional:', error);
    req.isAdmin = false;
    next();
  }
};

module.exports = {
  adminAuth,
  optionalAdminAuth,
}; 