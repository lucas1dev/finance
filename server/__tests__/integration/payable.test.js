const app = require('../../app');
const { createTestUser } = require('./setup');
const request = require('supertest');
const { sequelize } = require('../../models');
const { Payable, User, Customer, CustomerType, Category, Account, Payment } = require('../../models');
const { Op } = require('sequelize');

describe('Payable Integration Tests', () => {
  let testUser;
  let testSupplier;
  let testCategory;
  let testAccount;
  let authToken;

  beforeAll(async () => {
    // Criar usuário de teste
    testUser = await User.create({
      name: 'Test User Payable',
      email: `testpayable+${Date.now()}@example.com`,
      password: 'password123',
      two_factor_secret: 'test-secret'
    });

    // Criar fornecedor de teste
    testSupplier = await Customer.create({
      name: 'Fornecedor Payable',
      document_type: 'CNPJ',
      document_number: '12345678000195',
      email: 'fornecedor.payable@teste.com',
      user_id: testUser.id
    });

    // Associar tipo ao fornecedor
    await CustomerType.create({
      customer_id: testSupplier.id,
      type: 'supplier'
    });

    // Criar categoria de teste
    testCategory = await Category.create({
      user_id: testUser.id,
      name: 'Fornecedores',
      type: 'expense',
      color: '#F44336'
    });

    // Criar conta de teste
    testAccount = await Account.create({
      user_id: testUser.id,
      bank_name: 'Test Bank',
      account_type: 'checking',
      balance: 2000.00,
      description: 'Test account for payables'
    });

    // Fazer login para obter token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // A limpeza será feita pelo setup global
  });

  describe('POST /api/payables', () => {
    it('deve criar uma nova conta a pagar com sucesso', async () => {
      const payableData = {
        customer_id: testSupplier.id,
        category_id: testCategory.id,
        description: 'Compra de produtos',
        amount: 800.00,
        due_date: '2024-04-01',
        notes: 'Compra para fornecedor teste'
      };

      const response = await request(app)
        .post('/api/payables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payableData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBe('Compra de produtos');
      expect(Number(response.body.amount)).toBeCloseTo(800.00, 1);
      expect(response.body.customer_id).toBe(testSupplier.id);
      expect(response.body.category_id).toBe(testCategory.id);
      expect(response.body.status).toBe('pending');
    });

    it('deve criar uma conta a pagar sem categoria', async () => {
      const payableData = {
        customer_id: testSupplier.id,
        description: 'Compra sem categoria',
        amount: 400.00,
        due_date: '2024-04-15'
      };

      const response = await request(app)
        .post('/api/payables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payableData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.category_id).toBeNull();
    });

    it('deve retornar erro ao tentar criar conta a pagar sem autenticação', async () => {
      const payableData = {
        customer_id: testSupplier.id,
        description: 'Compra sem auth',
        amount: 800.00,
        due_date: '2024-04-01'
      };

      const response = await request(app)
        .post('/api/payables')
        .send(payableData);

      expect(response.status).toBe(401);
    });

    it('deve retornar erro para categoria inexistente', async () => {
      const payableData = {
        customer_id: testSupplier.id,
        category_id: 99999, // Categoria inexistente
        description: 'Compra com categoria inválida',
        amount: 800.00,
        due_date: '2024-04-01'
      };

      const response = await request(app)
        .post('/api/payables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payableData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/payables', () => {
    it('deve listar todas as contas a pagar', async () => {
      const response = await request(app)
        .get('/api/payables')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Verificar se tem remaining_amount
      const payable = response.body[0];
      expect(payable).toHaveProperty('remaining_amount');
      expect(payable).toHaveProperty('category');
    });

    it('deve filtrar contas a pagar por status', async () => {
      const response = await request(app)
        .get('/api/payables?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Verificar se todas são pending
      response.body.forEach(payable => {
        expect(payable.status).toBe('pending');
      });
    });
  });

  describe('GET /api/payables/:id', () => {
    it('deve retornar uma conta a pagar específica', async () => {
      // Primeiro criar uma conta a pagar
      const payableData = {
        customer_id: testSupplier.id,
        category_id: testCategory.id,
        description: 'Compra específica',
        amount: 600.00,
        due_date: '2024-04-10'
      };

      const createResponse = await request(app)
        .post('/api/payables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payableData);

      const payableId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/payables/${payableId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(payableId);
      expect(response.body).toHaveProperty('remaining_amount');
      expect(response.body).toHaveProperty('category');
      expect(response.body.category.id).toBe(testCategory.id);
    });

    it('deve retornar 404 para conta a pagar inexistente', async () => {
      const response = await request(app)
        .get('/api/payables/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/payables/:id', () => {
    it('deve atualizar uma conta a pagar', async () => {
      // Primeiro criar uma conta a pagar
      const payableData = {
        customer_id: testSupplier.id,
        description: 'Compra para atualizar',
        amount: 500.00,
        due_date: '2024-04-20'
      };

      const createResponse = await request(app)
        .post('/api/payables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payableData);

      const payableId = createResponse.body.id;

      const updateData = {
        description: 'Compra atualizada',
        amount: 700.00,
        due_date: '2024-04-25',
        category_id: testCategory.id,
        notes: 'Nota atualizada'
      };

      const response = await request(app)
        .patch(`/api/payables/${payableId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Compra atualizada');
      expect(Number(response.body.amount)).toBeCloseTo(700.00, 1);
      expect(response.body.category_id).toBe(testCategory.id);
      expect(response.body.notes).toBe('Nota atualizada');
    });

    it('deve retornar erro ao tentar atualizar conta a pagar inexistente', async () => {
      const updateData = {
        description: 'Compra inexistente',
        amount: 800.00,
        due_date: '2024-04-01'
      };

      const response = await request(app)
        .patch('/api/payables/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/payables/:id', () => {
    it('deve excluir uma conta a pagar', async () => {
      // Primeiro criar uma conta a pagar
      const payableData = {
        customer_id: testSupplier.id,
        description: 'Compra para excluir',
        amount: 200.00,
        due_date: '2024-04-30'
      };

      const createResponse = await request(app)
        .post('/api/payables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payableData);

      const payableId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/payables/${payableId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verificar se foi realmente excluída
      const getResponse = await request(app)
        .get(`/api/payables/${payableId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe('POST /api/payables/:id/payments', () => {
    it('deve adicionar um pagamento a uma conta a pagar', async () => {
      // Primeiro criar uma conta a pagar
      const payableData = {
        customer_id: testSupplier.id,
        category_id: testCategory.id,
        description: 'Compra para pagar',
        amount: 1000.00,
        due_date: '2024-04-01'
      };

      const createResponse = await request(app)
        .post('/api/payables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payableData);

      const payableId = createResponse.body.id;

      const paymentData = {
        amount: 500.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'pix',
        description: 'Pagamento parcial',
        account_id: testAccount.id
      };

      const response = await request(app)
        .post(`/api/payables/${payableId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment).toHaveProperty('id');
      expect(Number(response.body.payment.amount)).toBeCloseTo(500.00, 1);
      expect(response.body.payment.payable_id).toBe(payableId);
      expect(response.body).toHaveProperty('newBalance');
    });

    it('deve retornar erro para pagamento maior que o valor restante', async () => {
      // Primeiro criar uma conta a pagar
      const payableData = {
        customer_id: testSupplier.id,
        description: 'Compra para pagar',
        amount: 300.00,
        due_date: '2024-04-01'
      };

      const createResponse = await request(app)
        .post('/api/payables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payableData);

      const payableId = createResponse.body.id;

      const paymentData = {
        amount: 500.00, // Maior que o valor da conta
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'pix',
        account_id: testAccount.id
      };

      const response = await request(app)
        .post(`/api/payables/${payableId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/payables/:id/payments', () => {
    it('deve listar pagamentos de uma conta a pagar', async () => {
      // Primeiro criar uma conta a pagar e adicionar um pagamento
      const payableData = {
        customer_id: testSupplier.id,
        description: 'Compra para listar pagamentos',
        amount: 400.00,
        due_date: '2024-04-01'
      };

      const createResponse = await request(app)
        .post('/api/payables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payableData);

      const payableId = createResponse.body.id;

      // Adicionar um pagamento
      const paymentData = {
        amount: 200.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'transfer',
        account_id: testAccount.id
      };

      await request(app)
        .post(`/api/payables/${payableId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      // Listar pagamentos
      const response = await request(app)
        .get(`/api/payables/${payableId}/payments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('payable_id', payableId);
    });
  });

  describe('GET /api/payables/upcoming-due', () => {
    it('deve listar contas a pagar que vencem nos próximos 30 dias', async () => {
      const response = await request(app)
        .get('/api/payables/upcoming-due')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/payables/overdue', () => {
    it('deve listar contas a pagar vencidas', async () => {
      const response = await request(app)
        .get('/api/payables/overdue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
}); 