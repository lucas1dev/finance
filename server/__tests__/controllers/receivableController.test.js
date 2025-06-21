const request = require('supertest');
const { Op } = require('sequelize');
const app = require('../../app');
const { sequelize } = require('../../models');
const { Receivable, User, Customer, CustomerType, Category, Payment, Account } = require('../../models');
const { createTestUser, cleanAllTestData } = require('../integration/setup');

describe('ReceivableController', () => {
  let testUser;
  let testCustomer;
  let testCategory;
  let testReceivable;
  let authToken;
  let testAccount;

  beforeAll(async () => {
    // Criar usuário de teste via API e obter token
    authToken = await createTestUser(app, 'testreceivablecontroller@example.com', 'Test User Receivable Controller');
    // Buscar o usuário criado
    testUser = await User.findOne({ where: { email: 'testreceivablecontroller@example.com' } });

    // Criar cliente de teste
    testCustomer = await Customer.create({
      name: 'Cliente Teste',
      document_type: 'CPF',
      document_number: '12345678909',
      email: 'cliente@teste.com',
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
      name: 'Categoria Teste',
      type: 'income',
      color: '#4CAF50'
    });

    // Criar conta a receber de teste
    testReceivable = await Receivable.create({
      user_id: testUser.id,
      customer_id: testCustomer.id,
      category_id: testCategory.id,
      description: 'Venda de produtos',
      amount: 1000.00,
      due_date: '2024-04-01',
      status: 'pending',
      notes: 'Venda para cliente teste'
    });

    // Criar conta bancária de teste
    testAccount = await Account.create({
      user_id: testUser.id,
      name: 'Conta Bancária Teste',
      bank_name: 'Banco Teste',
      account_type: 'corrente',
      balance: 10000.00
    });
  });

  afterAll(async () => {
    await sequelize.close();
    // Limpar todos os dados de teste de forma segura
    await cleanAllTestData();
  });

  afterEach(async () => {
    // Limpar dados criados nos testes
    await Payment.destroy({ where: { receivable_id: { [Op.ne]: null } } });
    await Receivable.destroy({ where: { id: { [Op.ne]: testReceivable.id } } });
  });

  describe('POST /api/receivables', () => {
    it('deve criar uma nova conta a receber com sucesso', async () => {
      const receivableData = {
        customer_id: testCustomer.id,
        category_id: testCategory.id,
        description: 'Nova venda',
        amount: 1500.00,
        due_date: '2024-05-01',
        notes: 'Venda nova'
      };

      const response = await request(app)
        .post('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receivableData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBe('Nova venda');
      expect(Number(response.body.amount)).toBeCloseTo(1500.00, 1);
      expect(response.body.customer_id).toBe(testCustomer.id);
      expect(response.body.category_id).toBe(testCategory.id);
      expect(response.body.status).toBe('pending');
    });

    it('deve criar conta a receber sem categoria', async () => {
      const receivableData = {
        customer_id: testCustomer.id,
        description: 'Venda sem categoria',
        amount: 800.00,
        due_date: '2024-05-15'
      };

      const response = await request(app)
        .post('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receivableData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.category_id).toBeNull();
      expect(response.body.status).toBe('pending');
    });

    it('deve retornar erro para dados inválidos', async () => {
      const invalidData = {
        customer_id: testCustomer.id,
        amount: -100, // Valor negativo
        due_date: '2024-05-01'
      };

      const response = await request(app)
        .post('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para cliente inexistente', async () => {
      const receivableData = {
        customer_id: 99999, // Cliente inexistente
        description: 'Venda cliente inexistente',
        amount: 1000.00,
        due_date: '2024-05-01'
      };

      const response = await request(app)
        .post('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(receivableData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para categoria inexistente', async () => {
      const receivableData = {
        customer_id: testCustomer.id,
        category_id: 99999, // Categoria inexistente
        description: 'Venda categoria inexistente',
        amount: 1000.00,
        due_date: '2024-05-01'
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
    it('deve listar todas as contas a receber do usuário', async () => {
      const response = await request(app)
        .get('/api/receivables')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const receivable = response.body[0];
      expect(receivable).toHaveProperty('id');
      expect(receivable).toHaveProperty('description');
      expect(receivable).toHaveProperty('amount');
      expect(receivable).toHaveProperty('remaining_amount');
      expect(receivable).toHaveProperty('status');
      expect(receivable).toHaveProperty('customer');
      expect(receivable).toHaveProperty('category');
    });

    it('deve filtrar por status', async () => {
      const response = await request(app)
        .get('/api/receivables?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      response.body.forEach(receivable => {
        expect(receivable.status).toBe('pending');
      });
    });

    it('deve filtrar por data de vencimento', async () => {
      const response = await request(app)
        .get('/api/receivables?due_date_from=2024-04-01&due_date_to=2024-04-30')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar por cliente', async () => {
      const response = await request(app)
        .get(`/api/receivables?customer_id=${testCustomer.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      response.body.forEach(receivable => {
        expect(receivable.customer_id).toBe(testCustomer.id);
      });
    });
  });

  describe('GET /api/receivables/:id', () => {
    it('deve retornar uma conta a receber específica', async () => {
      const response = await request(app)
        .get(`/api/receivables/${testReceivable.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testReceivable.id);
      expect(response.body.description).toBe('Venda de produtos');
      expect(response.body).toHaveProperty('customer');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('payments');
    });

    it('deve retornar erro para ID inexistente', async () => {
      const response = await request(app)
        .get('/api/receivables/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para ID inválido', async () => {
      const response = await request(app)
        .get('/api/receivables/invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/receivables/:id', () => {
    it('deve atualizar uma conta a receber com sucesso', async () => {
      const updateData = {
        description: 'Venda atualizada',
        amount: 1200.00,
        due_date: '2024-05-15',
        notes: 'Notas atualizadas'
      };

      const response = await request(app)
        .put(`/api/receivables/${testReceivable.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Venda atualizada');
      expect(Number(response.body.amount)).toBeCloseTo(1200.00, 1);
      expect(response.body.notes).toBe('Notas atualizadas');
    });

    it('deve retornar erro para atualização com dados inválidos', async () => {
      const invalidData = {
        amount: -100 // Valor negativo
      };

      const response = await request(app)
        .put(`/api/receivables/${testReceivable.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para ID inexistente', async () => {
      const updateData = {
        description: 'Venda inexistente'
      };

      const response = await request(app)
        .put('/api/receivables/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/receivables/:id', () => {
    it('deve deletar uma conta a receber com sucesso', async () => {
      // Criar uma conta a receber para deletar
      const receivableToDelete = await Receivable.create({
        user_id: testUser.id,
        customer_id: testCustomer.id,
        description: 'Venda para deletar',
        amount: 500.00,
        due_date: '2024-06-01',
        status: 'pending'
      });

      const response = await request(app)
        .delete(`/api/receivables/${receivableToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verificar se foi realmente deletada
      const deletedReceivable = await Receivable.findByPk(receivableToDelete.id);
      expect(deletedReceivable).toBeNull();
    });

    it('deve retornar erro para ID inexistente', async () => {
      const response = await request(app)
        .delete('/api/receivables/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para conta a receber com pagamentos', async () => {
      // Criar uma conta a receber com pagamento
      const receivableWithPayment = await Receivable.create({
        user_id: testUser.id,
        customer_id: testCustomer.id,
        description: 'Venda com pagamento',
        amount: 1000.00,
        due_date: '2024-06-01',
        status: 'pending'
      });

      // Criar um pagamento
      await Payment.create({
        user_id: testUser.id,
        receivable_id: receivableWithPayment.id,
        amount: 500.00,
        payment_date: '2024-04-01',
        payment_method: 'pix'
      });

      const response = await request(app)
        .delete(`/api/receivables/${receivableWithPayment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });
  });

  describe('POST /api/receivables/:id/payments', () => {
    it('deve registrar um pagamento com sucesso', async () => {
      const paymentData = {
        amount: 500.00,
        payment_date: '2024-04-01',
        payment_method: 'pix',
        description: 'Pagamento parcial',
        account_id: testAccount.id
      };

      const response = await request(app)
        .post(`/api/receivables/${testReceivable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('payment');
      expect(Number(response.body.payment.amount)).toBeCloseTo(500.00, 1);
      expect(response.body.payment.payment_method).toBe('pix');
      expect(response.body.payment.receivable_id).toBe(testReceivable.id);
    });

    it('deve retornar erro para pagamento maior que o valor restante', async () => {
      const paymentData = {
        amount: 2000.00, // Maior que o valor da conta
        payment_date: '2024-04-01',
        payment_method: 'pix',
        account_id: testAccount.id
      };

      const response = await request(app)
        .post(`/api/receivables/${testReceivable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para dados inválidos', async () => {
      const invalidData = {
        amount: -100, // Valor negativo
        payment_date: '2024-04-01',
        payment_method: 'pix',
        account_id: testAccount.id
      };

      const response = await request(app)
        .post(`/api/receivables/${testReceivable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});