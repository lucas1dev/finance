/**
 * Testes unitários para o TransactionController
 * @author Lucas Santos
 */

// Mock do service antes de importar o controller
jest.mock('../../services/transactionService', () => ({
  createTransaction: jest.fn(),
  getTransactions: jest.fn(),
  getTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
  getTransactionStats: jest.fn(),
  getTimelineData: jest.fn(),
  getCategoryChartData: jest.fn()
}));

// Mock dos modelos
jest.mock('../../models', () => ({
  Transaction: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    sum: jest.fn(),
    findAndCountAll: jest.fn()
  },
  Account: {
    findOne: jest.fn(),
    update: jest.fn()
  },
  Category: {
    findOne: jest.fn()
  }
}));

// Mock das validações
jest.mock('../../utils/validators', () => ({
  createTransactionSchema: {
    parse: jest.fn()
  },
  updateTransactionSchema: {
    parse: jest.fn()
  }
}));

// Mock dos erros
jest.mock('../../utils/errors', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.name = 'AppError';
      this.statusCode = statusCode;
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(message, errors) {
      super(message);
      this.name = 'ValidationError';
      this.errors = errors;
    }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = 'NotFoundError';
    }
  }
}));

// Mock do logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

let transactionController;
let transactionService;
let createTransactionSchema, updateTransactionSchema;
let AppError;

