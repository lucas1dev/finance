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
  let mockReq;
  let mockRes;
  let mockCustomer;

  beforeEach(() => {
    mockReq = {
      user: { id: 1 },
      query: {},
      params: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockCustomer = {
      id: 1,
      user_id: 1,
      name: 'Cliente Teste',
      document_type: 'CPF',
      document_number: '12345678900',
      email: 'cliente@teste.com',
      phone: '11999999999',
      address: 'Rua Teste, 123',
      types: [
        { type: 'customer' }
      ],
      update: jest.fn(),
      destroy: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('index', () => {
    it('deve retornar todos os clientes do usuário', async () => {
      const mockCustomers = [
        { ...mockCustomer },
        { ...mockCustomer, id: 2, name: 'Outro Cliente' }
      ];
      Customer.findAll.mockResolvedValue(mockCustomers);
      await customerController.index(mockReq, mockRes);
      expect(Customer.findAll).toHaveBeenCalledWith({
        where: { user_id: 1 },
        include: [{
          model: CustomerType,
          as: 'types',
          attributes: ['type']
        }],
        order: [['name', 'ASC']]
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockCustomers);
    });
    it('deve filtrar clientes por tipo', async () => {
      mockReq.query.type = 'customer';
      const mockCustomers = [{ ...mockCustomer }];
      Customer.findAll.mockResolvedValue(mockCustomers);
      await customerController.index(mockReq, mockRes);
      expect(Customer.findAll).toHaveBeenCalledWith({
        where: { user_id: 1 },
        include: [{
          model: CustomerType,
          as: 'types',
          attributes: ['type'],
          where: { type: 'customer' }
        }],
        order: [['name', 'ASC']]
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockCustomers);
    });
  });

  describe('show', () => {
    it('deve retornar um cliente específico', async () => {
      mockReq.params.id = 1;
      Customer.findOne.mockResolvedValue(mockCustomer);
      await customerController.show(mockReq, mockRes);
      expect(Customer.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        include: [
          {
            model: CustomerType,
            as: 'types',
            attributes: ['type']
          },
          {
            model: Receivable,
            as: 'receivables',
            attributes: ['id', 'amount', 'due_date', 'status']
          }
        ]
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockCustomer);
    });
    it('deve retornar 404 quando cliente não é encontrado', async () => {
      mockReq.params.id = 999;
      Customer.findOne.mockResolvedValue(null);
      await customerController.show(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Cliente não encontrado' });
    });
    it('deve retornar 403 quando cliente pertence a outro usuário', async () => {
      mockReq.params.id = 1;
      mockCustomer.user_id = 2;
      Customer.findOne.mockResolvedValue(mockCustomer);
      await customerController.show(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });
  });

  describe('create', () => {
    it('deve criar um novo cliente com sucesso', async () => {
      mockReq.body = {
        name: 'Novo Cliente',
        documentType: 'CPF',
        documentNumber: '12345678900',
        email: 'novo@cliente.com',
        phone: '11999999999',
        address: 'Rua Nova, 123',
        types: ['customer']
      };
      validateCPF.mockReturnValue(true);
      Customer.findOne.mockResolvedValue(null);
      // Mock transação para retornar o customer criado
      sequelize.transaction.mockImplementation(async (cb) => cb({}));
      Customer.create.mockResolvedValue({ ...mockCustomer, id: 2 });
      CustomerType.bulkCreate.mockResolvedValue();
      await customerController.create(mockReq, mockRes);
      expect(Customer.create).toHaveBeenCalledWith({
        user_id: 1,
        name: 'Novo Cliente',
        document_type: 'CPF',
        document_number: '12345678900',
        email: 'novo@cliente.com',
        phone: '11999999999',
        address: 'Rua Nova, 123'
      }, { transaction: {} });
      expect(CustomerType.bulkCreate).toHaveBeenCalledWith([
        { customer_id: 2, type: 'customer' }
      ], { transaction: {} });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ id: 2, message: 'Cliente criado com sucesso' });
    });
    it('deve retornar erro quando campos obrigatórios estão faltando', async () => {
      mockReq.body = {
        name: 'Novo Cliente',
        documentType: 'CPF',
        documentNumber: '12345678900'
      };
      await customerController.create(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Nome, tipo e número do documento e pelo menos um tipo (cliente/fornecedor) são obrigatórios'
      });
    });
    it('deve retornar erro quando documento é inválido', async () => {
      mockReq.body = {
        name: 'Novo Cliente',
        documentType: 'CPF',
        documentNumber: '12345678900',
        types: ['customer']
      };
      validateCPF.mockReturnValue(false);
      await customerController.create(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Documento inválido' });
    });
    it('deve adicionar novos tipos a um cliente existente', async () => {
      mockReq.body = {
        name: 'Cliente Existente',
        documentType: 'CPF',
        documentNumber: '12345678900',
        types: ['customer', 'supplier']
      };
      validateCPF.mockReturnValue(true);
      Customer.findOne.mockResolvedValue({ ...mockCustomer, types: [{ type: 'customer' }] });
      CustomerType.bulkCreate.mockResolvedValue();
      await customerController.create(mockReq, mockRes);
      expect(CustomerType.bulkCreate).toHaveBeenCalledWith([
        { customer_id: 1, type: 'supplier' }
      ]);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ id: 1, message: 'Tipos adicionados com sucesso' });
    });
  });

  describe('update', () => {
    it('deve atualizar um cliente com sucesso', async () => {
      mockReq.params.id = 1;
      mockReq.body = {
        name: 'Cliente Atualizado',
        documentType: 'CPF',
        documentNumber: '12345678900',
        email: 'atualizado@cliente.com',
        phone: '11999999999',
        address: 'Rua Atualizada, 123',
        types: ['customer', 'supplier']
      };
      validateCPF.mockReturnValue(true);
      Customer.findOne.mockResolvedValueOnce(mockCustomer); // Primeira chamada para encontrar o cliente
      Customer.findOne.mockResolvedValueOnce(null); // Segunda chamada para verificar documento duplicado
      mockCustomer.update.mockResolvedValue([1]);
      CustomerType.bulkCreate.mockResolvedValue();
      CustomerType.destroy.mockResolvedValue();
      await customerController.update(mockReq, mockRes);
      expect(mockCustomer.update).toHaveBeenCalledWith({
        name: 'Cliente Atualizado',
        document_type: 'CPF',
        document_number: '12345678900',
        email: 'atualizado@cliente.com',
        phone: '11999999999',
        address: 'Rua Atualizada, 123'
      });
      expect(CustomerType.bulkCreate).toHaveBeenCalledWith([
        { customer_id: 1, type: 'supplier' }
      ]);
      expect(CustomerType.destroy).not.toHaveBeenCalled(); // Não há tipos a remover
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Cliente atualizado com sucesso' });
    });
    it('deve retornar erro quando cliente não é encontrado', async () => {
      mockReq.params.id = 999;
      mockReq.body = {
        name: 'Cliente Teste',
        documentType: 'CPF',
        documentNumber: '12345678900',
        email: 'cliente@teste.com',
        phone: '11999999999',
        address: 'Rua Teste, 123',
        types: ['customer']
      };
      validateCPF.mockReturnValue(true);
      Customer.findOne.mockResolvedValue(null);
      await customerController.update(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Cliente não encontrado' });
    });
    it('deve retornar erro quando documento já existe em outro cliente', async () => {
      mockReq.params.id = 1;
      mockReq.body = {
        name: 'Cliente Atualizado',
        documentType: 'CPF',
        documentNumber: '98765432100',
        types: ['customer']
      };
      validateCPF.mockReturnValue(true);
      Customer.findOne.mockResolvedValueOnce(mockCustomer); // Primeira chamada para encontrar o cliente
      Customer.findOne.mockResolvedValueOnce({ id: 2 }); // Segunda chamada para verificar documento duplicado
      await customerController.update(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Já existe um cliente com este documento' });
    });
  });

  describe('delete', () => {
    it('deve excluir um cliente com sucesso', async () => {
      mockReq.params.id = 1;
      Customer.findOne.mockResolvedValue({ ...mockCustomer, types: [{ type: 'customer' }] });
      mockCustomer.destroy.mockResolvedValue(1);
      Receivable.findOne = jest.fn().mockResolvedValue(null); // Mock para não haver recebíveis em aberto
      await customerController.delete(mockReq, mockRes);
      expect(Customer.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 1 },
        include: expect.arrayContaining([
          expect.objectContaining({ as: 'types' })
        ])
      }));
      expect(mockCustomer.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Cliente excluído com sucesso' });
    });
    it('deve retornar erro quando cliente não é encontrado', async () => {
      mockReq.params.id = 999;
      Customer.findOne.mockResolvedValue(null);
      await customerController.delete(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Cliente não encontrado' });
    });
    it('deve retornar erro quando cliente pertence a outro usuário', async () => {
      mockReq.params.id = 1;
      mockCustomer.user_id = 2;
      Customer.findOne.mockResolvedValue(mockCustomer);
      await customerController.delete(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });
  });

  describe('getCustomerReceivables', () => {
    it('deve retornar os recebíveis de um cliente', async () => {
      mockReq.params.id = 1;
      const mockReceivables = [
        { id: 1, amount: 100, due_date: '2024-01-01', status: 'pending' },
        { id: 2, amount: 200, due_date: '2024-02-01', status: 'paid' }
      ];
      Customer.findOne.mockResolvedValue({ ...mockCustomer, types: [{ type: 'customer' }] });
      Receivable.findAll.mockResolvedValue(mockReceivables);
      await customerController.getCustomerReceivables(mockReq, mockRes);
      expect(Customer.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 1 },
        include: expect.arrayContaining([
          expect.objectContaining({ as: 'types' })
        ])
      }));
      expect(Receivable.findAll).toHaveBeenCalledWith({
        where: { customer_id: 1 },
        order: [['due_date', 'ASC']]
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockReceivables);
    });
    it('deve retornar erro quando cliente não é encontrado', async () => {
      mockReq.params.id = 999;
      Customer.findOne.mockResolvedValue(null);
      await customerController.getCustomerReceivables(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Cliente não encontrado' });
    });
    it('deve retornar erro quando cliente pertence a outro usuário', async () => {
      mockReq.params.id = 1;
      mockCustomer.user_id = 2;
      Customer.findOne.mockResolvedValue(mockCustomer);
      await customerController.getCustomerReceivables(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Acesso negado' });
    });
  });
}); 