/**
 * Testes unitários para o InvestmentController
 * @author Lucas Santos
 */

const { ValidationError, NotFoundError } = require('../../utils/errors');

// Mock dos modelos
jest.mock('../../models', () => ({
  Investment: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    sum: jest.fn()
  },
  Account: {
    findOne: jest.fn(),
    update: jest.fn()
  },
  Category: {
    findOne: jest.fn()
  },
  Transaction: {
    create: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn()
  },
  InvestmentContribution: {
    findOne: jest.fn()
  }
}));

// Mock das validações
jest.mock('../../utils/investmentValidators', () => ({
  createInvestmentSchema: {
    parse: jest.fn()
  },
  updateInvestmentSchema: {
    parse: jest.fn()
  },
  sellAssetSchema: {
    parse: jest.fn()
  },
  listPositionsSchema: {
    parse: jest.fn()
  }
}));

describe('InvestmentController', () => {
  let mockReq, mockRes, investmentController;
  let { Investment, Account, Category, Transaction } = require('../../models');
  let { createInvestmentSchema, updateInvestmentSchema } = require('../../utils/investmentValidators');

  beforeEach(() => {
    // Importa o controller dentro do beforeEach para garantir que os mocks sejam aplicados
    jest.resetModules();
    investmentController = require('../../controllers/investmentController');
    ({ Investment, Account, Category, Transaction } = require('../../models'));
    ({ createInvestmentSchema, updateInvestmentSchema } = require('../../utils/investmentValidators'));

    mockReq = {
      user: { id: 1 },
      userId: 1,
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

  describe('createInvestment', () => {
    it('should create an investment with valid data', async () => {
      const investmentData = {
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        ticker: 'PETR4',
        invested_amount: 1000.00,
        quantity: 100,
        operation_date: '2024-01-15',
        operation_type: 'compra',
        broker: 'XP Investimentos',
        observations: 'Compra de ações Petrobras',
        account_id: 1,
        category_id: 1
      };

      const mockAccount = { 
        id: 1, 
        balance: 5000.00,
        update: jest.fn().mockResolvedValue(true)
      };
      const mockCategory = { id: 1, name: 'Ações' };
      const mockInvestment = { 
        id: 1, 
        ...investmentData, 
        user_id: 1 
      };
      const mockTransaction = { 
        id: 1, 
        type: 'expense',
        amount: 1000.00,
        description: 'Compra de Petrobras'
      };

      // Mock das validações e modelos
      createInvestmentSchema.parse.mockReturnValue(investmentData);
      Account.findOne.mockResolvedValue(mockAccount);
      Category.findOne.mockResolvedValue(mockCategory);
      Investment.create.mockResolvedValue(mockInvestment);
      Investment.findByPk.mockResolvedValue({
        ...mockInvestment,
        account: mockAccount,
        category: mockCategory
      });
      Transaction.create.mockResolvedValue(mockTransaction);

      mockReq.body = investmentData;

      await investmentController.createInvestment(mockReq, mockRes);

      expect(createInvestmentSchema.parse).toHaveBeenCalledWith(investmentData);
      expect(Account.findOne).toHaveBeenCalledWith({
        where: { id: investmentData.account_id, user_id: mockReq.userId }
      });
      expect(Category.findOne).toHaveBeenCalledWith({
        where: { id: investmentData.category_id, user_id: mockReq.userId }
      });
      expect(Investment.create).toHaveBeenCalledWith({
        ...investmentData,
        user_id: mockReq.userId
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Investimento criado com sucesso',
        investment: expect.any(Object),
        transaction: mockTransaction
      });
    });

    it('should handle validation errors', async () => {
      const zodError = new Error('Validation failed');
      zodError.name = 'ZodError';
      zodError.errors = [{ message: 'Invalid data' }];
      
      createInvestmentSchema.parse.mockImplementation(() => { 
        throw zodError; 
      });

      mockReq.body = {};

      try {
        await investmentController.createInvestment(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Dados inválidos');
      }
    });

    it('should handle account not found', async () => {
      const investmentData = {
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 1000.00,
        account_id: 999,
        operation_date: '2024-01-15',
        operation_type: 'compra'
      };

      createInvestmentSchema.parse.mockReturnValue(investmentData);
      Account.findOne.mockResolvedValue(null);

      mockReq.body = investmentData;

      try {
        await investmentController.createInvestment(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Conta não encontrada');
      }
    });

    it('should handle category not found', async () => {
      const investmentData = {
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 1000.00,
        account_id: 1,
        category_id: 999,
        operation_date: '2024-01-15',
        operation_type: 'compra'
      };

      const mockAccount = { id: 1, balance: 5000.00 };

      createInvestmentSchema.parse.mockReturnValue(investmentData);
      Account.findOne.mockResolvedValue(mockAccount);
      Category.findOne.mockResolvedValue(null);

      mockReq.body = investmentData;

      try {
        await investmentController.createInvestment(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Categoria não encontrada');
      }
    });

    it('should handle insufficient balance for purchase', async () => {
      const investmentData = {
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 10000.00,
        account_id: 1,
        operation_date: '2024-01-15',
        operation_type: 'compra'
      };

      const mockAccount = { id: 1, balance: 1000.00 };

      createInvestmentSchema.parse.mockReturnValue(investmentData);
      Account.findOne.mockResolvedValue(mockAccount);

      mockReq.body = investmentData;

      try {
        await investmentController.createInvestment(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Saldo insuficiente na conta');
      }
    });
  });

  describe('getInvestments', () => {
    it('should return all investments for user', async () => {
      const mockInvestments = [
        { id: 1, investment_type: 'acoes', asset_name: 'Petrobras', invested_amount: 1000.00 },
        { id: 2, investment_type: 'renda_fixa', asset_name: 'Tesouro Direto', invested_amount: 500.00 }
      ];

      const mockResult = {
        count: 2,
        rows: mockInvestments
      };

      Investment.findAndCountAll.mockResolvedValue(mockResult);
      Investment.sum
        .mockResolvedValueOnce(1500.00) // totalInvested
        .mockResolvedValueOnce(200.00); // totalSold

      await investmentController.getInvestments(mockReq, mockRes);

      expect(Investment.findAndCountAll).toHaveBeenCalledWith({
        where: { user_id: mockReq.userId },
        include: [
          { model: Account, as: 'account' },
          { model: Category, as: 'category' }
        ],
        order: [['operation_date', 'DESC']],
        limit: 10,
        offset: 0
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        investments: mockInvestments,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        },
        statistics: {
          totalInvested: 1500.00,
          totalSold: 200.00,
          netInvestment: 1300.00
        }
      });
    });

    it('should apply filters correctly', async () => {
      mockReq.query = {
        investment_type: 'acoes',
        operation_type: 'compra',
        status: 'ativo',
        broker: 'XP',
        page: 2,
        limit: 5
      };

      const mockResult = { count: 0, rows: [] };
      Investment.findAndCountAll.mockResolvedValue(mockResult);
      Investment.sum.mockResolvedValue(0);

      await investmentController.getInvestments(mockReq, mockRes);

      expect(Investment.findAndCountAll).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          investment_type: 'acoes',
          operation_type: 'compra',
          status: 'ativo',
          broker: 'XP'
        },
        include: expect.any(Array),
        order: [['operation_date', 'DESC']],
        limit: 5,
        offset: 5
      });
    });
  });

  describe('getInvestment', () => {
    it('should return a specific investment', async () => {
      const mockInvestment = {
        id: 1,
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 1000.00,
        account: { id: 1, name: 'Conta Principal' },
        category: { id: 1, name: 'Ações' },
        toJSON: () => ({
          id: 1,
          investment_type: 'acoes',
          asset_name: 'Petrobras',
          invested_amount: 1000.00,
          account: { id: 1, name: 'Conta Principal' },
          category: { id: 1, name: 'Ações' }
        })
      };

      Investment.findOne.mockResolvedValue(mockInvestment);

      mockReq.params = { id: 1 };

      await investmentController.getInvestment(mockReq, mockRes);

      expect(Investment.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
        include: [
          { model: Account, as: 'account' },
          { model: Category, as: 'category' },
          { model: require('../../models').InvestmentContribution, as: 'contributions' }
        ]
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockInvestment);
    });

    it('should return error when investment is not found', async () => {
      Investment.findByPk.mockResolvedValue(null);

      mockReq.params = { id: 999 };

      try {
        await investmentController.getInvestment(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Investimento não encontrado');
      }
    });
  });

  describe('updateInvestment', () => {
    it('should update an investment with valid data', async () => {
      const updateData = {
        asset_name: 'Petrobras Atualizada',
        invested_amount: 1500.00
      };

      const mockInvestment = {
        id: 1,
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 1000.00,
        account_id: 1,
        update: jest.fn().mockResolvedValue(true),
        toJSON: () => ({
          id: 1,
          investment_type: 'acoes',
          asset_name: 'Petrobras Atualizada',
          invested_amount: 1500.00,
          account_id: 1
        })
      };

      updateInvestmentSchema.parse.mockReturnValue(updateData);
      Investment.findOne.mockResolvedValue(mockInvestment);
      Investment.findByPk.mockResolvedValue(mockInvestment);

      mockReq.params = { id: 1 };
      mockReq.body = updateData;

      await investmentController.updateInvestment(mockReq, mockRes);

      expect(updateInvestmentSchema.parse).toHaveBeenCalledWith(updateData);
      expect(Investment.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 }
      });
      expect(mockInvestment.update).toHaveBeenCalledWith(updateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Investimento atualizado com sucesso',
        investment: mockInvestment
      });
    });

    it('should return error when investment is not found', async () => {
      Investment.findByPk.mockResolvedValue(null);

      mockReq.params = { id: 999 };

      try {
        await investmentController.updateInvestment(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Investimento não encontrado');
      }
    });
  });

  describe('deleteInvestment', () => {
    it('should delete an investment', async () => {
      const mockInvestment = {
        id: 1,
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 1000.00,
        account_id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      Investment.findOne.mockResolvedValue(mockInvestment);
      Transaction.findOne.mockResolvedValue(null);

      mockReq.params = { id: 1 };

      await investmentController.deleteInvestment(mockReq, mockRes);

      expect(Investment.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 }
      });
      expect(Transaction.findOne).toHaveBeenCalledWith({
        where: { investment_id: 1 }
      });
      expect(mockInvestment.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Investimento excluído com sucesso'
      });
    });

    it('should return error when investment is not found', async () => {
      Investment.findByPk.mockResolvedValue(null);

      mockReq.params = { id: 999 };

      try {
        await investmentController.deleteInvestment(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Investimento não encontrado');
      }
    });
  });
}); 