describe('TransactionController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reimportar para garantir mocks limpos
    jest.resetModules();
    transactionController = require('../../controllers/transactionController');
    transactionService = require('../../services/transactionService');
    ({ createTransactionSchema, updateTransactionSchema } = require('../../utils/validators'));
    ({ AppError } = require('../../utils/errors'));

    // Resetar todos os métodos do service
    Object.values(transactionService).forEach(fn => {
      if (fn && fn.mockClear) fn.mockClear();
    });
    // Resetar métodos dos schemas
    if (createTransactionSchema.parse.mockClear) createTransactionSchema.parse.mockClear();
    if (updateTransactionSchema.parse.mockClear) updateTransactionSchema.parse.mockClear();

    mockReq = {
      user: { id: 1 },
      userId: 1,
      body: {},
      params: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createTransaction', () => {
    it('deve criar uma transação com dados válidos', async () => {
      const transactionData = {
        account_id: 1,
        category_id: 1,
        type: 'income',
        amount: 1000.00,
        description: 'Salário',
        date: '2024-01-15'
      };
      const mockTransaction = {
        id: 1,
        ...transactionData,
        user_id: 1,
        date: '2024-01-15'
      };
      const newBalance = 6000.00;
      createTransactionSchema.parse.mockReturnValue(transactionData);
      transactionService.createTransaction.mockResolvedValue({ transaction: mockTransaction, newBalance });
      mockReq.body = transactionData;
      const next = jest.fn();
      await transactionController.createTransaction(mockReq, mockRes, next);
      expect(createTransactionSchema.parse).toHaveBeenCalledWith(transactionData);
      expect(transactionService.createTransaction).toHaveBeenCalledWith(1, transactionData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Transação criada com sucesso',
        transactionId: 1,
        newBalance,
        transaction: {
          id: 1,
          type: 'income',
          amount: 1000.00,
          description: 'Salário',
          date: '2024-01-15'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next em caso de erro de validação', async () => {
      const zodError = new Error('Validation failed');
      createTransactionSchema.parse.mockImplementation(() => { throw zodError; });
      mockReq.body = { account_id: 1 };
      const next = jest.fn();
      await transactionController.createTransaction(mockReq, mockRes, next);
      expect(next).toHaveBeenCalledWith(zodError);
    });

    it('deve chamar next em caso de erro do service', async () => {
      const transactionData = { account_id: 1, type: 'income', amount: 100 };
      createTransactionSchema.parse.mockReturnValue(transactionData);
      const serviceError = new Error('Erro no service');
      transactionService.createTransaction.mockRejectedValue(serviceError);
      mockReq.body = transactionData;
      const next = jest.fn();
      await transactionController.createTransaction(mockReq, mockRes, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getTransactions', () => {
    it('deve retornar transações com sucesso', async () => {
      const mockTransactions = [
        { id: 1, description: 'Transação 1', amount: 100 },
        { id: 2, description: 'Transação 2', amount: 200 }
      ];
      transactionService.getTransactions.mockResolvedValue(mockTransactions);
      const next = jest.fn();
      await transactionController.getTransactions(mockReq, mockRes, next);
      expect(transactionService.getTransactions).toHaveBeenCalledWith(1, {});
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTransactions,
        count: 2
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve aplicar filtros corretamente', async () => {
      const filters = { type: 'income', startDate: '2024-01-01', endDate: '2024-01-31' };
      transactionService.getTransactions.mockResolvedValue([]);
      mockReq.query = filters;
      const next = jest.fn();
      await transactionController.getTransactions(mockReq, mockRes, next);
      expect(transactionService.getTransactions).toHaveBeenCalledWith(1, filters);
    });

    it('deve chamar next em caso de erro do service', async () => {
      const serviceError = new Error('Erro no service');
      transactionService.getTransactions.mockRejectedValue(serviceError);
      const next = jest.fn();
      await transactionController.getTransactions(mockReq, mockRes, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getTransaction', () => {
    it('deve retornar uma transação específica', async () => {
      const mockTransaction = {
        id: 1,
        description: 'Transação teste',
        amount: 100
      };
      transactionService.getTransaction.mockResolvedValue(mockTransaction);
      mockReq.params = { id: 1 };
      const next = jest.fn();
      await transactionController.getTransaction(mockReq, mockRes, next);
      expect(transactionService.getTransaction).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTransaction
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next quando transação não encontrada', async () => {
      transactionService.getTransaction.mockResolvedValue(null);
      mockReq.params = { id: 999 };
      const next = jest.fn();
      await transactionController.getTransaction(mockReq, mockRes, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateTransaction', () => {
    it('deve atualizar uma transação com sucesso', async () => {
      const updateData = { description: 'Transação atualizada' };
      const mockTransaction = {
        id: 1,
        type: 'income',
        amount: 100,
        description: 'Transação atualizada',
        date: '2024-01-15'
      };
      const newBalance = 1100;
      updateTransactionSchema.parse.mockReturnValue(updateData);
      transactionService.updateTransaction.mockResolvedValue({ transaction: mockTransaction, newBalance });
      mockReq.params = { id: 1 };
      mockReq.body = updateData;
      const next = jest.fn();
      await transactionController.updateTransaction(mockReq, mockRes, next);
      expect(updateTransactionSchema.parse).toHaveBeenCalledWith(updateData);
      expect(transactionService.updateTransaction).toHaveBeenCalledWith(1, 1, updateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Transação atualizada com sucesso',
        newBalance,
        transaction: {
          id: 1,
          type: 'income',
          amount: 100,
          description: 'Transação atualizada',
          date: '2024-01-15'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next em caso de erro do service', async () => {
      const updateData = { description: 'Transação atualizada' };
      updateTransactionSchema.parse.mockReturnValue(updateData);
      const serviceError = new Error('Erro no service');
      transactionService.updateTransaction.mockRejectedValue(serviceError);
      mockReq.params = { id: 1 };
      mockReq.body = updateData;
      const next = jest.fn();
      await transactionController.updateTransaction(mockReq, mockRes, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('deleteTransaction', () => {
    it('deve remover uma transação com sucesso', async () => {
      const newBalance = 900;
      transactionService.deleteTransaction.mockResolvedValue({ newBalance });
      mockReq.params = { id: 1 };
      const next = jest.fn();
      await transactionController.deleteTransaction(mockReq, mockRes, next);
      expect(transactionService.deleteTransaction).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Transação removida com sucesso',
        newBalance
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next em caso de erro do service', async () => {
      const serviceError = new Error('Erro no service');
      transactionService.deleteTransaction.mockRejectedValue(serviceError);
      mockReq.params = { id: 1 };
      const next = jest.fn();
      await transactionController.deleteTransaction(mockReq, mockRes, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas de transações', async () => {
      const mockStats = {
        totalIncome: 1000,
        totalExpenses: 500,
        netAmount: 500,
        transactionCount: 10,
        period: 'month'
      };
      transactionService.getTransactionStats.mockResolvedValue(mockStats);
      const next = jest.fn();
      await transactionController.getStats(mockReq, mockRes, next);
      expect(transactionService.getTransactionStats).toHaveBeenCalledWith(1, 'month');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next em caso de erro do service', async () => {
      const serviceError = new Error('Erro no service');
      transactionService.getTransactionStats.mockRejectedValue(serviceError);
      const next = jest.fn();
      await transactionController.getStats(mockReq, mockRes, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getCharts', () => {
    it('deve retornar dados de timeline', async () => {
      const mockChartData = { timeline: [{ label: '01/01', income: 100, expenses: 50 }] };
      transactionService.getTimelineData.mockResolvedValue(mockChartData);
      mockReq.query = { chart: 'timeline', period: 'month' };
      const next = jest.fn();
      await transactionController.getCharts(mockReq, mockRes, next);
      expect(transactionService.getTimelineData).toHaveBeenCalledWith(1, 'month');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockChartData
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar dados de categorias', async () => {
      const mockChartData = { income: [], expenses: [] };
      transactionService.getCategoryChartData.mockResolvedValue(mockChartData);
      mockReq.query = { chart: 'categories', period: 'month' };
      const next = jest.fn();
      await transactionController.getCharts(mockReq, mockRes, next);
      expect(transactionService.getCategoryChartData).toHaveBeenCalledWith(1, 'month');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockChartData
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next para tipo de gráfico não suportado', async () => {
      mockReq.query = { chart: 'invalid' };
      const next = jest.fn();
      await transactionController.getCharts(mockReq, mockRes, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('deve chamar next em caso de erro do service', async () => {
      const serviceError = new Error('Erro no service');
      transactionService.getTimelineData.mockRejectedValue(serviceError);
      mockReq.query = { chart: 'timeline' };
      const next = jest.fn();
      await transactionController.getCharts(mockReq, mockRes, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });
}); 