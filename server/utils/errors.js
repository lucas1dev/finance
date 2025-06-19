/**
 * Classe base para erros da aplicação
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erro para recursos não encontrados
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Erro para requisições inválidas
 */
class ValidationError extends AppError {
  constructor(message = 'Invalid request data') {
    super(message, 400);
  }
}

/**
 * Erro para autenticação
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

/**
 * Erro para acesso proibido
 */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access') {
    super(message, 403);
  }
}

/**
 * Erro para conflitos (ex: recurso já existe)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
}; 