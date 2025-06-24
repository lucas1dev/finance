const dashboardController = require('../../controllers/dashboardController');
const { User, Transaction, Account, Category, FixedAccount, Notification, InvestmentGoal } = require('../../models');

// Mock dos modelos
jest.mock('../../models', () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn()
  },
  Transaction: {
    findAll: jest.fn()
  },
  Account: {
    findAll: jest.fn()
  },
  Category: {
    findAll: jest.fn()
  },
  FixedAccount: {
    findAll: jest.fn()
  },
  Notification: {
    findAll: jest.fn()
  },
  InvestmentGoal: {
    findAll: jest.fn()
  }
}));

describe('DashboardController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup do request mock
    mockReq = {
      userId: 'test-user-id'
    };

    // Setup do response mock
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getMetrics', () => {
    it('should return dashboard metrics successfully', async () => {
      // Mock dos dados
      const mockAccounts = [
        { id: 1, description: 'Conta Principal', balance: '10000' },
        { id: 2, description: 'Conta Secundária', balance: '5000' }
      ];

      const mockTransactions = [
        { id: 1, type: 'income', amount: '5000', date: new Date(), category: { name: 'Salário', type: 'income' } },
        { id: 2, type: 'expense', amount: '3000', date: new Date(), category: { name: 'Alimentação', type: 'expense' } }
      ];

      const mockPreviousTransactions = [
        { id: 3, type: 'income', amount: '4500', date: new Date() },
        { id: 4, type: 'expense', amount: '2800', date: new Date() }
      ];

      const mockOverdueAccounts = [
        { id: 1, description: 'Conta Vencida', amount: '500', next_due_date: new Date(Date.now() - 86400000) }
      ];

      // Setup dos mocks
      Account.findAll.mockResolvedValue(mockAccounts);
      Transaction.findAll
        .mockResolvedValueOnce(mockTransactions) // mês atual
        .mockResolvedValueOnce(mockPreviousTransactions) // mês anterior
        .mockResolvedValueOnce([]); // 3 meses atrás
      FixedAccount.findAll.mockResolvedValue(mockOverdueAccounts);

      await dashboardController.getMetrics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalBalance: expect.any(Number),
            monthlyIncome: expect.any(Number),
            monthlyExpenses: expect.any(Number),
            monthlyNet: expect.any(Number),
            incomeVariation: expect.any(Number),
            expensesVariation: expect.any(Number),
            topExpenseCategories: expect.any(Array),
            overdueAccounts: expect.any(Number),
            overdueAmount: expect.any(Number),
            projectedBalance: expect.any(Number),
            accountsCount: expect.any(Number),
            lastUpdated: expect.any(String)
          }),
          message: expect.any(String)
        })
      );
    });
  });

  describe('getCharts', () => {
    it('should return chart data successfully', async () => {
      // Mock dos dados
      const mockTransactions = [
        { id: 1, type: 'income', amount: '5000', date: new Date(), category: { name: 'Salário', type: 'income', color: '#00ff00' } },
        { id: 2, type: 'expense', amount: '3000', date: new Date(), category: { name: 'Alimentação', type: 'expense', color: '#ff0000' } }
      ];

      const mockPreviousTransactions = [
        { id: 3, type: 'income', amount: '4500', date: new Date() },
        { id: 4, type: 'expense', amount: '2800', date: new Date() }
      ];

      // Setup dos mocks
      Transaction.findAll
        .mockResolvedValueOnce(mockTransactions) // mês atual
        .mockResolvedValueOnce(mockPreviousTransactions) // mês anterior
        .mockResolvedValueOnce([]); // 12 meses de evolução

      await dashboardController.getCharts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            balanceEvolution: expect.any(Array),
            categoryDistribution: expect.any(Array),
            monthlyComparison: expect.objectContaining({
              current: expect.any(Object),
              previous: expect.any(Object)
            }),
            cashFlowProjection: expect.any(Array),
            lastUpdated: expect.any(String)
          }),
          message: expect.any(String)
        })
      );
    });
  });

  describe('getAlerts', () => {
    it('should return alerts successfully', async () => {
      // Mock dos dados
      const mockAccounts = [
        { id: 1, description: 'Conta Principal', balance: '1000' },
        { id: 2, description: 'Conta Secundária', balance: '5000' }
      ];

      const mockOverdueAccounts = [
        { id: 1, description: 'Conta Vencida', amount: '500', next_due_date: new Date(Date.now() - 86400000) }
      ];

      const mockUpcomingPayments = [
        { id: 2, description: 'Conta Próxima', amount: '300', next_due_date: new Date(Date.now() + 86400000) }
      ];

      const mockNotifications = [
        { id: 1, title: 'Alerta', message: 'Conta vencida', type: 'payment_overdue', createdAt: new Date() }
      ];

      const mockInvestmentGoals = [
        {
          id: 1,
          title: 'Meta de Investimento',
          target_amount: 10000,
          current_amount: 3000
        }
      ];

      // Setup dos mocks
      Account.findAll.mockResolvedValue(mockAccounts);
      FixedAccount.findAll
        .mockResolvedValueOnce(mockOverdueAccounts) // contas vencidas
        .mockResolvedValueOnce(mockUpcomingPayments); // pagamentos próximos
      Notification.findAll.mockResolvedValue(mockNotifications);
      InvestmentGoal.findAll.mockResolvedValue(mockInvestmentGoals);

      await dashboardController.getAlerts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            overdueAccounts: expect.any(Array),
            lowBalance: expect.any(Array),
            upcomingPayments: expect.any(Array),
            unreadNotifications: expect.any(Array),
            unmetGoals: expect.any(Array),
            summary: expect.objectContaining({
              totalOverdue: expect.any(Number),
              totalLowBalance: expect.any(Number),
              totalUpcoming: expect.any(Number),
              totalUnread: expect.any(Number),
              totalUnmetGoals: expect.any(Number)
            }),
            lastUpdated: expect.any(String)
          }),
          message: expect.any(String)
        })
      );
    });

    it('should return empty arrays when no data exists', async () => {
      // Setup dos mocks para retornar arrays vazios
      Account.findAll.mockResolvedValue([]);
      FixedAccount.findAll.mockResolvedValue([]);
      Notification.findAll.mockResolvedValue([]);
      InvestmentGoal.findAll.mockResolvedValue([]);

      await dashboardController.getAlerts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            overdueAccounts: [],
            lowBalance: [],
            upcomingPayments: [],
            unreadNotifications: [],
            unmetGoals: [],
            summary: expect.objectContaining({
              totalOverdue: 0,
              totalLowBalance: 0,
              totalUpcoming: 0,
              totalUnread: 0,
              totalUnmetGoals: 0
            })
          })
        })
      );
    });
  });
}); 