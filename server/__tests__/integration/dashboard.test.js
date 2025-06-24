process.env.JWT_SECRET = 'testsecret';

const request = require('supertest');
const app = require('../../app');
const { User, Transaction, Account, Category, FixedAccount, Notification } = require('../../models');
const { generateToken } = require('../../utils/helpers');

describe('Dashboard Integration Tests', () => {
  let token;
  let testUser;
  let testAccount;
  let testCategory;

  beforeAll(async () => {
    // Criar usuário de teste
    testUser = await User.create({
      name: 'Test Dashboard User',
      email: 'dashboard@test.com',
      password: 'password123',
      role: 'user'
    });

    token = generateToken(testUser.id);

    // Criar conta de teste
    testAccount = await Account.create({
      name: 'Conta Teste',
      bank_name: 'Banco Teste',
      account_type: 'checking',
      balance: 10000,
      user_id: testUser.id
    });

    // Criar categoria de teste
    testCategory = await Category.create({
      name: 'Alimentação',
      type: 'expense',
      color: '#ff0000',
      user_id: testUser.id
    });

    // Criar transações de teste
    await Transaction.create({
      description: 'Salário',
      amount: 5000,
      type: 'income',
      date: new Date(),
      account_id: testAccount.id,
      category_id: testCategory.id,
      user_id: testUser.id
    });

    await Transaction.create({
      description: 'Supermercado',
      amount: 3000,
      type: 'expense',
      date: new Date(),
      account_id: testAccount.id,
      category_id: testCategory.id,
      user_id: testUser.id
    });

    // Criar conta fixa vencida
    await FixedAccount.create({
      description: 'Conta Vencida',
      amount: 500,
      next_due_date: new Date(Date.now() - 86400000), // 1 dia atrás
      periodicity: 'monthly',
      user_id: testUser.id,
      is_paid: false,
      start_date: new Date(Date.now() - 30 * 86400000),
      category_id: testCategory.id
    });

    // Criar notificação não lida
    await Notification.create({
      user_id: testUser.id,
      title: 'Alerta de Teste',
      message: 'Conta vencida',
      type: 'payment_overdue',
      is_read: false
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await Transaction.destroy({ where: { user_id: testUser.id } });
    await FixedAccount.destroy({ where: { user_id: testUser.id } });
    await Notification.destroy({ where: { user_id: testUser.id } });
    await Account.destroy({ where: { user_id: testUser.id } });
    await Category.destroy({ where: { user_id: testUser.id } });
    await User.destroy({ where: { id: testUser.id } });
  });

  describe('GET /api/dashboard/metrics', () => {
    it('should return dashboard metrics successfully', async () => {
      const response = await request(app)
        .get('/api/dashboard/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalBalance');
      expect(response.body.data).toHaveProperty('monthlyIncome');
      expect(response.body.data).toHaveProperty('monthlyExpenses');
      expect(response.body.data).toHaveProperty('monthlyNet');
      expect(response.body.data).toHaveProperty('incomeVariation');
      expect(response.body.data).toHaveProperty('expensesVariation');
      expect(response.body.data).toHaveProperty('topExpenseCategories');
      expect(response.body.data).toHaveProperty('overdueAccounts');
      expect(response.body.data).toHaveProperty('overdueAmount');
      expect(response.body.data).toHaveProperty('projectedBalance');
      expect(response.body.data).toHaveProperty('accountsCount');
      expect(response.body.data).toHaveProperty('lastUpdated');

      // Verificar valores específicos
      expect(response.body.data.totalBalance).toBeCloseTo(10000, 1);
      expect(response.body.data.monthlyIncome).toBe(5000);
      expect(response.body.data.monthlyExpenses).toBe(3000);
      expect(response.body.data.monthlyNet).toBe(2000);
      expect(response.body.data.overdueAccounts).toBe(1);
      expect(response.body.data.overdueAmount).toBe(500);
      expect(response.body.data.accountsCount).toBe(1);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/dashboard/metrics');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/charts', () => {
    it('should return chart data successfully', async () => {
      const response = await request(app)
        .get('/api/dashboard/charts')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('balanceEvolution');
      expect(response.body.data).toHaveProperty('categoryDistribution');
      expect(response.body.data).toHaveProperty('monthlyComparison');
      expect(response.body.data).toHaveProperty('cashFlowProjection');
      expect(response.body.data).toHaveProperty('lastUpdated');

      // Verificar estrutura dos dados
      expect(Array.isArray(response.body.data.balanceEvolution)).toBe(true);
      expect(Array.isArray(response.body.data.categoryDistribution)).toBe(true);
      expect(response.body.data.monthlyComparison).toHaveProperty('current');
      expect(response.body.data.monthlyComparison).toHaveProperty('previous');
      expect(Array.isArray(response.body.data.cashFlowProjection)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/dashboard/charts');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/alerts', () => {
    it('should return alerts successfully', async () => {
      const response = await request(app)
        .get('/api/dashboard/alerts')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('overdueAccounts');
      expect(response.body.data).toHaveProperty('lowBalance');
      expect(response.body.data).toHaveProperty('upcomingPayments');
      expect(response.body.data).toHaveProperty('unreadNotifications');
      expect(response.body.data).toHaveProperty('unmetGoals');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('lastUpdated');

      // Verificar dados específicos
      expect(Array.isArray(response.body.data.overdueAccounts)).toBe(true);
      expect(response.body.data.overdueAccounts.length).toBe(1);
      expect(response.body.data.overdueAccounts[0].name).toBe('Conta Vencida');
      expect(response.body.data.overdueAccounts[0].amount).toBe(500);

      expect(Array.isArray(response.body.data.unreadNotifications)).toBe(true);
      expect(response.body.data.unreadNotifications.length).toBe(1);
      expect(response.body.data.unreadNotifications[0].title).toBe('Alerta de Teste');

      expect(response.body.data.summary).toHaveProperty('totalOverdue');
      expect(response.body.data.summary).toHaveProperty('totalUnread');
      expect(response.body.data.summary.totalOverdue).toBe(1);
      expect(response.body.data.summary.totalUnread).toBe(1);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/dashboard/alerts');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/dashboard', () => {
    it('should return all dashboard data for authenticated user', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('metrics');
      expect(response.body.data).toHaveProperty('charts');
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('lastUpdated');
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app).get('/api/dashboard');
      expect(response.status).toBe(401);
    });

    it('should return metrics data in correct format', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const { metrics } = response.body.data;
      
      expect(metrics).toHaveProperty('totalBalance');
      expect(metrics).toHaveProperty('monthlyIncome');
      expect(metrics).toHaveProperty('monthlyExpenses');
      expect(metrics).toHaveProperty('monthlyNet');
      expect(metrics).toHaveProperty('incomeVariation');
      expect(metrics).toHaveProperty('expensesVariation');
      expect(metrics).toHaveProperty('topExpenseCategories');
      expect(metrics).toHaveProperty('overdueAccounts');
      expect(metrics).toHaveProperty('overdueAmount');
      expect(metrics).toHaveProperty('projectedBalance');
      expect(metrics).toHaveProperty('accountsCount');
      
      expect(typeof metrics.totalBalance).toBe('number');
      expect(typeof metrics.monthlyIncome).toBe('number');
      expect(typeof metrics.monthlyExpenses).toBe('number');
      expect(Array.isArray(metrics.topExpenseCategories)).toBe(true);
    });

    it('should return charts data in correct format', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const { charts } = response.body.data;
      
      expect(charts).toHaveProperty('balanceEvolution');
      expect(charts).toHaveProperty('categoryDistribution');
      
      expect(Array.isArray(charts.balanceEvolution)).toBe(true);
      expect(Array.isArray(charts.categoryDistribution)).toBe(true);
      
      if (charts.balanceEvolution.length > 0) {
        expect(charts.balanceEvolution[0]).toHaveProperty('month');
        expect(charts.balanceEvolution[0]).toHaveProperty('income');
        expect(charts.balanceEvolution[0]).toHaveProperty('expenses');
        expect(charts.balanceEvolution[0]).toHaveProperty('net');
      }
    });

    it('should return alerts data in correct format', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const { alerts } = response.body.data;
      
      expect(alerts).toHaveProperty('overdueAccounts');
      expect(alerts).toHaveProperty('upcomingAccounts');
      expect(alerts).toHaveProperty('unreadNotifications');
      expect(alerts).toHaveProperty('lowBalanceAccounts');
      expect(alerts).toHaveProperty('summary');
      
      expect(Array.isArray(alerts.overdueAccounts)).toBe(true);
      expect(Array.isArray(alerts.upcomingAccounts)).toBe(true);
      expect(Array.isArray(alerts.unreadNotifications)).toBe(true);
      expect(Array.isArray(alerts.lowBalanceAccounts)).toBe(true);
      
      expect(alerts.summary).toHaveProperty('totalOverdue');
      expect(alerts.summary).toHaveProperty('totalUpcoming');
      expect(alerts.summary).toHaveProperty('totalUnread');
      expect(alerts.summary).toHaveProperty('totalLowBalance');
    });
  });
}); 