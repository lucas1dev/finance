/**
 * Testes unitários para o controlador de clientes.
 * @author Lucas Santos
 *
 * @fileoverview
 * Testa as funções do customerController, cobrindo casos de sucesso, erro e borda.
 *
 * @example
 * // Para rodar os testes:
 * // npm test __tests__/controllers/customerController.test.js
 */

const request = require('supertest');
const app = require('../../app');
const { Customer, Receivable } = require('../../models');

describe('CustomerController', () => {
  let customerController;
  let mockModels, mockValidators, mockErrors;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mocks dos modelos
    mockModels = {
      Customer: {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn()
      },
      Receivable: {
        findAll: jest.fn(),
        findOne: jest.fn()
      },
      sequelize: {
        transaction: jest.fn()
      }
    };

    // Mocks dos validators
    mockValidators = {
      validateCPF: jest.fn(),
      validateCNPJ: jest.fn()
    };

    // Mocks dos erros
    mockErrors = {
      ValidationError: class ValidationError extends Error {
        constructor(message) {
          super(message);
          this.name = 'ValidationError';
        }
      },
      NotFoundError: class NotFoundError extends Error {
        constructor(message) {
          super(message);
          this.name = 'NotFoundError';
        }
      }
    };

    // Aplicar mocks
    jest.mock('../../models', () => mockModels);
    jest.mock('../../utils/documentValidator', () => mockValidators);

    // Importar controller
    customerController = require('../../controllers/customerController');
  });

  describe('index', () => {
    it('deve listar todos os clientes do usuário', async () => {
      const req = { user: { id: 1 }, query: {} };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockCustomers = [
        {
          id: 1,
          name: 'Cliente 1',
          email: 'cliente1@example.com'
        },
        {
          id: 2,
          name: 'Cliente 2',
          email: 'cliente2@example.com'
        }
      ];

      mockModels.Customer.findAll.mockResolvedValue(mockCustomers);

      await customerController.index(req, res);

      expect(mockModels.Customer.findAll).toHaveBeenCalledWith({
        where: { user_id: 1 },
        order: [['name', 'ASC']]
      });
      expect(res.json).toHaveBeenCalledWith(mockCustomers);
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { user: { id: 1 }, query: {} };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.Customer.findAll.mockRejectedValue(new Error('Erro de banco'));

      await customerController.index(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar clientes' });
    });
  });

  describe('show', () => {
    it('deve retornar um cliente específico', async () => {
      const req = { user: { id: 1 }, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockCustomer = {
        id: 1,
        name: 'Cliente 1',
        email: 'cliente1@example.com',
        user_id: 1,
        receivables: []
      };

      mockModels.Customer.findOne.mockResolvedValue(mockCustomer);

      await customerController.show(req, res);

      expect(mockModels.Customer.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        include: [
          {
            model: mockModels.Receivable,
            as: 'receivables',
            attributes: ['id', 'amount', 'due_date', 'status']
          }
        ]
      });
      expect(res.json).toHaveBeenCalledWith(mockCustomer);
    });

    it('deve retornar erro quando cliente não é encontrado', async () => {
      const req = { user: { id: 1 }, params: { id: 999 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.Customer.findOne.mockResolvedValue(null);

      await customerController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cliente não encontrado' });
    });

    it('deve retornar erro quando cliente pertence a outro usuário', async () => {
      const req = { user: { id: 1 }, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockCustomer = {
        id: 1,
        name: 'Cliente 1',
        user_id: 2 // Pertence a outro usuário
      };

      mockModels.Customer.findOne.mockResolvedValue(mockCustomer);

      await customerController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { user: { id: 1 }, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      mockModels.Customer.findOne.mockRejectedValue(new Error('Erro de banco'));

      await customerController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar cliente' });
    });
  });

  describe('create', () => {
    it('deve criar um novo cliente com sucesso', async () => {
      const req = {
        user: { id: 1 },
        body: {
          name: 'Novo Cliente',
          documentType: 'CPF',
          documentNumber: '12345678900',
          email: 'novo@cliente.com',
          phone: '11999999999',
          address: 'Rua Nova, 123'
        }
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockCustomer = {
        id: 1,
        name: 'Novo Cliente',
        document_type: 'CPF',
        document_number: '12345678900'
      };

      mockValidators.validateCPF.mockReturnValue(true);
      mockModels.Customer.findOne.mockResolvedValue(null); // Cliente não existe
      mockModels.Customer.create.mockResolvedValue(mockCustomer);

      await customerController.create(req, res);

      expect(mockValidators.validateCPF).toHaveBeenCalledWith('12345678900');
      expect(mockModels.Customer.findOne).toHaveBeenCalledWith({
        where: {
          document_type: 'CPF',
          document_number: '12345678900',
          user_id: 1
        }
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        message: 'Cliente criado com sucesso'
      });
    });

    it('deve retornar erro para dados inválidos', async () => {
      const req = {
        user: { id: 1 },
        body: {
          name: '', // Nome vazio
          documentType: 'CPF',
          documentNumber: '12345678900'
        }
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await customerController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Nome, tipo e número do documento são obrigatórios'
      });
    });

    it('deve retornar erro para documento inválido', async () => {
      const req = {
        user: { id: 1 },
        body: {
          name: 'Cliente Teste',
          documentType: 'CPF',
          documentNumber: '12345678900'
        }
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      mockValidators.validateCPF.mockReturnValue(false);

      await customerController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Documento inválido'
      });
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = {
        user: { id: 1 },
        body: {
          name: 'Cliente Teste',
          documentType: 'CPF',
          documentNumber: '12345678900'
        }
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      mockValidators.validateCPF.mockReturnValue(true);
      mockModels.Customer.findOne.mockRejectedValue(new Error('Erro de banco'));

      await customerController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao criar cliente' });
    });
  });

  describe('update', () => {
    it('deve atualizar um cliente com sucesso', async () => {
      const req = {
        user: { id: 1 },
        params: { id: 1 },
        body: {
          name: 'Cliente Atualizado',
          documentType: 'CPF',
          documentNumber: '12345678900',
          email: 'atualizado@cliente.com',
          phone: '11999999999',
          address: 'Rua Atualizada, 123'
        }
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockCustomer = {
        id: 1,
        name: 'Cliente Original',
        user_id: 1,
        document_type: 'CPF',
        document_number: '12345678900',
        update: jest.fn().mockResolvedValue(true)
      };

      mockValidators.validateCPF.mockReturnValue(true);
      mockModels.Customer.findOne.mockResolvedValue(mockCustomer);

      await customerController.update(req, res);

      expect(mockCustomer.update).toHaveBeenCalledWith({
        name: 'Cliente Atualizado',
        document_type: 'CPF',
        document_number: '12345678900',
        email: 'atualizado@cliente.com',
        phone: '11999999999',
        address: 'Rua Atualizada, 123'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cliente atualizado com sucesso'
      });
    });

    it('deve retornar erro quando cliente não é encontrado', async () => {
      const req = {
        user: { id: 1 },
        params: { id: 999 },
        body: {
          name: 'Cliente Teste',
          documentType: 'CPF',
          documentNumber: '12345678900',
          types: ['customer']
        }
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      mockValidators.validateCPF.mockReturnValue(true);
      mockModels.Customer.findOne.mockResolvedValue(null);

      await customerController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cliente não encontrado' });
    });

    it('deve retornar erro quando cliente pertence a outro usuário', async () => {
      const req = {
        user: { id: 1 },
        params: { id: 1 },
        body: {
          name: 'Cliente Teste',
          documentType: 'CPF',
          documentNumber: '12345678900',
          types: ['customer']
        }
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockCustomer = {
        id: 1,
        name: 'Cliente Teste',
        user_id: 2, // Pertence a outro usuário
        types: [{ type: 'customer' }]
      };

      mockValidators.validateCPF.mockReturnValue(true);
      mockModels.Customer.findOne.mockResolvedValue(mockCustomer);

      await customerController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });

    it('deve retornar erro quando documento já existe em outro cliente', async () => {
      const req = {
        user: { id: 1 },
        params: { id: 1 },
        body: {
          name: 'Cliente Teste',
          documentType: 'CPF',
          documentNumber: '98765432100', // Documento diferente
          types: ['customer']
        }
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockCustomer = {
        id: 1,
        name: 'Cliente Teste',
        user_id: 1,
        document_type: 'CPF',
        document_number: '12345678900', // Documento original
        types: [{ type: 'customer' }]
      };

      const mockExistingCustomer = {
        id: 2,
        name: 'Outro Cliente',
        user_id: 1,
        document_type: 'CPF',
        document_number: '98765432100'
      };

      mockValidators.validateCPF.mockReturnValue(true);
      mockModels.Customer.findOne
        .mockResolvedValueOnce(mockCustomer) // Primeira chamada para buscar o cliente
        .mockResolvedValueOnce(mockExistingCustomer); // Segunda chamada para verificar documento duplicado

      await customerController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Já existe um cliente com este documento'
      });
    });
  });

  describe('delete', () => {
    it('deve excluir um cliente com sucesso', async () => {
      const req = { user: { id: 1 }, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockCustomer = {
        id: 1,
        name: 'Cliente Teste',
        user_id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      mockModels.Customer.findOne.mockResolvedValue(mockCustomer);
      mockModels.Receivable.findOne.mockResolvedValue(null); // Sem recebíveis

      await customerController.delete(req, res);

      expect(mockCustomer.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cliente excluído com sucesso'
      });
    });

    it('deve retornar erro quando cliente não é encontrado', async () => {
      const req = { user: { id: 1 }, params: { id: 999 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      mockModels.Customer.findOne.mockResolvedValue(null);

      await customerController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cliente não encontrado' });
    });

    it('deve retornar erro quando cliente pertence a outro usuário', async () => {
      const req = { user: { id: 1 }, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockCustomer = {
        id: 1,
        name: 'Cliente Teste',
        user_id: 2 // Pertence a outro usuário
      };

      mockModels.Customer.findOne.mockResolvedValue(mockCustomer);

      await customerController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });

    it('deve retornar erro quando cliente tem recebíveis', async () => {
      const req = { user: { id: 1 }, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockCustomer = {
        id: 1,
        name: 'Cliente Teste',
        user_id: 1
      };

      const mockReceivable = {
        id: 1,
        amount: 1000,
        customer_id: 1
      };

      mockModels.Customer.findOne.mockResolvedValue(mockCustomer);
      mockModels.Receivable.findOne.mockResolvedValue(mockReceivable);

      await customerController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Não é possível excluir um cliente com contas a receber'
      });
    });
  });

  describe('getCustomerReceivables', () => {
    it('deve retornar os recebíveis de um cliente', async () => {
      const req = { user: { id: 1 }, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockCustomer = {
        id: 1,
        name: 'Cliente Teste',
        user_id: 1
      };

      const mockReceivables = [
        {
          id: 1,
          amount: 1000,
          due_date: '2024-04-01',
          status: 'pending'
        }
      ];

      mockModels.Customer.findOne.mockResolvedValue(mockCustomer);
      mockModels.Receivable.findAll.mockResolvedValue(mockReceivables);

      await customerController.getCustomerReceivables(req, res);

      expect(mockModels.Receivable.findAll).toHaveBeenCalledWith({
        where: { customer_id: 1 },
        order: [['due_date', 'ASC']]
      });
      expect(res.json).toHaveBeenCalledWith(mockReceivables);
    });

    it('deve retornar erro quando cliente não é encontrado', async () => {
      const req = { user: { id: 1 }, params: { id: 999 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      mockModels.Customer.findOne.mockResolvedValue(null);

      await customerController.getCustomerReceivables(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cliente não encontrado' });
    });

    it('deve retornar erro quando cliente pertence a outro usuário', async () => {
      const req = { user: { id: 1 }, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      
      const mockCustomer = {
        id: 1,
        name: 'Cliente Teste',
        user_id: 2 // Pertence a outro usuário
      };

      mockModels.Customer.findOne.mockResolvedValue(mockCustomer);

      await customerController.getCustomerReceivables(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { user: { id: 1 }, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      mockModels.Customer.findOne.mockRejectedValue(new Error('Erro de banco'));

      await customerController.getCustomerReceivables(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Erro ao buscar contas a receber do cliente'
      });
    });
  });
}); 