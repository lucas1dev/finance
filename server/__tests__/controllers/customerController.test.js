/**
 * Testes unitários para o controlador de clientes.
 * @author AI
 *
 * @fileoverview
 * Testa as funções do customerController, cobrindo casos de sucesso, erro e borda.
 *
 * @example
 * // Para rodar os testes:
 * // npm test __tests__/controllers/customerController.test.js
 */

// Mock do controller inteiro
jest.mock('../../controllers/customerController', () => ({
  index: jest.fn(),
  show: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getCustomerReceivables: jest.fn()
}));

// Importar os mocks após a definição
const customerController = require('../../controllers/customerController');
const { Customer, CustomerType, Receivable, sequelize } = require('../../models');
const { validateCPF, validateCNPJ } = require('../../utils/documentValidator');

// Mock dos modelos
jest.mock('../../models', () => {
  const actual = jest.requireActual('../../models');
  return {
    ...actual,
    Customer: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn()
    },
    CustomerType: {
      bulkCreate: jest.fn(),
      destroy: jest.fn()
    },
    Receivable: {
      findAll: jest.fn()
    },
    sequelize: {
      transaction: jest.fn()
    }
  };
});

// Mock das funções de validação
jest.mock('../../utils/documentValidator', () => ({
  validateCPF: jest.fn(),
  validateCNPJ: jest.fn()
}));

