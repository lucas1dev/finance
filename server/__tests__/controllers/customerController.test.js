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

describe('CustomerController', () => {
  let customerService, createCustomerSchema, updateCustomerSchema, customerController;
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Aplicar mocks antes de importar
    jest.doMock('../../services/customerService', () => ({
      listCustomers: jest.fn(),
      getCustomer: jest.fn(),
      createCustomer: jest.fn(),
      updateCustomer: jest.fn(),
      deleteCustomer: jest.fn(),
      getCustomerReceivables: jest.fn()
    }));

    jest.doMock('../../utils/validators', () => ({
      createCustomerSchema: { parse: jest.fn() },
      updateCustomerSchema: { parse: jest.fn() }
    }));
    
    // Importar após aplicar mocks
    customerService = require('../../services/customerService');
    createCustomerSchema = require('../../utils/validators').createCustomerSchema;
    updateCustomerSchema = require('../../utils/validators').updateCustomerSchema;
    customerController = require('../../controllers/customerController');
    
    req = {
      user: { id: 1 },
      params: {},
      query: {},
      body: {}
    };
    
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
  });

  afterEach(() => {
    jest.dontMock('../../services/customerService');
    jest.dontMock('../../utils/validators');
  });

  describe('index', () => {
    it('deve listar todos os clientes do usuário', async () => {
      const mockCustomers = [
        { id: 1, name: 'Cliente 1', email: 'cliente1@example.com' },
        { id: 2, name: 'Cliente 2', email: 'cliente2@example.com' }
      ];

      customerService.listCustomers.mockResolvedValue(mockCustomers);

      await customerController.index(req, res, next);

      expect(customerService.listCustomers).toHaveBeenCalledWith(1, undefined);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockCustomers });
    });

    it('deve listar clientes com filtro por tipo', async () => {
      req.query.type = 'customer';
      const mockCustomers = [{ id: 1, name: 'Cliente 1' }];

      customerService.listCustomers.mockResolvedValue(mockCustomers);

      await customerController.index(req, res, next);

      expect(customerService.listCustomers).toHaveBeenCalledWith(1, 'customer');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockCustomers });
    });

    it('deve lidar com erro do service', async () => {
      const error = new Error('Erro de banco');
      customerService.listCustomers.mockRejectedValue(error);

      await customerController.index(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('show', () => {
    it('deve retornar um cliente específico', async () => {
      req.params.id = '1';
      const mockCustomer = {
        id: 1,
        name: 'Cliente 1',
        email: 'cliente1@example.com',
        receivables: []
      };

      customerService.getCustomer.mockResolvedValue(mockCustomer);

      await customerController.show(req, res, next);

      expect(customerService.getCustomer).toHaveBeenCalledWith(1, '1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { customer: mockCustomer } });
    });

    it('deve lidar com erro do service', async () => {
      req.params.id = '999';
      const error = new Error('Cliente não encontrado');
      customerService.getCustomer.mockRejectedValue(error);

      await customerController.show(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('create', () => {
    it('deve criar um novo cliente com sucesso', async () => {
      const customerData = {
        name: 'Novo Cliente',
        documentType: 'CPF',
        document: '12345678900',
        email: 'novo@cliente.com',
        phone: '11999999999'
      };

      req.body = customerData;
      const mockCustomer = { id: 1, ...customerData };

      createCustomerSchema.parse.mockReturnValue(customerData);
      customerService.createCustomer.mockResolvedValue(mockCustomer);

      await customerController.create(req, res, next);

      expect(createCustomerSchema.parse).toHaveBeenCalledWith(customerData);
      expect(customerService.createCustomer).toHaveBeenCalledWith(1, customerData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { customer: mockCustomer } });
    });

    it('deve lidar com erro de validação', async () => {
      const validationError = new Error('Dados inválidos');
      validationError.name = 'ZodError';
      createCustomerSchema.parse.mockImplementation(() => {
        throw validationError;
      });

      await customerController.create(req, res, next);

      expect(next).toHaveBeenCalledWith(validationError);
    });

    it('deve lidar com erro do service', async () => {
      const customerData = { name: 'Cliente', documentType: 'CPF', document: '12345678900' };
      req.body = customerData;
      const error = new Error('Documento inválido');
      
      createCustomerSchema.parse.mockReturnValue(customerData);
      customerService.createCustomer.mockRejectedValue(error);

      await customerController.create(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('deve atualizar um cliente com sucesso', async () => {
      req.params.id = '1';
      const updateData = {
        name: 'Cliente Atualizado',
        email: 'atualizado@cliente.com'
      };

      req.body = updateData;
      const mockCustomer = { id: 1, ...updateData };

      updateCustomerSchema.parse.mockReturnValue(updateData);
      customerService.updateCustomer.mockResolvedValue(mockCustomer);

      await customerController.update(req, res, next);

      expect(updateCustomerSchema.parse).toHaveBeenCalledWith(updateData);
      expect(customerService.updateCustomer).toHaveBeenCalledWith(1, '1', updateData);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { customer: mockCustomer } });
    });

    it('deve lidar com erro de validação', async () => {
      const validationError = new Error('Dados inválidos');
      validationError.name = 'ZodError';
      updateCustomerSchema.parse.mockImplementation(() => {
        throw validationError;
      });

      await customerController.update(req, res, next);

      expect(next).toHaveBeenCalledWith(validationError);
    });

    it('deve lidar com erro do service', async () => {
      req.params.id = '999';
      const updateData = { name: 'Cliente' };
      req.body = updateData;
      const error = new Error('Cliente não encontrado');
      
      updateCustomerSchema.parse.mockReturnValue(updateData);
      customerService.updateCustomer.mockRejectedValue(error);

      await customerController.update(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('delete', () => {
    it('deve excluir um cliente com sucesso', async () => {
      req.params.id = '1';

      customerService.deleteCustomer.mockResolvedValue(true);

      await customerController.delete(req, res, next);

      expect(customerService.deleteCustomer).toHaveBeenCalledWith(1, '1');
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        data: { message: 'Cliente excluído com sucesso' } 
      });
    });

    it('deve lidar com erro do service', async () => {
      req.params.id = '999';
      const error = new Error('Cliente não encontrado');
      customerService.deleteCustomer.mockRejectedValue(error);

      await customerController.delete(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCustomerReceivables', () => {
    it('deve retornar contas a receber do cliente', async () => {
      req.params.id = '1';
      const mockReceivables = [
        { id: 1, amount: 1000, due_date: '2024-01-01', status: 'pending' },
        { id: 2, amount: 2000, due_date: '2024-01-15', status: 'paid' }
      ];

      customerService.getCustomerReceivables.mockResolvedValue(mockReceivables);

      await customerController.getCustomerReceivables(req, res, next);

      expect(customerService.getCustomerReceivables).toHaveBeenCalledWith(1, '1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { receivables: mockReceivables } });
    });

    it('deve lidar com erro do service', async () => {
      req.params.id = '999';
      const error = new Error('Cliente não encontrado');
      customerService.getCustomerReceivables.mockRejectedValue(error);

      await customerController.getCustomerReceivables(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 