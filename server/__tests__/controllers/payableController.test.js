const request = require('supertest');
const { Op } = require('sequelize');
const app = require('../../app');
const { sequelize } = require('../../models');
const { Payable, User, Customer, CustomerType, Category, Payment, Account, Supplier } = require('../../models');
const { createTestUser, cleanAllTestData } = require('../integration/setup');

describe('PayableController', () => {
  let testUser;
  let testSupplier;
  let testCategory;
  let testAccount;
  let testPayable;
  let authToken;

  beforeAll(async () => {
    // Criar usuário de teste via API e obter token
    
    authToken = await createTestUser(app, 'testpayablecontroller@example.com', 'Test User Payable Controller'); 
    
    
    
    // Buscar o usuário criado
    testUser = await User.findOne({ where: { email: 'testpayablecontroller@example.com' } });
    

    // Criar fornecedor de teste
    testSupplier = await Supplier.create({
      name: 'Fornecedor Teste',
      document_type: 'CNPJ',
      document_number: '12345678901234',
      email: 'fornecedor@teste.com',
      phone: '11999999999',
      user_id: testUser.id
    });

    // Criar categoria de teste
    testCategory = await Category.create({
      name: 'Categoria Teste',
      type: 'expense',
      user_id: testUser.id
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
      supplier_id: testSupplier.id,
      category_id: testCategory.id,
      description: 'Compra de produtos',
      amount: 800.00,
      due_date: '2024-04-01',
      status: 'pending',
      notes: 'Compra para fornecedor teste'
    });
  });

  afterAll(async () => {
    await sequelize.close();
    // Limpar todos os dados de teste de forma segura
    await cleanAllTestData();
  });

  afterEach(async () => {
    // Limpar dados criados nos testes
    await Payment.destroy({ where: { payable_id: { [Op.ne]: null } } });
    // Limpar payables criados nos testes, mas manter o testPayable original
    if (testPayable && testPayable.id) {
      await Payable.destroy({ where: { id: { [Op.ne]: testPayable.id } } });
    }
  });

  describe('POST /api/payables', () => {
    it('deve criar uma nova conta a pagar com sucesso', async () => {
      const payableData = {
        supplier_id: testSupplier.id,
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
      expect(response.body.supplier_id).toBe(testSupplier.id);
      expect(response.body.category_id).toBe(testCategory.id);
      expect(response.body.status).toBe('pending');
    });

    it('deve criar conta a pagar sem categoria', async () => {
      const payableData = {
        supplier_id: testSupplier.id,
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
    });

    it('deve retornar erro para dados inválidos', async () => {
      const invalidData = {
        supplier_id: testSupplier.id,
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
        supplier_id: 99999, // Fornecedor inexistente
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
        supplier_id: testSupplier.id,
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
      expect(payable).toHaveProperty('supplier');
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
        .get(`/api/payables?supplier_id=${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      response.body.forEach(payable => {
        expect(payable.supplier_id).toBe(testSupplier.id);
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
      expect(response.body).toHaveProperty('supplier');
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

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/payables/:id', () => {
    it('deve atualizar uma conta a pagar com sucesso', async () => {
      // Criar um payable novo para garantir existência
      const novoPayable = await Payable.create({
        user_id: testUser.id,
        supplier_id: testSupplier.id,
        category_id: testCategory.id,
        description: 'Update Test',
        amount: 500.00,
        due_date: '2024-06-01',
        status: 'pending',
      });

      // Verificar se foi criado corretamente
      const payableCriado = await Payable.findByPk(novoPayable.id);
      expect(payableCriado).toBeTruthy();
      expect(payableCriado.user_id).toBe(testUser.id);

      const updateData = {
        description: 'Compra atualizada',
        amount: 1000.00,
        due_date: '2024-05-15',
        notes: 'Notas atualizadas'
      };

      const response = await request(app)
        .patch(`/api/payables/${novoPayable.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Compra atualizada');
      expect(Number(response.body.amount)).toBeCloseTo(1000.00, 1);
      expect(response.body.notes).toBe('Notas atualizadas');
    });

    it('deve retornar erro para atualização com dados inválidos', async () => {
      // Criar um payable novo para garantir existência
      const novoPayable = await Payable.create({
        user_id: testUser.id,
        supplier_id: testSupplier.id,
        category_id: testCategory.id,
        description: 'Update Test Inválido',
        amount: 500.00,
        due_date: '2024-06-01',
        status: 'pending',
      });

      // Verificar se foi criado corretamente
      const payableCriado = await Payable.findByPk(novoPayable.id);
      expect(payableCriado).toBeTruthy();
      expect(payableCriado.user_id).toBe(testUser.id);

      const invalidData = {
        amount: -100 // Valor negativo
      };

      const response = await request(app)
        .patch(`/api/payables/${novoPayable.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro para ID inexistente', async () => {
      const updateData = {
        description: 'Compra inexistente',
        amount: 1000.00,
        due_date: '2024-05-15',
        notes: 'Notas atualizadas'
      };

      const response = await request(app)
        .patch('/api/payables/99999')
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
        supplier_id: testSupplier.id,
        description: 'Compra para deletar',
        amount: 400.00,
        due_date: '2024-06-01',
        status: 'pending'
      });

      const response = await request(app)
        .delete(`/api/payables/${payableToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

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
      // Criar um payable novo
      const payableComPagamento = await Payable.create({
        user_id: testUser.id,
        supplier_id: testSupplier.id,
        category_id: testCategory.id,
        description: 'Com Pagamento',
        amount: 300.00,
        due_date: '2024-06-01',
        status: 'pending',
      });
      // Criar um pagamento para esse payable
      await Payment.create({
        payable_id: payableComPagamento.id,
        amount: 100.00,
        payment_date: '2024-06-01',
        payment_method: 'pix',
        description: 'Teste pagamento'
      });
      const response = await request(app)
        .delete(`/api/payables/${payableComPagamento.id}`)
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
      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment).toHaveProperty('id');
      expect(Number(response.body.payment.amount)).toBeCloseTo(400.00, 1);
      expect(response.body.payment.payment_method).toBe('pix');
      expect(response.body.payment.payable_id).toBe(testPayable.id);
      expect(response.body).toHaveProperty('newBalance');
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
      // Criar um payable novo para garantir existência
      const novoPayable = await Payable.create({
        user_id: testUser.id,
        supplier_id: testSupplier.id,
        category_id: testCategory.id,
        description: 'Pagamento Inválido',
        amount: 500.00,
        due_date: '2024-06-01',
        status: 'pending',
      });
      const invalidData = {
        amount: -100, // Valor negativo
        payment_date: '', // Data vazia
        payment_method: '', // Método vazio
        account_id: null // Conta nula
      };
      const response = await request(app)
        .post(`/api/payables/${novoPayable.id}/payments`)
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

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 