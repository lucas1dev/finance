const request = require('supertest');
const app = require('../../app');
const { Payment, Receivable, Payable, User, Customer, CustomerType, Account, Transaction, Category } = require('../../models');

describe('Payment Integration Tests', () => {
  let authToken;
  let testUser;
  let testReceivable;
  let testPayable;
  let testPayment;
  let testCustomer;
  let testSupplier;
  let uniqueEmail;
  let testAccount;

  beforeAll(async () => {
    // Gerar e-mail único para evitar duplicidade
    uniqueEmail = `testpayment+${Date.now()}@example.com`;
    // Criar usuário de teste
    testUser = await User.create({
      name: 'Test User Payment',
      email: uniqueEmail,
      password: 'password123',
      two_factor_secret: 'test-secret'
    });

    // Criar cliente de teste
    testCustomer = await Customer.create({
      name: 'Cliente Pagamento',
      document_type: 'CPF',
      document_number: '12345678909',
      email: 'cliente.pagamento@teste.com',
      user_id: testUser.id
    });

    // Criar fornecedor de teste
    testSupplier = await Customer.create({
      name: 'Fornecedor Pagamento',
      document_type: 'CNPJ',
      document_number: '12345678000195',
      email: 'fornecedor.pagamento@teste.com',
      user_id: testUser.id
    });

    // Associar tipos aos customers
    await CustomerType.create({
      customer_id: testCustomer.id,
      type: 'customer'
    });

    await CustomerType.create({
      customer_id: testSupplier.id,
      type: 'supplier'
    });

    // Criar conta de teste
    testAccount = await Account.create({
      user_id: testUser.id,
      bank_name: 'Test Bank',
      account_type: 'checking',
      balance: 1000.00,
      description: 'Test account for payments'
    });

    // Criar conta a receber de teste
    testReceivable = await Receivable.create({
      user_id: testUser.id,
      customer_id: testCustomer.id,
      amount: 1000.00,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      description: 'Test receivable for payment',
      status: 'pending'
    });

    // Criar conta a pagar de teste
    testPayable = await Payable.create({
      user_id: testUser.id,
      customer_id: testSupplier.id,
      amount: 500.00,
      due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
      description: 'Test payable for payment',
      status: 'pending'
    });

    // Fazer login para obter token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Limpar dados de teste na ordem correta (dependências primeiro)
    await Payment.destroy({ where: { receivable_id: testReceivable.id } });
    await Payment.destroy({ where: { payable_id: testPayable.id } });
    await Transaction.destroy({ where: { user_id: testUser.id } });
    await Category.destroy({ where: { user_id: testUser.id } });
    await Receivable.destroy({ where: { id: testReceivable.id } });
    await Payable.destroy({ where: { id: testPayable.id } });
    await CustomerType.destroy({ where: { customer_id: testCustomer.id } });
    await CustomerType.destroy({ where: { customer_id: testSupplier.id } });
    await Customer.destroy({ where: { id: testCustomer.id } });
    await Customer.destroy({ where: { id: testSupplier.id } });
    await Account.destroy({ where: { id: testAccount.id } });
    await User.destroy({ where: { id: testUser.id } });
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
      expect(response.body).toHaveProperty('id');
      expect(Number(response.body.amount)).toBeCloseTo(250.00, 1);
      expect(Number(response.body.payable_id)).toBe(testPayable.id);
      expect(response.body.payment_method).toBe('transfer');
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
        customer_id: 1,
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
    it('should delete a payment', async () => {
      // Criar um pagamento para deletar
      const paymentToDelete = await Payment.create({
        receivable_id: testReceivable.id,
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