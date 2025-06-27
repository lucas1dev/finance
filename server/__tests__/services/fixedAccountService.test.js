/**
 * Testes unitários para o FixedAccountService
 */
const FixedAccountService = require('../../services/fixedAccountService');
const { FixedAccount, FixedAccountTransaction, Category, Supplier, Account, User, Transaction } = require('../../models');
const { sequelize } = require('../../utils/database');

// Mock dos modelos
jest.mock('../../models', () => ({
  FixedAccount: {
    create: jest.fn(),
    findAll: jest.fn(),
    calculateNextDueDate: jest.fn(),
    findOne: jest.fn()
  },
  FixedAccountTransaction: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn()
  },
  Category: {
    findByPk: jest.fn()
  },
  Supplier: {
    findByPk: jest.fn()
  },
  Account: {
    findByPk: jest.fn()
  },
  User: {
    findAll: jest.fn()
  },
  Transaction: {
    create: jest.fn()
  }
}));

// Mock do database
jest.mock('../../utils/database', () => ({
  sequelize: {
    transaction: jest.fn()
  }
}));

// Mock do TransactionService
jest.mock('../../services/transactionService', () => ({
  createFromFixedAccount: jest.fn(),
  updateAccountBalance: jest.fn()
}));

// Mock do logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('FixedAccountService', () => {
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };
    
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe('createFixedAccount', () => {
    const mockFixedAccountData = {
      user_id: 1,
      description: 'Aluguel',
      type: 'expense',
      amount: 1500.00,
      periodicity: 'monthly',
      start_date: '2024-01-01',
      category_id: 1,
      supplier_id: 1,
      account_id: 1
    };

    const mockCategory = {
      id: 1,
      name: 'Moradia',
      type: 'expense'
    };

    const mockFixedAccount = {
      id: 1,
      ...mockFixedAccountData,
      next_due_date: '2024-02-01'
    };

    const mockFirstTransaction = {
      id: 1,
      fixed_account_id: 1,
      user_id: 1,
      due_date: '2024-01-01',
      amount: 1500.00,
      status: 'pending'
    };

    it('deve criar uma conta fixa com sucesso', async () => {
      // Arrange
      Category.findByPk.mockResolvedValue(mockCategory);
      FixedAccount.calculateNextDueDate.mockReturnValue('2024-02-01');
      FixedAccount.create.mockResolvedValue(mockFixedAccount);
      FixedAccountTransaction.create.mockResolvedValue(mockFirstTransaction);

      // Act
      const result = await FixedAccountService.createFixedAccount(mockFixedAccountData);

      // Assert
      expect(result).toEqual({
        fixedAccount: mockFixedAccount,
        firstTransaction: mockFirstTransaction
      });
      expect(FixedAccount.create).toHaveBeenCalledWith({
        ...mockFixedAccountData,
        next_due_date: '2024-02-01'
      }, { transaction: mockTransaction });
      expect(FixedAccountTransaction.create).toHaveBeenCalledWith({
        fixed_account_id: 1,
        user_id: 1,
        due_date: '2024-01-01',
        amount: 1500.00,
        status: 'pending'
      }, { transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('deve lançar erro se dados obrigatórios não forem fornecidos', async () => {
      // Arrange
      const invalidData = {
        user_id: 1,
        description: 'Aluguel'
        // Faltam campos obrigatórios
      };

      // Act & Assert
      await expect(FixedAccountService.createFixedAccount(invalidData))
        .rejects.toThrow('Dados obrigatórios não fornecidos');
    });

    it('deve lançar erro se categoria não for encontrada', async () => {
      // Arrange
      Category.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(FixedAccountService.createFixedAccount(mockFixedAccountData))
        .rejects.toThrow('Categoria não encontrada');
    });

    it('deve lançar erro se tipo da categoria não for compatível', async () => {
      // Arrange
      const incompatibleCategory = { ...mockCategory, type: 'income' };
      Category.findByPk.mockResolvedValue(incompatibleCategory);

      // Act & Assert
      await expect(FixedAccountService.createFixedAccount(mockFixedAccountData))
        .rejects.toThrow('Categoria deve ser do tipo expense');
    });
  });

  describe('checkOverdueFixedAccounts', () => {
    const mockOverdueFixedAccounts = [
      {
        id: 1,
        user_id: 1,
        next_due_date: '2024-01-01',
        amount: 1500.00,
        periodicity: 'monthly',
        category: { id: 1, name: 'Moradia' },
        supplier: { id: 1, name: 'Imobiliária' },
        account: { id: 1, name: 'Conta Principal' }
      }
    ];

    const mockNewTransaction = {
      id: 1,
      fixed_account_id: 1,
      user_id: 1,
      due_date: '2024-01-01',
      amount: 1500.00,
      status: 'pending'
    };

    it('deve verificar contas fixas vencidas com sucesso', async () => {
      // Arrange
      FixedAccount.findAll.mockResolvedValue(mockOverdueFixedAccounts);
      FixedAccountTransaction.findOne.mockResolvedValue(null);
      FixedAccountTransaction.create.mockResolvedValue(mockNewTransaction);
      FixedAccount.calculateNextDueDate.mockReturnValue('2024-02-01');

      // Act
      const result = await FixedAccountService.checkOverdueFixedAccounts();

      // Assert
      expect(result).toEqual({
        processed: 1,
        newTransactions: 1,
        updatedAccounts: 1,
        errors: 0
      });
      expect(FixedAccountTransaction.create).toHaveBeenCalledWith({
        fixed_account_id: 1,
        user_id: 1,
        due_date: '2024-01-01',
        amount: 1500.00,
        status: 'pending'
      }, { transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('deve pular lançamentos que já existem', async () => {
      // Arrange
      FixedAccount.findAll.mockResolvedValue(mockOverdueFixedAccounts);
      FixedAccountTransaction.findOne.mockResolvedValue(mockNewTransaction); // Já existe

      // Act
      const result = await FixedAccountService.checkOverdueFixedAccounts();

      // Assert
      expect(result.errors).toBe(0);
      expect(FixedAccountTransaction.create).not.toHaveBeenCalled();
    });

    it('deve processar apenas usuário específico quando fornecido', async () => {
      // Arrange
      FixedAccount.findAll.mockResolvedValue(mockOverdueFixedAccounts);
      FixedAccountTransaction.findOne.mockResolvedValue(null);
      FixedAccountTransaction.create.mockResolvedValue(mockNewTransaction);
      FixedAccount.calculateNextDueDate.mockReturnValue('2024-02-01');

      // Act
      const result = await FixedAccountService.checkOverdueFixedAccounts(1);

      // Assert
      expect(FixedAccount.findAll).toHaveBeenCalledWith({
        where: {
          is_active: true,
          next_due_date: expect.any(Object),
          user_id: 1
        },
        include: expect.any(Array),
        transaction: mockTransaction
      });
    });
  });

  describe('payFixedAccountTransactions', () => {
    const mockPaymentData = {
      transaction_ids: [1, 2],
      payment_date: '2024-01-15',
      payment_method: 'card',
      observations: 'Pagamento realizado',
      account_id: 1
    };

    const mockAccount = {
      id: 1,
      balance: 5000.00
    };

    const mockTransactions = [
      {
        id: 1,
        user_id: 1,
        amount: 1500.00,
        status: 'pending',
        due_date: '2024-01-01',
        fixedAccount: {
          id: 1,
          type: 'expense',
          description: 'Aluguel',
          category_id: 1,
          supplier_id: 1
        }
      },
      {
        id: 2,
        user_id: 1,
        amount: 500.00,
        status: 'pending',
        due_date: '2024-01-01',
        fixedAccount: {
          id: 2,
          type: 'expense',
          description: 'Energia',
          category_id: 1,
          supplier_id: 1
        }
      }
    ];

    const mockFinancialTransaction = {
      id: 1,
      user_id: 1,
      account_id: 1,
      amount: 1500.00,
      type: 'expense'
    };

    it('deve registrar pagamento de lançamentos com sucesso', async () => {
      // Arrange
      Account.findByPk.mockResolvedValue(mockAccount);
      FixedAccountTransaction.findAll.mockResolvedValue(mockTransactions);
      const TransactionService = require('../../services/transactionService');
      TransactionService.createFromFixedAccount.mockResolvedValue(mockFinancialTransaction);
      TransactionService.updateAccountBalance.mockResolvedValue();

      // Act
      const result = await FixedAccountService.payFixedAccountTransactions(mockPaymentData);

      // Assert
      expect(result.paidTransactions).toHaveLength(2);
      expect(result.createdTransactions).toHaveLength(2);
      expect(result.totalAmount).toBe(2000.00);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('deve lançar erro se conta bancária não for encontrada', async () => {
      // Arrange
      Account.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(FixedAccountService.payFixedAccountTransactions(mockPaymentData))
        .rejects.toThrow('Conta bancária não encontrada');
    });

    it('deve lançar erro se saldo for insuficiente', async () => {
      // Arrange
      const lowBalanceAccount = { ...mockAccount, balance: 100.00 };
      Account.findByPk.mockResolvedValue(lowBalanceAccount);
      FixedAccountTransaction.findAll.mockResolvedValue(mockTransactions);

      // Act & Assert
      await expect(FixedAccountService.payFixedAccountTransactions(mockPaymentData))
        .rejects.toThrow('Saldo insuficiente na conta bancária');
    });

    it('deve lançar erro se nenhum lançamento válido for encontrado', async () => {
      // Arrange
      Account.findByPk.mockResolvedValue(mockAccount);
      FixedAccountTransaction.findAll.mockResolvedValue([]);

      // Act & Assert
      await expect(FixedAccountService.payFixedAccountTransactions(mockPaymentData))
        .rejects.toThrow('Nenhum lançamento válido encontrado');
    });
  });

  describe('listFixedAccountTransactions', () => {
    const mockFilters = {
      user_id: 1,
      status: 'pending',
      page: 1,
      limit: 20
    };

    const mockTransactions = [
      {
        id: 1,
        user_id: 1,
        due_date: '2024-01-01',
        amount: 1500.00,
        status: 'pending',
        fixedAccount: {
          id: 1,
          description: 'Aluguel',
          category: { id: 1, name: 'Moradia' },
          supplier: { id: 1, name: 'Imobiliária' }
        }
      }
    ];

    it('deve listar lançamentos com filtros', async () => {
      // Arrange
      FixedAccountTransaction.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockTransactions
      });

      // Act
      const result = await FixedAccountService.listFixedAccountTransactions(mockFilters);

      // Assert
      expect(result.transactions).toEqual(mockTransactions);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1
      });
    });

    it('deve aplicar filtros de data corretamente', async () => {
      // Arrange
      const filtersWithDate = {
        ...mockFilters,
        due_date_from: '2024-01-01',
        due_date_to: '2024-01-31'
      };

      FixedAccountTransaction.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });

      // Act
      await FixedAccountService.listFixedAccountTransactions(filtersWithDate);

      // Assert
      expect(FixedAccountTransaction.findAndCountAll).toHaveBeenCalledWith({
        where: expect.objectContaining({
          due_date: {
            gte: '2024-01-01',
            lte: '2024-01-31'
          }
        }),
        include: expect.any(Array),
        order: [['due_date', 'ASC']],
        limit: 20,
        offset: 0
      });
    });
  });

  describe('generateNotifications', () => {
    const mockFixedAccounts = [
      {
        id: 1,
        user_id: 1,
        next_due_date: '2024-01-15',
        reminder_days: 3,
        is_paid: false,
        user: { id: 1, name: 'João' },
        category: { id: 1, name: 'Moradia' }
      }
    ];

    it('deve gerar notificações para contas vencendo em breve', async () => {
      // Arrange
      const today = new Date('2024-01-12'); // 3 dias antes do vencimento
      jest.spyOn(global, 'Date').mockImplementation(() => today);
      
      FixedAccount.findAll.mockResolvedValue(mockFixedAccounts);

      // Act
      const result = await FixedAccountService.generateNotifications();

      // Assert
      expect(result.processed).toBe(1);
      expect(result.notifications).toBe(1);
    });

    it('deve processar apenas usuário específico quando fornecido', async () => {
      // Arrange
      FixedAccount.findAll.mockResolvedValue(mockFixedAccounts);

      // Act
      await FixedAccountService.generateNotifications(1);

      // Assert
      expect(FixedAccount.findAll).toHaveBeenCalledWith({
        where: {
          is_active: true,
          is_paid: false,
          user_id: 1
        },
        include: expect.any(Array)
      });
    });
  });
}); 