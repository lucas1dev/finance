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

// Mock do service
jest.mock('../../services/creditorService', () => ({
  createCreditor: jest.fn(),
  listCreditors: jest.fn(),
  getCreditor: jest.fn(),
  updateCreditor: jest.fn(),
  deleteCreditor: jest.fn(),
  searchCreditors: jest.fn()
}));

// Mock dos validadores
jest.mock('../../utils/creditorValidators', () => ({
  createCreditorSchema: { parse: jest.fn() },
  updateCreditorSchema: { parse: jest.fn() },
  listCreditorsSchema: { parse: jest.fn() }
}));

describe('CreditorController', () => {
  let creditorController;
  let creditorService;
  let createCreditorSchema, updateCreditorSchema, listCreditorsSchema;

  beforeEach(() => {
    // Limpar cache do require para garantir mocks limpos
    jest.resetModules();
    delete require.cache[require.resolve('../../controllers/creditorController')];
    delete require.cache[require.resolve('../../services/creditorService')];
    delete require.cache[require.resolve('../../utils/creditorValidators')];
    
    // Reimportar módulos com mocks limpos
    creditorController = require('../../controllers/creditorController');
    creditorService = require('../../services/creditorService');
    const validators = require('../../utils/creditorValidators');
    
    createCreditorSchema = validators.createCreditorSchema;
    updateCreditorSchema = validators.updateCreditorSchema;
    listCreditorsSchema = validators.listCreditorsSchema;

    // Limpar todos os mocks
    jest.clearAllMocks();
  });

  describe('createCreditor', () => {
    it('deve criar um novo credor com sucesso', async () => {
      const req = {
        userId: 1,
        body: {
          name: 'Banco XYZ',
          document_type: 'CNPJ',
          document_number: '12.345.678/0001-90',
          address: 'Rua ABC, 123'
        }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const validatedData = { ...req.body };
      const createdCreditor = { id: 1, ...validatedData, user_id: 1 };

      createCreditorSchema.parse.mockReturnValue(validatedData);
      creditorService.createCreditor.mockResolvedValue(createdCreditor);

      await creditorController.createCreditor(req, res, next);

      expect(createCreditorSchema.parse).toHaveBeenCalledWith(req.body);
      expect(creditorService.createCreditor).toHaveBeenCalledWith(1, validatedData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { creditor: createdCreditor }
      });
    });

    it('deve passar erro para o next', async () => {
      const req = { userId: 1, body: { name: 'Test' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const error = new Error('Erro de validação');
      createCreditorSchema.parse.mockImplementation(() => { throw error; });

      await creditorController.createCreditor(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('listCreditors', () => {
    it('deve listar credores com sucesso', async () => {
      const req = {
        userId: 1,
        query: { page: 1, limit: 10 }
      };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const validatedQuery = { page: 1, limit: 10 };
      const result = {
        creditors: [{ id: 1, name: 'Banco XYZ' }],
        pagination: { total: 1, page: 1, limit: 10 }
      };

      listCreditorsSchema.parse.mockReturnValue(validatedQuery);
      creditorService.listCreditors.mockResolvedValue(result);

      await creditorController.listCreditors(req, res, next);

      expect(listCreditorsSchema.parse).toHaveBeenCalledWith(req.query);
      expect(creditorService.listCreditors).toHaveBeenCalledWith(1, validatedQuery);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result
      });
    });

    it('deve passar erro para o next', async () => {
      const req = { userId: 1, query: {} };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const error = new Error('Erro de validação');
      listCreditorsSchema.parse.mockImplementation(() => { throw error; });

      await creditorController.listCreditors(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCreditor', () => {
    it('deve obter credor com sucesso', async () => {
      const req = { userId: 1, params: { id: '1' } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const creditor = { id: 1, name: 'Banco XYZ' };
      creditorService.getCreditor.mockResolvedValue(creditor);

      await creditorController.getCreditor(req, res, next);

      expect(creditorService.getCreditor).toHaveBeenCalledWith(1, '1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { creditor }
      });
    });

    it('deve passar erro para o next', async () => {
      const req = { userId: 1, params: { id: '1' } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const error = new Error('Credor não encontrado');
      creditorService.getCreditor.mockRejectedValue(error);

      await creditorController.getCreditor(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateCreditor', () => {
    it('deve atualizar credor com sucesso', async () => {
      const req = {
        userId: 1,
        params: { id: '1' },
        body: { name: 'Novo Nome' }
      };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const validatedData = { name: 'Novo Nome' };
      const updatedCreditor = { id: 1, name: 'Novo Nome' };

      updateCreditorSchema.parse.mockReturnValue(validatedData);
      creditorService.updateCreditor.mockResolvedValue(updatedCreditor);

      await creditorController.updateCreditor(req, res, next);

      expect(updateCreditorSchema.parse).toHaveBeenCalledWith(req.body);
      expect(creditorService.updateCreditor).toHaveBeenCalledWith(1, '1', validatedData);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { creditor: updatedCreditor }
      });
    });

    it('deve passar erro para o next', async () => {
      const req = { userId: 1, params: { id: '1' }, body: {} };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const error = new Error('Erro de validação');
      updateCreditorSchema.parse.mockImplementation(() => { throw error; });

      await creditorController.updateCreditor(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteCreditor', () => {
    it('deve excluir credor com sucesso', async () => {
      const req = { userId: 1, params: { id: '1' } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      creditorService.deleteCreditor.mockResolvedValue(true);

      await creditorController.deleteCreditor(req, res, next);

      expect(creditorService.deleteCreditor).toHaveBeenCalledWith(1, '1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Credor excluído com sucesso' }
      });
    });

    it('deve passar erro para o next', async () => {
      const req = { userId: 1, params: { id: '1' } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const error = new Error('Credor não encontrado');
      creditorService.deleteCreditor.mockRejectedValue(error);

      await creditorController.deleteCreditor(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('searchCreditors', () => {
    it('deve buscar credores com sucesso', async () => {
      const req = { userId: 1, query: { term: 'Banco' } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const creditors = [{ id: 1, name: 'Banco XYZ' }];
      creditorService.searchCreditors.mockResolvedValue(creditors);

      await creditorController.searchCreditors(req, res, next);

      expect(creditorService.searchCreditors).toHaveBeenCalledWith(1, 'Banco');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { creditors }
      });
    });

    it('deve retornar lista vazia quando termo não fornecido', async () => {
      const req = { userId: 1, query: {} };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await creditorController.searchCreditors(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { creditors: [] }
      });
    });

    it('deve passar erro para o next', async () => {
      const req = { userId: 1, query: { term: 'Banco' } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const error = new Error('Erro de busca');
      creditorService.searchCreditors.mockRejectedValue(error);

      await creditorController.searchCreditors(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 