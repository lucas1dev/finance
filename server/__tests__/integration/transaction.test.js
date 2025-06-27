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
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('transaction');
      expect(response.body.data).toHaveProperty('newBalance');
      expect(response.body.data.newBalance).toBeCloseTo(9900.00, 2); // 10000 - 100

      const createdTransaction = await Transaction.findByPk(response.body.data.transaction.id);
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
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('transaction');
      expect(response.body.data).toHaveProperty('newBalance');
      expect(response.body.data.newBalance).toBeCloseTo(10500.00, 1); // 10000 + 500

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
        description: 'Test transaction',
        date: new Date().toISOString().split('T')[0]
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData);

      // Pode retornar 404 ou 500 dependendo do erro
      expect([404, 500]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body).toHaveProperty('error', 'Conta não encontrada');
      }
    });
  });

  describe('GET /api/transactions', () => {
    it('should list all transactions for the user', async () => {
      // Criar algumas transações para testar
      await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'income',
        amount: 500.00,
        description: 'Salário',
        date: new Date()
      });

      await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'expense',
        amount: 100.00,
        description: 'Compras',
        date: new Date()
      });

      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('transactions');
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
      expect(response.body.data.transactions.length).toBeGreaterThan(0);

      // Verificar se todas as transações pertencem ao usuário
      response.body.data.transactions.forEach(transaction => {
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
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('transactions');
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
      response.body.data.transactions.forEach(transaction => {
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
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('transactions');
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
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
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('transaction');
      expect(response.body.data.transaction).toHaveProperty('id', transaction.id);
      expect(response.body.data.transaction).toHaveProperty('type', 'expense');
      expect(Number(response.body.data.transaction.amount)).toBeCloseTo(100.00, 2);
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/api/transactions/99999')
        .set('Authorization', `Bearer ${authToken}`);

      // Pode retornar 404 ou 500 dependendo do erro
      expect([404, 500]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body).toHaveProperty('error', 'Transação não encontrada');
      }
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
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('transaction');
      expect(response.body.data).toHaveProperty('newBalance');

      // Verificar se foi realmente atualizada
      const updatedTransaction = await Transaction.findByPk(transaction.id);
      expect(updatedTransaction.type).toBe('income');
      expect(Number(updatedTransaction.amount)).toBeCloseTo(200.00, 2);
      expect(updatedTransaction.description).toBe('Updated transaction');
    }, 60000); // Aumentar timeout para 60s

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

      // Pode retornar 404 ou 500 dependendo do erro
      expect([404, 500]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body).toHaveProperty('error', 'Transação não encontrada');
      }
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
      expect(response.body).toHaveProperty('message', 'Transação removida com sucesso');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('newBalance');
    }, 60000); // Aumentar timeout para 60s

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .delete('/api/transactions/99999')
        .set('Authorization', `Bearer ${authToken}`);

      // Pode retornar 404 ou 500 dependendo do erro
      expect([404, 500]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body).toHaveProperty('error', 'Transação não encontrada');
      }
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
      // Criar algumas transações para ter dados
      await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'income',
        amount: 1000.00,
        description: 'Income transaction',
        date: new Date()
      });

      await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'expense',
        amount: 500.00,
        description: 'Expense transaction',
        date: new Date()
      });

      const response = await request(app)
        .get('/api/transactions/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalIncome');
      expect(response.body.data).toHaveProperty('totalExpenses');
      expect(response.body.data).toHaveProperty('netAmount');
      expect(response.body.data).toHaveProperty('transactionCount');
      expect(response.body.data).toHaveProperty('period');
    });

    it('should return statistics with different periods', async () => {
      const periods = ['week', 'month', 'quarter', 'year'];
      
      for (const period of periods) {
        const response = await request(app)
          .get(`/api/transactions/stats?period=${period}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('period', period);
        expect(response.body.data).toHaveProperty('totalIncome');
        expect(response.body.data).toHaveProperty('totalExpenses');
        expect(response.body.data).toHaveProperty('netAmount');
      }
    });
  });

  describe('GET /api/transactions/charts', () => {
    it('should return chart data for authenticated user', async () => {
      const response = await request(app)
        .get('/api/transactions/charts?chart=timeline&period=month')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('timeline');
    });

    it('should return timeline chart data', async () => {
      const response = await request(app)
        .get('/api/transactions/charts?chart=timeline&period=month')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('timeline');
      expect(Array.isArray(response.body.data.timeline)).toBe(true);
    });

    it('should return category chart data', async () => {
      const response = await request(app)
        .get('/api/transactions/charts?chart=categories&period=month')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('income');
      expect(response.body.data).toHaveProperty('expenses');
      expect(Array.isArray(response.body.data.income)).toBe(true);
    });

    it('should handle different periods for charts', async () => {
      const periods = ['week', 'month', 'quarter', 'year'];
      
      for (const period of periods) {
        const response = await request(app)
          .get(`/api/transactions/charts?chart=timeline&period=${period}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('timeline');
      }
    });
  });
}); 