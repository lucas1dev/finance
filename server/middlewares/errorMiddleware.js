const { AppError } = require('../utils/errors');
const { ValidationError } = require('sequelize');

/**
 * Middleware para tratamento de erros
 * @param {Error} err - Erro capturado
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 */
const errorHandler = (err, req, res, next) => {
  // Erro operacional (erro conhecido da aplicação)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Erro de validação do Sequelize
  if (err instanceof ValidationError) {
    return res.status(400).json({
      status: 'fail',
      message: err.message,
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Erro de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack
    });
  }

  // Erro de produção
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};

module.exports = {
  errorHandler
}; 