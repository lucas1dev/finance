const request = require('supertest');
const app = require('../../app');
const { User, Transaction, Category, Account } = require('../../models');

describe('Transaction Statistics and Charts Integration Tests', () => {
  let testUser, token, testCategory, testAccount;

  beforeAll(async () => {
    // Criar usuário de teste
    testUser = await User.create({
      name: 'Test User',
      email: `test${Date.now()}@test.com`,
      password: 'password123',
      role: 'user'
    });

    // Fazer login para obter token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'password123'
      });

    token = loginResponse.body.token;

    // Criar categoria de teste
    testCategory = await Category.create({
      name: 'Test Category',
      type: 'expense',
      color: '#FF0000',
      user_id: testUser.id
    });

    // Criar conta de teste
    testAccount = await Account.create({
      name: 'Test Account',
      bank_name: 'Test Bank',
      account_type: 'checking',
      balance: 1000.00,
      user_id: testUser.id
    });

    // Criar algumas transações de teste
    await Transaction.create({
      description: 'Test Transaction 1',
      amount: 100.00,
      type: 'income',
      date: new Date(),
      category_id: testCategory.id,
      account_id: testAccount.id,
      user_id: testUser.id
    });

    await Transaction.create({
      description: 'Test Transaction 2',
      amount: 50.00,
      type: 'expense',
      date: new Date(),
      category_id: testCategory.id,
      account_id: testAccount.id,
      user_id: testUser.id
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await Transaction.destroy({ where: { user_id: testUser.id } });
    await Category.destroy({ where: { user_id: testUser.id } });
    await Account.destroy({ where: { user_id: testUser.id } });
    await User.destroy({ where: { id: testUser.id } });
  });

  describe('GET /api/transactions/stats', () => {
    it('should return transaction statistics for authenticated user', async () => {
      const response = await request(app)
        .get('/api/transactions/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('trends');
      expect(response.body).toHaveProperty('categories');
      expect(response.body).toHaveProperty('distribution');
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app).get('/api/transactions/stats');
      expect(response.status).toBe(401);
    });

    it('should return statistics with different periods', async () => {
      const periods = ['week', 'month', 'quarter', 'year'];
      
      for (const period of periods) {
        const response = await request(app)
          .get(`/api/transactions/stats?period=${period}`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.period).toBe(period);
        expect(response.body.summary).toHaveProperty('totalTransactions');
        expect(response.body.summary).toHaveProperty('totalIncome');
        expect(response.body.summary).toHaveProperty('totalExpenses');
        expect(response.body.summary).toHaveProperty('netAmount');
      }
    });

    it('should return correct summary structure', async () => {
      const response = await request(app)
        .get('/api/transactions/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const { summary } = response.body;
      
      expect(typeof summary.totalTransactions).toBe('number');
      expect(typeof summary.totalIncome).toBe('number');
      expect(typeof summary.totalExpenses).toBe('number');
      expect(typeof summary.netAmount).toBe('number');
      expect(typeof summary.averageTransaction).toBe('number');
    });

    it('should return correct trends structure', async () => {
      const response = await request(app)
        .get('/api/transactions/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const { trends } = response.body;
      
      expect(typeof trends.incomeChange).toBe('number');
      expect(typeof trends.expensesChange).toBe('number');
      expect(typeof trends.netChange).toBe('number');
    });

    it('should return correct categories structure', async () => {
      const response = await request(app)
        .get('/api/transactions/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const { categories } = response.body;
      
      expect(Array.isArray(categories.all)).toBe(true);
      expect(Array.isArray(categories.topIncome)).toBe(true);
      expect(Array.isArray(categories.topExpenses)).toBe(true);
    });
  });

  describe('GET /api/transactions/charts', () => {
    it('should return chart data for authenticated user', async () => {
      const response = await request(app)
        .get('/api/transactions/charts')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('timeline');
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app).get('/api/transactions/charts');
      expect(response.status).toBe(401);
    });

    it('should return timeline chart data', async () => {
      const response = await request(app)
        .get('/api/transactions/charts?type=timeline&period=month')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('timeline');
      expect(Array.isArray(response.body.timeline)).toBe(true);
      
      if (response.body.timeline.length > 0) {
        expect(response.body.timeline[0]).toHaveProperty('label');
        expect(response.body.timeline[0]).toHaveProperty('date');
        expect(response.body.timeline[0]).toHaveProperty('income');
        expect(response.body.timeline[0]).toHaveProperty('expenses');
        expect(response.body.timeline[0]).toHaveProperty('net');
        expect(response.body.timeline[0]).toHaveProperty('count');
      }
    });

    it('should return category chart data', async () => {
      const response = await request(app)
        .get('/api/transactions/charts?type=category&period=month')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('income');
      expect(response.body).toHaveProperty('expenses');
      expect(Array.isArray(response.body.income)).toBe(true);
      expect(Array.isArray(response.body.expenses)).toBe(true);
    });

    it('should return trend chart data', async () => {
      const response = await request(app)
        .get('/api/transactions/charts?type=trend&period=month')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('trend');
      expect(Array.isArray(response.body.trend)).toBe(true);
      
      if (response.body.trend.length > 0) {
        expect(response.body.trend[0]).toHaveProperty('label');
        expect(response.body.trend[0]).toHaveProperty('date');
        expect(response.body.trend[0]).toHaveProperty('total');
        expect(response.body.trend[0]).toHaveProperty('count');
        expect(response.body.trend[0]).toHaveProperty('average');
      }
    });

    it('should handle different periods for charts', async () => {
      const periods = ['week', 'month', 'quarter', 'year'];
      
      for (const period of periods) {
        const response = await request(app)
          .get(`/api/transactions/charts?period=${period}`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('timeline');
      }
    });
  });
}); 