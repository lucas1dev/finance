/**
 * Testes unitários para as classes de erro.
 * @author AI
 */
const {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
} = require('../../utils/errors');

describe('Error Classes', () => {
  describe('AppError', () => {
    it('deve criar erro com status code padrão 500', () => {
      const error = new AppError('Erro interno');
      expect(error.statusCode).toBe(500);
      expect(error.status).toBe('error');
      expect(error.isOperational).toBe(true);
      expect(error.message).toBe('Erro interno');
    });

    it('deve criar erro com status code personalizado', () => {
      const error = new AppError('Erro de validação', 400);
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
      expect(error.message).toBe('Erro de validação');
    });
  });

  describe('NotFoundError', () => {
    it('deve criar erro 404 com mensagem padrão', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.status).toBe('fail');
      expect(error.message).toBe('Resource not found');
    });

    it('deve criar erro 404 com mensagem personalizada', () => {
      const error = new NotFoundError('Usuário não encontrado');
      expect(error.statusCode).toBe(404);
      expect(error.status).toBe('fail');
      expect(error.message).toBe('Usuário não encontrado');
    });
  });

  describe('ValidationError', () => {
    it('deve criar erro 400 com mensagem padrão', () => {
      const error = new ValidationError();
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.message).toBe('Invalid request data');
    });

    it('deve criar erro 400 com mensagem personalizada', () => {
      const error = new ValidationError('Dados inválidos');
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.message).toBe('Dados inválidos');
    });
  });

  describe('UnauthorizedError', () => {
    it('deve criar erro 401 com mensagem padrão', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.status).toBe('fail');
      expect(error.message).toBe('Unauthorized access');
    });

    it('deve criar erro 401 com mensagem personalizada', () => {
      const error = new UnauthorizedError('Token inválido');
      expect(error.statusCode).toBe(401);
      expect(error.status).toBe('fail');
      expect(error.message).toBe('Token inválido');
    });
  });

  describe('ForbiddenError', () => {
    it('deve criar erro 403 com mensagem padrão', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.status).toBe('fail');
      expect(error.message).toBe('Forbidden access');
    });

    it('deve criar erro 403 com mensagem personalizada', () => {
      const error = new ForbiddenError('Acesso negado');
      expect(error.statusCode).toBe(403);
      expect(error.status).toBe('fail');
      expect(error.message).toBe('Acesso negado');
    });
  });

  describe('ConflictError', () => {
    it('deve criar erro 409 com mensagem padrão', () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
      expect(error.status).toBe('fail');
      expect(error.message).toBe('Resource already exists');
    });

    it('deve criar erro 409 com mensagem personalizada', () => {
      const error = new ConflictError('Email já cadastrado');
      expect(error.statusCode).toBe(409);
      expect(error.status).toBe('fail');
      expect(error.message).toBe('Email já cadastrado');
    });
  });
}); 