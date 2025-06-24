/**
 * Testes unitários para o TransactionController
 * @author Lucas Santos
 */

const { ValidationError, NotFoundError } = require('../../utils/errors');

// Mock dos modelos
jest.mock('../../models', () => ({
  Transaction: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Account: {
    findOne: jest.fn(),
    update: jest.fn()
  },
  Category: {
    findOne: jest.fn()
  }
}));

// Mock das validações
jest.mock('../../utils/validators', () => ({
  createTransactionSchema: {
    parse: jest.fn()
  },
  updateTransactionSchema: {
    parse: jest.fn()
  }
}));

describe('TransactionController', () => {
  let mockReq, mockRes, transactionController;
  let { Transaction, Account, Category } = require('../../models');
  let { createTransactionSchema, updateTransactionSchema } = require('../../utils/validators');

  beforeEach(() => {
    // Importa o controller dentro do beforeEach para garantir que os mocks sejam aplicados
    jest.resetModules();
    transactionController = require('../../controllers/transactionController');
    ({ Transaction, Account, Category } = require('../../models'));
    ({ createTransactionSchema, updateTransactionSchema } = require('../../utils/validators'));

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

    // Reset completo dos mocks
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should create a transaction with valid data', async () => {
      const transactionData = {
        account_id: 1,
        category_id: 1,
        type: 'income',
        amount: 1000.00,
        description: 'Salário',
        date: '2024-01-15'
      };

      const mockAccount = {
        id: 1,
        balance: 5000.00,
        update: jest.fn().mockResolvedValue(true)
      };

      const mockTransaction = {
        id: 1,
        ...transactionData,
        user_id: 1
      };

      createTransactionSchema.parse.mockReturnValue(transactionData);
      Account.findOne.mockResolvedValue(mockAccount);
      Transaction.create.mockResolvedValue(mockTransaction);

      mockReq.body = transactionData;

      await transactionController.createTransaction(mockReq, mockRes);

      expect(createTransactionSchema.parse).toHaveBeenCalledWith(transactionData);
      expect(Account.findOne).toHaveBeenCalledWith({
        where: {
          id: transactionData.account_id,
          user_id: mockReq.user.id
        }
      });
      expect(mockAccount.update).toHaveBeenCalledWith({ balance: 6000.00 });
      expect(Transaction.create).toHaveBeenCalledWith({
        user_id: 1,
        account_id: 1,
        category_id: 1,
        type: 'income',
        amount: 1000.00,
        description: 'Salário',
        date: '2024-01-15'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Transação criada com sucesso',
        transactionId: 1,
        newBalance: 6000.00
      });
    });

    it('should create an expense transaction and decrease balance', async () => {
      const transactionData = {
        account_id: 1,
        type: 'expense',
        amount: 500.00,
        description: 'Compras',
        date: '2024-01-15'
      };

      const mockAccount = {
        id: 1,
        balance: 1000.00,
        update: jest.fn().mockResolvedValue(true)
      };

      const mockTransaction = {
        id: 1,
        ...transactionData,
        user_id: 1
      };

      createTransactionSchema.parse.mockReturnValue(transactionData);
      Account.findOne.mockResolvedValue(mockAccount);
      Transaction.create.mockResolvedValue(mockTransaction);

      mockReq.body = transactionData;

      await transactionController.createTransaction(mockReq, mockRes);

      expect(mockAccount.update).toHaveBeenCalledWith({ balance: 500.00 });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Transação criada com sucesso',
        transactionId: 1,
        newBalance: 500.00
      });
    });

    it('should handle account not found', async () => {
      const transactionData = {
        account_id: 999,
        type: 'income',
        amount: 1000.00,
        description: 'Salário'
      };

      createTransactionSchema.parse.mockReturnValue(transactionData);
      Account.findOne.mockResolvedValue(null);

      mockReq.body = transactionData;

      await transactionController.createTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta não encontrada' });
    });

    it('should handle validation errors', async () => {
      const zodError = new Error('Validation failed');
      zodError.name = 'ZodError';
      zodError.errors = [{ message: 'Invalid data' }];
      
      createTransactionSchema.parse.mockImplementation(() => { 
        throw zodError; 
      });

      mockReq.body = {};

      await transactionController.createTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro ao criar transação' });
    });

    it('should handle database errors', async () => {
      const transactionData = {
        account_id: 1,
        type: 'income',
        amount: 1000.00,
        description: 'Salário'
      };

      createTransactionSchema.parse.mockReturnValue(transactionData);
      Account.findOne.mockRejectedValue(new Error('Database error'));

      mockReq.body = transactionData;

      await transactionController.createTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro ao criar transação' });
    });
  });

  describe('getTransactions', () => {
    it('should return all transactions for user', async () => {
      const mockTransactions = [
        {
          id: 1,
          type: 'income',
          amount: 1000.00,
          description: 'Salário',
          account: { bank_name: 'Banco A', account_type: 'checking' },
          category: { name: 'Salário' }
        },
        {
          id: 2,
          type: 'expense',
          amount: 500.00,
          description: 'Compras',
          account: { bank_name: 'Banco A', account_type: 'checking' },
          category: { name: 'Alimentação' }
        }
      ];

      Transaction.findAll.mockResolvedValue(mockTransactions);

      await transactionController.getTransactions(mockReq, mockRes);

      expect(Transaction.findAll).toHaveBeenCalledWith({
        where: { user_id: 1 },
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['bank_name', 'account_type']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['name', 'color', 'is_default']
          }
        ],
        order: [['date', 'DESC']]
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockTransactions);
    });

    it('should apply filters correctly', async () => {
      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        type: 'income',
        category_id: 1,
        account_id: 1
      };

      const mockTransactions = [];
      Transaction.findAll.mockResolvedValue(mockTransactions);

      await transactionController.getTransactions(mockReq, mockRes);

      expect(Transaction.findAll).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          date: {
            [require('sequelize').Op.gte]: '2024-01-01',
            [require('sequelize').Op.lte]: '2024-12-31'
          },
          type: 'income',
          category_id: 1,
          account_id: 1
        },
        include: expect.any(Array),
        order: [['date', 'DESC']]
      });
    });

    it('should handle database errors', async () => {
      Transaction.findAll.mockRejectedValue(new Error('Database error'));

      await transactionController.getTransactions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro ao buscar transações' });
    });
  });

  describe('getTransaction', () => {
    it('should return a specific transaction', async () => {
      const mockTransaction = {
        id: 1,
        type: 'income',
        amount: 1000.00,
        description: 'Salário',
        user_id: 1
      };

      Transaction.findOne.mockResolvedValue(mockTransaction);

      mockReq.params = { id: 1 };

      await transactionController.getTransaction(mockReq, mockRes);

      expect(Transaction.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          user_id: 1
        }
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockTransaction);
    });

    it('should return error when transaction is not found', async () => {
      Transaction.findOne.mockResolvedValue(null);

      mockReq.params = { id: 999 };

      await transactionController.getTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Transação não encontrada' });
    });

    it('should handle database errors', async () => {
      Transaction.findOne.mockRejectedValue(new Error('Database error'));

      mockReq.params = { id: 1 };

      await transactionController.getTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro ao buscar transação' });
    });
  });

  describe('updateTransaction', () => {
    it('should update a transaction with valid data', async () => {
      const updateData = {
        type: 'income',
        amount: 1500.00,
        description: 'Salário atualizado'
      };

      const mockTransaction = {
        id: 1,
        type: 'income',
        amount: 1000.00,
        description: 'Salário',
        user_id: 1,
        account_id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      const mockAccount = {
        id: 1,
        balance: 5000.00,
        update: jest.fn().mockResolvedValue(true)
      };

      updateTransactionSchema.parse.mockReturnValue(updateData);
      Transaction.findOne.mockResolvedValue(mockTransaction);
      Account.findOne.mockResolvedValue(mockAccount);

      mockReq.params = { id: 1 };
      mockReq.body = updateData;

      await transactionController.updateTransaction(mockReq, mockRes);

      expect(updateTransactionSchema.parse).toHaveBeenCalledWith(updateData);
      expect(Transaction.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          user_id: 1
        }
      });
      expect(mockTransaction.update).toHaveBeenCalledWith(updateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Transação atualizada com sucesso',
        newBalance: 5500.00
      });
    });

    it('should return error when transaction is not found', async () => {
      updateTransactionSchema.parse.mockReturnValue({});
      Transaction.findOne.mockResolvedValue(null);

      mockReq.params = { id: 999 };

      await transactionController.updateTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Transação não encontrada' });
    });

    it('should handle validation errors', async () => {
      const zodError = new Error('Validation failed');
      zodError.name = 'ZodError';
      
      updateTransactionSchema.parse.mockImplementation(() => { 
        throw zodError; 
      });

      mockReq.params = { id: 1 };

      await transactionController.updateTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro ao atualizar transação' });
    });
  });

  describe('deleteTransaction', () => {
    it('should delete a transaction successfully', async () => {
      const mockTransaction = {
        id: 1,
        type: 'income',
        amount: 1000.00,
        user_id: 1,
        account_id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      const mockAccount = {
        id: 1,
        balance: 5000.00,
        update: jest.fn().mockResolvedValue(true)
      };

      Transaction.findOne.mockResolvedValue(mockTransaction);
      Account.findOne.mockResolvedValue(mockAccount);

      mockReq.params = { id: 1 };

      await transactionController.deleteTransaction(mockReq, mockRes);

      expect(Transaction.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          user_id: 1
        }
      });
      expect(mockTransaction.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Transação excluída com sucesso',
        newBalance: 4000.00
      });
    });

    it('should return error when transaction is not found', async () => {
      Transaction.findOne.mockResolvedValue(null);

      mockReq.params = { id: 999 };

      await transactionController.deleteTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Transação não encontrada' });
    });

    it('should handle database errors', async () => {
      Transaction.findOne.mockRejectedValue(new Error('Database error'));

      mockReq.params = { id: 1 };

      await transactionController.deleteTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro ao excluir transação' });
    });
  });
}); 