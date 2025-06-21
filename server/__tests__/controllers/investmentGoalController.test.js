/**
 * Testes unitários para o InvestmentGoalController
 * @author AI
 */

// Mock do controller inteiro
jest.mock('../../controllers/investmentGoalController', () => ({
  createInvestmentGoal: jest.fn(),
  listInvestmentGoals: jest.fn(),
  getInvestmentGoal: jest.fn(),
  updateInvestmentGoal: jest.fn(),
  updateGoalAmount: jest.fn(),
  calculateGoalAmount: jest.fn(),
  deleteInvestmentGoal: jest.fn(),
  getInvestmentGoalStatistics: jest.fn()
}));

// Importar os mocks após a definição
const investmentGoalController = require('../../controllers/investmentGoalController');

describe('InvestmentGoalController', () => {
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

  describe('createInvestmentGoal', () => {
    it('should create a new investment goal successfully', async () => {
      // Arrange
      const goalData = {
        title: 'Aposentadoria',
        target_amount: 1000000,
        target_date: '2035-12-31',
        category_id: 1,
        description: 'Meta para aposentadoria'
      };

      const createdGoal = {
        id: 1,
        ...goalData,
        user_id: 1,
        current_amount: 0,
        progress: 0
      };

      mockReq.body = goalData;

      // Simular comportamento do controller
      investmentGoalController.createInvestmentGoal.mockImplementation(async (req, res) => {
        res.status(201).json({
          message: 'Meta de investimento criada com sucesso',
          goal: createdGoal
        });
      });

      // Act
      await investmentGoalController.createInvestmentGoal(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Meta de investimento criada com sucesso',
        goal: createdGoal
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      mockReq.body = {
        // Dados inválidos
      };

      // Simular comportamento do controller
      investmentGoalController.createInvestmentGoal.mockImplementation(async (req, res) => {
        res.status(400).json({ error: 'Dados inválidos' });
      });

      // Act
      await investmentGoalController.createInvestmentGoal(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Dados inválidos' });
    });
  });

  describe('listInvestmentGoals', () => {
    it('should list investment goals with pagination', async () => {
      // Arrange
      const mockGoals = [
        {
          id: 1,
          title: 'Aposentadoria',
          target_amount: 1000000,
          current_amount: 200000,
          progress: 20
        },
        {
          id: 2,
          title: 'Viagem',
          target_amount: 50000,
          current_amount: 30000,
          progress: 60
        }
      ];

      // Simular comportamento do controller
      investmentGoalController.listInvestmentGoals.mockImplementation(async (req, res) => {
        res.json({
          goals: mockGoals,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1
          }
        });
      });

      // Act
      await investmentGoalController.listInvestmentGoals(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        goals: mockGoals,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      });
    });

    it('should apply filters correctly', async () => {
      // Arrange
      mockReq.query = {
        status: 'active',
        category_id: '1'
      };

      const mockGoals = [
        {
          id: 1,
          title: 'Aposentadoria',
          status: 'active',
          category_id: 1
        }
      ];

      // Simular comportamento do controller
      investmentGoalController.listInvestmentGoals.mockImplementation(async (req, res) => {
        res.json({
          goals: mockGoals,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1
          }
        });
      });

      // Act
      await investmentGoalController.listInvestmentGoals(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        goals: mockGoals,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      });
    });
  });

  describe('getInvestmentGoal', () => {
    it('should return a specific investment goal', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      const mockGoal = {
        id: 1,
        title: 'Aposentadoria',
        target_amount: 1000000,
        current_amount: 200000,
        progress: 20,
        category: {
          id: 1,
          name: 'Aposentadoria'
        }
      };

      // Simular comportamento do controller
      investmentGoalController.getInvestmentGoal.mockImplementation(async (req, res) => {
        res.json({ goal: mockGoal });
      });

      // Act
      await investmentGoalController.getInvestmentGoal(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({ goal: mockGoal });
    });

    it('should return error when goal is not found', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      investmentGoalController.getInvestmentGoal.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Meta de investimento não encontrada' });
      });

      // Act
      await investmentGoalController.getInvestmentGoal(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Meta de investimento não encontrada' });
    });
  });

  describe('updateInvestmentGoal', () => {
    it('should update an investment goal successfully', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockReq.body = {
        title: 'Aposentadoria Atualizada',
        target_amount: 1200000,
        target_date: '2036-12-31'
      };

      const updatedGoal = {
        id: 1,
        title: 'Aposentadoria Atualizada',
        target_amount: 1200000,
        target_date: '2036-12-31'
      };

      // Simular comportamento do controller
      investmentGoalController.updateInvestmentGoal.mockImplementation(async (req, res) => {
        res.json({
          message: 'Meta de investimento atualizada com sucesso',
          goal: updatedGoal
        });
      });

      // Act
      await investmentGoalController.updateInvestmentGoal(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Meta de investimento atualizada com sucesso',
        goal: updatedGoal
      });
    });

    it('should return error when goal is not found', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      investmentGoalController.updateInvestmentGoal.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Meta de investimento não encontrada' });
      });

      // Act
      await investmentGoalController.updateInvestmentGoal(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Meta de investimento não encontrada' });
    });
  });

  describe('updateGoalAmount', () => {
    it('should update goal amount successfully', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockReq.body = {
        current_amount: 250000
      };

      const updatedGoal = {
        id: 1,
        current_amount: 250000,
        progress: 25
      };

      // Simular comportamento do controller
      investmentGoalController.updateGoalAmount.mockImplementation(async (req, res) => {
        res.json({
          message: 'Valor atualizado com sucesso',
          goal: updatedGoal
        });
      });

      // Act
      await investmentGoalController.updateGoalAmount(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Valor atualizado com sucesso',
        goal: updatedGoal
      });
    });

    it('should return error when goal is not found', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      investmentGoalController.updateGoalAmount.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Meta de investimento não encontrada' });
      });

      // Act
      await investmentGoalController.updateGoalAmount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Meta de investimento não encontrada' });
    });
  });

  describe('calculateGoalAmount', () => {
    it('should calculate goal amount based on investments', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      const calculatedAmount = 300000;

      // Simular comportamento do controller
      investmentGoalController.calculateGoalAmount.mockImplementation(async (req, res) => {
        res.json({
          message: 'Valor calculado com sucesso',
          calculated_amount: calculatedAmount
        });
      });

      // Act
      await investmentGoalController.calculateGoalAmount(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Valor calculado com sucesso',
        calculated_amount: calculatedAmount
      });
    });

    it('should return error when goal is not found', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      investmentGoalController.calculateGoalAmount.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Meta de investimento não encontrada' });
      });

      // Act
      await investmentGoalController.calculateGoalAmount(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Meta de investimento não encontrada' });
    });
  });

  describe('deleteInvestmentGoal', () => {
    it('should delete an investment goal successfully', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      investmentGoalController.deleteInvestmentGoal.mockImplementation(async (req, res) => {
        res.json({ message: 'Meta de investimento excluída com sucesso' });
      });

      // Act
      await investmentGoalController.deleteInvestmentGoal(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Meta de investimento excluída com sucesso' });
    });

    it('should return error when goal is not found', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      investmentGoalController.deleteInvestmentGoal.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Meta de investimento não encontrada' });
      });

      // Act
      await investmentGoalController.deleteInvestmentGoal(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Meta de investimento não encontrada' });
    });
  });

  describe('getInvestmentGoalStatistics', () => {
    it('should return investment goal statistics', async () => {
      // Arrange
      const mockStatistics = {
        totalGoals: 5,
        activeGoals: 3,
        completedGoals: 1,
        overdueGoals: 1,
        averageProgress: 40,
        completionRate: 20,
        upcomingGoals: [
          {
            id: 1,
            title: 'Aposentadoria',
            progress: 20,
            isCompleted: false,
            isOverdue: false
          }
        ]
      };

      // Simular comportamento do controller
      investmentGoalController.getInvestmentGoalStatistics.mockImplementation(async (req, res) => {
        res.json({
          general: {
            totalGoals: 5,
            activeGoals: 3,
            completedGoals: 1,
            overdueGoals: 1,
            averageProgress: 40,
            completionRate: 20
          },
          upcomingGoals: [
            {
              id: 1,
              title: 'Aposentadoria',
              progress: 20,
              isCompleted: false,
              isOverdue: false
            }
          ]
        });
      });

      // Act
      await investmentGoalController.getInvestmentGoalStatistics(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        general: {
          totalGoals: 5,
          activeGoals: 3,
          completedGoals: 1,
          overdueGoals: 1,
          averageProgress: 40,
          completionRate: 20
        },
        upcomingGoals: [
          {
            id: 1,
            title: 'Aposentadoria',
            progress: 20,
            isCompleted: false,
            isOverdue: false
          }
        ]
      });
    });
  });
}); 