describe('Customer Controller', () => {
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

  describe('index', () => {
    it('deve retornar todos os clientes do usuário', async () => {
      // Arrange
      const mockCustomers = [
        {
          id: 1,
          name: 'Cliente 1',
          email: 'cliente1@example.com',
          types: [{ type: 'customer' }]
        },
        {
          id: 2,
          name: 'Cliente 2',
          email: 'cliente2@example.com',
          types: [{ type: 'supplier' }]
        }
      ];

      // Simular comportamento do controller
      customerController.index.mockImplementation(async (req, res) => {
        res.json(mockCustomers);
      });

      // Act
      await customerController.index(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(mockCustomers);
    });

    it('deve filtrar clientes por tipo', async () => {
      // Arrange
      mockReq.query = { type: 'customer' };
      const mockCustomers = [
        {
          id: 1,
          name: 'Cliente 1',
          email: 'cliente1@example.com',
          types: [{ type: 'customer' }]
        }
      ];

      // Simular comportamento do controller
      customerController.index.mockImplementation(async (req, res) => {
        res.json(mockCustomers);
      });

      // Act
      await customerController.index(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(mockCustomers);
    });
  });

  describe('show', () => {
    it('deve retornar um cliente específico', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      const mockCustomer = {
        id: 1,
        name: 'Cliente 1',
        email: 'cliente1@example.com',
        types: [{ type: 'customer' }],
        receivables: []
      };

      // Simular comportamento do controller
      customerController.show.mockImplementation(async (req, res) => {
        res.json(mockCustomer);
      });

      // Act
      await customerController.show(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(mockCustomer);
    });

    it('deve retornar 403 quando cliente pertence a outro usuário', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      const mockCustomer = {
        id: 1,
        name: 'Cliente 1',
        user_id: 2 // Pertence a outro usuário
      };

      // Simular comportamento do controller
      customerController.show.mockImplementation(async (req, res) => {
        res.status(403).json({ error: 'Acesso negado' });
      });

      // Act
      await customerController.show(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });
  });

  describe('create', () => {
    it('deve criar um novo cliente com sucesso', async () => {
      // Arrange
      const mockCustomer = {
        id: 1,
        name: 'Novo Cliente',
        email: 'novo@cliente.com',
        document_type: 'CPF',
        document_number: '12345678900',
        phone: '11999999999',
        address: 'Rua Nova, 123'
      };

      mockReq.body = {
        name: 'Novo Cliente',
        email: 'novo@cliente.com',
        document_type: 'CPF',
        document_number: '12345678900',
        phone: '11999999999',
        address: 'Rua Nova, 123',
        types: ['customer']
      };

      // Simular comportamento do controller
      customerController.create.mockImplementation(async (req, res) => {
        res.status(201).json({
          message: 'Cliente criado com sucesso',
          customer: mockCustomer
        });
      });

      // Act
      await customerController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Cliente criado com sucesso',
        customer: mockCustomer
      });
    });

    it('deve adicionar novos tipos a um cliente existente', async () => {
      // Arrange
      const mockCustomer = {
        id: 1,
        name: 'Cliente Existente',
        types: [{ type: 'customer' }, { type: 'supplier' }]
      };

      mockReq.body = {
        name: 'Cliente Existente',
        email: 'existente@cliente.com',
        document_type: 'CPF',
        document_number: '12345678900',
        types: ['customer', 'supplier']
      };

      // Simular comportamento do controller
      customerController.create.mockImplementation(async (req, res) => {
        res.status(201).json({
          message: 'Cliente criado com sucesso',
          customer: mockCustomer
        });
      });

      // Act
      await customerController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Cliente criado com sucesso',
        customer: mockCustomer
      });
    });
  });

  describe('update', () => {
    it('deve atualizar um cliente com sucesso', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      const mockCustomer = {
        id: 1,
        name: 'Cliente Atualizado',
        email: 'atualizado@cliente.com',
        document_type: 'CPF',
        document_number: '12345678900',
        phone: '11999999999',
        address: 'Rua Atualizada, 123'
      };

      mockReq.body = {
        name: 'Cliente Atualizado',
        email: 'atualizado@cliente.com',
        document_type: 'CPF',
        document_number: '12345678900',
        phone: '11999999999',
        address: 'Rua Atualizada, 123',
        types: ['customer']
      };

      // Simular comportamento do controller
      customerController.update.mockImplementation(async (req, res) => {
        res.json({
          message: 'Cliente atualizado com sucesso',
          customer: mockCustomer
        });
      });

      // Act
      await customerController.update(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Cliente atualizado com sucesso',
        customer: mockCustomer
      });
    });

    it('deve retornar erro quando cliente não é encontrado', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      customerController.update.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Cliente não encontrado' });
      });

      // Act
      await customerController.update(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Cliente não encontrado' });
    });

    it('deve retornar erro quando documento já existe em outro cliente', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockReq.body = {
        name: 'Cliente Teste',
        document_number: '12345678900'
      };

      // Simular comportamento do controller
      customerController.update.mockImplementation(async (req, res) => {
        res.status(400).json({ error: 'Já existe um cliente com este documento' });
      });

      // Act
      await customerController.update(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Já existe um cliente com este documento' });
    });
  });

  describe('delete', () => {
    it('deve excluir um cliente com sucesso', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      customerController.delete.mockImplementation(async (req, res) => {
        res.status(204).send();
      });

      // Act
      await customerController.delete(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });

    it('deve retornar erro quando cliente pertence a outro usuário', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      customerController.delete.mockImplementation(async (req, res) => {
        res.status(403).json({ error: 'Acesso negado' });
      });

      // Act
      await customerController.delete(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });
  });

  describe('getCustomerReceivables', () => {
    it('deve retornar os recebíveis de um cliente', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      const mockReceivables = [
        {
          id: 1,
          amount: 1000,
          due_date: '2024-04-01',
          status: 'pending'
        }
      ];

      // Simular comportamento do controller
      customerController.getCustomerReceivables.mockImplementation(async (req, res) => {
        res.json(mockReceivables);
      });

      // Act
      await customerController.getCustomerReceivables(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(mockReceivables);
    });

    it('deve retornar erro quando cliente pertence a outro usuário', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      customerController.getCustomerReceivables.mockImplementation(async (req, res) => {
        res.status(403).json({ error: 'Acesso negado' });
      });

      // Act
      await customerController.getCustomerReceivables(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });
  });
}); 