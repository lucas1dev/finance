// Mock dos modelos e serviços antes de qualquer require
jest.mock('../../models');
jest.mock('../../services/jobTracking');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

let processOverdueFixedAccounts;
let createFixedAccountNotifications;
let calculateNextDueDate;
let User, FixedAccount, Transaction, Account, Category, Supplier, Notification;
let jobTracking;

describe('FixedAccountJobs', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock explícito dos modelos
    const mockAccount = {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findOne: jest.fn().mockResolvedValue({ id: 1, balance: 1000, update: jest.fn() })
    };

    const mockTransaction = {
      create: jest.fn().mockResolvedValue({ id: 1 })
    };

    const mockNotification = {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findOne: jest.fn().mockResolvedValue(null)
    };

    const mockFixedAccount = {
      findAll: jest.fn().mockResolvedValue([
        { 
          id: 1, 
          user_id: 1, 
          account_id: 1, 
          amount: 100, 
          due_date: new Date(), 
          periodicity: 'monthly', 
          is_paid: false, 
          update: jest.fn(), 
          get: jest.fn().mockReturnValue({ id: 1 }) 
        }
      ])
    };

    const mockUser = {
      findByPk: jest.fn().mockResolvedValue({ id: 1 })
    };

    const mockJobTracking = {
      startJobTracking: jest.fn().mockResolvedValue({ id: 'test-execution-id' }),
      finishJobTracking: jest.fn()
    };

    // Aplicar mocks antes do require
    jest.doMock('../../models', () => ({
      User: mockUser,
      FixedAccount: mockFixedAccount,
      Transaction: mockTransaction,
      Account: mockAccount,
      Category: {},
      Supplier: {},
      Notification: mockNotification
    }));

    jest.doMock('../../services/jobTracking', () => mockJobTracking);

    // Agora importar os módulos
    const fixedAccountJobsModule = require('../../services/fixedAccountJobs');
    processOverdueFixedAccounts = fixedAccountJobsModule.processOverdueFixedAccounts;
    createFixedAccountNotifications = fixedAccountJobsModule.createFixedAccountNotifications;
    calculateNextDueDate = fixedAccountJobsModule.calculateNextDueDate;

    const models = require('../../models');
    User = models.User;
    FixedAccount = models.FixedAccount;
    Transaction = models.Transaction;
    Account = models.Account;
    Category = models.Category;
    Supplier = models.Supplier;
    Notification = models.Notification;

    jobTracking = require('../../services/jobTracking');
  });

  describe('calculateNextDueDate', () => {
    it('should calculate next due date for daily periodicity', () => {
      const currentDate = '2024-01-01';
      const result = calculateNextDueDate(currentDate, 'daily');
      expect(result).toBe('2024-01-02');
    });

    it('should calculate next due date for weekly periodicity', () => {
      const currentDate = '2024-01-01';
      const result = calculateNextDueDate(currentDate, 'weekly');
      expect(result).toBe('2024-01-08');
    });

    it('should calculate next due date for monthly periodicity', () => {
      const currentDate = '2024-01-01';
      const result = calculateNextDueDate(currentDate, 'monthly');
      expect(result).toBe('2024-02-01');
    });

    it('should calculate next due date for quarterly periodicity', () => {
      const currentDate = '2024-01-01';
      const result = calculateNextDueDate(currentDate, 'quarterly');
      expect(result).toBe('2024-04-01');
    });

    it('should calculate next due date for yearly periodicity', () => {
      const currentDate = '2024-01-01';
      const result = calculateNextDueDate(currentDate, 'yearly');
      expect(result).toBe('2025-01-01');
    });
  });

  describe('processOverdueFixedAccounts', () => {
    it('should process overdue fixed accounts and create transactions', async () => {
      const mockUser = { id: 1 };
      const mockAccount = { id: 1, balance: 1000, update: jest.fn() };
      const mockFixedAccount = {
        id: 1,
        amount: 100,
        description: 'Test Account',
        category_id: 1,
        supplier_id: 1,
        payment_method: 'automatic_debit',
        next_due_date: '2024-01-01',
        periodicity: 'monthly',
        update: jest.fn()
      };
      const mockTransaction = { id: 1 };

      User.findByPk.mockResolvedValue(mockUser);
      FixedAccount.findAll.mockResolvedValue([mockFixedAccount]);
      Account.findOne.mockResolvedValue(mockAccount);
      Transaction.create.mockResolvedValue(mockTransaction);

      await processOverdueFixedAccounts(1);

      expect(jobTracking.startJobTracking).toHaveBeenCalledWith('fixed_account_processing');
      expect(FixedAccount.findAll).toHaveBeenCalled();
      expect(Transaction.create).toHaveBeenCalledWith({
        user_id: 1,
        account_id: 1,
        type: 'expense',
        amount: 100,
        description: 'Pagamento automático: Test Account',
        category_id: 1,
        supplier_id: 1,
        payment_method: 'automatic_debit',
        payment_date: expect.any(Date),
        date: expect.any(Date),
        fixed_account_id: 1
      });
      expect(mockAccount.update).toHaveBeenCalledWith({
        balance: 900
      });
      expect(mockFixedAccount.update).toHaveBeenCalledWith({
        is_paid: true,
        next_due_date: '2024-02-01'
      });
      expect(jobTracking.finishJobTracking).toHaveBeenCalled();
    });

    it('should skip processing if insufficient balance', async () => {
      const mockUser = { id: 1 };
      const mockAccount = { id: 1, balance: 50 };
      const mockFixedAccount = {
        id: 1,
        amount: 100,
        description: 'Test Account',
        category_id: 1,
        supplier_id: 1,
        payment_method: 'automatic_debit',
        next_due_date: '2024-01-01',
        periodicity: 'monthly',
        update: jest.fn()
      };

      User.findByPk.mockResolvedValue(mockUser);
      FixedAccount.findAll.mockResolvedValue([mockFixedAccount]);
      Account.findOne.mockResolvedValue(mockAccount);

      await processOverdueFixedAccounts(1);

      expect(Transaction.create).not.toHaveBeenCalled();
      expect(mockFixedAccount.update).not.toHaveBeenCalled();
    });

    it('should create default account if none exists', async () => {
      const mockUser = { id: 1 };
      const mockFixedAccount = {
        id: 1,
        amount: 100,
        description: 'Test Account',
        category_id: 1,
        supplier_id: 1,
        payment_method: 'automatic_debit',
        next_due_date: '2024-01-01',
        periodicity: 'monthly',
        update: jest.fn()
      };
      const mockDefaultAccount = { id: 2, balance: 0, update: jest.fn() };
      const mockTransaction = { id: 1 };

      User.findByPk.mockResolvedValue(mockUser);
      FixedAccount.findAll.mockResolvedValue([mockFixedAccount]);
      Account.findOne.mockResolvedValue(null);
      Account.create.mockResolvedValue(mockDefaultAccount);
      Transaction.create.mockResolvedValue(mockTransaction);

      await processOverdueFixedAccounts(1);

      expect(Account.create).toHaveBeenCalledWith({
        user_id: 1,
        bank_name: 'Conta Padrão',
        account_type: 'corrente',
        balance: 0,
        description: 'Conta criada automaticamente para transações de contas fixas'
      });
    });
  });

  describe('createFixedAccountNotifications', () => {
    it('should create notifications for overdue fixed accounts', async () => {
      const mockUser = { id: 1 };
      const mockFixedAccount = {
        id: 1,
        description: 'Test Account',
        amount: 100,
        next_due_date: '2024-01-01'
      };

      User.findByPk.mockResolvedValue(mockUser);
      FixedAccount.findAll.mockResolvedValue([mockFixedAccount]);
      Notification.findOne.mockResolvedValue(null);
      Notification.create.mockResolvedValue({ id: 1 });

      await createFixedAccountNotifications(1);

      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 1,
        title: 'Conta Fixa Vencida',
        message: expect.stringContaining('Test Account'),
        type: 'fixed_account_overdue',
        priority: 'urgent',
        related_type: 'fixed_account',
        related_id: 1,
        is_read: false,
        is_active: true
      });
    });

    it('should create notifications for accounts due today', async () => {
      const mockUser = { id: 1 };
      const today = new Date().toISOString().split('T')[0];
      const mockFixedAccount = {
        id: 1,
        description: 'Test Account',
        amount: 100,
        next_due_date: today
      };

      User.findByPk.mockResolvedValue(mockUser);
      FixedAccount.findAll.mockResolvedValue([mockFixedAccount]);
      Notification.findOne.mockResolvedValue(null);
      Notification.create.mockResolvedValue({ id: 1 });

      await createFixedAccountNotifications(1);

      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 1,
        title: 'Conta Fixa Vence Hoje',
        message: expect.stringContaining('Test Account'),
        type: 'fixed_account_due_today',
        priority: 'high',
        related_type: 'fixed_account',
        related_id: 1,
        is_read: false,
        is_active: true
      });
    });

    it('should not create duplicate notifications', async () => {
      const mockUser = { id: 1 };
      const mockFixedAccount = {
        id: 1,
        description: 'Test Account',
        amount: 100,
        next_due_date: '2024-01-01'
      };

      User.findByPk.mockResolvedValue(mockUser);
      FixedAccount.findAll.mockResolvedValue([mockFixedAccount]);
      Notification.findOne.mockResolvedValue({ id: 1 }); // Notificação já existe

      await createFixedAccountNotifications(1);

      expect(Notification.create).not.toHaveBeenCalled();
    });
  });
}); 