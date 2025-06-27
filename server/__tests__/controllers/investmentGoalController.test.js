/**
 * Testes unitários para o InvestmentGoalController
 * @author Lucas Santos
 */

const { ValidationError, NotFoundError } = require('../../utils/errors');
const InvestmentGoalController = require('../../controllers/investmentGoalController');
const InvestmentGoalService = require('../../services/investmentGoalService');

// Mock dos modelos
jest.mock('../../models', () => ({
  InvestmentGoal: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    sum: jest.fn(),
    findAll: jest.fn()
  },
  Category: {
    findOne: jest.fn()
  },
  Investment: {
    findAll: jest.fn(),
    count: jest.fn(),
    sum: jest.fn()
  }
}));

// Mock dos validators
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
  let investmentGoalController;
  let mockInvestmentGoalService;
  let mockReq;
  let mockRes;
  let createInvestmentGoalSchema, updateInvestmentGoalSchema, updateGoalAmountSchema;

  beforeEach(() => {
    // Limpa todos os mocks
    jest.clearAllMocks();
    
    // Mock das funções do service
    mockInvestmentGoalService = {
      createInvestmentGoal: jest.fn(),
      getInvestmentGoals: jest.fn(),
      getInvestmentGoal: jest.fn(),
      updateInvestmentGoal: jest.fn(),
      updateGoalAmount: jest.fn(),
      calculateGoalAmount: jest.fn(),
      deleteInvestmentGoal: jest.fn(),
      getInvestmentGoalStatistics: jest.fn()
    };

    // Mock do request
    mockReq = {
      userId: 1,
      body: {},
      params: {},
      query: {}
    };

    // Mock do response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock do service antes de instanciar o controller
    jest.doMock('../../services/investmentGoalService', () => {
      return jest.fn().mockImplementation(() => mockInvestmentGoalService);
    });

    // Limpa o cache do require para aplicar o mock
    jest.resetModules();
    
    // Importa os validators após o mock
    const validators = require('../../utils/investmentValidators');
    createInvestmentGoalSchema = validators.createInvestmentGoalSchema;
    updateInvestmentGoalSchema = validators.updateInvestmentGoalSchema;
    updateGoalAmountSchema = validators.updateGoalAmountSchema;
    
    // Importa o controller após o mock
    const InvestmentGoalController = require('../../controllers/investmentGoalController');
    investmentGoalController = new InvestmentGoalController();
  });

  describe('createInvestmentGoal', () => {
    it('should create an investment goal with valid data', async () => {
      const goalData = {
        title: 'Aposentadoria',
        description: 'Meta para aposentadoria',
        target_amount: 500000,
        target_date: '2030-12-31',
        category_id: 1
      };

      const mockGoal = {
        id: 1,
        title: 'Aposentadoria',
        progress: 0
      };

      createInvestmentGoalSchema.parse.mockReturnValue(goalData);
      mockInvestmentGoalService.createInvestmentGoal.mockResolvedValue(mockGoal);

      mockReq.body = goalData;

      await investmentGoalController.createInvestmentGoal(mockReq, mockRes);

      expect(createInvestmentGoalSchema.parse).toHaveBeenCalledWith(goalData);
      expect(mockInvestmentGoalService.createInvestmentGoal).toHaveBeenCalledWith(1, goalData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Meta de investimento criada com sucesso',
          goal: mockGoal
        }
      });
    });

    it('should create an investment goal without category', async () => {
      const goalData = {
        title: 'Aposentadoria',
        description: 'Meta para aposentadoria',
        target_amount: 500000,
        target_date: '2030-12-31'
      };

      const mockGoal = {
        id: 1,
        title: 'Aposentadoria',
        progress: 0
      };

      createInvestmentGoalSchema.parse.mockReturnValue(goalData);
      mockInvestmentGoalService.createInvestmentGoal.mockResolvedValue(mockGoal);

      mockReq.body = goalData;

      await investmentGoalController.createInvestmentGoal(mockReq, mockRes);

      expect(mockInvestmentGoalService.createInvestmentGoal).toHaveBeenCalledWith(1, goalData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should handle validation errors', async () => {
      const goalData = { invalid: 'data' };
      const validationError = new Error('Validation failed');
      validationError.name = 'ZodError';

      createInvestmentGoalSchema.parse.mockImplementation(() => {
        throw validationError;
      });

      mockReq.body = goalData;

      try {
        await investmentGoalController.createInvestmentGoal(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.name).toBe('ZodError');
      }
    });

    it('should handle category not found', async () => {
      const goalData = {
        title: 'Aposentadoria',
        description: 'Meta para aposentadoria',
        target_amount: 500000,
        target_date: '2030-12-31',
        category_id: 999
      };

      createInvestmentGoalSchema.parse.mockReturnValue(goalData);
      mockInvestmentGoalService.createInvestmentGoal.mockRejectedValue(
        new Error('Categoria não encontrada')
      );

      mockReq.body = goalData;

      try {
        await investmentGoalController.createInvestmentGoal(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Categoria não encontrada');
      }
    });

    it('should handle goal not found after creation', async () => {
      const goalData = {
        title: 'Aposentadoria',
        description: 'Meta para aposentadoria',
        target_amount: 500000,
        target_date: '2030-12-31'
      };

      createInvestmentGoalSchema.parse.mockReturnValue(goalData);
      mockInvestmentGoalService.createInvestmentGoal.mockRejectedValue(
        new Error('Meta de investimento não encontrada após criação')
      );

      mockReq.body = goalData;

      try {
        await investmentGoalController.createInvestmentGoal(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Meta de investimento não encontrada após criação');
      }
    });
  });

  describe('getInvestmentGoals', () => {
    it('should return all investment goals for user', async () => {
      const mockResult = {
        goals: [
          { id: 1, title: 'Aposentadoria', progress: 25 },
          { id: 2, title: 'Casa', progress: 50 }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        },
        statistics: {
          totalGoals: 2,
          activeGoals: 2,
          completedGoals: 0,
          completionRate: 0
        }
      };

      mockInvestmentGoalService.getInvestmentGoals.mockResolvedValue(mockResult);

      await investmentGoalController.getInvestmentGoals(mockReq, mockRes);

      expect(mockInvestmentGoalService.getInvestmentGoals).toHaveBeenCalledWith(1, {});
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        status: 'ativa',
        page: 2,
        limit: 5
      };

      const mockResult = {
        goals: [],
        pagination: { total: 0, page: 2, limit: 5, totalPages: 0 },
        statistics: { totalGoals: 0, activeGoals: 0, completedGoals: 0, completionRate: 0 }
      };

      mockInvestmentGoalService.getInvestmentGoals.mockResolvedValue(mockResult);

      mockReq.query = filters;

      await investmentGoalController.getInvestmentGoals(mockReq, mockRes);

      expect(mockInvestmentGoalService.getInvestmentGoals).toHaveBeenCalledWith(1, filters);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should handle empty results', async () => {
      const mockResult = {
        goals: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        statistics: { totalGoals: 0, activeGoals: 0, completedGoals: 0, completionRate: 0 }
      };

      mockInvestmentGoalService.getInvestmentGoals.mockResolvedValue(mockResult);

      await investmentGoalController.getInvestmentGoals(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should calculate completion rate correctly', async () => {
      const mockResult = {
        goals: [
          { id: 1, title: 'Aposentadoria', progress: 100, status: 'concluida' }
        ],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
        statistics: { totalGoals: 1, activeGoals: 0, completedGoals: 1, completionRate: 100 }
      };

      mockInvestmentGoalService.getInvestmentGoals.mockResolvedValue(mockResult);

      await investmentGoalController.getInvestmentGoals(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });
  });

  describe('getInvestmentGoal', () => {
    it('should return a specific investment goal', async () => {
      const mockGoal = {
        id: 1,
        title: 'Aposentadoria',
        progress: 25,
        isOverdue: false,
        isCompleted: false
      };

      mockInvestmentGoalService.getInvestmentGoal.mockResolvedValue(mockGoal);
      mockReq.params = { id: 1 };

      await investmentGoalController.getInvestmentGoal(mockReq, mockRes);

      expect(mockInvestmentGoalService.getInvestmentGoal).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockGoal
      });
    });

    it('should return error when goal is not found', async () => {
      mockInvestmentGoalService.getInvestmentGoal.mockRejectedValue(
        new Error('Meta de investimento não encontrada')
      );
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
        title: 'Aposentadoria Atualizada',
        target_amount: 600000
      };

      const mockGoal = {
        id: 1,
        title: 'Aposentadoria Atualizada',
        progress: 20
      };

      updateInvestmentGoalSchema.parse.mockReturnValue(updateData);
      mockInvestmentGoalService.updateInvestmentGoal.mockResolvedValue(mockGoal);
      mockReq.params = { id: 1 };
      mockReq.body = updateData;

      await investmentGoalController.updateInvestmentGoal(mockReq, mockRes);

      expect(updateInvestmentGoalSchema.parse).toHaveBeenCalledWith(updateData);
      expect(mockInvestmentGoalService.updateInvestmentGoal).toHaveBeenCalledWith(1, 1, updateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Meta de investimento atualizada com sucesso',
          goal: mockGoal
        }
      });
    });

    it('should update goal with category validation', async () => {
      const updateData = {
        title: 'Aposentadoria',
        category_id: 2
      };

      const mockGoal = {
        id: 1,
        title: 'Aposentadoria',
        category_id: 2
      };

      updateInvestmentGoalSchema.parse.mockReturnValue(updateData);
      mockInvestmentGoalService.updateInvestmentGoal.mockResolvedValue(mockGoal);
      mockReq.params = { id: 1 };
      mockReq.body = updateData;

      await investmentGoalController.updateInvestmentGoal(mockReq, mockRes);

      expect(mockInvestmentGoalService.updateInvestmentGoal).toHaveBeenCalledWith(1, 1, updateData);
    });

    it('should handle category not found during update', async () => {
      const updateData = {
        title: 'Aposentadoria',
        category_id: 999
      };

      updateInvestmentGoalSchema.parse.mockReturnValue(updateData);
      mockInvestmentGoalService.updateInvestmentGoal.mockRejectedValue(
        new Error('Categoria não encontrada')
      );
      mockReq.params = { id: 1 };
      mockReq.body = updateData;

      try {
        await investmentGoalController.updateInvestmentGoal(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Categoria não encontrada');
      }
    });

    it('should return error when goal is not found', async () => {
      const updateData = { title: 'Aposentadoria' };

      updateInvestmentGoalSchema.parse.mockReturnValue(updateData);
      mockInvestmentGoalService.updateInvestmentGoal.mockRejectedValue(
        new Error('Meta de investimento não encontrada')
      );
      mockReq.params = { id: 999 };
      mockReq.body = updateData;

      try {
        await investmentGoalController.updateInvestmentGoal(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Meta de investimento não encontrada');
      }
    });

    it('should handle validation errors during update', async () => {
      const updateData = { invalid: 'data' };
      const validationError = new Error('Validation failed');
      validationError.name = 'ZodError';

      updateInvestmentGoalSchema.parse.mockImplementation(() => {
        throw validationError;
      });

      mockReq.params = { id: 1 };
      mockReq.body = updateData;

      try {
        await investmentGoalController.updateInvestmentGoal(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.name).toBe('ZodError');
      }
    });
  });

  describe('updateGoalAmount', () => {
    it('should update goal amount with valid data', async () => {
      const updateData = {
        current_amount: 125000
      };

      const mockGoal = {
        id: 1,
        title: 'Aposentadoria',
        current_amount: 125000,
        progress: 25
      };

      updateGoalAmountSchema.parse.mockReturnValue(updateData);
      mockInvestmentGoalService.updateGoalAmount.mockResolvedValue(mockGoal);
      mockReq.params = { id: 1 };
      mockReq.body = updateData;

      await investmentGoalController.updateGoalAmount(mockReq, mockRes);

      expect(updateGoalAmountSchema.parse).toHaveBeenCalledWith(updateData);
      expect(mockInvestmentGoalService.updateGoalAmount).toHaveBeenCalledWith(1, 1, updateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Valor atual da meta atualizado com sucesso',
          goal: mockGoal
        }
      });
    });

    it('should return error when goal is not found for amount update', async () => {
      const updateData = { current_amount: 125000 };

      updateGoalAmountSchema.parse.mockReturnValue(updateData);
      mockInvestmentGoalService.updateGoalAmount.mockRejectedValue(
        new Error('Meta de investimento não encontrada')
      );
      mockReq.params = { id: 999 };
      mockReq.body = updateData;

      try {
        await investmentGoalController.updateGoalAmount(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Meta de investimento não encontrada');
      }
    });

    it('should handle validation errors for amount update', async () => {
      const updateData = { invalid: 'data' };
      const validationError = new Error('Validation failed');
      validationError.name = 'ZodError';

      updateGoalAmountSchema.parse.mockImplementation(() => {
        throw validationError;
      });

      mockReq.params = { id: 1 };
      mockReq.body = updateData;

      try {
        await investmentGoalController.updateGoalAmount(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.name).toBe('ZodError');
      }
    });
  });

  describe('calculateGoalAmount', () => {
    it('should calculate goal amount from investments', async () => {
      const mockResult = {
        id: 1,
        title: 'Aposentadoria',
        current_amount: 250000,
        progress: 50,
        calculatedAmount: 250000,
        investmentsCount: 5
      };

      mockInvestmentGoalService.calculateGoalAmount.mockResolvedValue(mockResult);
      mockReq.params = { id: 1 };

      await investmentGoalController.calculateGoalAmount(mockReq, mockRes);

      expect(mockInvestmentGoalService.calculateGoalAmount).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Valor da meta calculado com sucesso',
          goal: mockResult,
          calculatedAmount: 250000,
          investmentsCount: 5
        }
      });
    });

    it('should handle zero invested amount', async () => {
      const mockResult = {
        id: 1,
        title: 'Aposentadoria',
        current_amount: 0,
        progress: 0,
        calculatedAmount: 0,
        investmentsCount: 0
      };

      mockInvestmentGoalService.calculateGoalAmount.mockResolvedValue(mockResult);
      mockReq.params = { id: 1 };

      await investmentGoalController.calculateGoalAmount(mockReq, mockRes);

      expect(mockInvestmentGoalService.calculateGoalAmount).toHaveBeenCalledWith(1, 1);
    });

    it('should return error when goal is not found for calculation', async () => {
      mockInvestmentGoalService.calculateGoalAmount.mockRejectedValue(
        new Error('Meta de investimento não encontrada')
      );
      mockReq.params = { id: 999 };

      try {
        await investmentGoalController.calculateGoalAmount(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Meta de investimento não encontrada');
      }
    });
  });

  describe('deleteInvestmentGoal', () => {
    it('should delete an investment goal', async () => {
      const mockResult = {
        message: 'Meta de investimento excluída com sucesso'
      };

      mockInvestmentGoalService.deleteInvestmentGoal.mockResolvedValue(mockResult);
      mockReq.params = { id: 1 };

      await investmentGoalController.deleteInvestmentGoal(mockReq, mockRes);

      expect(mockInvestmentGoalService.deleteInvestmentGoal).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should return error when goal is not found', async () => {
      mockInvestmentGoalService.deleteInvestmentGoal.mockRejectedValue(
        new Error('Meta de investimento não encontrada')
      );
      mockReq.params = { id: 999 };

      try {
        await investmentGoalController.deleteInvestmentGoal(mockReq, mockRes);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Meta de investimento não encontrada');
      }
    });
  });

  describe('getInvestmentGoalStatistics', () => {
    it('should return complete statistics', async () => {
      const mockStatistics = {
        summary: {
          totalGoals: 3,
          activeGoals: 2,
          completedGoals: 1,
          overdueGoals: 0,
          completionRate: 33.33
        },
        amounts: {
          totalTargetAmount: 1000000,
          totalCurrentAmount: 400000,
          totalProgress: 40,
          remainingAmount: 600000
        },
        progressByCategory: {
          'Aposentadoria': {
            totalGoals: 1,
            totalTargetAmount: 500000,
            totalCurrentAmount: 200000,
            averageProgress: 40
          }
        }
      };

      mockInvestmentGoalService.getInvestmentGoalStatistics.mockResolvedValue(mockStatistics);

      await investmentGoalController.getInvestmentGoalStatistics(mockReq, mockRes);

      expect(mockInvestmentGoalService.getInvestmentGoalStatistics).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatistics
      });
    });

    it('should handle empty goals list', async () => {
      const mockStatistics = {
        summary: {
          totalGoals: 0,
          activeGoals: 0,
          completedGoals: 0,
          overdueGoals: 0,
          completionRate: 0
        },
        amounts: {
          totalTargetAmount: 0,
          totalCurrentAmount: 0,
          totalProgress: 0,
          remainingAmount: 0
        },
        progressByCategory: {}
      };

      mockInvestmentGoalService.getInvestmentGoalStatistics.mockResolvedValue(mockStatistics);

      await investmentGoalController.getInvestmentGoalStatistics(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatistics
      });
    });

    it('should handle goals with invalid progress', async () => {
      const mockStatistics = {
        summary: {
          totalGoals: 2,
          activeGoals: 2,
          completedGoals: 0,
          overdueGoals: 0,
          completionRate: 0
        },
        amounts: {
          totalTargetAmount: 1000000,
          totalCurrentAmount: 0,
          totalProgress: 0,
          remainingAmount: 1000000
        },
        progressByCategory: {}
      };

      mockInvestmentGoalService.getInvestmentGoalStatistics.mockResolvedValue(mockStatistics);

      await investmentGoalController.getInvestmentGoalStatistics(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatistics
      });
    });
  });
}); 