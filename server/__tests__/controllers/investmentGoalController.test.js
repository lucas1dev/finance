/**
 * Testes unitários para o InvestmentGoalController
 * @author Lucas Santos
 */

const { ValidationError, NotFoundError } = require('../../utils/errors');

// Mock dos modelos
jest.mock('../../models', () => ({
  InvestmentGoal: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn()
  },
  Category: {
    findOne: jest.fn()
  },
  Investment: {
    findAll: jest.fn(),
    count: jest.fn()
  }
}));

// Mock das validações
jest.mock('../../utils/investmentValidators', () => ({
  createInvestmentGoalSchema: {
    parse: jest.fn()
  },
  updateInvestmentGoalSchema: {
    parse: jest.fn()
  },
  updateGoalAmountSchema: {
    parse: jest.fn()
  }
}));

describe('InvestmentGoalController', () => {
  let mockReq, mockRes, investmentGoalController;
  let { InvestmentGoal, Category, Investment } = require('../../models');
  let { createInvestmentGoalSchema, updateInvestmentGoalSchema } = require('../../utils/investmentValidators');

  beforeEach(() => {
    // Importa o controller dentro do beforeEach para garantir que os mocks sejam aplicados
    jest.resetModules();
    investmentGoalController = require('../../controllers/investmentGoalController');
    ({ InvestmentGoal, Category, Investment } = require('../../models'));
    ({ createInvestmentGoalSchema, updateInvestmentGoalSchema } = require('../../utils/investmentValidators'));

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

  describe('createInvestmentGoal', () => {
    it('should create an investment goal with valid data', async () => {
      const goalData = {
        title: 'Aposentadoria',
        description: 'Meta para aposentadoria',
        target_amount: 1000000.00,
        target_date: '2035-12-31',
        current_amount: 0,
        color: '#3B82F6',
        category_id: 1
      };

      const mockGoal = {
        id: 1,
        ...goalData,
        user_id: 1,
        toJSON: () => ({ id: 1, ...goalData, user_id: 1 }),
        getProgress: () => 0
      };

      createInvestmentGoalSchema.parse.mockReturnValue(goalData);
      Category.findOne.mockResolvedValue({ id: 1, name: 'Investimentos' });
      InvestmentGoal.create.mockResolvedValue(mockGoal);
      InvestmentGoal.findByPk.mockResolvedValue(mockGoal);

      mockReq.body = goalData;

      await investmentGoalController.createInvestmentGoal(mockReq, mockRes);

      expect(createInvestmentGoalSchema.parse).toHaveBeenCalledWith(goalData);
      expect(Category.findOne).toHaveBeenCalledWith({
        where: { id: goalData.category_id, user_id: mockReq.userId }
      });
      expect(InvestmentGoal.create).toHaveBeenCalledWith({
        ...goalData,
        user_id: mockReq.userId,
        current_amount: 0
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Meta de investimento criada com sucesso',
        goal: expect.any(Object)
      });
    });

    it('should handle validation errors', async () => {
      const zodError = new Error('Validation failed');
      zodError.name = 'ZodError';
      zodError.errors = [{ message: 'Invalid data' }];
      
      createInvestmentGoalSchema.parse.mockImplementation(() => { 
        throw zodError; 
      });

      mockReq.body = {};

      try {
        await investmentGoalController.createInvestmentGoal(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Dados inválidos');
      }
    });

    it('should handle category not found', async () => {
      const goalData = {
        title: 'Aposentadoria',
        target_amount: 1000000.00,
        target_date: '2035-12-31',
        category_id: 999
      };

      createInvestmentGoalSchema.parse.mockReturnValue(goalData);
      Category.findOne.mockResolvedValue(null);

      mockReq.body = goalData;

      try {
        await investmentGoalController.createInvestmentGoal(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Categoria não encontrada');
      }
    });
  });

  describe('getInvestmentGoals', () => {
    it('should return all investment goals for user', async () => {
      const mockGoals = [
        {
          id: 1,
          title: 'Aposentadoria',
          target_amount: 1000000.00,
          toJSON: () => ({ id: 1, title: 'Aposentadoria', target_amount: 1000000.00 }),
          getProgress: () => 25,
          isOverdue: () => false,
          isCompleted: () => false
        },
        {
          id: 2,
          title: 'Viagem',
          target_amount: 50000.00,
          toJSON: () => ({ id: 2, title: 'Viagem', target_amount: 50000.00 }),
          getProgress: () => 50,
          isOverdue: () => false,
          isCompleted: () => false
        }
      ];

      const mockResult = {
        count: 2,
        rows: mockGoals
      };

      InvestmentGoal.findAndCountAll.mockResolvedValue(mockResult);
      InvestmentGoal.count
        .mockResolvedValueOnce(2) // totalGoals
        .mockResolvedValueOnce(1) // activeGoals
        .mockResolvedValueOnce(0); // completedGoals

      await investmentGoalController.getInvestmentGoals(mockReq, mockRes);

      expect(InvestmentGoal.findAndCountAll).toHaveBeenCalledWith({
        where: { user_id: mockReq.userId },
        include: [
          { model: Category, as: 'category' }
        ],
        order: [['target_date', 'ASC']],
        limit: 10,
        offset: 0
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        goals: expect.any(Array),
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        },
        statistics: {
          totalGoals: 2,
          activeGoals: 1,
          completedGoals: 0,
          completionRate: 0
        }
      });
    });

    it('should apply filters correctly', async () => {
      mockReq.query = {
        status: 'ativa',
        page: 2,
        limit: 5
      };

      const mockResult = { count: 0, rows: [] };
      InvestmentGoal.findAndCountAll.mockResolvedValue(mockResult);
      InvestmentGoal.count.mockResolvedValue(0);

      await investmentGoalController.getInvestmentGoals(mockReq, mockRes);

      expect(InvestmentGoal.findAndCountAll).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          status: 'ativa'
        },
        include: expect.any(Array),
        order: [['target_date', 'ASC']],
        limit: 5,
        offset: 5
      });
    });
  });

  describe('getInvestmentGoal', () => {
    it('should return a specific investment goal', async () => {
      const mockGoal = {
        id: 1,
        title: 'Aposentadoria',
        target_amount: 1000000.00,
        toJSON: () => ({ id: 1, title: 'Aposentadoria', target_amount: 1000000.00 }),
        getProgress: () => 25,
        isOverdue: () => false,
        isCompleted: () => false
      };

      InvestmentGoal.findOne.mockResolvedValue(mockGoal);

      mockReq.params = { id: 1 };

      await investmentGoalController.getInvestmentGoal(mockReq, mockRes);

      expect(InvestmentGoal.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: mockReq.userId },
        include: [
          { model: Category, as: 'category' }
        ]
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 1,
        title: 'Aposentadoria',
        target_amount: 1000000.00,
        progress: 25,
        isOverdue: false,
        isCompleted: false
      });
    });

    it('should return error when goal is not found', async () => {
      InvestmentGoal.findOne.mockResolvedValue(null);

      mockReq.params = { id: 999 };

      try {
        await investmentGoalController.getInvestmentGoal(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Meta de investimento não encontrada');
      }
    });
  });

  describe('updateInvestmentGoal', () => {
    it('should update an investment goal with valid data', async () => {
      const updateData = {
        title: 'Aposentadoria Premium',
        target_amount: 1500000.00
      };

      const mockGoal = {
        id: 1,
        user_id: 1,
        title: 'Aposentadoria',
        target_amount: 1000000.00,
        update: jest.fn().mockResolvedValue(true),
        getProgress: jest.fn().mockReturnValue(0.5),
        isOverdue: jest.fn().mockReturnValue(false),
        isCompleted: jest.fn().mockReturnValue(false),
        toJSON: () => ({
          id: 1,
          user_id: 1,
          title: 'Aposentadoria Premium',
          target_amount: 1500000.00
        })
      };

      updateInvestmentGoalSchema.parse.mockReturnValue(updateData);
      InvestmentGoal.findOne.mockResolvedValue(mockGoal);
      InvestmentGoal.findByPk = jest.fn().mockResolvedValue({
        ...mockGoal,
        getProgress: jest.fn().mockReturnValue(0.5),
        isOverdue: jest.fn().mockReturnValue(false),
        isCompleted: jest.fn().mockReturnValue(false)
      });

      mockReq.params = { id: 1 };
      mockReq.body = updateData;

      await investmentGoalController.updateInvestmentGoal(mockReq, mockRes);

      expect(updateInvestmentGoalSchema.parse).toHaveBeenCalledWith(updateData);
      expect(InvestmentGoal.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 }
      });
      expect(mockGoal.update).toHaveBeenCalledWith(updateData);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Meta de investimento atualizada com sucesso',
          goal: expect.objectContaining({
            id: 1,
            user_id: 1,
            title: 'Aposentadoria Premium'
          })
        })
      );
    });

    it('should return error when goal is not found', async () => {
      InvestmentGoal.findOne.mockResolvedValue(null);

      mockReq.params = { id: 999 };

      try {
        await investmentGoalController.updateInvestmentGoal(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Meta de investimento não encontrada');
      }
    });
  });

  describe('deleteInvestmentGoal', () => {
    it('should delete an investment goal', async () => {
      const mockGoal = {
        id: 1,
        user_id: 1,
        title: 'Aposentadoria',
        target_amount: 1000000.00,
        destroy: jest.fn().mockResolvedValue(true)
      };
      const { Investment } = require('../../models');
      InvestmentGoal.findOne.mockResolvedValue(mockGoal);
      Investment.findOne = jest.fn().mockResolvedValue(null);

      mockReq.params = { id: 1 };

      await investmentGoalController.deleteInvestmentGoal(mockReq, mockRes);

      expect(InvestmentGoal.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 }
      });
      expect(mockGoal.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Meta de investimento excluída com sucesso'
      });
    });

    it('should return error when goal is not found', async () => {
      InvestmentGoal.findOne.mockResolvedValue(null);

      mockReq.params = { id: 999 };

      try {
        await investmentGoalController.deleteInvestmentGoal(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Meta de investimento não encontrada');
      }
    });
  });
}); 