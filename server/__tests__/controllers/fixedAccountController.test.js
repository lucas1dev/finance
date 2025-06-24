const { ValidationError, NotFoundError } = require('../../utils/errors');
const z = require('zod');

// Não importar controller nem schemas aqui!

jest.mock('../../models', () => ({
  FixedAccount: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Category: {
    findOne: jest.fn()
  },
  Supplier: {
    findOne: jest.fn()
  },
  Transaction: {
    create: jest.fn()
  },
  Account: {
    findOne: jest.fn()
  }
}));

describe('FixedAccountController', () => {
  let mockReq, mockRes;
  let fixedAccountController;
  let createFixedAccountSchema, updateFixedAccountSchema;
  let originalCreateParse, originalUpdateParse;
  let FixedAccount, Category, Supplier, Transaction, Account;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Reimporta os mocks e o controller após resetModules
    ({ FixedAccount, Category, Supplier, Transaction, Account } = require('../../models'));
    fixedAccountController = require('../../controllers/fixedAccountController');
    createFixedAccountSchema = fixedAccountController.createFixedAccountSchema;
    updateFixedAccountSchema = fixedAccountController.updateFixedAccountSchema;

    mockReq = {
      userId: 1,
      body: {},
      params: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Salva os métodos originais do schema exportado
    if (!originalCreateParse) {
      originalCreateParse = createFixedAccountSchema.parse;
    }
    if (!originalUpdateParse) {
      originalUpdateParse = updateFixedAccountSchema.parse;
    }
  });

  afterEach(() => {
    // Restaura o método parse original após cada teste
    createFixedAccountSchema.parse = originalCreateParse;
    updateFixedAccountSchema.parse = originalUpdateParse;
  });

  describe('createFixedAccount', () => {
    it('should create a fixed account with valid data', async () => {
      const accountData = {
        description: 'Netflix',
        amount: 29.90,
        periodicity: 'monthly',
        start_date: '2024-01-01',
        category_id: 1,
        supplier_id: 1,
        payment_method: 'card',
        observations: 'Assinatura Netflix',
        reminder_days: 3
      };
      const mockCategory = { id: 1, name: 'Entretenimento' };
      const mockSupplier = { id: 1, name: 'Netflix' };
      const mockFixedAccount = { 
        id: 1, 
        ...accountData, 
        user_id: 1,
        next_due_date: accountData.start_date,
        reload: jest.fn().mockResolvedValueOnce({ id: 1, ...accountData, user_id: 1 })
      };

      // Mock do parse do schema exportado
      createFixedAccountSchema.parse = jest.fn().mockReturnValue(accountData);

      // Mock dos modelos
      Category.findOne.mockResolvedValueOnce(mockCategory);
      Supplier.findOne.mockResolvedValueOnce(mockSupplier);
      FixedAccount.create.mockResolvedValueOnce(mockFixedAccount);

      mockReq.body = accountData;

      await fixedAccountController.createFixedAccount(mockReq, mockRes);

      expect(createFixedAccountSchema.parse).toHaveBeenCalledWith(accountData);
      expect(Category.findOne).toHaveBeenCalledWith({
        where: { id: accountData.category_id, user_id: mockReq.userId }
      });
      expect(Supplier.findOne).toHaveBeenCalledWith({
        where: { id: accountData.supplier_id, user_id: mockReq.userId }
      });
      expect(FixedAccount.create).toHaveBeenCalledWith({
        ...accountData,
        user_id: mockReq.userId,
        next_due_date: accountData.start_date
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockFixedAccount
      });
    });

    it('should handle validation errors', async () => {
      // Mock específico para este teste - simular erro de validação lançando ValidationError
      createFixedAccountSchema.parse = jest.fn().mockImplementationOnce(() => { throw new ValidationError('Dados inválidos', [{ message: 'Invalid data' }]); });

      mockReq.body = {};

      await expect(fixedAccountController.createFixedAccount(mockReq, mockRes))
        .rejects.toThrow(ValidationError);
    });

    it('should handle category not found', async () => {
      const accountData = {
        description: 'Netflix',
        amount: 29.90,
        periodicity: 'monthly',
        start_date: '2024-01-01',
        category_id: 999,
        supplier_id: 1
      };

      // Mock do parse do schema exportado
      createFixedAccountSchema.parse = jest.fn().mockReturnValue(accountData);

      // Mock específico para este teste
      Category.findOne.mockResolvedValueOnce(null);

      mockReq.body = accountData;

      await expect(fixedAccountController.createFixedAccount(mockReq, mockRes))
        .rejects.toThrow();
    });

    it('should handle supplier not found', async () => {
      const accountData = {
        description: 'Netflix',
        amount: 29.90,
        periodicity: 'monthly',
        start_date: '2024-01-01',
        category_id: 1,
        supplier_id: 999
      };
      const mockCategory = { id: 1, name: 'Entretenimento' };

      // Mock do parse do schema exportado
      createFixedAccountSchema.parse = jest.fn().mockReturnValue(accountData);

      // Mock específico para este teste
      Category.findOne.mockResolvedValueOnce(mockCategory);
      Supplier.findOne.mockResolvedValueOnce(null);

      mockReq.body = accountData;

      await expect(fixedAccountController.createFixedAccount(mockReq, mockRes))
        .rejects.toThrow();
    });
  });

  describe('getFixedAccounts', () => {
    it('should return all fixed accounts for user', async () => {
      const mockAccounts = [
        { id: 1, description: 'Netflix', amount: 29.90 },
        { id: 2, description: 'Spotify', amount: 19.90 }
      ];

      // Mock específico para este teste
      FixedAccount.findAll.mockResolvedValueOnce(mockAccounts);

      await fixedAccountController.getFixedAccounts(mockReq, mockRes);

      expect(FixedAccount.findAll).toHaveBeenCalledWith({
        where: { user_id: mockReq.userId },
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' }
        ],
        order: [['created_at', 'DESC']]
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccounts
      });
    });
  });

  describe('getFixedAccountById', () => {
    it('should return a specific fixed account', async () => {
      const mockAccount = { id: 1, description: 'Netflix', amount: 29.90 };

      // Mock específico para este teste
      FixedAccount.findOne.mockResolvedValueOnce(mockAccount);

      mockReq.params = { id: 1 };

      await fixedAccountController.getFixedAccountById(mockReq, mockRes);

      expect(FixedAccount.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: mockReq.userId },
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' }
        ]
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccount
      });
    });

    it('should return error when account is not found', async () => {
      // Mock específico para este teste
      FixedAccount.findOne.mockResolvedValueOnce(null);

      mockReq.params = { id: 999 };

      await expect(fixedAccountController.getFixedAccountById(mockReq, mockRes))
        .rejects.toThrow();
    });
  });

  describe('updateFixedAccount', () => {
    it('should update a fixed account with valid data', async () => {
      const updateData = {
        description: 'Netflix Premium',
        amount: 39.90
      };
      const mockAccount = { 
        id: 1, 
        ...updateData, 
        user_id: 1,
        update: jest.fn().mockResolvedValueOnce({ id: 1, ...updateData, user_id: 1 }),
        reload: jest.fn().mockResolvedValueOnce({ id: 1, ...updateData, user_id: 1 })
      };
      const mockCategory = { id: 1, name: 'Entretenimento' };

      // Mock do parse do schema exportado
      updateFixedAccountSchema.parse = jest.fn().mockReturnValue(updateData);

      FixedAccount.findOne.mockResolvedValueOnce(mockAccount);
      Category.findOne.mockResolvedValueOnce(mockCategory);

      mockReq.params = { id: 1 };
      mockReq.body = updateData;

      await fixedAccountController.updateFixedAccount(mockReq, mockRes);

      expect(updateFixedAccountSchema.parse).toHaveBeenCalledWith(updateData);
      expect(FixedAccount.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: mockReq.userId }
      });
      expect(mockAccount.update).toHaveBeenCalledWith(updateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccount
      });
    });

    it('should return error when account is not found', async () => {
      const updateData = { description: 'Netflix Premium' };

      // Mock do parse do schema exportado
      updateFixedAccountSchema.parse = jest.fn().mockReturnValue(updateData);

      // Mock específico para este teste
      FixedAccount.findOne.mockResolvedValueOnce(null);

      mockReq.params = { id: 999 };
      mockReq.body = updateData;

      await expect(fixedAccountController.updateFixedAccount(mockReq, mockRes))
        .rejects.toThrow();
    });
  });

  describe('toggleFixedAccount', () => {
    it('should toggle fixed account active status', async () => {
      let isActive = true;
      const mockAccount = {
        id: 1,
        description: 'Netflix',
        is_active: isActive,
        user_id: 1,
        update: jest.fn().mockImplementationOnce(function (data) { this.is_active = data.is_active; return Promise.resolve(this); }),
        reload: jest.fn().mockResolvedValueOnce({ id: 1, description: 'Netflix', is_active: false, user_id: 1 })
      };

      // Mock específico para este teste
      FixedAccount.findOne.mockResolvedValueOnce(mockAccount);

      mockReq.params = { id: 1 };

      await fixedAccountController.toggleFixedAccount(mockReq, mockRes);

      expect(FixedAccount.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: mockReq.userId }
      });
      expect(mockAccount.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ is_active: false })
      });
    });

    it('should return error when account is not found', async () => {
      // Mock específico para este teste
      FixedAccount.findOne.mockResolvedValueOnce(null);

      mockReq.params = { id: 999 };

      await expect(fixedAccountController.toggleFixedAccount(mockReq, mockRes))
        .rejects.toThrow();
    });
  });

  describe('payFixedAccount', () => {
    it('should mark fixed account as paid and create transaction', async () => {
      const mockAccount = {
        id: 1,
        description: 'Netflix',
        amount: 29.90,
        is_active: true,
        user_id: 1,
        next_due_date: '2024-01-15',
        periodicity: 'monthly',
        category_id: 1,
        supplier_id: 1,
        payment_method: 'card',
        update: jest.fn().mockImplementationOnce(function (data) { this.is_paid = true; return Promise.resolve(this); }),
        reload: jest.fn().mockResolvedValueOnce({ id: 1, description: 'Netflix', amount: 29.90, is_active: true, is_paid: true, user_id: 1 })
      };
      const mockTransaction = { id: 1, amount: 29.90, type: 'expense' };
      const mockBankAccount = { id: 1, name: 'Conta Corrente', initial_date: '2024-01-01' };

      // Mock específico para este teste
      FixedAccount.findOne.mockResolvedValueOnce(mockAccount);
      Transaction.create.mockResolvedValueOnce(mockTransaction);
      Account.findOne.mockResolvedValueOnce(mockBankAccount);

      mockReq.params = { id: 1 };
      mockReq.body = { payment_date: '2024-01-15' };

      await fixedAccountController.payFixedAccount(mockReq, mockRes);

      expect(FixedAccount.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: mockReq.userId },
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' }
        ]
      });
      expect(mockAccount.update).toHaveBeenCalledWith({ is_paid: true });
      expect(Transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 29.90,
          type: 'expense',
          user_id: mockReq.userId,
          fixed_account_id: 1
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTransaction,
        transaction: mockTransaction,
        message: 'Conta fixa paga com sucesso'
      });
    });

    it('should update account balance when marking fixed account as paid', async () => {
      const mockFixedAccount = {
        id: 1,
        description: 'Aluguel',
        amount: 1500.00,
        is_active: true,
        user_id: 1,
        next_due_date: '2024-01-15',
        periodicity: 'monthly',
        category_id: 1,
        supplier_id: 1,
        payment_method: 'automatic_debit',
        update: jest.fn().mockResolvedValue(true)
      };
      
      const mockBankAccount = {
        id: 1,
        balance: 5000.00,
        update: jest.fn().mockResolvedValue(true)
      };
      
      const mockTransaction = { id: 1, amount: 1500.00, type: 'expense' };

      FixedAccount.findOne.mockResolvedValueOnce(mockFixedAccount);
      Account.findOne.mockResolvedValueOnce(mockBankAccount);
      Transaction.create.mockResolvedValueOnce(mockTransaction);

      mockReq.params = { id: 1 };
      mockReq.body = { payment_date: '2024-01-15' };

      await fixedAccountController.payFixedAccount(mockReq, mockRes);

      // Verificar se o saldo da conta foi atualizado
      expect(mockBankAccount.update).toHaveBeenCalledWith({
        balance: 3500.00 // 5000 - 1500
      });
    });

    it('should throw error when account has insufficient balance', async () => {
      const mockFixedAccount = {
        id: 1,
        description: 'Aluguel',
        amount: 1500.00,
        is_active: true,
        user_id: 1,
        next_due_date: '2024-01-15',
        periodicity: 'monthly',
        category_id: 1,
        supplier_id: 1,
        payment_method: 'automatic_debit'
      };
      
      const mockBankAccount = {
        id: 1,
        balance: 1000.00 // Saldo insuficiente
      };

      FixedAccount.findOne.mockResolvedValueOnce(mockFixedAccount);
      Account.findOne.mockResolvedValueOnce(mockBankAccount);

      mockReq.params = { id: 1 };
      mockReq.body = { payment_date: '2024-01-15' };

      await expect(fixedAccountController.payFixedAccount(mockReq, mockRes))
        .rejects
        .toThrow('Saldo insuficiente na conta bancária');
    });

    it('should throw error when fixed account is inactive', async () => {
      const mockFixedAccount = {
        id: 1,
        description: 'Aluguel',
        amount: 1500.00,
        is_active: false, // Conta inativa
        user_id: 1,
        next_due_date: '2024-01-15',
        periodicity: 'monthly',
        category_id: 1,
        supplier_id: 1,
        payment_method: 'automatic_debit'
      };

      FixedAccount.findOne.mockResolvedValueOnce(mockFixedAccount);

      mockReq.params = { id: 1 };
      mockReq.body = { payment_date: '2024-01-15' };

      await expect(fixedAccountController.payFixedAccount(mockReq, mockRes))
        .rejects
        .toThrow('Conta fixa está inativa');
    });
  });

  describe('deleteFixedAccount', () => {
    it('should delete a fixed account', async () => {
      const mockAccount = { 
        id: 1, 
        description: 'Netflix', 
        user_id: 1,
        destroy: jest.fn().mockResolvedValueOnce(1)
      };

      // Mock específico para este teste
      FixedAccount.findOne.mockResolvedValueOnce(mockAccount);

      mockReq.params = { id: 1 };

      await fixedAccountController.deleteFixedAccount(mockReq, mockRes);

      expect(FixedAccount.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: mockReq.userId }
      });
      expect(mockAccount.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Conta fixa removida com sucesso'
      });
    });

    it('should return error when account is not found', async () => {
      // Mock específico para este teste
      FixedAccount.findOne.mockResolvedValueOnce(null);

      mockReq.params = { id: 999 };

      await expect(fixedAccountController.deleteFixedAccount(mockReq, mockRes))
        .rejects.toThrow();
    });
  });

  describe('getFixedAccountStatistics', () => {
    it('should return statistics for user fixed accounts', async () => {
      // Criar categorias e fornecedores de teste
      const category = await Category.create({
        user_id: testUser.id,
        name: 'Test Category',
        type: 'expense',
        color: '#FF0000'
      });

      const supplier = await Supplier.create({
        user_id: testUser.id,
        name: 'Test Supplier',
        document: '12345678901'
      });

      // Criar contas fixas de teste
      await FixedAccount.create({
        user_id: testUser.id,
        description: 'Test Account 1',
        amount: 100.00,
        periodicity: 'monthly',
        start_date: '2024-01-01',
        category_id: category.id,
        supplier_id: supplier.id,
        is_active: true,
        is_paid: false,
        next_due_date: '2024-12-01'
      });

      await FixedAccount.create({
        user_id: testUser.id,
        description: 'Test Account 2',
        amount: 200.00,
        periodicity: 'monthly',
        start_date: '2024-01-01',
        category_id: category.id,
        is_active: true,
        is_paid: true,
        next_due_date: '2024-11-01'
      });

      const req = {
        userId: testUser.id
      };

      const res = {
        json: jest.fn()
      };

      await fixedAccountController.getFixedAccountStatistics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          total: 2,
          totalAmount: 300.00,
          active: 2,
          inactive: 0,
          paid: 1,
          unpaid: 1,
          totalMonthlyValue: 300.00,
          totalYearlyValue: 3600.00,
          byPeriodicity: expect.objectContaining({
            monthly: 2
          }),
          byCategory: expect.objectContaining({
            'Test Category': expect.objectContaining({
              count: 2,
              totalAmount: 300.00
            })
          }),
          bySupplier: expect.objectContaining({
            'Test Supplier': expect.objectContaining({
              count: 1,
              totalAmount: 100.00
            })
          })
        })
      });
    });

    it('should return empty statistics when user has no fixed accounts', async () => {
      const req = {
        userId: testUser.id
      };

      const res = {
        json: jest.fn()
      };

      await fixedAccountController.getFixedAccountStatistics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          total: 0,
          totalAmount: 0,
          active: 0,
          inactive: 0,
          paid: 0,
          unpaid: 0,
          overdue: 0,
          dueThisMonth: 0,
          dueNextMonth: 0,
          totalMonthlyValue: 0,
          totalYearlyValue: 0,
          byPeriodicity: {
            daily: 0,
            weekly: 0,
            monthly: 0,
            quarterly: 0,
            yearly: 0
          },
          byCategory: {},
          bySupplier: {}
        })
      });
    });
  });
}); 