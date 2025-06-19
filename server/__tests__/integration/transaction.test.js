const request = require('supertest');
const app = require('../../app');
const { Transaction, Category, Account, User } = require('../../models');

describe('Transaction Integration Tests', () => {
  let authToken;
  let testUser;
  let testCategory;
  let testAccount;
  let testTransaction;

  beforeAll(async () => {
    // Criar usuário de teste
    testUser = await User.create({
      name: 'Test User Transaction',
      email: 'testtransaction@example.com',
      password: 'password123',
      two_factor_secret: 'test-secret'
    });

    // Criar categoria de teste
    testCategory = await Category.create({
      name: 'Test Category',
      type: 'expense',
      user_id: testUser.id
    });

    // Criar conta de teste
    testAccount = await Account.create({
      user_id: testUser.id,
      bank_name: 'Test Bank',
      account_type: 'checking',
      balance: 1000.00,
      description: 'Test account'
    });

    // Fazer login para obter token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testtransaction@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await Transaction.destroy({ where: { user_id: testUser.id } });
    await Category.destroy({ where: { user_id: testUser.id } });
    await Account.destroy({ where: { user_id: testUser.id } });
    await User.destroy({ where: { id: testUser.id } });
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
      expect(response.body.newBalance).toBeCloseTo(900.00, 2); // 1000 - 100

      testTransaction = await Transaction.findByPk(response.body.transactionId);
      expect(testTransaction.type).toBe('expense');
      expect(Number(testTransaction.amount)).toBeCloseTo(100.00, 2);
      expect(testTransaction.user_id).toBe(testUser.id);
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
      expect(response.body.newBalance).toBeCloseTo(1400.00, 1); // 900 + 500

      // Verificar se o saldo da conta foi atualizado
      const updatedAccount = await Account.findByPk(testAccount.id);
      expect(Number(updatedAccount.balance)).toBeCloseTo(1400.00, 1);
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
      const response = await request(app)
        .get(`/api/transactions/${testTransaction.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testTransaction.id);
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
      const updateData = {
        type: 'income',
        amount: 200.00,
        category_id: testCategory.id,
        description: 'Updated transaction',
        date: new Date().toISOString().split('T')[0]
      };

      const response = await request(app)
        .put(`/api/transactions/${testTransaction.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Transação atualizada com sucesso');
      expect(response.body).toHaveProperty('newBalance');

      // Verificar se foi realmente atualizada
      const updatedTransaction = await Transaction.findByPk(testTransaction.id);
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
      expect(response.body).toHaveProperty('newBalance');

      // Verificar se foi realmente deletada
      const deletedTransaction = await Transaction.findByPk(transactionToDelete.id);
      expect(deletedTransaction).toBeNull();
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
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/transactions/summary?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/transactions/balance', () => {
    it('should get balance by period', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/transactions/balance?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/transactions');

      expect(response.status).toBe(401);
    });

    it('should not allow access to other users transactions', async () => {
      // Criar outro usuário
      const otherUser = await User.create({
        name: 'Other User Transaction',
        email: 'otherusertransaction@example.com',
        password: 'password123',
        two_factor_secret: 'test-secret'
      });

      // Fazer login com outro usuário
      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'otherusertransaction@example.com',
          password: 'password123'
        });

      const otherAuthToken = otherLoginResponse.body.token;

      // Tentar acessar transação do primeiro usuário
      const response = await request(app)
        .get(`/api/transactions/${testTransaction.id}`)
        .set('Authorization', `Bearer ${otherAuthToken}`);

      expect(response.status).toBe(404);

      // Limpar
      await User.destroy({ where: { id: otherUser.id } });
    });
  });
}); 