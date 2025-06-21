const { AppError, ValidationError, NotFoundError } = require('../utils/errors');
const { ValidationError: SequelizeValidationError } = require('sequelize');
const { ZodError } = require('zod');

/**
 * Middleware para tratamento de erros
 * @param {Error} err - Erro capturado
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 */
const errorHandler = (err, req, res, next) => {
  // Erro de validação do Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      errors: err.errors.map(e => ({
        code: e.code,
        message: e.message,
        path: e.path,
        received: e.received,
        options: e.options,
        type: e.type
      }))
    });
  }

  // Erro de validação customizado
  if (err instanceof ValidationError) {
    const response = {
      error: err.message
    };
    
    // Inclui os erros de validação se disponíveis
    if (err.errors) {
      response.errors = err.errors;
    }
    
    return res.status(400).json(response);
  }

  // Erro de recurso não encontrado customizado
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: err.message
    });
  }

  // Erro operacional (erro conhecido da aplicação)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  // Erro de validação do Sequelize
  if (err instanceof SequelizeValidationError) {
    return res.status(400).json({
      error: err.message,
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Erro de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }

  // Erro de produção
  return res.status(500).json({
    error: 'Internal server error'
  });
};

module.exports = {
  errorHandler
}; 