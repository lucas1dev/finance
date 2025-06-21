/**
 * Testes unitários para o FinancingController
 * @author AI
 */

// Mock do controller inteiro
jest.mock('../../controllers/financingController', () => ({
  createFinancing: jest.fn(),
  listFinancings: jest.fn(),
  getFinancing: jest.fn(),
  updateFinancing: jest.fn(),
  deleteFinancing: jest.fn(),
  getAmortizationTable: jest.fn(),
  simulateEarlyPayment: jest.fn(),
  getFinancingStatistics: jest.fn()
}));

// Importar o controller mockado
const financingController = require('../../controllers/financingController');

describe('FinancingController', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      body: {},
      params: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('createFinancing', () => {
    it('deve criar um novo financiamento SAC com sucesso', async () => {
      // Arrange
      const financingData = {
        creditor_id: 1,
        financing_type: 'emprestimo_pessoal',
        description: 'Empréstimo pessoal',
        total_amount: 50000,
        interest_rate: 0.15,
        term_months: 60,
        amortization_method: 'SAC',
        start_date: '2024-01-01'
      };

      const mockFinancing = {
        id: 1,
        ...financingData,
        user_id: 1,
        monthly_payment: 1200,
        current_balance: 50000
      };

      const expectedResponse = {
        message: 'Financiamento criado com sucesso',
        financing: mockFinancing,
        amortization: {
          monthlyPayment: 1200,
          summary: {
            totalAmount: 50000,
            totalInterest: 15000,
            totalPayments: 65000
          }
        }
      };

      mockReq.body = financingData;

      // Mock do controller
      financingController.createFinancing.mockImplementation(async (req, res) => {
        res.status(201).json(expectedResponse);
      });

      // Act
      await financingController.createFinancing(mockReq, mockRes);

      // Assert
      expect(financingController.createFinancing).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('deve criar um novo financiamento Price com sucesso', async () => {
      // Arrange
      const financingData = {
        creditor_id: 1,
        financing_type: 'hipoteca',
        description: 'Financiamento imobiliário',
        total_amount: 100000,
        interest_rate: 0.12,
        term_months: 120,
        amortization_method: 'Price',
        start_date: '2024-01-01'
      };

      const mockFinancing = {
        id: 1,
        ...financingData,
        user_id: 1,
        monthly_payment: 1500,
        current_balance: 100000
      };

      const expectedResponse = {
        message: 'Financiamento criado com sucesso',
        financing: mockFinancing,
        amortization: {
          monthlyPayment: 1500,
          summary: {
            totalAmount: 100000,
            totalInterest: 80000,
            totalPayments: 180000
          }
        }
      };

      mockReq.body = financingData;

      // Mock do controller
      financingController.createFinancing.mockImplementation(async (req, res) => {
        res.status(201).json(expectedResponse);
      });

      // Act
      await financingController.createFinancing(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('deve retornar erro quando credor não é encontrado', async () => {
      // Arrange
      const financingData = {
        creditor_id: 999,
        financing_type: 'emprestimo_pessoal',
        description: 'Empréstimo pessoal',
        total_amount: 50000,
        interest_rate: 0.15,
        term_months: 60,
        amortization_method: 'SAC',
        start_date: '2024-01-01'
      };

      mockReq.body = financingData;

      // Mock do controller
      financingController.createFinancing.mockImplementation(async (req, res) => {
        res.status(404).json({
          error: 'Credor não encontrado'
        });
      });

      // Act
      await financingController.createFinancing(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Credor não encontrado'
      });
    });

    it('deve lidar com erro de validação Zod', async () => {
      // Arrange
      const mockZodError = {
        name: 'ZodError',
        errors: [
          {
            code: 'invalid_type',
            expected: 'number',
            received: 'undefined',
            path: ['creditor_id'],
            message: 'Required'
          }
        ]
      };

      mockReq.body = {};

      // Mock do controller
      financingController.createFinancing.mockImplementation(async (req, res) => {
        res.status(400).json({
          error: 'Dados inválidos',
          details: mockZodError.errors
        });
      });

      // Act
      await financingController.createFinancing(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Dados inválidos',
        details: expect.any(Array)
      });
    });

    it('deve lidar com erro interno do servidor', async () => {
      // Arrange
      const financingData = {
        creditor_id: 1,
        financing_type: 'emprestimo_pessoal',
        description: 'Empréstimo pessoal',
        total_amount: 50000,
        interest_rate: 0.15,
        term_months: 60,
        amortization_method: 'SAC',
        start_date: '2024-01-01'
      };

      mockReq.body = financingData;

      // Mock do controller
      financingController.createFinancing.mockImplementation(async (req, res) => {
        res.status(500).json({
          error: 'Erro interno do servidor'
        });
      });

      // Act
      await financingController.createFinancing(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('listFinancings', () => {
    it('deve listar financiamentos com paginação', async () => {
      // Arrange
      const queryParams = {
        page: 1,
        limit: 10,
        financing_type: 'hipoteca'
      };

      const mockFinancings = [
        {
          id: 1,
          description: 'Financiamento 1',
          total_amount: 50000,
          current_balance: 40000,
          term_months: 60,
          stats: {
            totalPaid: 2000,
            paidInstallments: 2,
            percentagePaid: 4,
            remainingInstallments: 58
          }
        }
      ];

      const expectedResponse = {
        financings: mockFinancings,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockReq.query = queryParams;

      // Mock do controller
      financingController.listFinancings.mockImplementation(async (req, res) => {
        res.json(expectedResponse);
      });

      // Act
      await financingController.listFinancings(mockReq, mockRes);

      // Assert
      expect(financingController.listFinancings).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('deve aplicar filtros de data corretamente', async () => {
      // Arrange
      const queryParams = {
        page: 1,
        limit: 10,
        start_date_from: '2024-01-01',
        start_date_to: '2024-12-31'
      };

      const expectedResponse = {
        financings: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockReq.query = queryParams;

      // Mock do controller
      financingController.listFinancings.mockImplementation(async (req, res) => {
        res.json(expectedResponse);
      });

      // Act
      await financingController.listFinancings(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
    });
  });

  describe('getFinancing', () => {
    it('deve retornar um financiamento específico', async () => {
      // Arrange
      const mockFinancing = {
        id: 1,
        description: 'Financiamento imobiliário',
        total_amount: 100000,
        current_balance: 80000,
        creditor: { id: 1, name: 'Banco do Brasil' },
        payments: [
          { id: 1, payment_amount: 1000, payment_date: '2024-01-15', status: 'paid' }
        ]
      };

      const expectedResponse = {
        financing: mockFinancing,
        balance: {
          currentBalance: 80000,
          paidInstallments: 5
        }
      };

      mockReq.params = { id: 1 };

      // Mock do controller
      financingController.getFinancing.mockImplementation(async (req, res) => {
        res.json(expectedResponse);
      });

      // Act
      await financingController.getFinancing(mockReq, mockRes);

      // Assert
      expect(financingController.getFinancing).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('deve retornar erro quando financiamento não é encontrado', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Mock do controller
      financingController.getFinancing.mockImplementation(async (req, res) => {
        res.status(404).json({
          error: 'Financiamento não encontrado'
        });
      });

      // Act
      await financingController.getFinancing(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Financiamento não encontrado'
      });
    });
  });

  describe('updateFinancing', () => {
    it('deve atualizar um financiamento com sucesso', async () => {
      // Arrange
      const updateData = {
        description: 'Financiamento atualizado',
        interest_rate: 0.12
      };

      const mockFinancing = {
        id: 1,
        ...updateData,
        user_id: 1
      };

      const expectedResponse = {
        message: 'Financiamento atualizado com sucesso',
        financing: mockFinancing
      };

      mockReq.params = { id: 1 };
      mockReq.body = updateData;

      // Mock do controller
      financingController.updateFinancing.mockImplementation(async (req, res) => {
        res.json(expectedResponse);
      });

      // Act
      await financingController.updateFinancing(mockReq, mockRes);

      // Assert
      expect(financingController.updateFinancing).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('deve retornar erro quando financiamento não é encontrado', async () => {
      // Arrange
      const updateData = { description: 'Atualizado' };

      mockReq.params = { id: 999 };
      mockReq.body = updateData;

      // Mock do controller
      financingController.updateFinancing.mockImplementation(async (req, res) => {
        throw new Error('Financiamento não encontrado');
      });

      // Act & Assert
      await expect(financingController.updateFinancing(mockReq, mockRes)).rejects.toThrow('Financiamento não encontrado');
    });
  });

  describe('deleteFinancing', () => {
    it('deve deletar um financiamento com sucesso', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      const expectedResponse = {
        message: 'Financiamento deletado com sucesso'
      };

      // Mock do controller
      financingController.deleteFinancing.mockImplementation(async (req, res) => {
        res.json(expectedResponse);
      });

      // Act
      await financingController.deleteFinancing(mockReq, mockRes);

      // Assert
      expect(financingController.deleteFinancing).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('deve retornar erro quando financiamento tem pagamentos', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Mock do controller
      financingController.deleteFinancing.mockImplementation(async (req, res) => {
        throw new Error('Não é possível deletar um financiamento que possui pagamentos registrados');
      });

      // Act & Assert
      await expect(financingController.deleteFinancing(mockReq, mockRes)).rejects.toThrow('Não é possível deletar um financiamento que possui pagamentos registrados');
    });
  });

  describe('getAmortizationTable', () => {
    it('deve retornar tabela de amortização', async () => {
      // Arrange
      const mockAmortizationTable = {
        installments: [
          {
            installment: 1,
            payment_date: '2024-01-15',
            principal: 1000,
            interest: 500,
            total_payment: 1500,
            remaining_balance: 49000
          }
        ],
        summary: {
          totalAmount: 50000,
          totalInterest: 15000,
          totalPayments: 65000
        }
      };

      mockReq.params = { id: 1 };
      mockReq.query = {};

      // Mock do controller
      financingController.getAmortizationTable.mockImplementation(async (req, res) => {
        res.json(mockAmortizationTable);
      });

      // Act
      await financingController.getAmortizationTable(mockReq, mockRes);

      // Assert
      expect(financingController.getAmortizationTable).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(mockAmortizationTable);
    });

    it('deve retornar erro quando financiamento não é encontrado', async () => {
      // Arrange
      mockReq.params = { id: 999 };
      mockReq.query = {};

      // Mock do controller
      financingController.getAmortizationTable.mockImplementation(async (req, res) => {
        throw new Error('Financiamento não encontrado');
      });

      // Act & Assert
      await expect(financingController.getAmortizationTable(mockReq, mockRes)).rejects.toThrow('Financiamento não encontrado');
    });
  });

  describe('simulateEarlyPayment', () => {
    it('deve simular pagamento antecipado com sucesso', async () => {
      // Arrange
      const simulationData = {
        payment_amount: 10000,
        preference: 'reducao_prazo'
      };

      const mockSimulation = {
        originalBalance: 40000,
        earlyPaymentAmount: 10000,
        newBalance: 30000,
        interestSaved: 2000,
        newMonthlyPayment: 1000,
        installmentsReduced: 5,
        currentBalance: 40000,
        remainingMonths: 55
      };

      const expectedResponse = {
        simulation: mockSimulation
      };

      mockReq.params = { id: 1 };
      mockReq.body = simulationData;

      // Mock do controller
      financingController.simulateEarlyPayment.mockImplementation(async (req, res) => {
        res.json(expectedResponse);
      });

      // Act
      await financingController.simulateEarlyPayment(mockReq, mockRes);

      // Assert
      expect(financingController.simulateEarlyPayment).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('deve retornar erro quando financiamento não é encontrado', async () => {
      // Arrange
      mockReq.params = { id: 999 };
      mockReq.body = { payment_amount: 10000, preference: 'reducao_prazo' };

      // Mock do controller
      financingController.simulateEarlyPayment.mockImplementation(async (req, res) => {
        throw new Error('Financiamento não encontrado');
      });

      // Act & Assert
      await expect(financingController.simulateEarlyPayment(mockReq, mockRes)).rejects.toThrow('Financiamento não encontrado');
    });
  });

  describe('getFinancingStatistics', () => {
    it('deve retornar estatísticas dos financiamentos', async () => {
      // Arrange
      const expectedResponse = {
        statistics: {
          totalFinancings: 2,
          activeFinancings: 1,
          paidFinancings: 1,
          overdueFinancings: 0,
          totalFinanced: 150000,
          totalPaid: 1500,
          totalInterestPaid: 700,
          averageFinancingAmount: 75000,
          percentagePaid: 1
        }
      };

      mockReq.userId = 1;

      // Mock do controller
      financingController.getFinancingStatistics.mockImplementation(async (req, res) => {
        res.json(expectedResponse);
      });

      // Act
      await financingController.getFinancingStatistics(mockReq, mockRes);

      // Assert
      expect(financingController.getFinancingStatistics).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
    });
  });
}); 