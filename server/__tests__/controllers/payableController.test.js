const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');
const { Payable, User, Customer, CustomerType, Category, Payment, Account } = require('../../models');

describe('PayableController', () => {
  let testUser;
  let testSupplier;
  let testCategory;
  let testAccount;
  let testPayable;
  let authToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Criar usuário de teste
    testUser = await User.create({
      name: 'Test User',
      email: `testpayable+${Date.now()}@example.com`,
      password: 'password123',
      two_factor_secret: 'test-secret'
    });

    // Criar fornecedor de teste
    testSupplier = await Customer.create({
      name: 'Fornecedor Teste',
      document_type: 'CNPJ',
      document_number: '12345678000195',
      email: 'fornecedor@teste.com',
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

    // Criar conta a pagar de teste
    testPayable = await Payable.create({
      user_id: testUser.id,
      customer_id: testSupplier.id,
      category_id: testCategory.id,
      description: 'Compra de produtos',
      amount: 800.00,
      due_date: '2024-04-01',
      status: 'pending',
      notes: 'Compra para fornecedor teste'
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
    await sequelize.close();
  });

  afterEach(async () => {
    // Limpar dados criados nos testes
    await Payment.destroy({ where: { payable_id: { [sequelize.Op.ne]: null } } });
    await Payable.destroy({ where: { id: { [sequelize.Op.ne]: testPayable.id } } });
  });

  describe('POST /api/payables', () => {
    it('deve criar uma nova conta a pagar com sucesso', async () => {
      const payableData = {
        customer_id: testSupplier.id,
        category_id: testCategory.id,
        description: 'Nova compra',
        amount: 1200.00,
        due_date: '2024-05-01',
        notes: 'Compra nova'
      };

      const response = await request(app)
        .post('/api/payables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payableData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBe('Nova compra');
      expect(Number(response.body.amount)).toBeCloseTo(1200.00, 1);
      expect(response.body.customer_id).toBe(testSupplier.id);
      expect(response.body.category_id).toBe(testCategory.id);
      expect(response.body.status).toBe('pending');
      expect(response.body.remaining_amount).toBeCloseTo(1200.00, 1);
    });

    it('deve criar conta a pagar sem categoria', async () => {
      const payableData = {
        customer_id: testSupplier.id,
        description: 'Compra sem categoria',
        amount: 600.00,
        due_date: '2024-05-15'
      };

      const response = await request(app)
        .post('/api/payables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payableData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.category_id).toBeNull();
      expect(response.body.remaining_amount).toBeCloseTo(600.00, 1);
    });

    it('deve retornar erro para dados inválidos', async () => {
      const invalidData = {
        customer_id: testSupplier.id,
        amount: -100, // Valor negativo
        due_date: '2024-05-01'
      };

      const response = await request(app)
        .post('/api/payables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para fornecedor inexistente', async () => {
      const payableData = {
        customer_id: 99999, // Fornecedor inexistente
        description: 'Compra fornecedor inexistente',
        amount: 1000.00,
        due_date: '2024-05-01'
      };

      const response = await request(app)
        .post('/api/payables')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payableData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para categoria inexistente', async () => {
      const payableData = {
        customer_id: testSupplier.id,
        category_id: 99999, // Categoria inexistente
        description: 'Compra categoria inexistente',
        amount: 1000.00,
        due_date: '2024-05-01'
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
    it('deve listar todas as contas a pagar do usuário', async () => {
      const response = await request(app)
        .get('/api/payables')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const payable = response.body[0];
      expect(payable).toHaveProperty('id');
      expect(payable).toHaveProperty('description');
      expect(payable).toHaveProperty('amount');
      expect(payable).toHaveProperty('remaining_amount');
      expect(payable).toHaveProperty('status');
      expect(payable).toHaveProperty('customer');
      expect(payable).toHaveProperty('category');
    });

    it('deve filtrar por status', async () => {
      const response = await request(app)
        .get('/api/payables?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      response.body.forEach(payable => {
        expect(payable.status).toBe('pending');
      });
    });

    it('deve filtrar por data de vencimento', async () => {
      const response = await request(app)
        .get('/api/payables?due_date_from=2024-04-01&due_date_to=2024-04-30')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar por fornecedor', async () => {
      const response = await request(app)
        .get(`/api/payables?customer_id=${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      response.body.forEach(payable => {
        expect(payable.customer_id).toBe(testSupplier.id);
      });
    });
  });

  describe('GET /api/payables/:id', () => {
    it('deve retornar uma conta a pagar específica', async () => {
      const response = await request(app)
        .get(`/api/payables/${testPayable.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testPayable.id);
      expect(response.body.description).toBe('Compra de produtos');
      expect(response.body).toHaveProperty('customer');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('payments');
    });

    it('deve retornar erro para ID inexistente', async () => {
      const response = await request(app)
        .get('/api/payables/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para ID inválido', async () => {
      const response = await request(app)
        .get('/api/payables/invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/payables/:id', () => {
    it('deve atualizar uma conta a pagar com sucesso', async () => {
      const updateData = {
        description: 'Compra atualizada',
        amount: 1000.00,
        due_date: '2024-05-15',
        notes: 'Notas atualizadas'
      };

      const response = await request(app)
        .put(`/api/payables/${testPayable.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Compra atualizada');
      expect(Number(response.body.amount)).toBeCloseTo(1000.00, 1);
      expect(response.body.notes).toBe('Notas atualizadas');
    });

    it('deve retornar erro para atualização com dados inválidos', async () => {
      const invalidData = {
        amount: -100 // Valor negativo
      };

      const response = await request(app)
        .put(`/api/payables/${testPayable.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para ID inexistente', async () => {
      const updateData = {
        description: 'Compra inexistente'
      };

      const response = await request(app)
        .put('/api/payables/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/payables/:id', () => {
    it('deve deletar uma conta a pagar com sucesso', async () => {
      // Criar uma conta a pagar para deletar
      const payableToDelete = await Payable.create({
        user_id: testUser.id,
        customer_id: testSupplier.id,
        description: 'Compra para deletar',
        amount: 400.00,
        due_date: '2024-06-01',
        status: 'pending'
      });

      const response = await request(app)
        .delete(`/api/payables/${payableToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verificar se foi realmente deletada
      const deletedPayable = await Payable.findByPk(payableToDelete.id);
      expect(deletedPayable).toBeNull();
    });

    it('deve retornar erro para ID inexistente', async () => {
      const response = await request(app)
        .delete('/api/payables/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para conta a pagar com pagamentos', async () => {
      // Criar uma conta a pagar com pagamento
      const payableWithPayment = await Payable.create({
        user_id: testUser.id,
        customer_id: testSupplier.id,
        description: 'Compra com pagamento',
        amount: 1000.00,
        due_date: '2024-06-01',
        status: 'pending'
      });

      // Criar um pagamento
      await Payment.create({
        user_id: testUser.id,
        payable_id: payableWithPayment.id,
        account_id: testAccount.id,
        amount: 500.00,
        payment_date: '2024-04-01',
        payment_method: 'pix'
      });

      const response = await request(app)
        .delete(`/api/payables/${payableWithPayment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/payables/:id/payments', () => {
    it('deve registrar um pagamento com sucesso', async () => {
      const paymentData = {
        account_id: testAccount.id,
        amount: 400.00,
        payment_date: '2024-04-01',
        payment_method: 'pix',
        notes: 'Pagamento parcial'
      };

      const response = await request(app)
        .post(`/api/payables/${testPayable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(Number(response.body.amount)).toBeCloseTo(400.00, 1);
      expect(response.body.payment_method).toBe('pix');
      expect(response.body.payable_id).toBe(testPayable.id);
      expect(response.body.account_id).toBe(testAccount.id);

      // Verificar se o remaining_amount foi atualizado
      const updatedPayable = await Payable.findByPk(testPayable.id);
      expect(Number(updatedPayable.remaining_amount)).toBeCloseTo(400.00, 1);

      // Verificar se o saldo da conta foi atualizado
      const updatedAccount = await Account.findByPk(testAccount.id);
      expect(Number(updatedAccount.balance)).toBeCloseTo(1600.00, 1); // 2000 - 400
    });

    it('deve retornar erro para pagamento maior que o valor restante', async () => {
      const paymentData = {
        account_id: testAccount.id,
        amount: 2000.00, // Maior que o valor da conta
        payment_date: '2024-04-01',
        payment_method: 'pix'
      };

      const response = await request(app)
        .post(`/api/payables/${testPayable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para dados inválidos', async () => {
      const invalidData = {
        account_id: testAccount.id,
        amount: -100, // Valor negativo
        payment_date: '2024-04-01',
        payment_method: 'pix'
      };

      const response = await request(app)
        .post(`/api/payables/${testPayable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para conta inexistente', async () => {
      const paymentData = {
        account_id: 99999, // Conta inexistente
        amount: 400.00,
        payment_date: '2024-04-01',
        payment_method: 'pix'
      };

      const response = await request(app)
        .post(`/api/payables/${testPayable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para saldo insuficiente na conta', async () => {
      // Criar uma conta com saldo baixo
      const lowBalanceAccount = await Account.create({
        user_id: testUser.id,
        bank_name: 'Low Balance Bank',
        account_type: 'checking',
        balance: 100.00,
        description: 'Low balance account'
      });

      const paymentData = {
        account_id: lowBalanceAccount.id,
        amount: 200.00, // Maior que o saldo disponível
        payment_date: '2024-04-01',
        payment_method: 'pix'
      };

      const response = await request(app)
        .post(`/api/payables/${testPayable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 