/**
 * Testes unitários para FinancingPaymentController
 * Testa operações CRUD, validações e integração com transações
 */

// Mock dos models Sequelize - DEVE SER A PRIMEIRA LINHA
jest.mock('../../models', () => ({
  Financing: { 
    findOne: jest.fn(), 
    update: jest.fn(),
    findAll: jest.fn()
  },
  Account: { 
    findOne: jest.fn(), 
    update: jest.fn()
  },
  FinancingPayment: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    findAndCountAll: jest.fn()
  },
  Category: { findOne: jest.fn() },
  Transaction: { create: jest.fn() },
  Creditor: { findOne: jest.fn() },
  sequelize: { transaction: jest.fn() }
}));

// Mock dos validadores
jest.mock('../../utils/financingPaymentValidators', () => ({
  createFinancingPaymentSchema: {
    parse: jest.fn()
  },
  updateFinancingPaymentSchema: {
    parse: jest.fn()
  },
  listFinancingPaymentsSchema: {
    parse: jest.fn()
  },
  payInstallmentSchema: {
    parse: jest.fn()
  },
  earlyPaymentSchema: {
    parse: jest.fn()
  }
}));

// Mock dos cálculos
jest.mock('../../utils/financingCalculations', () => ({
  generateAmortizationTable: jest.fn(),
  calculateUpdatedBalance: jest.fn()
}));

// Agora os requires dos models e do controller
const { Financing, Account, FinancingPayment, Category, Transaction, sequelize } = require('../../models');
const { 
  createFinancingPaymentSchema, 
  updateFinancingPaymentSchema, 
  listFinancingPaymentsSchema,
  payInstallmentSchema,
  earlyPaymentSchema
} = require('../../utils/financingPaymentValidators');
const { ValidationError, NotFoundError } = require('../../utils/errors');

// Importar o controller DEPOIS de todos os mocks
const financingPaymentController = require('../../controllers/financingPaymentController');

