const { FixedAccount, Category, Supplier, Transaction, User, Account } = require('../../models');
const fixedAccountController = require('../../controllers/fixedAccountController');
const { ValidationError, NotFoundError } = require('../../utils/errors');

// Mock dos modelos
jest.mock('../../models');

describe('FixedAccountController', () => {
  let mockReq;
  let mockRes;
  let mockUser;
  let mockCategory;
  let mockSupplier;

  beforeEach(() => {
    mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    };

    mockCategory = {
      id: 1,
      name: 'Aluguel',
      type: 'expense',
      user_id: 1
    };

    mockSupplier = {
      id: 1,
      name: 'Imobiliária ABC',
      document_type: 'CNPJ',
      document_number: '12345678000190',
      user_id: 1
    };

    mockReq = {
      userId: 1,
      body: {},
      params: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFixedAccount', () => {
    const validData = {
      description: 'Aluguel',
      amount: 1500.00,
      periodicity: 'monthly',
      start_date: '2024-01-01',
      category_id: 1,
      supplier_id: 1,
      payment_method: 'boleto',
      observations: 'Aluguel do apartamento',
      reminder_days: 3
    };

    it('should create a fixed account with valid data', async () => {
      mockReq.body = validData;

      Category.findOne.mockResolvedValue(mockCategory);
      Supplier.findOne.mockResolvedValue(mockSupplier);

      const mockFixedAccount = {
        id: 1,
        ...validData,
        user_id: 1,
        next_due_date: '2024-01-01',
        reload: jest.fn().mockResolvedValue({
          id: 1,
          ...validData,
          user_id: 1,
          category: mockCategory,
          supplier: mockSupplier
        })
      };

      FixedAccount.create.mockResolvedValue(mockFixedAccount);

      await fixedAccountController.createFixedAccount(mockReq, mockRes);

      expect(FixedAccount.create).toHaveBeenCalledWith({
        ...validData,
        user_id: 1,
        next_due_date: '2024-01-01'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 1,
          description: 'Aluguel'
        })
      });
    });

    it('should throw ValidationError for invalid data', async () => {
      mockReq.body = {
        description: '',
        amount: -100,
        periodicity: 'invalid'
      };

      await expect(fixedAccountController.createFixedAccount(mockReq, mockRes))
        .rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent category', async () => {
      mockReq.body = validData;
      Category.findOne.mockResolvedValue(null);

      await expect(fixedAccountController.createFixedAccount(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for non-existent supplier', async () => {
      mockReq.body = { ...validData, supplier_id: 999 };
      Category.findOne.mockResolvedValue(mockCategory);
      Supplier.findOne.mockResolvedValue(null);

      await expect(fixedAccountController.createFixedAccount(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getFixedAccounts', () => {
    it('should return all fixed accounts for user', async () => {
      const mockFixedAccounts = [
        {
          id: 1,
          description: 'Aluguel',
          amount: '1500.00',
          category: mockCategory,
          supplier: mockSupplier
        }
      ];

      FixedAccount.findAll.mockResolvedValue(mockFixedAccounts);

      await fixedAccountController.getFixedAccounts(mockReq, mockRes);

      expect(FixedAccount.findAll).toHaveBeenCalledWith({
        where: { user_id: 1 },
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' }
        ],
        order: [['created_at', 'DESC']]
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockFixedAccounts
      });
    });
  });

  describe('getFixedAccountById', () => {
    it('should return a specific fixed account', async () => {
      mockReq.params = { id: 1 };

      const mockFixedAccount = {
        id: 1,
        description: 'Aluguel',
        amount: '1500.00',
        category: mockCategory,
        supplier: mockSupplier
      };

      FixedAccount.findOne.mockResolvedValue(mockFixedAccount);

      await fixedAccountController.getFixedAccountById(mockReq, mockRes);

      expect(FixedAccount.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' }
        ]
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockFixedAccount
      });
    });

    it('should throw NotFoundError for non-existent fixed account', async () => {
      mockReq.params = { id: 999 };
      FixedAccount.findOne.mockResolvedValue(null);

      await expect(fixedAccountController.getFixedAccountById(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateFixedAccount', () => {
    it('should update a fixed account with valid data', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { amount: 1600.00, observations: 'Aumento do aluguel' };

      const mockFixedAccount = {
        id: 1,
        description: 'Aluguel',
        amount: '1500.00',
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockImplementation(function () {
          this.amount = '1600.00';
          this.observations = 'Aumento do aluguel';
          this.category = mockCategory;
          this.supplier = mockSupplier;
          return Promise.resolve(this);
        })
      };

      FixedAccount.findOne.mockResolvedValue(mockFixedAccount);

      await fixedAccountController.updateFixedAccount(mockReq, mockRes);

      expect(mockFixedAccount.update).toHaveBeenCalledWith({
        amount: 1600.00,
        observations: 'Aumento do aluguel'
      });
      expect(mockFixedAccount.reload).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockFixedAccount
      });
    });

    it('should throw NotFoundError for non-existent fixed account', async () => {
      mockReq.params = { id: 999 };
      mockReq.body = { amount: 1600.00 };
      FixedAccount.findOne.mockResolvedValue(null);

      await expect(fixedAccountController.updateFixedAccount(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('toggleFixedAccount', () => {
    it('should toggle fixed account active status', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { is_active: false };

      const mockFixedAccount = {
        id: 1,
        description: 'Aluguel',
        is_active: true,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockImplementation(function () {
          this.is_active = false;
          this.category = mockCategory;
          this.supplier = mockSupplier;
          return Promise.resolve(this);
        })
      };

      FixedAccount.findOne.mockResolvedValue(mockFixedAccount);

      await fixedAccountController.toggleFixedAccount(mockReq, mockRes);

      expect(mockFixedAccount.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockFixedAccount.reload).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockFixedAccount
      });
    });

    it('should throw NotFoundError for non-existent fixed account', async () => {
      mockReq.params = { id: 999 };
      mockReq.body = { is_active: false };
      FixedAccount.findOne.mockResolvedValue(null);

      await expect(fixedAccountController.toggleFixedAccount(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('payFixedAccount', () => {
    it('should mark fixed account as paid and create transaction', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { payment_date: '2024-01-15' };

      const mockFixedAccount = {
        id: 1,
        description: 'Aluguel',
        amount: '1500.00',
        is_active: true,
        category_id: 1,
        supplier_id: 1,
        payment_method: 'boleto',
        next_due_date: '2024-01-01',
        update: jest.fn().mockResolvedValue(true),
        category: mockCategory,
        supplier: mockSupplier
      };

      const mockTransaction = {
        id: 1,
        type: 'expense',
        amount: '1500.00',
        description: 'Aluguel'
      };

      // Mock simples que sempre retorna o objeto
      FixedAccount.findOne = jest.fn().mockResolvedValue(mockFixedAccount);
      Account.findOne = jest.fn().mockResolvedValue({ id: 1 });
      Transaction.create = jest.fn().mockResolvedValue(mockTransaction);

      await fixedAccountController.payFixedAccount(mockReq, mockRes);

      expect(Transaction.create).toHaveBeenCalledWith({
        user_id: 1,
        account_id: 1,
        type: 'expense',
        amount: '1500.00',
        description: 'Aluguel',
        category_id: 1,
        supplier_id: 1,
        payment_method: 'boleto',
        payment_date: '2024-01-15',
        fixed_account_id: 1
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTransaction,
        message: 'Conta fixa paga com sucesso'
      });
    });

    it('should throw NotFoundError for non-existent fixed account', async () => {
      mockReq.params = { id: 999 };
      mockReq.body = { payment_date: '2024-01-15' };
      FixedAccount.findOne.mockResolvedValue(null);

      await expect(fixedAccountController.payFixedAccount(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for inactive fixed account', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { payment_date: '2024-01-15' };

      const mockFixedAccount = {
        id: 1,
        description: 'Aluguel',
        is_active: false,
        category: mockCategory,
        supplier: mockSupplier
      };

      FixedAccount.findOne.mockResolvedValue(mockFixedAccount);

      await expect(fixedAccountController.payFixedAccount(mockReq, mockRes))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('deleteFixedAccount', () => {
    it('should delete a fixed account', async () => {
      mockReq.params = { id: 1 };

      const mockFixedAccount = {
        id: 1,
        description: 'Aluguel',
        destroy: jest.fn().mockResolvedValue(true)
      };

      FixedAccount.findOne.mockResolvedValue(mockFixedAccount);

      await fixedAccountController.deleteFixedAccount(mockReq, mockRes);

      expect(mockFixedAccount.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Conta fixa removida com sucesso'
      });
    });

    it('should throw NotFoundError for non-existent fixed account', async () => {
      mockReq.params = { id: 999 };
      FixedAccount.findOne.mockResolvedValue(null);

      await expect(fixedAccountController.deleteFixedAccount(mockReq, mockRes))
        .rejects.toThrow(NotFoundError);
    });
  });
}); 