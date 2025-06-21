/**
 * Testes unitários para o middleware de tratamento de erros.
 * @author AI
 */
const { errorHandler } = require('../../middlewares/errorMiddleware');
const { AppError, ValidationError, NotFoundError } = require('../../utils/errors');
const { ValidationError: SequelizeValidationError } = require('sequelize');

describe('Error Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve tratar erro operacional (AppError)', () => {
    // Arrange
    const error = new AppError('Erro de teste', 400);

    // Act
    errorHandler(error, mockReq, mockRes, nextFunction);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Erro de teste'
    });
  });

  it('deve tratar erro de validação do Sequelize', () => {
    // Arrange
    const error = new SequelizeValidationError('Erro de validação', [
      { path: 'email', message: 'Email inválido' },
      { path: 'password', message: 'Senha muito curta' }
    ]);

    // Act
    errorHandler(error, mockReq, mockRes, nextFunction);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Erro de validação',
      errors: [
        { field: 'email', message: 'Email inválido' },
        { field: 'password', message: 'Senha muito curta' }
      ]
    });
  });

  it('deve retornar detalhes do erro em ambiente de desenvolvimento', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const error = new Error('Erro interno');

    // Act
    errorHandler(error, mockReq, mockRes, nextFunction);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Erro interno',
      stack: error.stack
    });

    // Restaurar ambiente
    process.env.NODE_ENV = originalEnv;
  });

  it('deve retornar mensagem genérica em ambiente de produção', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const error = new Error('Erro interno');

    // Act
    errorHandler(error, mockReq, mockRes, nextFunction);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Internal server error'
    });

    // Restaurar ambiente
    process.env.NODE_ENV = originalEnv;
  });

  it('deve tratar erro de validação customizado', () => {
    // Arrange
    const error = new ValidationError('Dados inválidos');

    // Act
    errorHandler(error, mockReq, mockRes, nextFunction);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Dados inválidos'
    });
  });

  it('deve tratar erro de recurso não encontrado', () => {
    // Arrange
    const error = new NotFoundError('Usuário não encontrado');

    // Act
    errorHandler(error, mockReq, mockRes, nextFunction);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Usuário não encontrado'
    });
  });
}); 