const request = require('supertest');
const app = require('../../app');
const { Payment, Receivable, Payable, User, Customer, CustomerType, Account, Transaction, Category, Supplier } = require('../../models');
const { createTestUser, cleanAllTestData } = require('./setup');

describe('Payment Integration Tests', () => {
  let authToken;
  let testUser;
  let testReceivable;
  let testPayable;
  let testPayment;
  let testCustomer;
  let testSupplier;
  let testAccount;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    // Limpar dados relevantes
    await Payment.destroy({ where: {} });
    await Receivable.destroy({ where: {} });
    await Payable.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await Customer.destroy({ where: {} });
    await Supplier.destroy({ where: {} });
    // await User.destroy({ where: { email: 'testpayment@example.com' } }); // COMENTADO: Causava problemas de conexão

    // Criar usuário de teste via API e obter token
    authToken = await createTestUser(app, 'testpayment@example.com', 'Test User Payment');
    testUser = await User.findOne({ where: { email: 'testpayment@example.com' } });

    // Criar cliente de teste
    testCustomer = await Customer.create({
      name: 'Cliente Pagamento',
      document_type: 'CPF',
      document_number: '12345678909',
      email: 'cliente.pagamento@teste.com',
      user_id: testUser.id
    });

    // Criar fornecedor de teste
    testSupplier = await Supplier.create({
      name: 'Fornecedor Pagamento',
      document_type: 'CNPJ',
      document_number: '12345678000195',
      email: 'fornecedor.pagamento@teste.com',
      user_id: testUser.id
    });

    // Criar conta de teste
    testAccount = await Account.create({
      name: 'Conta Principal',
      bank_name: 'Banco Teste',
      account_type: 'checking',
      balance: 10000,
      user_id: testUser.id
    });

    // Criar conta a receber de teste
    testReceivable = await Receivable.create({
      customer_id: testCustomer.id,
      description: 'Conta a receber teste',
      amount: 1000,
      due_date: '2024-04-01',
      user_id: testUser.id
    });

    // Criar conta a pagar de teste
    testPayable = await Payable.create({
      supplier_id: testSupplier.id,
      description: 'Conta a pagar teste',
      amount: 1000,
      due_date: '2024-04-01',
      user_id: testUser.id
    });
  });

  describe('POST /api/receivables/:receivable_id/payments', () => {
    it('should create a payment for a receivable', async () => {
      const paymentData = {
        amount: 500.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'pix',
        description: 'Payment test for receivable',
        account_id: testAccount.id
      };

      const response = await request(app)
        .post(`/api/receivables/${testReceivable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      if (response.status === 400) {
        console.log('Erro 400:', response.body);
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment).toHaveProperty('id');
      expect(Number(response.body.payment.amount)).toBeCloseTo(500.00, 1);
      expect(response.body.payment.receivable_id).toBe(testReceivable.id);
      expect(response.body.payment.payment_method).toBe('pix');
      expect(response.body).toHaveProperty('newBalance');

      testPayment = response.body;
    });

    it('should create a payment for a payable', async () => {
      const paymentData = {
        amount: 250.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'transfer',
        description: 'Payment test for payable',
        account_id: testAccount.id
      };

      const response = await request(app)
        .post(`/api/payables/${testPayable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('payment');
      expect(response.body).toHaveProperty('newBalance');
      expect(response.body.payment).toHaveProperty('id');
      expect(Number(response.body.payment.amount)).toBeCloseTo(250.00, 1);
      expect(Number(response.body.payment.payable_id)).toBe(testPayable.id);
      expect(response.body.payment.payment_method).toBe('transfer');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post(`/api/receivables/${testReceivable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100.00
          // Missing payment_date and payment_method
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent receivable', async () => {
      const paymentData = {
        amount: 100.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'pix',
        description: 'Payment test for non-existent receivable',
        account_id: testAccount.id
      };

      const response = await request(app)
        .post('/api/receivables/99999/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/receivables/:receivable_id/payments', () => {
    it('should list payments for a receivable', async () => {
      // Criar um pagamento para o testReceivable
      const paymentData = {
        amount: 200.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'pix',
        description: 'Pagamento para listagem',
        account_id: testAccount.id
      };

      await request(app)
        .post(`/api/receivables/${testReceivable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      const response = await request(app)
        .get(`/api/receivables/${testReceivable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('receivable_id', testReceivable.id);
    });

    it('should return empty array for receivable with no payments', async () => {
      // Criar uma nova conta a receber sem pagamentos
      const newReceivable = await Receivable.create({
        user_id: testUser.id,
        customer_id: testCustomer.id,
        amount: 200.00,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'Receivable without payments',
        status: 'pending'
      });

      const response = await request(app)
        .get(`/api/receivables/${newReceivable.id}/payments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);

      // Limpar
      await Receivable.destroy({ where: { id: newReceivable.id } });
    });
  });

  describe('DELETE /api/payments/:id', () => {
    it('should return 401 for unauthenticated delete request', async () => {
      const response = await request(app)
        .delete('/api/payments/1');

      expect(response.status).toBe(401);
    });

    it('should delete a payment', async () => {
      // Criar um pagamento para deletar
      const paymentToDelete = await Payment.create({
        receivable_id: testReceivable.id,
        user_id: testUser.id,
        account_id: testAccount.id,
        amount: 100.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        description: 'Payment to delete'
      });

      const response = await request(app)
        .delete(`/api/payments/${paymentToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verificar se foi realmente deletado
      const deletedPayment = await Payment.findByPk(paymentToDelete.id);
      expect(deletedPayment).toBeNull();
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await request(app)
        .delete('/api/payments/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post(`/api/receivables/${testReceivable.id}/payments`)
        .send({
          amount: 100.00,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'pix'
        });

      expect(response.status).toBe(401);
    });
  });
}); 