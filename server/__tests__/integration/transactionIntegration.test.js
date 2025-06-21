/**
 * Testes de Integração - Financiamentos e Transações
 * Verifica a integração entre o sistema de financiamentos e o sistema de transações
 */

jest.setTimeout(30000);

const request = require('supertest');
const app = require('../../app');
const { 
  createTestUser,
  createTestCategory,
  createTestAccount,
  createTestCreditor,
  createTestFinancing,
  generateAuthToken
} = require('./factories');
const { cleanAllTestData } = require('./setup');

describe('Transaction Integration Tests', () => {
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
    // Limpeza completa de dados
    await cleanAllTestData();

    // Criar usuário de teste e gerar token
    testUser = await createTestUser({ email: 'testtransactionintegration@example.com', name: 'Test User Transaction Integration' });
    authToken = generateAuthToken(testUser);

    // Criar dados obrigatórios
    testCategory = await createTestCategory({ 
      user_id: testUser.id,
      name: 'Financiamentos',
      type: 'expense',
      color: '#FF0000'
    });
    
    testAccount = await createTestAccount({ 
      user_id: testUser.id,
      balance: 10000.00 // Saldo inicial maior para os testes
    });
    
    testCreditor = await createTestCreditor({ 
      user_id: testUser.id,
      document_number: `9876543200019${Date.now()}` // Garantir unicidade
    });

    // Criar financiamento de teste com dados específicos
    testFinancing = await createTestFinancing({
      description: 'Financiamento Teste Integração',
      amount: 5000.00,
      interest_rate: 0.0150, // 1.5% em decimal
      term_months: 12,
      payment_method: 'boleto',
      amortization_method: 'SAC',
      creditor_id: testCreditor.id,
      account_id: testAccount.id,
      user_id: testUser.id,
      start_date: new Date(),
      is_active: true,
    });
  });

  describe('Integração Financiamento-Transação', () => {
    it('deve criar transação automaticamente ao registrar pagamento de financiamento', async () => {
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
        observations: 'Pagamento da parcela 1 - Teste Integração'
      };

      const response = await request(app)
        .post('/api/financing-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction.type).toBe('expense');
      expect(Number(response.body.transaction.amount)).toBeCloseTo(450.00, 2);
      expect(response.body.transaction.account_id).toBe(testAccount.id);
      expect(response.body.transaction.category_id).toBe(testCategory.id);
      expect(response.body.transaction.description).toContain('Pagamento parcela 1');
      expect(response.body.transaction.description).toContain(testFinancing.description);

      // Verificar se a transação foi salva no banco
      const { Transaction } = require('../../models');
      const savedTransaction = await Transaction.findByPk(response.body.transaction.id);
      expect(savedTransaction).toBeTruthy();
      expect(savedTransaction.user_id).toBe(testUser.id);
      expect(savedTransaction.payment_method).toBe('pix');
    });

    it('deve atualizar o saldo da conta ao registrar pagamento', async () => {
      // Buscar o saldo atual da conta (pode ter mudado após testes anteriores)
      const { Account } = require('../../models');
      const currentAccount = await Account.findByPk(testAccount.id);
      const initialBalance = Number(currentAccount.balance);
      
      const paymentData = {
        financing_id: testFinancing.id,
        account_id: testAccount.id,
        installment_number: 2,
        payment_amount: 445.00,
        principal_amount: 400.00,
        interest_amount: 45.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'transferencia',
        payment_type: 'parcela',
        balance_before: 4600.00,
        balance_after: 4200.00,
        observations: 'Pagamento da parcela 2 - Teste Saldo'
      };

      const response = await request(app)
        .post('/api/financing-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);

      // Verificar se o saldo da conta foi atualizado
      const updatedAccount = await Account.findByPk(testAccount.id);
      const expectedBalance = initialBalance - paymentData.payment_amount;
      expect(Number(updatedAccount.balance)).toBeCloseTo(expectedBalance, 2);
    });

    it('deve criar transação com categoria correta', async () => {
      const paymentData = {
        financing_id: testFinancing.id,
        account_id: testAccount.id,
        installment_number: 3,
        payment_amount: 440.00,
        principal_amount: 400.00,
        interest_amount: 40.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'boleto',
        payment_type: 'parcela',
        balance_before: 4200.00,
        balance_after: 3800.00,
        observations: 'Pagamento da parcela 3 - Teste Categoria'
      };

      const response = await request(app)
        .post('/api/financing-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      
      // Verificar se a transação foi criada com a categoria correta
      const { Transaction, Category } = require('../../models');
      const transaction = await Transaction.findByPk(response.body.transaction.id, {
        include: [{ model: Category, as: 'category' }]
      });
      
      expect(transaction.category).toBeTruthy();
      expect(transaction.category.id).toBe(testCategory.id);
      expect(transaction.category.name).toBe(testCategory.name);
      expect(transaction.category.type).toBe('expense');
    });

    it('deve manter consistência entre FinancingPayment e Transaction', async () => {
      const paymentData = {
        financing_id: testFinancing.id,
        account_id: testAccount.id,
        installment_number: 4,
        payment_amount: 435.00,
        principal_amount: 400.00,
        interest_amount: 35.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cartao',
        payment_type: 'parcela',
        balance_before: 3800.00,
        balance_after: 3400.00,
        observations: 'Pagamento da parcela 4 - Teste Consistência'
      };

      const response = await request(app)
        .post('/api/financing-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      
      // Verificar consistência entre FinancingPayment e Transaction
      const { FinancingPayment, Transaction } = require('../../models');
      const payment = await FinancingPayment.findByPk(response.body.payment.id);
      expect(payment.transaction_id).toBe(response.body.transaction.id);
      
      // Buscar a transação diretamente pelo ID
      const transaction = await Transaction.findByPk(payment.transaction_id);
      expect(transaction).toBeTruthy();
      expect(transaction.id).toBe(response.body.transaction.id);
      expect(Number(transaction.amount)).toBeCloseTo(paymentData.payment_amount, 2);
      expect(transaction.type).toBe('expense');
    });

    it('deve listar transações relacionadas ao financiamento', async () => {
      // Criar alguns pagamentos primeiro
      const { FinancingPayment } = require('../../models');
      
      // Criar pagamento 1
      await request(app)
        .post('/api/financing-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
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
        });

      // Criar pagamento 2
      await request(app)
        .post('/api/financing-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          financing_id: testFinancing.id,
          account_id: testAccount.id,
          installment_number: 2,
          payment_amount: 445.00,
          principal_amount: 400.00,
          interest_amount: 45.00,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'transferencia',
          payment_type: 'parcela',
          balance_before: 4600.00,
          balance_after: 4200.00,
          observations: 'Pagamento da parcela 2'
        });
      
      // Buscar todos os pagamentos do financiamento
      const payments = await FinancingPayment.findAll({
        where: {
          user_id: testUser.id,
          financing_id: testFinancing.id
        }
      });
      const transactionIds = payments.map(p => p.transaction_id).filter(Boolean);
      
      // Buscar transações relacionadas
      const { Transaction } = require('../../models');
      const transactions = await Transaction.findAll({
        where: {
          id: transactionIds,
          user_id: testUser.id
        },
        order: [['created_at', 'DESC']]
      });

      expect(transactions.length).toBeGreaterThan(0);
      // Verificar se todas as transações são do tipo expense
      transactions.forEach(transaction => {
        expect(transaction.type).toBe('expense');
        expect(transaction.user_id).toBe(testUser.id);
      });
    });
  });

  describe('Validações de Integração', () => {
    it('deve falhar ao tentar criar pagamento sem categoria de despesa', async () => {
      // Deletar categoria temporariamente
      await testCategory.destroy();

      const paymentData = {
        financing_id: testFinancing.id,
        account_id: testAccount.id,
        installment_number: 5,
        payment_amount: 430.00,
        principal_amount: 400.00,
        interest_amount: 30.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'pix',
        payment_type: 'parcela',
        balance_before: 3400.00,
        balance_after: 3000.00,
        observations: 'Pagamento da parcela 5 - Teste Sem Categoria'
      };

      const response = await request(app)
        .post('/api/financing-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('categoria de despesa');

      // Recriar categoria para outros testes
      const { Category } = require('../../models');
      testCategory = await Category.create({
        name: 'Categoria Teste Recriada',
        type: 'expense',
        user_id: testUser.id,
        color: '#FF0000'
      });
    });
  });
}); 