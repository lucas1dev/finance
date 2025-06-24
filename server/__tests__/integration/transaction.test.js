const request = require('supertest');
const app = require('../../app');
const { Transaction, Category, Account, User } = require('../../models');
const { createTestUser, cleanAllTestData } = require('./setup');

describe('Transaction Integration Tests', () => {
  let authToken;
  let testUser;
  let testCategory;
  let testAccount;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    // Limpar dados relevantes
    await Transaction.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await User.destroy({ where: { email: 'testtransaction@example.com' } });

    // Criar usuário de teste via API e obter token
    authToken = await createTestUser(app, 'testtransaction@example.com', 'Test User Transaction');
    testUser = await User.findOne({ where: { email: 'testtransaction@example.com' } });

    // Criar conta de teste
    testAccount = await Account.create({
      name: 'Conta Principal',
      bank_name: 'Banco Teste',
      account_type: 'checking',
      balance: 10000,
      user_id: testUser.id
    });

    // Criar categoria de teste
    testCategory = await Category.create({
      name: 'Categoria Teste',
      type: 'expense',
      user_id: testUser.id
    });
  });

  describe('POST /api/transactions', () => {
    it('should create a new expense transaction', async () => {
      const transactionData = {
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'expense',
        amount: 100.00,
        description: 'Test expense transaction',
        date: new Date().toISOString().split('T')[0]
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Transação criada com sucesso');
      expect(response.body).toHaveProperty('transactionId');
      expect(response.body).toHaveProperty('newBalance');
      expect(response.body.newBalance).toBeCloseTo(9900.00, 2); // 10000 - 100

      const createdTransaction = await Transaction.findByPk(response.body.transactionId);
      expect(createdTransaction.type).toBe('expense');
      expect(Number(createdTransaction.amount)).toBeCloseTo(100.00, 2);
      expect(createdTransaction.user_id).toBe(testUser.id);
    });

    it('should create a new income transaction', async () => {
      const transactionData = {
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'income',
        amount: 500.00,
        description: 'Test income transaction',
        date: new Date().toISOString().split('T')[0]
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('transactionId');
      expect(response.body.newBalance).toBeCloseTo(10500.00, 1); // 10000 + 500

      // Verificar se o saldo da conta foi atualizado
      const updatedAccount = await Account.findByPk(testAccount.id);
      expect(Number(updatedAccount.balance)).toBeCloseTo(10500.00, 1);
    });

    it('should return 404 for non-existent account', async () => {
      const transactionData = {
        account_id: 99999,
        category_id: testCategory.id,
        type: 'expense',
        amount: 100.00,
        description: 'Test transaction'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Conta não encontrada');
    });
  });

  describe('GET /api/transactions', () => {
    it('should list all transactions for the user', async () => {
      // Criar transações para listar
      await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'expense',
        amount: 100.00,
        description: 'Transação 1',
        date: new Date()
      });
      await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'income',
        amount: 200.00,
        description: 'Transação 2',
        date: new Date()
      });

      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verificar se todas as transações pertencem ao usuário
      response.body.forEach(transaction => {
        expect(transaction).toHaveProperty('id');
        expect(transaction).toHaveProperty('type');
        expect(transaction).toHaveProperty('amount');
        expect(transaction).toHaveProperty('description');
        expect(transaction).toHaveProperty('date');
        expect(transaction).toHaveProperty('account');
        expect(transaction).toHaveProperty('category');
      });
    });

    it('should filter transactions by type', async () => {
      // Criar transação do tipo expense
      await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'expense',
        amount: 100.00,
        description: 'Transação expense',
        date: new Date()
      });

      const response = await request(app)
        .get('/api/transactions?type=expense')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(transaction => {
        expect(transaction.type).toBe('expense');
      });
    });

    it('should filter transactions by date range', async () => {
      // Criar transação para garantir que haja dados no range
      await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'income',
        amount: 150.00,
        description: 'Transação no range',
        date: new Date()
      });

      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/transactions?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should get a specific transaction', async () => {
      // Criar uma transação para buscar
      const transaction = await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'expense',
        amount: 100.00,
        description: 'Transação específica',
        date: new Date()
      });

      const response = await request(app)
        .get(`/api/transactions/${transaction.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', transaction.id);
      expect(response.body).toHaveProperty('type', 'expense');
      expect(Number(response.body.amount)).toBeCloseTo(100.00, 2);
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/api/transactions/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Transação não encontrada');
    });
  });

  describe('PUT /api/transactions/:id', () => {
    it('should update a transaction', async () => {
      // Criar uma transação para atualizar
      const transaction = await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'expense',
        amount: 100.00,
        description: 'Transação para atualizar',
        date: new Date()
      });

      const updateData = {
        type: 'income',
        amount: 200.00,
        category_id: testCategory.id,
        description: 'Updated transaction',
        date: new Date().toISOString().split('T')[0]
      };

      const response = await request(app)
        .put(`/api/transactions/${transaction.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Transação atualizada com sucesso');
      expect(response.body).toHaveProperty('newBalance');

      // Verificar se foi realmente atualizada
      const updatedTransaction = await Transaction.findByPk(transaction.id);
      expect(updatedTransaction.type).toBe('income');
      expect(Number(updatedTransaction.amount)).toBeCloseTo(200.00, 2);
      expect(updatedTransaction.description).toBe('Updated transaction');
    });

    it('should return 404 for non-existent transaction', async () => {
      const updateData = {
        type: 'expense',
        amount: 50.00,
        description: 'Non-existent'
      };

      const response = await request(app)
        .put('/api/transactions/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Transação não encontrada');
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete a transaction', async () => {
      // Criar uma transação para deletar
      const transactionToDelete = await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'expense',
        amount: 50.00,
        description: 'Transaction to delete',
        date: new Date()
      });

      const response = await request(app)
        .delete(`/api/transactions/${transactionToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Transação excluída com sucesso');
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .delete('/api/transactions/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Transação não encontrada');
    });
  });

  describe('GET /api/transactions/categories', () => {
    it('should get categories with transactions', async () => {
      // Criar transação para garantir categoria
      await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'expense',
        amount: 100.00,
        description: 'Transação para categoria',
        date: new Date()
      });

      const response = await request(app)
        .get('/api/transactions/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/transactions/summary', () => {
    it('should get transaction summary', async () => {
      // Criar transação para garantir dados
      await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'income',
        amount: 300.00,
        description: 'Transação para summary',
        date: new Date()
      });

      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/transactions/summary?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('income');
      expect(response.body).toHaveProperty('expense');
    });
  });

  describe('GET /api/transactions/balance', () => {
    it('should get balance by period', async () => {
      // Criar transação para garantir dados
      await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'income',
        amount: 400.00,
        description: 'Transação para balance',
        date: new Date()
      });

      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/transactions/balance?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('balance');
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/transactions');

      expect(response.status).toBe(401);
    });

    it('should not allow access to other users transactions', async () => {
      // Criar transação para o usuário principal
      const transaction = await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'expense',
        amount: 100.00,
        description: 'Transação de outro usuário',
        date: new Date()
      });

      // Criar outro usuário
      const otherAuthToken = await createTestUser(app, 'otherusertransaction@example.com', 'Other User');

      // Tentar acessar transação do primeiro usuário
      const response = await request(app)
        .get(`/api/transactions/${transaction.id}`)
        .set('Authorization', `Bearer ${otherAuthToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/transactions/stats', () => {
    it('should return transaction statistics for authenticated user', async () => {
      const response = await request(app)
        .get('/api/transactions/stats')
        .set('Authorization', `Bearer ${authToken}`);

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
          .set('Authorization', `Bearer ${authToken}`);

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
        .set('Authorization', `Bearer ${authToken}`);

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
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const { trends } = response.body;
      
      expect(typeof trends.incomeChange).toBe('number');
      expect(typeof trends.expensesChange).toBe('number');
      expect(typeof trends.netChange).toBe('number');
    });

    it('should return correct categories structure', async () => {
      const response = await request(app)
        .get('/api/transactions/stats')
        .set('Authorization', `Bearer ${authToken}`);

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
        .set('Authorization', `Bearer ${authToken}`);

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
        .set('Authorization', `Bearer ${authToken}`);

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
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('income');
      expect(response.body).toHaveProperty('expenses');
      expect(Array.isArray(response.body.income)).toBe(true);
      expect(Array.isArray(response.body.expenses)).toBe(true);
    });

    it('should return trend chart data', async () => {
      const response = await request(app)
        .get('/api/transactions/charts?type=trend&period=month')
        .set('Authorization', `Bearer ${authToken}`);

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
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('timeline');
      }
    });
  });
}); 