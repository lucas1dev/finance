const request = require('supertest');
const app = require('../../app');
const { User, Category, Supplier, FixedAccount, Transaction, Payable, Receivable, Payment, Account } = require('../../models');
const { generateToken } = require('../../utils/helpers');

describe('Fixed Account Integration Tests', () => {
  let authToken;
  let testUser;
  let testCategory;
  let testSupplier;
  let testFixedAccount;

  beforeAll(async () => {
    // Limpa o banco de dados de teste
    await Transaction.destroy({ where: {} });
    await FixedAccount.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await Supplier.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Cria usuário de teste
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    // Gera token de autenticação
    authToken = generateToken(testUser.id);

    // Cria categoria de teste
    testCategory = await Category.create({
      name: 'Aluguel',
      type: 'expense',
      user_id: testUser.id,
      color: '#FF0000'
    });

    // Cria fornecedor de teste
    testSupplier = await Supplier.create({
      name: 'Imobiliária ABC',
      document_type: 'CNPJ',
      document_number: '12345678000190',
      user_id: testUser.id,
      email: 'contato@imobiliaria.com'
    });
  });

  afterAll(async () => {
    // Cleanup: remove todos os dados de teste
    await Transaction.destroy({ where: {} });
    await FixedAccount.destroy({ where: {} });
    await Payable.destroy({ where: {} });
    await Receivable.destroy({ where: {} });
    await Payment.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await Supplier.destroy({ where: {} });
    await User.destroy({ where: {} });
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

      testFixedAccount = response.body.data;
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
      expect(response.body.message).toBeDefined();
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
      expect(response.body.message).toBe('Categoria não encontrada');
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
      expect(response.body.message).toBe('Conta fixa não encontrada');
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
        amount: 1600.00,
        observations: 'Aumento do aluguel'
      };

      const response = await request(app)
        .put(`/api/fixed-accounts/${testFixedAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe('1600.00');
      expect(response.body.data.observations).toBe(updateData.observations);
    });

    it('should return 404 for non-existent fixed account', async () => {
      const response = await request(app)
        .put('/api/fixed-accounts/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 1600.00 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Conta fixa não encontrada');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/fixed-accounts/${testFixedAccount.id}`)
        .send({ amount: 1600.00 });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/fixed-accounts/:id/toggle', () => {
    it('should toggle fixed account active status', async () => {
      const response = await request(app)
        .patch(`/api/fixed-accounts/${testFixedAccount.id}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ is_active: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_active).toBe(false);
    });

    it('should return 404 for non-existent fixed account', async () => {
      const response = await request(app)
        .patch('/api/fixed-accounts/999/toggle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ is_active: false });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Conta fixa não encontrada');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch(`/api/fixed-accounts/${testFixedAccount.id}/toggle`)
        .send({ is_active: true });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/fixed-accounts/:id/pay', () => {
    it('should mark fixed account as paid and create transaction', async () => {
      // Primeiro, reativa a conta fixa
      await request(app)
        .patch(`/api/fixed-accounts/${testFixedAccount.id}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ is_active: true });

      const response = await request(app)
        .post(`/api/fixed-accounts/${testFixedAccount.id}/pay`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ payment_date: '2024-01-15' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.type).toBe('expense');
      expect(response.body.data.amount).toBe('1600.00');
      expect(response.body.data.fixed_account_id).toBe(testFixedAccount.id);
      expect(response.body.message).toBe('Conta fixa paga com sucesso');
    });

    it('should return 404 for non-existent fixed account', async () => {
      const response = await request(app)
        .post('/api/fixed-accounts/999/pay')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ payment_date: '2024-01-15' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Conta fixa não encontrada');
    });

    it('should return 400 for inactive fixed account', async () => {
      // Desativa a conta fixa
      await request(app)
        .patch(`/api/fixed-accounts/${testFixedAccount.id}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ is_active: false });

      const response = await request(app)
        .post(`/api/fixed-accounts/${testFixedAccount.id}/pay`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ payment_date: '2024-01-15' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Conta fixa está inativa');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post(`/api/fixed-accounts/${testFixedAccount.id}/pay`)
        .send({ payment_date: '2024-01-15' });

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
      expect(response.body.message).toBe('Conta fixa não encontrada');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/fixed-accounts/${testFixedAccount.id}`);

      expect(response.status).toBe(401);
    });
  });
}); 