const app = require('../../app');
const { createTestUser, cleanAllTestData } = require('./setup');
const request = require('supertest');
const { sequelize } = require('../../models');
const { Receivable, User, Customer, CustomerType, Category } = require('../../models');

describe('Receivable Integration Tests', () => {
  let authToken;
  let testUser;
  let testCustomer;
  let testCategory;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    // Limpar dados relevantes
    await Receivable.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await Customer.destroy({ where: {} });
    await CustomerType.destroy({ where: {} });
    await User.destroy({ where: { email: 'testreceivable@example.com' } });

    // Criar usuário de teste via API e obter token
    authToken = await createTestUser(app, 'testreceivable@example.com', 'Test User Receivable');
    testUser = await User.findOne({ where: { email: 'testreceivable@example.com' } });

    // Criar cliente de teste
    testCustomer = await Customer.create({
      name: 'Cliente Receivable',
      document_type: 'CPF',
      document_number: '12345678909',
      email: 'cliente.receivable@teste.com',
      user_id: testUser.id
    });

    // Associar tipo ao cliente
    await CustomerType.create({
      customer_id: testCustomer.id,
      type: 'customer'
    });

    // Criar categoria de teste
    testCategory = await Category.create({
      user_id: testUser.id,
      name: 'Vendas',
      type: 'income',
      color: '#4CAF50'
    });
  });

  describe('POST /api/receivables', () => {
    it('deve criar uma nova conta a receber com sucesso', async () => {
      const receivableData = {
        customer_id: testCustomer.id,
        category_id: testCategory.id,
        description: 'Venda de produtos',
        amount: 1000.00,
        due_date: '2024-04-01',
        notes: 'Venda para cliente teste'
      };

      const response = await request(app)
        .post('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receivableData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBe('Venda de produtos');
      expect(Number(response.body.amount)).toBeCloseTo(1000.00, 1);
      expect(response.body.customer_id).toBe(testCustomer.id);
      expect(response.body.category_id).toBe(testCategory.id);
      expect(response.body.status).toBe('pending');
    });

    it('deve criar uma conta a receber sem categoria', async () => {
      const receivableData = {
        customer_id: testCustomer.id,
        description: 'Venda sem categoria',
        amount: 500.00,
        due_date: '2024-04-15'
      };

      const response = await request(app)
        .post('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receivableData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.category_id).toBeNull();
    });

    it('deve retornar erro ao tentar criar conta a receber sem autenticação', async () => {
      const receivableData = {
        customer_id: testCustomer.id,
        description: 'Venda sem auth',
        amount: 1000.00,
        due_date: '2024-04-01'
      };

      const response = await request(app)
        .post('/api/receivables')
        .send(receivableData);

      expect(response.status).toBe(401);
    });

    it('deve retornar erro para categoria inexistente', async () => {
      const receivableData = {
        customer_id: testCustomer.id,
        category_id: 99999, // Categoria inexistente
        description: 'Venda com categoria inválida',
        amount: 1000.00,
        due_date: '2024-04-01'
      };

      const response = await request(app)
        .post('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receivableData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/receivables', () => {
    beforeEach(async () => {
      // Criar algumas contas a receber para teste
      await request(app)
        .post('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customer_id: testCustomer.id,
          description: 'Conta 1',
          amount: 1500.00,
          due_date: '2024-04-01'
        });

      await request(app)
        .post('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customer_id: testCustomer.id,
          description: 'Conta 2',
          amount: 2500.00,
          due_date: '2024-04-15'
        });
    });

    it('deve listar todas as contas a receber', async () => {
      const response = await request(app)
        .get('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      // Verificar se tem remaining_amount
      const receivable = response.body[0];
      expect(receivable).toHaveProperty('remaining_amount');
      expect(receivable).toHaveProperty('category');
    });

    it('deve filtrar contas a receber por status', async () => {
      const response = await request(app)
        .get('/api/receivables?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Verificar se todas são pending
      response.body.forEach(receivable => {
        expect(receivable.status).toBe('pending');
      });
    });
  });

  describe('GET /api/receivables/:id', () => {
    let receivableId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customer_id: testCustomer.id,
          description: 'Conta Teste',
          amount: 1500.00,
          due_date: '2024-04-01'
        });

      receivableId = response.body.id;
    });

    it('deve retornar uma conta a receber específica', async () => {
      const response = await request(app)
        .get(`/api/receivables/${receivableId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(receivableId);
      expect(response.body.description).toBe('Conta Teste');
    });

    it('deve retornar 404 para conta a receber inexistente', async () => {
      const response = await request(app)
        .get('/api/receivables/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/receivables/:id', () => {
    it('deve atualizar uma conta a receber', async () => {
      // Primeiro criar uma conta a receber
      const receivableData = {
        customer_id: testCustomer.id,
        description: 'Venda para atualizar',
        amount: 600.00,
        due_date: '2024-04-20'
      };

      const createResponse = await request(app)
        .post('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receivableData);

      const receivableId = createResponse.body.id;

      const updateData = {
        description: 'Venda atualizada',
        amount: 800.00,
        due_date: '2024-04-25',
        category_id: testCategory.id,
        notes: 'Nota atualizada'
      };

      const response = await request(app)
        .put(`/api/receivables/${receivableId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Venda atualizada');
      expect(Number(response.body.amount)).toBeCloseTo(800.00, 1);
      expect(response.body.category_id).toBe(testCategory.id);
      expect(response.body.notes).toBe('Nota atualizada');
      expect(response.body.status).toBe('pending'); // Status permanece pending
    });

    it('deve retornar erro ao tentar atualizar conta a receber inexistente', async () => {
      const response = await request(app)
        .put('/api/receivables/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Conta Teste',
          amount: 1500.00,
          due_date: '2024-04-01'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/receivables/:id', () => {
    it('deve excluir uma conta a receber', async () => {
      // Primeiro criar uma conta a receber
      const receivableData = {
        customer_id: testCustomer.id,
        description: 'Venda para excluir',
        amount: 300.00,
        due_date: '2024-04-30'
      };

      const createResponse = await request(app)
        .post('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receivableData);

      const receivableId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/receivables/${receivableId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verificar se foi realmente excluída
      const getResponse = await request(app)
        .get(`/api/receivables/${receivableId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe('GET /api/receivables/upcoming-due', () => {
    it('deve listar contas a receber que vencem nos próximos 30 dias', async () => {
      const response = await request(app)
        .get('/api/receivables/upcoming-due')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/receivables/overdue', () => {
    it('deve listar contas a receber vencidas', async () => {
      const response = await request(app)
        .get('/api/receivables/overdue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
}); 