/**
 * Testes unitários para o TransactionController
 * Testa todas as funcionalidades do controller de transações
 */

const TransactionController = require('../../controllers/transactionController');
const { ValidationError, NotFoundError } = require('../../utils/errors');

// Mock do service
const mockTransactionService = {
  createTransaction: jest.fn(),
  getTransactions: jest.fn(),
  getTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
  getTransactionStats: jest.fn(),
  getTimelineData: jest.fn(),
  getCategoryChartData: jest.fn()
};

// Mock do logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('TransactionController', () => {
  let controller;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    controller = new TransactionController(mockTransactionService);
    
    // Reset dos mocks
    jest.clearAllMocks();
    
    // Mock da requisição
    mockReq = {
      userId: 1,
      body: {},
      params: {},
      query: {}
    };

    // Mock da resposta
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createTransaction', () => {
    it('deve criar uma transação com sucesso', async () => {
      const mockTransaction = {
        id: 1,
        amount: 100,
        type: 'income',
        description: 'Salário'
      };
      
      const mockResult = {
        transaction: mockTransaction,
        newBalance: 100
      };

      mockTransactionService.createTransaction.mockResolvedValue(mockResult);

      await controller.createTransaction(mockReq, mockRes);

      expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(1, {});
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          transaction: mockTransaction,
          newBalance: 100
        },
        message: 'Transação criada com sucesso'
      });
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const validationError = new ValidationError('Dados inválidos');
      mockTransactionService.createTransaction.mockRejectedValue(validationError);

      await controller.createTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados inválidos'
      });
    });

    it('deve retornar erro 404 para conta não encontrada', async () => {
      const notFoundError = new NotFoundError('Conta não encontrada');
      mockTransactionService.createTransaction.mockRejectedValue(notFoundError);

      await controller.createTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Conta não encontrada'
      });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      const error = new Error('Erro interno');
      mockTransactionService.createTransaction.mockRejectedValue(error);

      await controller.createTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('getTransactions', () => {
    it('deve listar transações com sucesso', async () => {
      const mockTransactions = [
        { id: 1, amount: 100, type: 'income' },
        { id: 2, amount: 50, type: 'expense' }
      ];

      mockTransactionService.getTransactions.mockResolvedValue(mockTransactions);

      await controller.getTransactions(mockReq, mockRes);

      expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(1, {});
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          transactions: mockTransactions,
          count: 2
        }
      });
    });

    it('deve aplicar filtros corretamente', async () => {
      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        type: 'income'
      };

      const mockTransactions = [{ id: 1, amount: 100, type: 'income' }];
      mockTransactionService.getTransactions.mockResolvedValue(mockTransactions);

      await controller.getTransactions(mockReq, mockRes);

      expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(1, {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        type: 'income'
      });
    });

    it('deve retornar erro 400 para filtros inválidos', async () => {
      const validationError = new ValidationError('Filtros inválidos');
      mockTransactionService.getTransactions.mockRejectedValue(validationError);

      await controller.getTransactions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Filtros inválidos'
      });
    });
  });

  describe('getTransaction', () => {
    it('deve obter uma transação específica com sucesso', async () => {
      mockReq.params.id = '1';
      const mockTransaction = { id: 1, amount: 100, type: 'income' };

      mockTransactionService.getTransaction.mockResolvedValue(mockTransaction);

      await controller.getTransaction(mockReq, mockRes);

      expect(mockTransactionService.getTransaction).toHaveBeenCalledWith(1, '1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { transaction: mockTransaction }
      });
    });

    it('deve retornar erro 404 para transação não encontrada', async () => {
      mockReq.params.id = '999';
      const notFoundError = new NotFoundError('Transação não encontrada');
      mockTransactionService.getTransaction.mockRejectedValue(notFoundError);

      await controller.getTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Transação não encontrada'
      });
    });
  });

  describe('updateTransaction', () => {
    it('deve atualizar uma transação com sucesso', async () => {
      mockReq.params.id = '1';
      mockReq.body = { amount: 150, description: 'Atualizado' };

      const mockTransaction = { id: 1, amount: 150, type: 'income' };
      const mockResult = {
        transaction: mockTransaction,
        newBalance: 150
      };

      mockTransactionService.updateTransaction.mockResolvedValue(mockResult);

      await controller.updateTransaction(mockReq, mockRes);

      expect(mockTransactionService.updateTransaction).toHaveBeenCalledWith(1, '1', { amount: 150, description: 'Atualizado' });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          transaction: mockTransaction,
          newBalance: 150
        },
        message: 'Transação atualizada com sucesso'
      });
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      mockReq.params.id = '1';
      const validationError = new ValidationError('Dados inválidos');
      mockTransactionService.updateTransaction.mockRejectedValue(validationError);

      await controller.updateTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados inválidos'
      });
    });

    it('deve retornar erro 404 para transação não encontrada', async () => {
      mockReq.params.id = '999';
      const notFoundError = new NotFoundError('Transação não encontrada');
      mockTransactionService.updateTransaction.mockRejectedValue(notFoundError);

      await controller.updateTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Transação não encontrada'
      });
    });
  });

  describe('deleteTransaction', () => {
    it('deve remover uma transação com sucesso', async () => {
      mockReq.params.id = '1';
      const mockResult = { newBalance: 50 };

      mockTransactionService.deleteTransaction.mockResolvedValue(mockResult);

      await controller.deleteTransaction(mockReq, mockRes);

      expect(mockTransactionService.deleteTransaction).toHaveBeenCalledWith(1, '1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          newBalance: 50
        },
        message: 'Transação removida com sucesso'
      });
    });

    it('deve retornar erro 404 para transação não encontrada', async () => {
      mockReq.params.id = '999';
      const notFoundError = new NotFoundError('Transação não encontrada');
      mockTransactionService.deleteTransaction.mockRejectedValue(notFoundError);

      await controller.deleteTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Transação não encontrada'
      });
    });
  });

  describe('getStats', () => {
    it('deve obter estatísticas com sucesso', async () => {
      mockReq.query.period = 'month';
      const mockStats = {
        totalIncome: 5000,
        totalExpenses: 3000,
        netAmount: 2000
      };

      mockTransactionService.getTransactionStats.mockResolvedValue(mockStats);

      await controller.getStats(mockReq, mockRes);

      expect(mockTransactionService.getTransactionStats).toHaveBeenCalledWith(1, 'month');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('deve usar período padrão quando não especificado', async () => {
      const mockStats = { totalIncome: 1000, totalExpenses: 500, netAmount: 500 };
      mockTransactionService.getTransactionStats.mockResolvedValue(mockStats);

      await controller.getStats(mockReq, mockRes);

      expect(mockTransactionService.getTransactionStats).toHaveBeenCalledWith(1, 'month');
    });
  });

  describe('getCharts', () => {
    it('deve obter dados de timeline com sucesso', async () => {
      mockReq.query.chart = 'timeline';
      mockReq.query.period = 'month';
      const mockChartData = {
        timeline: [
          { label: '01/01', income: 100, expenses: 50 }
        ]
      };

      mockTransactionService.getTimelineData.mockResolvedValue(mockChartData);

      await controller.getCharts(mockReq, mockRes);

      expect(mockTransactionService.getTimelineData).toHaveBeenCalledWith(1, 'month');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockChartData
      });
    });

    it('deve obter dados de categorias com sucesso', async () => {
      mockReq.query.chart = 'categories';
      mockReq.query.period = 'month';
      const mockChartData = {
        categories: [
          { name: 'Alimentação', amount: 500 }
        ]
      };

      mockTransactionService.getCategoryChartData.mockResolvedValue(mockChartData);

      await controller.getCharts(mockReq, mockRes);

      expect(mockTransactionService.getCategoryChartData).toHaveBeenCalledWith(1, 'month');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockChartData
      });
    });

    it('deve retornar erro 400 para tipo de gráfico não suportado', async () => {
      mockReq.query.chart = 'invalid';

      await controller.getCharts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Tipo de gráfico não suportado'
      });
    });

    it('deve usar período padrão quando não especificado', async () => {
      mockReq.query.chart = 'timeline';
      const mockChartData = { timeline: [] };
      mockTransactionService.getTimelineData.mockResolvedValue(mockChartData);

      await controller.getCharts(mockReq, mockRes);

      expect(mockTransactionService.getTimelineData).toHaveBeenCalledWith(1, 'month');
    });
  });
}); 