/**
 * Testes unitários para DashboardController
 * Testa operações de dashboard e métricas
 */

let DashboardService;
let dashboardController;

// Mock do DashboardService
jest.mock('../../services/dashboardService', () => ({
  getMetrics: jest.fn(),
  getCharts: jest.fn(),
  getAlerts: jest.fn()
}));

// Mock do logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('DashboardController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Importar após os mocks
    dashboardController = require('../../controllers/dashboardController');
    DashboardService = require('../../services/dashboardService');
    
    // Limpar todos os mocks
    jest.clearAllMocks();
    
    // Mock do objeto de requisição
    mockReq = {
      userId: 'test-user-id'
    };

    // Mock do objeto de resposta
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getMetrics', () => {
    it('should return dashboard metrics successfully', async () => {
      // Arrange
      const mockMetrics = {
        summary: {
          totalBalance: 15000.00,
          monthlyIncome: 5000.00,
          monthlyExpenses: 3000.00,
          monthlyNet: 2000.00,
          totalTransactions: 150,
          monthlyTransactions: 25
        },
        accounts: [
          {
            id: 1,
            name: 'Conta Principal',
            balance: 10000.00,
            type: 'checking'
          }
        ],
        recentTransactions: [
          {
            id: 1,
            description: 'Salário',
            amount: 5000.00,
            type: 'income',
            date: '2024-01-15'
          }
        ]
      };

      DashboardService.getMetrics.mockResolvedValue(mockMetrics);

      // Act
      await dashboardController.getMetrics(mockReq, mockRes);

      // Assert
      expect(DashboardService.getMetrics).toHaveBeenCalledWith('test-user-id');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockMetrics
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Database error');
      DashboardService.getMetrics.mockRejectedValue(error);

      // Act
      await dashboardController.getMetrics(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro ao obter métricas do dashboard'
      });
    });
  });

  describe('getCharts', () => {
    it('should return chart data successfully', async () => {
      // Arrange
      const mockCharts = {
        monthlyBalance: [
          { month: 'Jan', balance: 10000 },
          { month: 'Feb', balance: 12000 }
        ],
        incomeVsExpenses: [
          { month: 'Jan', income: 5000, expenses: 3000 },
          { month: 'Feb', income: 5500, expenses: 3200 }
        ],
        categoryBreakdown: [
          { category: 'Alimentação', amount: 800 },
          { category: 'Transporte', amount: 500 }
        ],
        transactionTrends: [
          { date: '2024-01-01', count: 5 },
          { date: '2024-01-02', count: 3 }
        ]
      };

      DashboardService.getCharts.mockResolvedValue(mockCharts);

      // Act
      await dashboardController.getCharts(mockReq, mockRes);

      // Assert
      expect(DashboardService.getCharts).toHaveBeenCalledWith('test-user-id');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCharts
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Chart data error');
      DashboardService.getCharts.mockRejectedValue(error);

      // Act
      await dashboardController.getCharts(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro ao obter dados dos gráficos'
      });
    });
  });

  describe('getAlerts', () => {
    it('should return alerts successfully', async () => {
      // Arrange
      const mockAlerts = {
        lowBalance: [
          {
            account_id: 1,
            account_name: 'Conta Principal',
            current_balance: 500.00,
            threshold: 1000.00
          }
        ],
        overduePayables: [
          {
            id: 1,
            description: 'Conta de luz',
            due_date: '2024-01-10',
            amount: 150.00,
            days_overdue: 5
          }
        ],
        upcomingReceivables: [
          {
            id: 1,
            description: 'Pagamento cliente',
            due_date: '2024-01-20',
            amount: 2000.00,
            days_until_due: 3
          }
        ],
        investmentAlerts: [
          {
            investment_id: 1,
            investment_name: 'CDB',
            maturity_date: '2024-01-25',
            amount: 5000.00,
            days_until_maturity: 8
          }
        ]
      };

      DashboardService.getAlerts.mockResolvedValue(mockAlerts);

      // Act
      await dashboardController.getAlerts(mockReq, mockRes);

      // Assert
      expect(DashboardService.getAlerts).toHaveBeenCalledWith('test-user-id');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAlerts
      });
    });

    it('should return empty arrays when no data exists', async () => {
      // Arrange
      const mockAlerts = {
        lowBalance: [],
        overduePayables: [],
        upcomingReceivables: [],
        investmentAlerts: []
      };

      DashboardService.getAlerts.mockResolvedValue(mockAlerts);

      // Act
      await dashboardController.getAlerts(mockReq, mockRes);

      // Assert
      expect(DashboardService.getAlerts).toHaveBeenCalledWith('test-user-id');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAlerts
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Alerts error');
      DashboardService.getAlerts.mockRejectedValue(error);

      // Act
      await dashboardController.getAlerts(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro ao obter alertas do dashboard'
      });
    });
  });
}); 