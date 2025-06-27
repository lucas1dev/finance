/**
 * Testes unitários para FinancingController
 * Testa operações CRUD e cálculos de financiamentos
 */

let FinancingService;
let financingController;

// Mock do FinancingService
jest.mock('../../services/financingService', () => ({
  createFinancing: jest.fn(),
  listFinancings: jest.fn(),
  getFinancingById: jest.fn(),
  updateFinancing: jest.fn(),
  deleteFinancing: jest.fn(),
  getAmortizationTable: jest.fn(),
  simulateEarlyPayment: jest.fn(),
  getFinancingStatistics: jest.fn()
}));

// Mock do logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('FinancingController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Importar após os mocks
    financingController = require('../../controllers/financingController');
    FinancingService = require('../../services/financingService');
    
    // Limpar todos os mocks
    jest.clearAllMocks();
    
    // Mock do objeto de requisição
    mockReq = {
      body: {},
      params: {},
      query: {},
      userId: 1
    };

    // Mock do objeto de resposta
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('create', () => {
    it('deve criar um novo financiamento SAC com sucesso', async () => {
      // Arrange
      const mockFinancingData = {
        creditor_id: 1,
        financing_type: 'hipoteca',
        total_amount: 100000,
        interest_rate: 0.12,
        term_months: 120,
        start_date: '2024-01-01',
        description: 'Financiamento imobiliário',
        amortization_method: 'SAC'
      };

      const mockResult = {
        financing: {
          id: 1,
          ...mockFinancingData,
          monthly_payment: 1500.00,
          current_balance: 100000
        },
        amortization: {
          monthlyPayment: 1500.00,
          summary: {
            totalAmount: 100000,
            totalInterest: 80000,
            totalPayments: 180000
          }
        }
      };

      mockReq.body = mockFinancingData;
      FinancingService.createFinancing.mockResolvedValue(mockResult);

      // Act
      await financingController.create(mockReq, mockRes);

      // Assert
      expect(FinancingService.createFinancing).toHaveBeenCalledWith(1, mockFinancingData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Financiamento criado com sucesso'
      });
    });

    it('deve criar um novo financiamento Price com sucesso', async () => {
      // Arrange
      const mockFinancingData = {
        creditor_id: 1,
        financing_type: 'emprestimo_pessoal',
        total_amount: 50000,
        interest_rate: 0.15,
        term_months: 60,
        start_date: '2024-01-01',
        description: 'Empréstimo pessoal',
        amortization_method: 'Price'
      };

      const mockResult = {
        financing: {
          id: 2,
          ...mockFinancingData,
          monthly_payment: 1200.00,
          current_balance: 50000
        },
        amortization: {
          monthlyPayment: 1200.00,
          summary: {
            totalAmount: 50000,
            totalInterest: 22000,
            totalPayments: 72000
          }
        }
      };

      mockReq.body = mockFinancingData;
      FinancingService.createFinancing.mockResolvedValue(mockResult);

      // Act
      await financingController.create(mockReq, mockRes);

      // Assert
      expect(FinancingService.createFinancing).toHaveBeenCalledWith(1, mockFinancingData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Financiamento criado com sucesso'
      });
    });

    it('deve retornar erro quando credor não é encontrado', async () => {
      // Arrange
      const mockFinancingData = {
        creditor_id: 999,
        financing_type: 'hipoteca',
        total_amount: 100000,
        interest_rate: 0.12,
        term_months: 120,
        start_date: '2024-01-01',
        amortization_method: 'SAC'
      };

      const error = new Error('Credor não encontrado');
      error.statusCode = 404;

      mockReq.body = mockFinancingData;
      FinancingService.createFinancing.mockRejectedValue(error);

      // Act
      await financingController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Credor não encontrado'
      });
    });

    it('deve lidar com erro de validação Zod', async () => {
      // Arrange
      const mockFinancingData = {
        creditor_id: 1,
        // Dados inválidos - faltando campos obrigatórios
      };

      const zodError = new Error('Dados inválidos');
      zodError.name = 'ZodError';
      zodError.errors = [
        { path: ['total_amount'], message: 'Campo obrigatório' }
      ];

      mockReq.body = mockFinancingData;
      FinancingService.createFinancing.mockRejectedValue(zodError);

      // Act
      await financingController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados inválidos',
        details: zodError.errors
      });
    });

    it('deve lidar com erro interno do servidor', async () => {
      // Arrange
      const mockFinancingData = {
        creditor_id: 1,
        financing_type: 'hipoteca',
        total_amount: 100000,
        interest_rate: 0.12,
        term_months: 120,
        start_date: '2024-01-01',
        amortization_method: 'SAC'
      };

      const error = new Error('Database connection failed');

      mockReq.body = mockFinancingData;
      FinancingService.createFinancing.mockRejectedValue(error);

      // Act
      await financingController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('list', () => {
    it('deve listar financiamentos com paginação', async () => {
      // Arrange
      const mockResult = {
        financings: [
          {
            id: 1,
            description: 'Financiamento imobiliário',
            total_amount: 100000,
            monthly_payment: 1500.00,
            stats: {
              totalPaid: 15000,
              paidInstallments: 10,
              percentagePaid: 15.0,
              remainingInstallments: 110
            }
          }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockReq.query = { page: 1, limit: 10 };
      FinancingService.listFinancings.mockResolvedValue(mockResult);

      // Act
      await financingController.list(mockReq, mockRes);

      // Assert
      expect(FinancingService.listFinancings).toHaveBeenCalledWith(1, mockReq.query);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve aplicar filtros de data corretamente', async () => {
      // Arrange
      const mockResult = {
        financings: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockReq.query = {
        page: 1,
        limit: 10,
        start_date_from: '2024-01-01',
        start_date_to: '2024-12-31'
      };
      FinancingService.listFinancings.mockResolvedValue(mockResult);

      // Act
      await financingController.list(mockReq, mockRes);

      // Assert
      expect(FinancingService.listFinancings).toHaveBeenCalledWith(1, mockReq.query);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });
  });

  describe('getById', () => {
    it('deve retornar um financiamento específico', async () => {
      // Arrange
      const mockFinancing = {
        id: 1,
        description: 'Financiamento imobiliário',
        total_amount: 100000,
        monthly_payment: 1500.00,
        current_balance: 85000,
        stats: {
          totalPaid: 15000,
          remainingAmount: 85000,
          paidInstallments: 10,
          percentagePaid: 15.0,
          remainingInstallments: 110
        }
      };

      mockReq.params = { id: 1 };
      FinancingService.getFinancingById.mockResolvedValue(mockFinancing);

      // Act
      await financingController.getById(mockReq, mockRes);

      // Assert
      expect(FinancingService.getFinancingById).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockFinancing
      });
    });

    it('deve retornar erro quando financiamento não é encontrado', async () => {
      // Arrange
      const error = new Error('Financiamento não encontrado');
      error.statusCode = 404;

      mockReq.params = { id: 999 };
      FinancingService.getFinancingById.mockRejectedValue(error);

      // Act
      await financingController.getById(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Financiamento não encontrado'
      });
    });
  });

  describe('update', () => {
    it('deve atualizar um financiamento com sucesso', async () => {
      // Arrange
      const mockUpdateData = {
        description: 'Financiamento atualizado',
        status: 'ativo'
      };

      const mockUpdatedFinancing = {
        id: 1,
        description: 'Financiamento atualizado',
        status: 'ativo',
        total_amount: 100000,
        monthly_payment: 1500.00
      };

      mockReq.params = { id: 1 };
      mockReq.body = mockUpdateData;
      FinancingService.updateFinancing.mockResolvedValue(mockUpdatedFinancing);

      // Act
      await financingController.update(mockReq, mockRes);

      // Assert
      expect(FinancingService.updateFinancing).toHaveBeenCalledWith(1, 1, mockUpdateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedFinancing,
        message: 'Financiamento atualizado com sucesso'
      });
    });

    it('deve retornar erro quando financiamento não é encontrado', async () => {
      // Arrange
      const error = new Error('Financiamento não encontrado');
      error.statusCode = 404;

      mockReq.params = { id: 999 };
      mockReq.body = { description: 'Teste' };
      FinancingService.updateFinancing.mockRejectedValue(error);

      // Act
      await financingController.update(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Financiamento não encontrado'
      });
    });
  });

  describe('delete', () => {
    it('deve deletar um financiamento com sucesso', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      FinancingService.deleteFinancing.mockResolvedValue();

      // Act
      await financingController.delete(mockReq, mockRes);

      // Assert
      expect(FinancingService.deleteFinancing).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Financiamento excluído com sucesso'
      });
    });

    it('deve retornar erro quando financiamento tem pagamentos', async () => {
      // Arrange
      const error = new Error('Não é possível excluir um financiamento que possui pagamentos registrados');
      error.statusCode = 400;

      mockReq.params = { id: 1 };
      FinancingService.deleteFinancing.mockRejectedValue(error);

      // Act
      await financingController.delete(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Não é possível excluir um financiamento que possui pagamentos registrados'
      });
    });
  });

  describe('getAmortizationTable', () => {
    it('deve retornar tabela de amortização', async () => {
      // Arrange
      const mockAmortizationTable = {
        financing: {
          id: 1,
          description: 'Financiamento imobiliário',
          total_amount: 100000,
          interest_rate: 0.12,
          term_months: 120,
          amortization_method: 'SAC',
          start_date: '2024-01-01',
          monthly_payment: 1500.00
        },
        amortization: {
          installments: [
            {
              installment: 1,
              payment_date: '2024-01-15',
              principal: 833.33,
              interest: 666.67,
              balance: 99166.67
            }
          ],
          summary: {
            totalAmount: 100000,
            totalInterest: 80000,
            totalPayments: 180000
          }
        }
      };

      mockReq.params = { id: 1 };
      FinancingService.getAmortizationTable.mockResolvedValue(mockAmortizationTable);

      // Act
      await financingController.getAmortizationTable(mockReq, mockRes);

      // Assert
      expect(FinancingService.getAmortizationTable).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAmortizationTable
      });
    });

    it('deve retornar erro quando financiamento não é encontrado', async () => {
      // Arrange
      const error = new Error('Financiamento não encontrado');
      error.statusCode = 404;

      mockReq.params = { id: 999 };
      FinancingService.getAmortizationTable.mockRejectedValue(error);

      // Act
      await financingController.getAmortizationTable(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Financiamento não encontrado'
      });
    });
  });

  describe('simulateEarlyPayment', () => {
    it('deve simular pagamento antecipado com sucesso', async () => {
      // Arrange
      const mockSimulationData = {
        early_payment_amount: 10000,
        payment_date: '2024-06-01'
      };

      const mockSimulation = {
        financing: {
          id: 1,
          description: 'Financiamento imobiliário',
          current_balance: 85000
        },
        simulation: {
          originalBalance: 85000,
          earlyPaymentAmount: 10000,
          newBalance: 75000,
          interestSaved: 5000,
          installmentsReduced: 8,
          newMonthlyPayment: 1200.00,
          remainingMonths: 62
        }
      };

      mockReq.params = { id: 1 };
      mockReq.body = mockSimulationData;
      FinancingService.simulateEarlyPayment.mockResolvedValue(mockSimulation);

      // Act
      await financingController.simulateEarlyPayment(mockReq, mockRes);

      // Assert
      expect(FinancingService.simulateEarlyPayment).toHaveBeenCalledWith(1, 1, mockSimulationData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSimulation
      });
    });

    it('deve retornar erro quando financiamento não é encontrado', async () => {
      // Arrange
      const error = new Error('Financiamento não encontrado');
      error.statusCode = 404;

      mockReq.params = { id: 999 };
      mockReq.body = { early_payment_amount: 10000 };
      FinancingService.simulateEarlyPayment.mockRejectedValue(error);

      // Act
      await financingController.simulateEarlyPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Financiamento não encontrado'
      });
    });
  });

  describe('getStatistics', () => {
    it('deve retornar estatísticas dos financiamentos', async () => {
      // Arrange
      const mockStatistics = {
        summary: {
          totalFinancings: 5,
          activeFinancings: 4,
          completedFinancings: 1,
          totalFinanced: 500000,
          totalPaid: 100000,
          totalRemaining: 400000,
          averageInterestRate: 0.12
        },
        byType: {
          hipoteca: {
            count: 3,
            totalAmount: 300000,
            totalPaid: 60000
          }
        },
        byStatus: {
          ativo: {
            count: 4,
            totalAmount: 400000
          }
        }
      };

      FinancingService.getFinancingStatistics.mockResolvedValue(mockStatistics);

      // Act
      await financingController.getStatistics(mockReq, mockRes);

      // Assert
      expect(FinancingService.getFinancingStatistics).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatistics
      });
    });
  });
}); 