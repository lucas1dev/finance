const { Investment, Account, Category, Transaction } = require('../../models');
const investmentController = require('../../controllers/investmentController');
const { ValidationError, NotFoundError } = require('../../utils/errors');

// Mock dos modelos
jest.mock('../../models');

describe('InvestmentController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      userId: 1
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Limpa todos os mocks
    jest.clearAllMocks();
  });

  describe('createInvestment', () => {
    it('should create a new investment successfully', async () => {
      const investmentData = {
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        ticker: 'PETR4',
        invested_amount: 1000,
        quantity: 100,
        operation_date: '2024-01-15',
        operation_type: 'compra',
        broker: 'xp_investimentos',
        observations: 'Compra inicial',
        account_id: 1,
        category_id: 1
      };

      mockReq.body = investmentData;

      const mockAccount = {
        id: 1,
        balance: 5000,
        update: jest.fn().mockResolvedValue(true)
      };

      const mockCategory = {
        id: 1,
        name: 'Ações'
      };

      const mockInvestment = {
        id: 1,
        ...investmentData,
        user_id: 1,
        unit_price: 10
      };

      const mockTransaction = {
        id: 1,
        type: 'expense',
        amount: 1000
      };

      Account.findOne = jest.fn().mockResolvedValue(mockAccount);
      Category.findOne = jest.fn().mockResolvedValue(mockCategory);
      Investment.create = jest.fn().mockResolvedValue(mockInvestment);
      Transaction.create = jest.fn().mockResolvedValue(mockTransaction);
      Investment.findByPk = jest.fn().mockResolvedValue({
        ...mockInvestment,
        account: mockAccount,
        category: mockCategory
      });

      await investmentController.createInvestment(mockReq, mockRes);

      expect(Account.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 }
      });
      expect(Category.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 }
      });
      expect(Investment.create).toHaveBeenCalledWith({
        ...investmentData,
        user_id: 1
      });
      expect(mockAccount.update).toHaveBeenCalledWith({
        balance: 4000
      });
      expect(Transaction.create).toHaveBeenCalledWith({
        type: 'expense',
        amount: 1000,
        description: 'Compra de Petrobras',
        date: '2024-01-15',
        account_id: 1,
        category_id: 1,
        user_id: 1,
        investment_id: 1
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Investimento criado com sucesso',
        investment: expect.any(Object),
        transaction: mockTransaction
      });
    });

    it('should throw NotFoundError when account does not exist', async () => {
      mockReq.body = {
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 1000,
        quantity: 100,
        operation_date: '2024-01-15',
        operation_type: 'compra',
        account_id: 999
      };

      Account.findOne = jest.fn().mockResolvedValue(null);

      await expect(investmentController.createInvestment(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when category does not exist', async () => {
      mockReq.body = {
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 1000,
        quantity: 100,
        operation_date: '2024-01-15',
        operation_type: 'compra',
        account_id: 1,
        category_id: 999
      };

      const mockAccount = { id: 1, balance: 5000 };

      Account.findOne = jest.fn()
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(null);

      await expect(investmentController.createInvestment(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when insufficient balance for purchase', async () => {
      mockReq.body = {
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 10000,
        quantity: 1000,
        operation_date: '2024-01-15',
        operation_type: 'compra',
        account_id: 1
      };

      const mockAccount = {
        id: 1,
        balance: 5000
      };

      Account.findOne = jest.fn().mockResolvedValue(mockAccount);

      await expect(investmentController.createInvestment(mockReq, mockRes))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getInvestments', () => {
    it('should return investments with pagination and statistics', async () => {
      mockReq.query = { page: 1, limit: 10 };

      const mockInvestments = [
        {
          id: 1,
          investment_type: 'acoes',
          asset_name: 'Petrobras',
          invested_amount: 1000,
          account: { id: 1, name: 'Conta Principal' },
          category: { id: 1, name: 'Ações' }
        }
      ];

      const mockResult = {
        count: 1,
        rows: mockInvestments
      };

      Investment.findAndCountAll = jest.fn().mockResolvedValue(mockResult);
      Investment.sum = jest.fn()
        .mockResolvedValueOnce(1000) // totalInvested
        .mockResolvedValueOnce(0);   // totalSold

      await investmentController.getInvestments(mockReq, mockRes);

      expect(Investment.findAndCountAll).toHaveBeenCalledWith({
        where: { user_id: 1 },
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
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        },
        statistics: {
          totalInvested: 1000,
          totalSold: 0,
          netInvestment: 1000
        }
      });
    });

    it('should apply filters correctly', async () => {
      mockReq.query = {
        investment_type: 'acoes',
        operation_type: 'compra',
        status: 'ativo',
        broker: 'xp_investimentos'
      };

      const mockResult = { count: 0, rows: [] };

      Investment.findAndCountAll = jest.fn().mockResolvedValue(mockResult);
      Investment.sum = jest.fn().mockResolvedValue(0);

      await investmentController.getInvestments(mockReq, mockRes);

      expect(Investment.findAndCountAll).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          investment_type: 'acoes',
          operation_type: 'compra',
          status: 'ativo',
          broker: 'xp_investimentos'
        },
        include: expect.any(Array),
        order: expect.any(Array),
        limit: 10,
        offset: 0
      });
    });
  });

  describe('getInvestment', () => {
    it('should return a specific investment', async () => {
      mockReq.params = { id: 1 };

      const mockInvestment = {
        id: 1,
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        account: { id: 1, name: 'Conta Principal' },
        category: { id: 1, name: 'Ações' }
      };

      Investment.findOne = jest.fn().mockResolvedValue(mockInvestment);

      await investmentController.getInvestment(mockReq, mockRes);

      expect(Investment.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
        include: [
          { model: Account, as: 'account' },
          { model: Category, as: 'category' }
        ]
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockInvestment);
    });

    it('should throw NotFoundError when investment does not exist', async () => {
      mockReq.params = { id: 999 };

      Investment.findOne = jest.fn().mockResolvedValue(null);

      await expect(investmentController.getInvestment(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateInvestment', () => {
    it('should update an investment successfully', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = {
        observations: 'Atualização das observações'
      };

      const mockInvestment = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      Investment.findOne = jest.fn().mockResolvedValue(mockInvestment);
      Investment.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        observations: 'Atualização das observações',
        account: { id: 1 },
        category: { id: 1 }
      });

      await investmentController.updateInvestment(mockReq, mockRes);

      expect(Investment.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 }
      });
      expect(mockInvestment.update).toHaveBeenCalledWith({
        observations: 'Atualização das observações'
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Investimento atualizado com sucesso',
        investment: expect.any(Object)
      });
    });

    it('should throw NotFoundError when investment does not exist', async () => {
      mockReq.params = { id: 999 };
      mockReq.body = { observations: 'Test' };

      Investment.findOne = jest.fn().mockResolvedValue(null);

      await expect(investmentController.updateInvestment(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteInvestment', () => {
    it('should delete an investment successfully', async () => {
      mockReq.params = { id: 1 };

      const mockInvestment = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      Investment.findOne = jest.fn().mockResolvedValue(mockInvestment);
      Transaction.findOne = jest.fn().mockResolvedValue(null);

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

    it('should throw NotFoundError when investment does not exist', async () => {
      mockReq.params = { id: 999 };

      Investment.findOne = jest.fn().mockResolvedValue(null);

      await expect(investmentController.deleteInvestment(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when investment has associated transactions', async () => {
      mockReq.params = { id: 1 };

      const mockInvestment = { id: 1 };
      const mockTransaction = { id: 1 };

      Investment.findOne = jest.fn().mockResolvedValue(mockInvestment);
      Transaction.findOne = jest.fn().mockResolvedValue(mockTransaction);

      await expect(investmentController.deleteInvestment(mockReq, mockRes))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getInvestmentStatistics', () => {
    it('should return investment statistics', async () => {
      const mockByType = [
        { investment_type: 'acoes', total_amount: 5000, count: 5 }
      ];

      const mockByBroker = [
        { broker: 'xp_investimentos', total_amount: 3000, count: 3 }
      ];

      const mockRecentInvestments = [
        { id: 1, asset_name: 'Petrobras' }
      ];

      Investment.sum = jest.fn()
        .mockResolvedValueOnce(5000) // totalInvested
        .mockResolvedValueOnce(1000); // totalSold

      Investment.findAll = jest.fn()
        .mockResolvedValueOnce(mockByType)
        .mockResolvedValueOnce(mockByBroker)
        .mockResolvedValueOnce(mockRecentInvestments);

      await investmentController.getInvestmentStatistics(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        general: {
          totalInvested: 5000,
          totalSold: 1000,
          netInvestment: 4000,
          totalTransactions: expect.any(Number)
        },
        byType: mockByType,
        byBroker: mockByBroker,
        recentInvestments: mockRecentInvestments
      });
    });
  });
}); 