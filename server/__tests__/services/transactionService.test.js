/**
 * Testes para o TransactionService
 * Testa a criação automática de transações a partir de outras entidades financeiras
 */
const TransactionService = require('../../services/transactionService');
const { Transaction, Account, User, Category, Supplier, Customer } = require('../../models');
const { sequelize } = require('../../config/database');

describe('TransactionService', () => {
  let testUser, testAccount, testCategory, testSupplier, testCustomer;

  beforeAll(async () => {
    // Criar dados de teste
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    testAccount = await Account.create({
      user_id: testUser.id,
      bank_name: 'Test Bank',
      account_type: 'checking',
      balance: 1000.00,
      description: 'Test Account'
    });

    testCategory = await Category.create({
      user_id: testUser.id,
      name: 'Test Category',
      type: 'expense',
      color: '#FF5722'
    });

    testSupplier = await Supplier.create({
      user_id: testUser.id,
      name: 'Test Supplier',
      document_type: 'CNPJ',
      document_number: '12345678000199'
    });

    testCustomer = await Customer.create({
      user_id: testUser.id,
      name: 'Test Customer',
      documentType: 'CPF',
      document: '12345678901'
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await Customer.destroy({ where: { id: testCustomer.id } });
    await Supplier.destroy({ where: { id: testSupplier.id } });
    await Category.destroy({ where: { id: testCategory.id } });
    await Account.destroy({ where: { id: testAccount.id } });
    await User.destroy({ where: { id: testUser.id } });
    await sequelize.close();
  });

  beforeEach(async () => {
    // Limpar transações antes de cada teste
    await Transaction.destroy({ where: {} });
  });

  describe('createFromPayablePayment', () => {
    it('deve criar uma transação de despesa a partir de pagamento de conta a pagar', async () => {
      const paymentData = {
        amount: 500.00,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        account_id: testAccount.id
      };

      const payableData = {
        id: 1,
        user_id: testUser.id,
        description: 'Conta de luz',
        category_id: testCategory.id,
        supplier_id: testSupplier.id,
        amount: 500.00
      };

      const transaction = await TransactionService.createFromPayablePayment(
        paymentData,
        payableData
      );

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('expense');
      expect(transaction.amount).toBe(500.00);
      expect(transaction.description).toBe('Pagamento: Conta de luz');
      expect(transaction.account_id).toBe(testAccount.id);
      expect(transaction.category_id).toBe(testCategory.id);
      expect(transaction.supplier_id).toBe(testSupplier.id);
      expect(transaction.user_id).toBe(testUser.id);
    });
  });

  describe('createFromReceivablePayment', () => {
    it('deve criar uma transação de receita a partir de recebimento de conta a receber', async () => {
      const paymentData = {
        amount: 1000.00,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        account_id: testAccount.id
      };

      const receivableData = {
        id: 1,
        user_id: testUser.id,
        description: 'Venda de produto',
        category_id: testCategory.id,
        amount: 1000.00
      };

      const transaction = await TransactionService.createFromReceivablePayment(
        paymentData,
        receivableData
      );

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('income');
      expect(transaction.amount).toBe(1000.00);
      expect(transaction.description).toBe('Recebimento: Venda de produto');
      expect(transaction.account_id).toBe(testAccount.id);
      expect(transaction.category_id).toBe(testCategory.id);
      expect(transaction.user_id).toBe(testUser.id);
    });

    it('deve criar uma transação de receita parcial com descrição apropriada', async () => {
      const paymentData = {
        amount: 300.00,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        account_id: testAccount.id
      };

      const receivableData = {
        id: 1,
        user_id: testUser.id,
        description: 'Venda de produto',
        category_id: testCategory.id,
        amount: 1000.00
      };

      const transaction = await TransactionService.createFromReceivablePayment(
        paymentData,
        receivableData
      );

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('income');
      expect(transaction.amount).toBe(300.00);
      expect(transaction.description).toBe('Recebimento parcial: Venda de produto (300/1000)');
    });
  });

  describe('createFromFinancingPayment', () => {
    it('deve criar uma transação de despesa a partir de pagamento de financiamento', async () => {
      const financingPaymentData = {
        id: 1,
        user_id: testUser.id,
        account_id: testAccount.id,
        installment_number: 5,
        payment_amount: 1200.00,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      const transaction = await TransactionService.createFromFinancingPayment(
        financingPaymentData
      );

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('expense');
      expect(transaction.amount).toBe(1200.00);
      expect(transaction.description).toBe('Parcela 5 - Financiamento');
      expect(transaction.account_id).toBe(testAccount.id);
      expect(transaction.user_id).toBe(testUser.id);
    });
  });

  describe('createFromFixedAccount', () => {
    it('deve criar uma transação de despesa a partir de conta fixa', async () => {
      const fixedAccountData = {
        id: 1,
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        supplier_id: testSupplier.id,
        description: 'Aluguel mensal',
        amount: 800.00,
        payment_method: 'automatic_debit'
      };

      const transaction = await TransactionService.createFromFixedAccount(
        fixedAccountData
      );

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('expense');
      expect(transaction.amount).toBe(800.00);
      expect(transaction.description).toBe('Conta Fixa: Aluguel mensal');
      expect(transaction.account_id).toBe(testAccount.id);
      expect(transaction.category_id).toBe(testCategory.id);
      expect(transaction.supplier_id).toBe(testSupplier.id);
      expect(transaction.fixed_account_id).toBe(1);
      expect(transaction.user_id).toBe(testUser.id);
    });
  });

  describe('updateAccountBalance', () => {
    it('deve atualizar o saldo da conta para transação de receita', async () => {
      const initialBalance = testAccount.balance;
      const amount = 500.00;

      await TransactionService.updateAccountBalance(
        testAccount.id,
        amount,
        'income'
      );

      const updatedAccount = await Account.findByPk(testAccount.id);
      expect(updatedAccount.balance).toBe(initialBalance + amount);
    });

    it('deve atualizar o saldo da conta para transação de despesa', async () => {
      const initialBalance = testAccount.balance;
      const amount = 300.00;

      await TransactionService.updateAccountBalance(
        testAccount.id,
        amount,
        'expense'
      );

      const updatedAccount = await Account.findByPk(testAccount.id);
      expect(updatedAccount.balance).toBe(initialBalance - amount);
    });

    it('deve lançar erro se a conta não existir', async () => {
      await expect(
        TransactionService.updateAccountBalance(99999, 100, 'income')
      ).rejects.toThrow('Conta ID 99999 não encontrada');
    });
  });

  describe('removeTransaction', () => {
    it('deve remover uma transação e reverter o saldo da conta', async () => {
      // Criar uma transação primeiro
      const transaction = await Transaction.create({
        user_id: testUser.id,
        account_id: testAccount.id,
        category_id: testCategory.id,
        type: 'expense',
        amount: 200.00,
        description: 'Test transaction',
        payment_date: new Date(),
        date: new Date()
      });

      const initialBalance = testAccount.balance;

      // Remover a transação
      await TransactionService.removeTransaction(transaction.id);

      // Verificar se a transação foi removida
      const deletedTransaction = await Transaction.findByPk(transaction.id);
      expect(deletedTransaction).toBeNull();

      // Verificar se o saldo foi revertido
      const updatedAccount = await Account.findByPk(testAccount.id);
      expect(updatedAccount.balance).toBe(initialBalance + 200.00);
    });

    it('deve lançar erro se a transação não existir', async () => {
      await expect(
        TransactionService.removeTransaction(99999)
      ).rejects.toThrow('Transação ID 99999 não encontrada');
    });
  });

  describe('Integração com transações do banco de dados', () => {
    it('deve criar transação dentro de uma transação do banco', async () => {
      const dbTransaction = await sequelize.transaction();

      try {
        const paymentData = {
          amount: 400.00,
          payment_date: '2024-01-15',
          payment_method: 'pix',
          account_id: testAccount.id
        };

        const payableData = {
          id: 1,
          user_id: testUser.id,
          description: 'Test payable',
          category_id: testCategory.id,
          supplier_id: testSupplier.id,
          amount: 400.00
        };

        const transaction = await TransactionService.createFromPayablePayment(
          paymentData,
          payableData,
          { transaction: dbTransaction }
        );

        expect(transaction).toBeDefined();
        expect(transaction.id).toBeDefined();

        await dbTransaction.commit();
      } catch (error) {
        await dbTransaction.rollback();
        throw error;
      }
    });
  });
}); 