const request = require('supertest');
const app = require('../../app');
const { User, Account, Creditor, Financing, FinancingPayment, Transaction, Category } = require('../../models');
const { createTestUser, cleanAllTestData } = require('./setup');

jest.setTimeout(20000);

describe('FinancingPayment Integration Tests', () => {
  let authToken;
  let testUser;
  let testAccount;
  let testCreditor;
  let testFinancing;
  let testCategory;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    // Limpar dados relevantes
    await FinancingPayment.destroy({ where: {} });
    await Transaction.destroy({ where: {} });
    await Financing.destroy({ where: {} });
    await Creditor.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await User.destroy({ where: { email: 'testfinancingpayment@example.com' } });

    // Criar usuário de teste via API e obter token
    authToken = await createTestUser(app, 'testfinancingpayment@example.com', 'Test User Financing Payment');
    testUser = await User.findOne({ where: { email: 'testfinancingpayment@example.com' } });

    // Criar credor de teste
    testCreditor = await Creditor.create({
      name: 'Banco Financiador',
      document_type: 'CNPJ',
      document_number: '12345678901234',
      address: 'Rua Financiamento, 456 - Centro - São Paulo/SP',
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

    // Criar categoria de teste
    testCategory = await Category.create({
      name: 'Financiamentos',
      type: 'expense',
      user_id: testUser.id
    });

    // Criar financiamento de teste
    testFinancing = await Financing.create({
      description: 'Financiamento Teste',
      financing_type: 'emprestimo_pessoal',
      total_amount: 5000.00,
      term_months: 12,
      interest_rate: 0.0150,
      start_date: new Date().toISOString().split('T')[0],
      creditor_id: testCreditor.id,
      user_id: testUser.id,
      current_balance: 5000.00,
      monthly_payment: 450.00,
      amortization_method: 'SAC',
      status: 'ativo'
    });
  });

  describe('POST /api/financing-payments', () => {
    it('deve criar um pagamento de financiamento e gerar transação financeira', async () => {
      const paymentData = {
        financing_id: testFinancing.id,
        account_id: testAccount.id,
        installment_number: 1,
        payment_amount: 450.00,
        principal_amount: 400.00,
        interest_amount: 50.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'pix',
        payment_type: 'parcela',
        balance_before: 5000.00,
        balance_after: 4600.00,
        observations: 'Pagamento da parcela 1'
      };

      const response = await request(app)
        .post('/api/financing-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment).toHaveProperty('id');
      expect(Number(response.body.payment.payment_amount)).toBeCloseTo(450.00, 2);
      expect(response.body.payment.financing_id).toBe(testFinancing.id);
      expect(response.body.payment.payment_method).toBe('pix');
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction.type).toBe('expense');
      expect(Number(response.body.transaction.amount)).toBeCloseTo(450.00, 2);
      expect(response.body.transaction.account_id).toBe(testAccount.id);
      expect(response.body.payment.transaction_id).toBe(response.body.transaction.id);
      
      // Verifica se o saldo da conta foi atualizado
      const updatedAccount = await Account.findByPk(testAccount.id);
      expect(Number(updatedAccount.balance)).toBeCloseTo(9550.00, 2);
    }, 30000); // Aumentando timeout para 30 segundos

    it('deve retornar erro para pagamento maior que o saldo devedor', async () => {
      const paymentData = {
        financing_id: testFinancing.id,
        account_id: testAccount.id,
        installment_number: 2, // Usando parcela 2 para evitar conflito com o primeiro teste
        payment_amount: 6000.00, // Maior que o saldo devedor (5000)
        principal_amount: 5500.00,
        interest_amount: 500.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'pix',
        payment_type: 'parcela',
        balance_before: 5000.00,
        balance_after: 0.00, // Não pode ser negativo, mas será rejeitado por outra validação
        observations: 'Pagamento maior que o saldo'
      };

      const response = await request(app)
        .post('/api/financing-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    }, 5000); // Reduzindo timeout para 5 segundos

    it('deve retornar erro para financiamento inexistente', async () => {
      const paymentData = {
        financing_id: 99999,
        account_id: testAccount.id,
        installment_number: 1,
        payment_amount: 450.00,
        principal_amount: 400.00,
        interest_amount: 50.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'pix',
        payment_type: 'parcela',
        balance_before: 5000.00,
        balance_after: 4600.00,
        observations: 'Pagamento para financiamento inexistente'
      };

      const response = await request(app)
        .post('/api/financing-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    }, 5000); // Reduzindo timeout para 5 segundos

    it('deve retornar erro para conta inexistente', async () => {
      const paymentData = {
        financing_id: testFinancing.id,
        account_id: 99999,
        installment_number: 1,
        payment_amount: 450.00,
        principal_amount: 400.00,
        interest_amount: 50.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'pix',
        payment_type: 'parcela',
        balance_before: 5000.00,
        balance_after: 4600.00,
        observations: 'Pagamento com conta inexistente'
      };

      const response = await request(app)
        .post('/api/financing-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    }, 5000); // Reduzindo timeout para 5 segundos

    it('deve retornar erro sem autenticação', async () => {
      const paymentData = {
        financing_id: testFinancing.id,
        account_id: testAccount.id,
        installment_number: 1,
        payment_amount: 450.00,
        principal_amount: 400.00,
        interest_amount: 50.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'pix',
        payment_type: 'parcela',
        balance_before: 5000.00,
        balance_after: 4600.00,
        observations: 'Pagamento sem autenticação'
      };

      const response = await request(app)
        .post('/api/financing-payments')
        .send(paymentData);

      expect(response.status).toBe(401);
    });
  });
}); 