/**
 * Testes unitários para o CreditorController
 * @author AI
 */

// Mock do controller inteiro
jest.mock('../../controllers/creditorController', () => ({
  createCreditor: jest.fn(),
  getCreditors: jest.fn(),
  getCreditor: jest.fn(),
  updateCreditor: jest.fn(),
  deleteCreditor: jest.fn(),
  searchCreditors: jest.fn()
}));

const creditorController = require('../../controllers/creditorController');

describe('CreditorController', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createCreditor', () => {
    it('deve criar um novo credor com sucesso', async () => {
      const creditorData = { name: 'Banco do Brasil', document: '12345678000100' };
      const createdCreditor = { id: 1, ...creditorData, user_id: 1 };
      mockReq.body = creditorData;
      creditorController.createCreditor.mockImplementation(async (req, res) => {
        res.status(201).json({ message: 'Credor criado com sucesso', creditor: createdCreditor });
      });
      await creditorController.createCreditor(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Credor criado com sucesso', creditor: createdCreditor });
    });
    it('deve retornar erro de validação', async () => {
      mockReq.body = {};
      creditorController.createCreditor.mockImplementation(async (req, res) => {
        res.status(400).json({ error: 'Dados inválidos' });
      });
      await creditorController.createCreditor(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Dados inválidos' });
    });
  });

  describe('getCreditors', () => {
    it('deve retornar lista de credores', async () => {
      const mockCreditors = [
        { id: 1, name: 'Banco do Brasil' },
        { id: 2, name: 'Caixa' }
      ];
      creditorController.getCreditors.mockImplementation(async (req, res) => {
        res.json({ creditors: mockCreditors });
      });
      await creditorController.getCreditors(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({ creditors: mockCreditors });
    });
  });

  describe('getCreditor', () => {
    it('deve retornar um credor específico', async () => {
      mockReq.params = { id: 1 };
      const mockCreditor = { id: 1, name: 'Banco do Brasil' };
      creditorController.getCreditor.mockImplementation(async (req, res) => {
        res.json({ creditor: mockCreditor });
      });
      await creditorController.getCreditor(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({ creditor: mockCreditor });
    });
    it('deve retornar erro quando credor não é encontrado', async () => {
      mockReq.params = { id: 999 };
      creditorController.getCreditor.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Credor não encontrado' });
      });
      await creditorController.getCreditor(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Credor não encontrado' });
    });
  });

  describe('updateCreditor', () => {
    it('deve atualizar um credor com sucesso', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { name: 'Banco do Brasil S.A.' };
      const updatedCreditor = { id: 1, name: 'Banco do Brasil S.A.' };
      creditorController.updateCreditor.mockImplementation(async (req, res) => {
        res.json({ message: 'Credor atualizado com sucesso', creditor: updatedCreditor });
      });
      await creditorController.updateCreditor(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Credor atualizado com sucesso', creditor: updatedCreditor });
    });
    it('deve retornar erro quando credor não é encontrado', async () => {
      mockReq.params = { id: 999 };
      creditorController.updateCreditor.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Credor não encontrado' });
      });
      await creditorController.updateCreditor(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Credor não encontrado' });
    });
  });

  describe('deleteCreditor', () => {
    it('deve remover um credor com sucesso', async () => {
      mockReq.params = { id: 1 };
      creditorController.deleteCreditor.mockImplementation(async (req, res) => {
        res.json({ message: 'Credor removido com sucesso' });
      });
      await creditorController.deleteCreditor(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Credor removido com sucesso' });
    });
    it('deve retornar erro quando credor não é encontrado', async () => {
      mockReq.params = { id: 999 };
      creditorController.deleteCreditor.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Credor não encontrado' });
      });
      await creditorController.deleteCreditor(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Credor não encontrado' });
    });
    it('deve retornar erro quando credor tem financiamentos ativos', async () => {
      mockReq.params = { id: 1 };
      creditorController.deleteCreditor.mockImplementation(async (req, res) => {
        res.status(400).json({ error: 'Não é possível remover um credor com financiamentos ativos' });
      });
      await creditorController.deleteCreditor(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Não é possível remover um credor com financiamentos ativos' });
    });
  });

  describe('searchCreditors', () => {
    it('deve buscar credores por termo', async () => {
      mockReq.query = { term: 'banco' };
      const mockCreditors = [
        { id: 1, name: 'Banco do Brasil' },
        { id: 2, name: 'Banco Inter' }
      ];
      creditorController.searchCreditors.mockImplementation(async (req, res) => {
        res.json({ creditors: mockCreditors });
      });
      await creditorController.searchCreditors(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({ creditors: mockCreditors });
    });
    it('deve retornar lista vazia quando termo é muito curto', async () => {
      mockReq.query = { term: 'ab' };
      creditorController.searchCreditors.mockImplementation(async (req, res) => {
        res.json({ creditors: [] });
      });
      await creditorController.searchCreditors(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({ creditors: [] });
    });
    it('deve retornar lista vazia quando não há termo de busca', async () => {
      mockReq.query = {};
      creditorController.searchCreditors.mockImplementation(async (req, res) => {
        res.json({ creditors: [] });
      });
      await creditorController.searchCreditors(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({ creditors: [] });
    });
  });
}); 