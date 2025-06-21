const request = require('supertest');
const app = require('../../app');
const { 
  createTestUser, 
  createTestCategory, 
  createTestSupplier, 
  createTestFixedAccount,
  generateAuthToken,
  createTestAccount 
} = require('./factories');
const { cleanAllTestData } = require('./setup');

describe('Fixed Account Integration Tests', () => {
  let authToken;
  let testUser;
  let testCategory;
  let testSupplier;
  let testFixedAccount;
  let testAccount;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    // Limpeza completa de dados
    await cleanAllTestData();

    // Criar dados obrigatórios
    testUser = await createTestUser({ email: 'testfixedaccount@example.com', name: 'Test User Fixed Account' });
    testCategory = await createTestCategory({ user_id: testUser.id });
    testSupplier = await createTestSupplier({ user_id: testUser.id });
    testAccount = await createTestAccount({ user_id: testUser.id });
    authToken = generateAuthToken(testUser);

    // Criar conta fixa de teste para cada teste
    testFixedAccount = await createTestFixedAccount({
      user_id: testUser.id,
      category_id: testCategory.id,
      supplier_id: testSupplier.id,
    });
  });

  describe('POST /api/fixed-accounts', () => {
    it('should create a new fixed account with valid data', async () => {
      const fixedAccountData = {
        description: 'Aluguel do apartamento',
        amount: 1500.00,
        periodicity: 'monthly',
        start_date: '2024-01-01',
        category_id: testCategory.id,
        supplier_id: testSupplier.id,
        payment_method: 'boleto',
        observations: 'Aluguel do apartamento no centro',
        reminder_days: 3
      };

      const response = await request(app)
        .post('/api/fixed-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(fixedAccountData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.description).toBe(fixedAccountData.description);
      expect(response.body.data.amount).toBe('1500.00');
      expect(response.body.data.periodicity).toBe('monthly');
      expect(response.body.data.is_active).toBe(true);
      expect(response.body.data.category).toBeDefined();
      expect(response.body.data.supplier).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        description: '',
        amount: -100,
        periodicity: 'invalid',
        start_date: 'invalid-date',
        category_id: 'not-a-number'
      };

      const response = await request(app)
        .post('/api/fixed-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for non-existent category', async () => {
      const data = {
        description: 'Test',
        amount: 100,
        periodicity: 'monthly',
        start_date: '2024-01-01',
        category_id: 999 // Categoria inexistente
      };

      const response = await request(app)
        .post('/api/fixed-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(data);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Categoria não encontrada');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/fixed-accounts')
        .send({ description: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/fixed-accounts', () => {
    it('should return all fixed accounts for authenticated user', async () => {
      const response = await request(app)
        .get('/api/fixed-accounts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('category');
      expect(response.body.data[0]).toHaveProperty('supplier');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/fixed-accounts');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/fixed-accounts/:id', () => {
    it('should return a specific fixed account', async () => {
      const response = await request(app)
        .get(`/api/fixed-accounts/${testFixedAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testFixedAccount.id);
      expect(response.body.data.description).toBe(testFixedAccount.description);
    });

    it('should return 404 for non-existent fixed account', async () => {
      const response = await request(app)
        .get('/api/fixed-accounts/999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Conta fixa não encontrada');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/fixed-accounts/${testFixedAccount.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/fixed-accounts/:id', () => {
    it('should update a fixed account', async () => {
      const updateData = {
        description: 'Aluguel atualizado',
        amount: 1600.00,
        observations: 'Aluguel com reajuste'
      };

      const response = await request(app)
        .put(`/api/fixed-accounts/${testFixedAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.amount).toBe('1600.00');
    });

    it('should return 404 for non-existent fixed account', async () => {
      const response = await request(app)
        .put('/api/fixed-accounts/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Conta fixa não encontrada');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/fixed-accounts/${testFixedAccount.id}`)
        .send({ description: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/fixed-accounts/:id/toggle', () => {
    it('should toggle fixed account active status', async () => {
      const response = await request(app)
        .patch(`/api/fixed-accounts/${testFixedAccount.id}/toggle`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const { FixedAccount } = require('../../models');
      const updated = await FixedAccount.findByPk(testFixedAccount.id);
      expect(response.body.data.is_active).toBe(updated.is_active);
      expect(updated.is_active).toBe(!testFixedAccount.is_active);
    });

    it('should return 404 for non-existent fixed account', async () => {
      const response = await request(app)
        .patch('/api/fixed-accounts/999/toggle')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Conta fixa não encontrada');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch(`/api/fixed-accounts/${testFixedAccount.id}/toggle`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/fixed-accounts/:id/pay', () => {
    it('should mark fixed account as paid and create transaction', async () => {
      const response = await request(app)
        .post(`/api/fixed-accounts/${testFixedAccount.id}/pay`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      const { FixedAccount } = require('../../models');
      const updated = await FixedAccount.findByPk(testFixedAccount.id);
      expect(updated.is_paid).toBe(true);
      expect(response.body.transaction).toBeDefined();
    });

    it('should return 404 for non-existent fixed account', async () => {
      const response = await request(app)
        .post('/api/fixed-accounts/999/pay')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Conta fixa não encontrada');
    });

    it('should return 400 for inactive fixed account', async () => {
      // Desativar a conta fixa primeiro
      await testFixedAccount.update({ is_active: false });

      const response = await request(app)
        .post(`/api/fixed-accounts/${testFixedAccount.id}/pay`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Conta fixa está inativa');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post(`/api/fixed-accounts/${testFixedAccount.id}/pay`);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/fixed-accounts/:id', () => {
    it('should delete a fixed account', async () => {
      const response = await request(app)
        .delete(`/api/fixed-accounts/${testFixedAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Conta fixa removida com sucesso');
    });

    it('should return 404 for non-existent fixed account', async () => {
      const response = await request(app)
        .delete('/api/fixed-accounts/999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Conta fixa não encontrada');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/fixed-accounts/${testFixedAccount.id}`);

      expect(response.status).toBe(401);
    });
  });
}); 