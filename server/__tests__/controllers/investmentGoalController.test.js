const { InvestmentGoal, Category, Investment } = require('../../models');
const investmentGoalController = require('../../controllers/investmentGoalController');
const { ValidationError, NotFoundError } = require('../../utils/errors');

// Mock dos modelos
jest.mock('../../models');

describe('InvestmentGoalController', () => {
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

  describe('createInvestmentGoal', () => {
    it('should create a new investment goal successfully', async () => {
      const goalData = {
        title: 'Aposentadoria',
        description: 'Meta para aposentadoria aos 60 anos',
        target_amount: 500000,
        target_date: '2030-12-31',
        current_amount: 0,
        color: '#3B82F6',
        category_id: 1
      };

      mockReq.body = goalData;

      const mockCategory = {
        id: 1,
        name: 'Investimentos'
      };

      const mockGoal = {
        id: 1,
        ...goalData,
        user_id: 1,
        getProgress: jest.fn().mockReturnValue(0)
      };

      Category.findOne = jest.fn().mockResolvedValue(mockCategory);
      InvestmentGoal.create = jest.fn().mockResolvedValue(mockGoal);
      InvestmentGoal.findByPk = jest.fn().mockResolvedValue({
        ...mockGoal,
        category: mockCategory
      });

      await investmentGoalController.createInvestmentGoal(mockReq, mockRes);

      expect(Category.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 }
      });
      expect(InvestmentGoal.create).toHaveBeenCalledWith({
        ...goalData,
        user_id: 1,
        current_amount: 0
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Meta de investimento criada com sucesso',
        goal: expect.objectContaining({
          id: 1,
          title: 'Aposentadoria',
          progress: 0
        })
      });
    });

    it('should throw NotFoundError when category does not exist', async () => {
      mockReq.body = {
        title: 'Aposentadoria',
        description: 'Meta para aposentadoria',
        target_amount: 500000,
        target_date: '2030-12-31',
        category_id: 999
      };

      Category.findOne = jest.fn().mockResolvedValue(null);

      await expect(investmentGoalController.createInvestmentGoal(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getInvestmentGoals', () => {
    it('should return investment goals with pagination and statistics', async () => {
      mockReq.query = { page: 1, limit: 10 };

      const mockGoals = [
        {
          id: 1,
          title: 'Aposentadoria',
          target_amount: 500000,
          current_amount: 100000,
          getProgress: jest.fn().mockReturnValue(20),
          isOverdue: jest.fn().mockReturnValue(false),
          isCompleted: jest.fn().mockReturnValue(false),
          toJSON: jest.fn().mockReturnValue({
            id: 1,
            title: 'Aposentadoria',
            target_amount: 500000,
            current_amount: 100000
          }),
          category: { id: 1, name: 'Investimentos' }
        }
      ];

      const mockResult = {
        count: 1,
        rows: mockGoals
      };

      InvestmentGoal.findAndCountAll = jest.fn().mockResolvedValue(mockResult);
      InvestmentGoal.count = jest.fn()
        .mockResolvedValueOnce(1)  // totalGoals
        .mockResolvedValueOnce(1)  // activeGoals
        .mockResolvedValueOnce(0); // completedGoals

      await investmentGoalController.getInvestmentGoals(mockReq, mockRes);

      expect(InvestmentGoal.findAndCountAll).toHaveBeenCalledWith({
        where: { user_id: 1 },
        include: [
          { model: Category, as: 'category' }
        ],
        order: [['target_date', 'ASC']],
        limit: 10,
        offset: 0
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        goals: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            title: 'Aposentadoria',
            progress: 20,
            isOverdue: false,
            isCompleted: false
          })
        ]),
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        },
        statistics: {
          totalGoals: 1,
          activeGoals: 1,
          completedGoals: 0,
          completionRate: 0
        }
      });
    });

    it('should apply status filter correctly', async () => {
      mockReq.query = { status: 'ativa' };

      const mockResult = { count: 0, rows: [] };

      InvestmentGoal.findAndCountAll = jest.fn().mockResolvedValue(mockResult);
      InvestmentGoal.count = jest.fn().mockResolvedValue(0);

      await investmentGoalController.getInvestmentGoals(mockReq, mockRes);

      expect(InvestmentGoal.findAndCountAll).toHaveBeenCalledWith({
        where: { user_id: 1, status: 'ativa' },
        include: expect.any(Array),
        order: expect.any(Array),
        limit: 10,
        offset: 0
      });
    });
  });

  describe('getInvestmentGoal', () => {
    it('should return a specific investment goal', async () => {
      mockReq.params = { id: 1 };

      const mockGoal = {
        id: 1,
        title: 'Aposentadoria',
        target_amount: 500000,
        current_amount: 100000,
        getProgress: jest.fn().mockReturnValue(20),
        isOverdue: jest.fn().mockReturnValue(false),
        isCompleted: jest.fn().mockReturnValue(false),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          title: 'Aposentadoria',
          target_amount: 500000,
          current_amount: 100000
        }),
        category: { id: 1, name: 'Investimentos' }
      };

      InvestmentGoal.findOne = jest.fn().mockResolvedValue(mockGoal);

      await investmentGoalController.getInvestmentGoal(mockReq, mockRes);

      expect(InvestmentGoal.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
        include: [
          { model: Category, as: 'category' }
        ]
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 1,
        title: 'Aposentadoria',
        target_amount: 500000,
        current_amount: 100000,
        progress: 20,
        isOverdue: false,
        isCompleted: false
      });
    });

    it('should throw NotFoundError when goal does not exist', async () => {
      mockReq.params = { id: 999 };

      InvestmentGoal.findOne = jest.fn().mockResolvedValue(null);

      await expect(investmentGoalController.getInvestmentGoal(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateInvestmentGoal', () => {
    it('should update an investment goal successfully', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = {
        target_amount: 600000
      };

      const mockGoal = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      InvestmentGoal.findOne = jest.fn().mockResolvedValue(mockGoal);
      InvestmentGoal.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        target_amount: 600000,
        getProgress: jest.fn().mockReturnValue(16.67),
        isOverdue: jest.fn().mockReturnValue(false),
        isCompleted: jest.fn().mockReturnValue(false),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          target_amount: 600000
        }),
        category: { id: 1 }
      });

      await investmentGoalController.updateInvestmentGoal(mockReq, mockRes);

      expect(InvestmentGoal.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 }
      });
      expect(mockGoal.update).toHaveBeenCalledWith({
        target_amount: 600000
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Meta de investimento atualizada com sucesso',
        goal: expect.objectContaining({
          id: 1,
          target_amount: 600000,
          progress: 16.67
        })
      });
    });

    it('should throw NotFoundError when goal does not exist', async () => {
      mockReq.params = { id: 999 };
      mockReq.body = { target_amount: 600000 };

      InvestmentGoal.findOne = jest.fn().mockResolvedValue(null);

      await expect(investmentGoalController.updateInvestmentGoal(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateGoalAmount', () => {
    it('should update goal amount successfully', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { current_amount: 125000 };

      const mockGoal = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      InvestmentGoal.findOne = jest.fn().mockResolvedValue(mockGoal);
      InvestmentGoal.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        current_amount: 125000,
        getProgress: jest.fn().mockReturnValue(25),
        isOverdue: jest.fn().mockReturnValue(false),
        isCompleted: jest.fn().mockReturnValue(false),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          current_amount: 125000
        }),
        category: { id: 1 }
      });

      await investmentGoalController.updateGoalAmount(mockReq, mockRes);

      expect(InvestmentGoal.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 }
      });
      expect(mockGoal.update).toHaveBeenCalledWith({
        current_amount: 125000
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Valor atual da meta atualizado com sucesso',
        goal: expect.objectContaining({
          id: 1,
          current_amount: 125000,
          progress: 25
        })
      });
    });
  });

  describe('calculateGoalAmount', () => {
    it('should calculate goal amount based on investments', async () => {
      mockReq.params = { id: 1 };

      const mockGoal = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      InvestmentGoal.findOne = jest.fn().mockResolvedValue(mockGoal);
      Investment.sum = jest.fn().mockResolvedValue(125000);
      InvestmentGoal.findByPk = jest.fn().mockResolvedValue({
        id: 1,
        current_amount: 125000,
        getProgress: jest.fn().mockReturnValue(25),
        isOverdue: jest.fn().mockReturnValue(false),
        isCompleted: jest.fn().mockReturnValue(false),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          current_amount: 125000
        }),
        category: { id: 1 }
      });

      await investmentGoalController.calculateGoalAmount(mockReq, mockRes);

      expect(InvestmentGoal.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 }
      });
      expect(Investment.sum).toHaveBeenCalledWith('invested_amount', {
        where: { 
          user_id: 1,
          operation_type: 'compra',
          status: 'ativo'
        }
      });
      expect(mockGoal.update).toHaveBeenCalledWith({
        current_amount: 125000
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Valor atual da meta calculado automaticamente',
        goal: expect.objectContaining({
          id: 1,
          current_amount: 125000,
          progress: 25
        })
      });
    });

    it('should throw NotFoundError when goal does not exist', async () => {
      mockReq.params = { id: 999 };

      InvestmentGoal.findOne = jest.fn().mockResolvedValue(null);

      await expect(investmentGoalController.calculateGoalAmount(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteInvestmentGoal', () => {
    it('should delete an investment goal successfully', async () => {
      mockReq.params = { id: 1 };

      const mockGoal = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      InvestmentGoal.findOne = jest.fn().mockResolvedValue(mockGoal);

      await investmentGoalController.deleteInvestmentGoal(mockReq, mockRes);

      expect(InvestmentGoal.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 }
      });
      expect(mockGoal.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Meta de investimento excluída com sucesso'
      });
    });

    it('should throw NotFoundError when goal does not exist', async () => {
      mockReq.params = { id: 999 };

      InvestmentGoal.findOne = jest.fn().mockResolvedValue(null);

      await expect(investmentGoalController.deleteInvestmentGoal(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getInvestmentGoalStatistics', () => {
    it('should return investment goal statistics', async () => {
      const mockUpcomingGoals = [
        {
          id: 1,
          title: 'Aposentadoria',
          target_date: '2025-12-31',
          getProgress: jest.fn().mockReturnValue(20),
          isOverdue: jest.fn().mockReturnValue(false),
          isCompleted: jest.fn().mockReturnValue(false),
          toJSON: jest.fn().mockReturnValue({
            id: 1,
            title: 'Aposentadoria',
            target_date: '2025-12-31'
          }),
          category: { id: 1, name: 'Investimentos' }
        }
      ];

      InvestmentGoal.count = jest.fn()
        .mockResolvedValueOnce(5)  // totalGoals
        .mockResolvedValueOnce(3)  // activeGoals
        .mockResolvedValueOnce(1)  // completedGoals
        .mockResolvedValueOnce(1); // overdueGoals

      InvestmentGoal.findAll = jest.fn()
        .mockResolvedValueOnce([
          { id: 1, getProgress: () => 50 },
          { id: 2, getProgress: () => 30 }
        ]) // allGoals
        .mockResolvedValueOnce(mockUpcomingGoals); // upcomingGoals

      await investmentGoalController.getInvestmentGoalStatistics(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        general: {
          totalGoals: 5,
          activeGoals: 3,
          completedGoals: 1,
          overdueGoals: 1,
          completionRate: 20,
          averageProgress: 40
        },
        upcomingGoals: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            title: 'Aposentadoria',
            progress: 20,
            isOverdue: false,
            isCompleted: false
          })
        ])
      });
    });
  });
}); 