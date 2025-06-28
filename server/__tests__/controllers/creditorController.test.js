/**
 * Testes unitários para o controlador de credores.
 * @author Lucas Santos
 *
 * @fileoverview
 * Testa as funções do creditorController, cobrindo casos de sucesso, erro e borda.
 *
 * @example
 * // Para rodar os testes:
 * // npm test __tests__/controllers/creditorController.test.js
 */

const { ValidationError, NotFoundError, AppError } = require('../../utils/errors');

// Mock do service
const mockCreditorService = {
  createCreditor: jest.fn(),
  listCreditors: jest.fn(),
  getCreditor: jest.fn(),
  updateCreditor: jest.fn(),
  deleteCreditor: jest.fn(),
  searchCreditors: jest.fn()
};

// Mock do módulo creditorService
jest.mock('../../services/creditorService', () => mockCreditorService);

// Mock dos validadores
jest.mock('../../utils/creditorValidators', () => ({
  createCreditorSchema: { parse: jest.fn() },
  updateCreditorSchema: { parse: jest.fn() },
  listCreditorsSchema: { parse: jest.fn() }
}));

describe('CreditorController', () => {
  let controller;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Limpar cache do require para garantir mocks limpos
    jest.resetModules();
    delete require.cache[require.resolve('../../controllers/creditorController')];
    
    // Reimportar módulos com mocks limpos
    const CreditorController = require('../../controllers/creditorController');
    controller = new CreditorController(mockCreditorService);

    mockReq = {
      user: { id: 1 },
      body: {},
      params: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Limpar todos os mocks
    jest.clearAllMocks();
  });

  describe('createCreditor', () => {
    it('deve criar um novo credor com sucesso', async () => {
      const creditorData = {
        name: 'Banco XYZ',
        document_type: 'CNPJ',
        document_number: '12.345.678/0001-90',
        address: 'Rua ABC, 123'
      };

      const mockCreditor = {
        id: 1,
        ...creditorData,
        user_id: 1
      };

      mockReq.body = creditorData;
      mockCreditorService.createCreditor.mockResolvedValue(mockCreditor);

      await controller.createCreditor(mockReq, mockRes);

      expect(mockCreditorService.createCreditor).toHaveBeenCalledWith(1, creditorData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { creditor: mockCreditor }
      });
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const creditorData = { name: '' };
      mockReq.body = creditorData;
      
      const zodError = new Error('Nome do credor é obrigatório');
      zodError.name = 'ZodError';
      mockCreditorService.createCreditor.mockRejectedValue(zodError);

      await controller.createCreditor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Nome do credor é obrigatório'
      });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      const creditorData = { name: 'Banco Teste' };
      mockReq.body = creditorData;
      
      const internalError = new Error('Erro interno');
      mockCreditorService.createCreditor.mockRejectedValue(internalError);

      await controller.createCreditor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('listCreditors', () => {
    it('deve listar credores com sucesso', async () => {
      const queryData = { page: 1, limit: 10 };
      const result = {
        creditors: [{ id: 1, name: 'Banco XYZ' }],
        pagination: { total: 1, page: 1, limit: 10 }
      };

      mockReq.query = queryData;
      mockCreditorService.listCreditors.mockResolvedValue(result);

      await controller.listCreditors(mockReq, mockRes);

      expect(mockCreditorService.listCreditors).toHaveBeenCalledWith(1, queryData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: result
      });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      const queryData = { page: 1 };
      mockReq.query = queryData;
      
      const internalError = new Error('Erro interno');
      mockCreditorService.listCreditors.mockRejectedValue(internalError);

      await controller.listCreditors(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('getCreditor', () => {
    it('deve obter credor com sucesso', async () => {
      const mockCreditor = { id: 1, name: 'Banco XYZ' };
      mockReq.params = { id: 1 };
      mockCreditorService.getCreditor.mockResolvedValue(mockCreditor);

      await controller.getCreditor(mockReq, mockRes);

      expect(mockCreditorService.getCreditor).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { creditor: mockCreditor }
      });
    });

    it('deve retornar erro 404 se credor não existir', async () => {
      mockReq.params = { id: 999 };
      const notFoundError = new NotFoundError('Credor não encontrado');
      notFoundError.name = 'NotFoundError';
      mockCreditorService.getCreditor.mockRejectedValue(notFoundError);

      await controller.getCreditor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Credor não encontrado'
      });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      mockReq.params = { id: 1 };
      const internalError = new Error('Erro interno');
      mockCreditorService.getCreditor.mockRejectedValue(internalError);

      await controller.getCreditor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('updateCreditor', () => {
    it('deve atualizar credor com sucesso', async () => {
      const updateData = { name: 'Novo Nome' };
      const updatedCreditor = { id: 1, name: 'Novo Nome' };

      mockReq.params = { id: 1 };
      mockReq.body = updateData;
      mockCreditorService.updateCreditor.mockResolvedValue(updatedCreditor);

      await controller.updateCreditor(mockReq, mockRes);

      expect(mockCreditorService.updateCreditor).toHaveBeenCalledWith(1, 1, updateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { creditor: updatedCreditor }
      });
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const updateData = { name: '' };
      mockReq.params = { id: 1 };
      mockReq.body = updateData;
      
      const zodError = new Error('Nome do credor é obrigatório');
      zodError.name = 'ZodError';
      mockCreditorService.updateCreditor.mockRejectedValue(zodError);

      await controller.updateCreditor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Nome do credor é obrigatório'
      });
    });

    it('deve retornar erro 404 se credor não existir', async () => {
      const updateData = { name: 'Novo Nome' };
      mockReq.params = { id: 999 };
      mockReq.body = updateData;
      const notFoundError = new NotFoundError('Credor não encontrado');
      notFoundError.name = 'NotFoundError';
      mockCreditorService.updateCreditor.mockRejectedValue(notFoundError);

      await controller.updateCreditor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Credor não encontrado'
      });
    });
  });

  describe('deleteCreditor', () => {
    it('deve excluir credor com sucesso', async () => {
      mockReq.params = { id: 1 };
      mockCreditorService.deleteCreditor.mockResolvedValue();

      await controller.deleteCreditor(mockReq, mockRes);

      expect(mockCreditorService.deleteCreditor).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Credor excluído com sucesso' }
      });
    });

    it('deve retornar erro 404 se credor não existir', async () => {
      mockReq.params = { id: 999 };
      const notFoundError = new NotFoundError('Credor não encontrado');
      notFoundError.name = 'NotFoundError';
      mockCreditorService.deleteCreditor.mockRejectedValue(notFoundError);

      await controller.deleteCreditor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Credor não encontrado'
      });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      mockReq.params = { id: 1 };
      const internalError = new Error('Erro interno');
      mockCreditorService.deleteCreditor.mockRejectedValue(internalError);

      await controller.deleteCreditor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('searchCreditors', () => {
    it('deve buscar credores com sucesso', async () => {
      const searchTerm = 'Banco';
      const creditors = [{ id: 1, name: 'Banco XYZ' }];

      mockReq.query = { term: searchTerm };
      mockCreditorService.searchCreditors.mockResolvedValue(creditors);

      await controller.searchCreditors(mockReq, mockRes);

      expect(mockCreditorService.searchCreditors).toHaveBeenCalledWith(1, searchTerm);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { creditors }
      });
    });

    it('deve retornar lista vazia quando termo não fornecido', async () => {
      mockReq.query = {};

      await controller.searchCreditors(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { creditors: [] }
      });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      mockReq.query = { term: 'Banco' };
      const internalError = new Error('Erro interno');
      mockCreditorService.searchCreditors.mockRejectedValue(internalError);

      await controller.searchCreditors(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('handleError', () => {
    it('deve tratar ValidationError corretamente', () => {
      const error = new ValidationError('Erro de validação');
      error.name = 'ValidationError';
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro de validação'
      });
    });

    it('deve tratar NotFoundError corretamente', () => {
      const error = new NotFoundError('Recurso não encontrado');
      error.name = 'NotFoundError';
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Recurso não encontrado'
      });
    });

    it('deve tratar AppError com statusCode específico corretamente', () => {
      const error = new AppError('Erro específico', 403);
      error.name = 'AppError';
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro específico'
      });
    });

    it('deve tratar erro genérico como 500', () => {
      const error = new Error('Erro interno');
      
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });
}); 