describe('Financing Payment Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      userId: 1
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Limpar todos os mocks
    jest.clearAllMocks();

    // Configurar mocks padrão que funcionam para a maioria dos testes
    Financing.findOne.mockResolvedValue({
      id: 1,
      user_id: 1,
      description: 'Financiamento teste',
      current_balance: 10000,
      total_amount: 10000,
      term_months: 12,
      update: jest.fn().mockResolvedValue()
    });

    Account.findOne.mockResolvedValue({
      id: 1,
      user_id: 1,
      balance: 5000,
      update: jest.fn().mockResolvedValue()
    });

    FinancingPayment.findOne.mockResolvedValue(null);
    FinancingPayment.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0
    });

    Category.findOne.mockResolvedValue({
      id: 1,
      user_id: 1,
      type: 'expense'
    });

    sequelize.transaction.mockResolvedValue({
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue()
    });

    Transaction.create.mockResolvedValue({
      id: 1,
      user_id: 1,
      account_id: 1,
      category_id: 1,
      type: 'expense',
      amount: 1000,
      description: 'Pagamento teste',
      date: '2024-01-15',
      payment_method: 'pix',
      payment_date: '2024-01-15'
    });

    FinancingPayment.create.mockResolvedValue({
      id: 1,
      financing_id: 1,
      account_id: 1,
      installment_number: 1,
      payment_amount: 1000,
      principal_amount: 800,
      interest_amount: 200,
      payment_date: '2024-01-15',
      payment_method: 'pix',
      payment_type: 'parcela',
      balance_before: 10000,
      balance_after: 9200,
      user_id: 1,
      transaction_id: 1
    });

    FinancingPayment.findAll.mockResolvedValue([]);
    FinancingPayment.findByPk.mockResolvedValue({
      id: 1,
      financing_id: 1,
      account_id: 1,
      installment_number: 1,
      payment_amount: 1000,
      payment_date: '2024-01-15',
      payment_method: 'pix',
      transaction: { id: 1 },
      account: { id: 1 }
    });
  });

  describe('createFinancingPayment', () => {
    it('deve criar um pagamento de financiamento com sucesso', async () => {
      // Arrange
      const paymentData = {
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        principal_amount: 800,
        interest_amount: 200,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        payment_type: 'parcela',
        balance_before: 10000,
        balance_after: 9200
      };

      mockReq.body = paymentData;
      mockReq.userId = 1;

      createFinancingPaymentSchema.parse.mockReturnValue(paymentData);

      // Act
      await financingPaymentController.createFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Pagamento de financiamento criado com sucesso',
        payment: expect.any(Object)
      });
    });

    it('deve retornar erro se financiamento não for encontrado', async () => {
      const paymentData = {
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        principal_amount: 800,
        interest_amount: 200,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        payment_type: 'parcela',
        balance_before: 10000,
        balance_after: 9200
      };

      mockReq.body = paymentData;
      mockReq.userId = 1;

      createFinancingPaymentSchema.parse.mockReturnValue(paymentData);
      Financing.findOne.mockResolvedValue(null);

      await expect(financingPaymentController.createFinancingPayment(mockReq, mockRes))
        .rejects.toThrow('Financiamento não encontrado');
    });

    it('deve retornar erro se conta não for encontrada', async () => {
      const paymentData = {
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        principal_amount: 800,
        interest_amount: 200,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        payment_type: 'parcela',
        balance_before: 10000,
        balance_after: 9200
      };

      mockReq.body = paymentData;
      mockReq.userId = 1;

      createFinancingPaymentSchema.parse.mockReturnValue(paymentData);
      Account.findOne.mockResolvedValue(null);

      await expect(financingPaymentController.createFinancingPayment(mockReq, mockRes))
        .rejects.toThrow('Conta não encontrada');
    });

    it('deve retornar erro se parcela já foi paga', async () => {
      const paymentData = {
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        principal_amount: 800,
        interest_amount: 200,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        payment_type: 'parcela',
        balance_before: 10000,
        balance_after: 9200
      };

      mockReq.body = paymentData;
      mockReq.userId = 1;

      createFinancingPaymentSchema.parse.mockReturnValue(paymentData);
      FinancingPayment.findOne.mockResolvedValue({ id: 1 });

      await expect(financingPaymentController.createFinancingPayment(mockReq, mockRes))
        .rejects.toThrow('Esta parcela já foi paga');
    });

    it('deve retornar erro se não encontrar categoria de despesa', async () => {
      const paymentData = {
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        principal_amount: 800,
        interest_amount: 200,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        payment_type: 'parcela',
        balance_before: 10000,
        balance_after: 9200
      };

      mockReq.body = paymentData;
      mockReq.userId = 1;

      createFinancingPaymentSchema.parse.mockReturnValue(paymentData);
      Category.findOne.mockResolvedValue(null);

      await expect(financingPaymentController.createFinancingPayment(mockReq, mockRes))
        .rejects.toThrow('Nenhuma categoria de despesa encontrada');
    });

    it('deve retornar erro de validação para dados inválidos', async () => {
      mockReq.body = {};
      mockReq.userId = 1;
      const validationError = { name: 'ZodError', errors: [{ message: 'Required', path: ['financing_id'] }] };
      createFinancingPaymentSchema.parse.mockImplementation(() => { throw validationError; });
      await expect(financingPaymentController.createFinancingPayment(mockReq, mockRes))
        .rejects.toThrow('Dados inválidos');
    });
  });

  describe('listFinancingPayments', () => {
    it('deve listar pagamentos com sucesso', async () => {
      // Arrange
      const mockPayments = [
        {
          id: 1,
          financing_id: 1,
          account_id: 1,
          installment_number: 1,
          payment_amount: 1000,
          payment_date: '2024-01-15',
          payment_method: 'pix',
          financing: {
            id: 1,
            description: 'Financiamento teste',
            creditor: { id: 1, name: 'Banco teste' }
          },
          account: {
            id: 1,
            account_type: 'corrente',
            bank_name: 'Banco teste'
          }
        }
      ];

      mockReq.query = { financing_id: 1, page: 1, limit: 10 };
      mockReq.userId = 1;

      listFinancingPaymentsSchema.parse.mockReturnValue({ financing_id: 1, page: 1, limit: 10 });
      FinancingPayment.findAndCountAll.mockResolvedValue({
        rows: mockPayments,
        count: 1
      });

      // Act
      await financingPaymentController.listFinancingPayments(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        payments: mockPayments,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    });

    it('deve lidar com erro de validação', async () => {
      mockReq.query = { financing_id: 'invalid' };
      mockReq.userId = 1;
      const validationError = { name: 'ZodError', errors: [{ message: 'Invalid financing_id', path: ['financing_id'] }] };
      listFinancingPaymentsSchema.parse.mockImplementation(() => { throw validationError; });
      await expect(financingPaymentController.listFinancingPayments(mockReq, mockRes))
        .rejects.toThrow('Parâmetros de consulta inválidos');
    });
  });

  describe('getFinancingPayment', () => {
    it('deve obter um pagamento específico', async () => {
      // Arrange
      const mockPayment = {
        id: 1,
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        financing: {
          id: 1,
          description: 'Financiamento teste'
        },
        account: {
          id: 1,
          account_type: 'corrente'
        }
      };

      mockReq.params = { id: 1 };
      mockReq.userId = 1;

      FinancingPayment.findOne.mockResolvedValue(mockPayment);

      // Act
      await financingPaymentController.getFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({ payment: mockPayment });
    });

    it('deve retornar erro se pagamento não for encontrado', async () => {
      mockReq.params = { id: 999 };
      mockReq.userId = 1;
      FinancingPayment.findOne.mockResolvedValue(null);
      await expect(financingPaymentController.getFinancingPayment(mockReq, mockRes))
        .rejects.toThrow('Pagamento não encontrado');
    });
  });

  describe('updateFinancingPayment', () => {
    it('deve atualizar um pagamento com sucesso', async () => {
      // Arrange
      const updateData = {
        payment_amount: 1200,
        payment_date: '2024-01-20'
      };

      const mockPayment = {
        id: 1,
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        update: jest.fn().mockResolvedValue()
      };

      mockReq.params = { id: 1 };
      mockReq.body = updateData;
      mockReq.userId = 1;

      updateFinancingPaymentSchema.parse.mockReturnValue(updateData);
      FinancingPayment.findOne.mockResolvedValue(mockPayment);

      // Act
      await financingPaymentController.updateFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Pagamento de financiamento atualizado com sucesso',
        payment: mockPayment
      });
    });

    it('deve retornar erro se pagamento não for encontrado', async () => {
      mockReq.params = { id: 999 };
      mockReq.body = { payment_amount: 1200 };
      mockReq.userId = 1;
      FinancingPayment.findOne.mockResolvedValue(null);
      await expect(financingPaymentController.updateFinancingPayment(mockReq, mockRes))
        .rejects.toThrow('Pagamento não encontrado');
    });

    it('deve retornar erro de validação para dados inválidos', async () => {
      const mockPayment = {
        id: 1,
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        update: jest.fn().mockResolvedValue()
      };

      mockReq.params = { id: 1 };
      mockReq.body = { payment_amount: 'invalid' };
      mockReq.userId = 1;
      
      FinancingPayment.findOne.mockResolvedValue(mockPayment);
      const validationError = { name: 'ZodError', errors: [{ message: 'Invalid payment_amount', path: ['payment_amount'] }] };
      updateFinancingPaymentSchema.parse.mockImplementation(() => { throw validationError; });
      
      await expect(financingPaymentController.updateFinancingPayment(mockReq, mockRes))
        .rejects.toThrow('Dados inválidos');
    });
  });

  describe('deleteFinancingPayment', () => {
    it('deve deletar um pagamento com sucesso', async () => {
      // Arrange
      const mockPayment = {
        id: 1,
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        transaction_id: null,
        destroy: jest.fn().mockResolvedValue()
      };

      mockReq.params = { id: 1 };
      mockReq.userId = 1;

      FinancingPayment.findOne.mockResolvedValue(mockPayment);

      // Act
      await financingPaymentController.deleteFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Pagamento de financiamento deletado com sucesso'
      });
    });

    it('deve retornar erro se pagamento não for encontrado', async () => {
      mockReq.params = { id: 999 };
      mockReq.userId = 1;
      FinancingPayment.findOne.mockResolvedValue(null);
      await expect(financingPaymentController.deleteFinancingPayment(mockReq, mockRes))
        .rejects.toThrow('Pagamento não encontrado');
    });

    it('deve retornar erro se pagamento tiver transação vinculada', async () => {
      const mockPayment = {
        id: 1,
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        transaction_id: 1
      };

      mockReq.params = { id: 1 };
      mockReq.userId = 1;

      FinancingPayment.findOne.mockResolvedValue(mockPayment);

      await expect(financingPaymentController.deleteFinancingPayment(mockReq, mockRes))
        .rejects.toThrow('Não é possível deletar um pagamento que possui transação vinculada');
    });
  });

  describe('payInstallment', () => {
    it('deve pagar uma parcela com sucesso', async () => {
      // Arrange
      const paymentData = {
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        payment_method: 'pix',
        payment_date: '2024-01-15'
      };

      mockReq.body = paymentData;
      mockReq.params = { financingId: 1, installmentNumber: 1 };
      mockReq.userId = 1;

      payInstallmentSchema.parse.mockReturnValue(paymentData);

      // Act
      await financingPaymentController.payInstallment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Parcela paga com sucesso',
        payment: expect.any(Object)
      });
    });

    it('deve retornar erro se parcela já foi paga', async () => {
      const paymentData = {
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        payment_method: 'pix',
        payment_date: '2024-01-15'
      };

      mockReq.body = paymentData;
      mockReq.params = { financingId: 1, installmentNumber: 1 };
      mockReq.userId = 1;

      payInstallmentSchema.parse.mockReturnValue(paymentData);
      FinancingPayment.findOne.mockResolvedValue({ id: 1 });

      await expect(financingPaymentController.payInstallment(mockReq, mockRes))
        .rejects.toThrow('Esta parcela já foi paga');
    });
  });

  describe('registerEarlyPayment', () => {
    it('deve registrar pagamento antecipado com sucesso', async () => {
      // Arrange
      const paymentData = {
        financing_id: 1,
        account_id: 1,
        payment_amount: 5000,
        payment_method: 'pix',
        payment_date: '2024-01-15',
        preference: 'reducao_prazo'
      };

      mockReq.body = paymentData;
      mockReq.params = { financingId: 1 };
      mockReq.userId = 1;

      earlyPaymentSchema.parse.mockReturnValue(paymentData);

      // Act
      await financingPaymentController.registerEarlyPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Pagamento antecipado registrado com sucesso',
        payment: expect.any(Object)
      });
    });

    it('deve retornar erro se valor for maior que saldo devedor', async () => {
      const paymentData = {
        financing_id: 1,
        account_id: 1,
        payment_amount: 15000,
        payment_method: 'pix',
        payment_date: '2024-01-15',
        preference: 'reducao_prazo'
      };

      mockReq.body = paymentData;
      mockReq.params = { financingId: 1 };
      mockReq.userId = 1;

      earlyPaymentSchema.parse.mockReturnValue(paymentData);
      Financing.findOne.mockResolvedValue({ id: 1, user_id: 1, current_balance: 10000, total_amount: 10000, term_months: 12 });

      await expect(financingPaymentController.registerEarlyPayment(mockReq, mockRes))
        .rejects.toThrow('Valor do pagamento antecipado deve ser menor que o saldo devedor');
    });
  });
}); 