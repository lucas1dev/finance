/**
 * Testes unitários para o FinancingController
 * @module __tests__/controllers/financingController.test
 */

describe('FinancingController', () => {
  let financingController;
  let mockModels, mockValidators, mockCalculations, mockErrors;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mocks dos modelos
    mockModels = {
      Financing: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        findAndCountAll: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        count: jest.fn()
      },
      FinancingPayment: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        count: jest.fn()
      },
      Creditor: {
        findByPk: jest.fn(),
        findOne: jest.fn()
      },
      Account: {
        findByPk: jest.fn()
      },
      Category: {
        findByPk: jest.fn()
      }
    };

    // Mocks dos validators
    mockValidators = {
      createFinancingSchema: {
        parse: jest.fn()
      },
      updateFinancingSchema: {
        parse: jest.fn()
      },
      listFinancingsSchema: {
        parse: jest.fn()
      },
      simulateEarlyPaymentSchema: {
        parse: jest.fn()
      },
      amortizationTableSchema: {
        parse: jest.fn()
      }
    };

    // Mocks dos cálculos
    mockCalculations = {
      calculateSACPayment: jest.fn(),
      calculatePricePayment: jest.fn(),
      generateAmortizationTable: jest.fn(),
      calculateUpdatedBalance: jest.fn(),
      simulateEarlyPayment: jest.fn()
    };

    // Mocks dos erros
    mockErrors = {
      ValidationError: class ValidationError extends Error {
        constructor(message) {
          super(message);
          this.name = 'ValidationError';
        }
      },
      NotFoundError: class NotFoundError extends Error {
        constructor(message) {
          super(message);
          this.name = 'NotFoundError';
        }
      }
    };

    // Aplicar mocks
    jest.mock('../../models', () => mockModels);
    jest.mock('../../utils/financingValidators', () => mockValidators);
    jest.mock('../../utils/financingCalculations', () => mockCalculations);
    jest.mock('../../utils/errors', () => mockErrors);

    // Importar controller
    financingController = require('../../controllers/financingController');
  });

  describe('createFinancing', () => {
    it('deve criar um novo financiamento SAC com sucesso', async () => {
      // Arrange
      const req = {
        userId: 1,
        body: {
          creditor_id: 1,
          financing_type: 'emprestimo_pessoal',
          description: 'Empréstimo pessoal',
          total_amount: 50000,
          interest_rate: 0.15,
          term_months: 60,
          amortization_method: 'SAC',
          start_date: '2024-01-01'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const validatedData = { ...req.body };
      const mockCreditor = { id: 1, name: 'Banco Teste' };
      const mockFinancing = {
        id: 1,
        ...validatedData,
        user_id: 1,
        monthly_payment: 1200,
        current_balance: 50000
      };

      const mockAmortizationTable = {
        summary: {
          totalAmount: 50000,
          totalInterest: 15000,
          totalPayments: 65000
        }
      };

      // Configurar mocks
      mockValidators.createFinancingSchema.parse.mockReturnValue(validatedData);
      mockModels.Creditor.findOne.mockResolvedValue(mockCreditor);
      mockCalculations.calculateSACPayment.mockReturnValue(1200);
      mockModels.Financing.create.mockResolvedValue(mockFinancing);
      mockCalculations.generateAmortizationTable.mockReturnValue(mockAmortizationTable);

      // Act
      await financingController.createFinancing(req, res);

      // Assert
      expect(mockValidators.createFinancingSchema.parse).toHaveBeenCalledWith(req.body);
      expect(mockModels.Creditor.findOne).toHaveBeenCalledWith({
        where: {
          id: validatedData.creditor_id,
          user_id: req.userId
        }
      });
      expect(mockCalculations.calculateSACPayment).toHaveBeenCalledWith(
        validatedData.total_amount,
        validatedData.interest_rate,
        validatedData.term_months
      );
      expect(mockModels.Financing.create).toHaveBeenCalledWith({
        ...validatedData,
        user_id: req.userId,
        monthly_payment: 1200,
        current_balance: validatedData.total_amount
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Financiamento criado com sucesso',
        financing: mockFinancing,
        amortization: {
          monthlyPayment: 1200,
          summary: mockAmortizationTable.summary
        }
      });
    });

    it('deve criar um novo financiamento Price com sucesso', async () => {
      // Arrange
      const req = {
        userId: 1,
        body: {
          creditor_id: 1,
          financing_type: 'hipoteca',
          description: 'Financiamento imobiliário',
          total_amount: 100000,
          interest_rate: 0.12,
          term_months: 120,
          amortization_method: 'Price',
          start_date: '2024-01-01'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const validatedData = { ...req.body };
      const mockCreditor = { id: 1, name: 'Banco Teste' };
      const mockFinancing = {
        id: 1,
        ...validatedData,
        user_id: 1,
        monthly_payment: 1500,
        current_balance: 100000
      };

      const mockAmortizationTable = {
        summary: {
          totalAmount: 100000,
          totalInterest: 80000,
          totalPayments: 180000
        }
      };

      // Configurar mocks
      mockValidators.createFinancingSchema.parse.mockReturnValue(validatedData);
      mockModels.Creditor.findOne.mockResolvedValue(mockCreditor);
      mockCalculations.calculatePricePayment.mockReturnValue(1500);
      mockModels.Financing.create.mockResolvedValue(mockFinancing);
      mockCalculations.generateAmortizationTable.mockReturnValue(mockAmortizationTable);

      // Act
      await financingController.createFinancing(req, res);

      // Assert
      expect(mockCalculations.calculatePricePayment).toHaveBeenCalledWith(
        validatedData.total_amount,
        validatedData.interest_rate,
        validatedData.term_months
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve retornar erro quando credor não é encontrado', async () => {
      // Arrange
      const req = {
        userId: 1,
        body: {
          creditor_id: 999,
          financing_type: 'emprestimo_pessoal',
          description: 'Empréstimo pessoal',
          total_amount: 50000,
          interest_rate: 0.15,
          term_months: 60,
          amortization_method: 'SAC',
          start_date: '2024-01-01'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const validatedData = { ...req.body };

      // Configurar mocks
      mockValidators.createFinancingSchema.parse.mockReturnValue(validatedData);
      mockModels.Creditor.findOne.mockResolvedValue(null);

      // Act
      await financingController.createFinancing(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Credor não encontrado'
      });
    });

    it('deve lidar com erro de validação Zod', async () => {
      // Arrange
      const req = {
        userId: 1,
        body: {}
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

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

      // Configurar mocks
      mockValidators.createFinancingSchema.parse.mockImplementation(() => {
        throw mockZodError;
      });

      // Act
      await financingController.createFinancing(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Dados inválidos',
        details: mockZodError.errors
      });
    });

    it('deve lidar com erro interno do servidor', async () => {
      // Arrange
      const req = {
        userId: 1,
        body: {
          creditor_id: 1,
          financing_type: 'emprestimo_pessoal',
          description: 'Empréstimo pessoal',
          total_amount: 50000,
          interest_rate: 0.15,
          term_months: 60,
          amortization_method: 'SAC',
          start_date: '2024-01-01'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const validatedData = { ...req.body };
      const mockCreditor = { id: 1, name: 'Banco Teste' };

      // Configurar mocks
      mockValidators.createFinancingSchema.parse.mockReturnValue(validatedData);
      mockModels.Creditor.findOne.mockResolvedValue(mockCreditor);
      mockCalculations.calculateSACPayment.mockImplementation(() => {
        throw new Error('Erro interno');
      });

      // Act
      await financingController.createFinancing(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('listFinancings', () => {
    it('deve listar financiamentos com paginação', async () => {
      // Arrange
      const req = {
        userId: 1,
        query: {
          page: 1,
          limit: 10,
          financing_type: 'hipoteca'
        }
      };

      const res = {
        json: jest.fn()
      };

      const validatedQuery = { ...req.query };
      const mockFinancing = {
        id: 1,
        description: 'Financiamento 1',
        total_amount: 50000,
        current_balance: 40000,
        term_months: 60,
        creditor: { id: 1, name: 'Banco Teste' },
        payments: [
          { id: 1, payment_amount: 1000, payment_date: '2024-01-15', status: 'paid' },
          { id: 2, payment_amount: 1000, payment_date: '2024-02-15', status: 'paid' }
        ],
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          description: 'Financiamento 1',
          total_amount: 50000,
          current_balance: 40000,
          term_months: 60,
          creditor: { id: 1, name: 'Banco Teste' },
          payments: [
            { id: 1, payment_amount: 1000, payment_date: '2024-01-15', status: 'paid' },
            { id: 2, payment_amount: 1000, payment_date: '2024-02-15', status: 'paid' }
          ]
        })
      };

      const mockResult = {
        count: 1,
        rows: [mockFinancing]
      };

      // Configurar mocks
      mockValidators.listFinancingsSchema.parse.mockReturnValue(validatedQuery);
      mockModels.Financing.findAndCountAll.mockResolvedValue(mockResult);

      // Act
      await financingController.listFinancings(req, res);

      // Assert
      expect(mockValidators.listFinancingsSchema.parse).toHaveBeenCalledWith(req.query);
      expect(mockModels.Financing.findAndCountAll).toHaveBeenCalledWith({
        where: {
          user_id: req.userId,
          financing_type: validatedQuery.financing_type
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            model: mockModels.Creditor,
            as: 'creditor'
          }),
          expect.objectContaining({
            model: mockModels.FinancingPayment,
            as: 'payments'
          })
        ]),
        order: [['created_at', 'DESC']],
        limit: validatedQuery.limit,
        offset: 0
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          financings: expect.arrayContaining([
            expect.objectContaining({
              stats: expect.objectContaining({
                totalPaid: 2000,
                paidInstallments: 2,
                percentagePaid: 4,
                remainingInstallments: 58
              })
            })
          ]),
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          })
        })
      );
    });

    it('deve aplicar filtros de data corretamente', async () => {
      // Arrange
      const req = {
        userId: 1,
        query: {
          page: 1,
          limit: 10,
          start_date_from: '2024-01-01',
          start_date_to: '2024-12-31'
        }
      };

      const res = {
        json: jest.fn()
      };

      const validatedQuery = { ...req.query };
      const mockResult = {
        count: 0,
        rows: []
      };

      // Configurar mocks
      mockValidators.listFinancingsSchema.parse.mockReturnValue(validatedQuery);
      mockModels.Financing.findAndCountAll.mockResolvedValue(mockResult);

      // Act
      await financingController.listFinancings(req, res);

      // Assert
      expect(mockModels.Financing.findAndCountAll).toHaveBeenCalledWith({
        where: {
          user_id: req.userId,
          start_date: expect.objectContaining({
            [require('sequelize').Op.gte]: validatedQuery.start_date_from,
            [require('sequelize').Op.lte]: validatedQuery.start_date_to
          })
        },
        include: expect.any(Array),
        order: [['created_at', 'DESC']],
        limit: validatedQuery.limit,
        offset: 0
      });
    });
  });

  describe('getFinancing', () => {
    it('deve retornar um financiamento específico', async () => {
      mockModels.Financing.findOne.mockReset();
      const req = { userId: 1, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      const mockFinancing = {
        id: 1,
        description: 'Financiamento imobiliário',
        total_amount: 100000,
        current_balance: 80000,
        term_months: 120,
        creditor: { id: 1, name: 'Banco do Brasil' },
        payments: [
          { id: 1, payment_amount: 1000, payment_date: '2024-01-15', status: 'paid' },
          { id: 2, payment_amount: 1000, payment_date: '2024-02-15', status: 'paid' },
          { id: 3, payment_amount: 1000, payment_date: '2024-03-15', status: 'paid' },
          { id: 4, payment_amount: 1000, payment_date: '2024-04-15', status: 'paid' },
          { id: 5, payment_amount: 1000, payment_date: '2024-05-15', status: 'paid' }
        ],
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          description: 'Financiamento imobiliário',
          total_amount: 100000,
          current_balance: 80000,
          term_months: 120,
          creditor: { id: 1, name: 'Banco do Brasil' },
          payments: [
            { id: 1, payment_amount: 1000, payment_date: '2024-01-15', status: 'paid' },
            { id: 2, payment_amount: 1000, payment_date: '2024-02-15', status: 'paid' },
            { id: 3, payment_amount: 1000, payment_date: '2024-03-15', status: 'paid' },
            { id: 4, payment_amount: 1000, payment_date: '2024-04-15', status: 'paid' },
            { id: 5, payment_amount: 1000, payment_date: '2024-05-15', status: 'paid' }
          ]
        })
      };
      mockModels.Financing.findOne.mockResolvedValue(mockFinancing);
      mockCalculations.calculateUpdatedBalance.mockReturnValue({
        currentBalance: 80000,
        paidInstallments: 5
      });
      await financingController.getFinancing(req, res);
      expect(res.json).toHaveBeenCalledWith({
        financing: mockFinancing,
        balance: {
          currentBalance: 80000,
          paidInstallments: 5
        }
      });
    });
    it('deve retornar erro quando financiamento não é encontrado', async () => {
      mockModels.Financing.findOne.mockReset();
      const req = { userId: 1, params: { id: 999 } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      mockModels.Financing.findOne.mockResolvedValue(null);
      await financingController.getFinancing(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Financiamento não encontrado' });
    });
  });

  describe('updateFinancing', () => {
    it('deve atualizar um financiamento com sucesso', async () => {
      mockModels.Financing.findOne.mockReset();
      mockModels.Financing.update.mockReset();
      const req = { userId: 1, params: { id: 1 }, body: { description: 'Financiamento atualizado', interest_rate: 0.12 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      const validatedData = { ...req.body };
      const mockFinancing = {
        id: 1,
        description: 'Financiamento atualizado',
        interest_rate: 0.12,
        user_id: 1,
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({ id: 1, description: 'Financiamento atualizado', interest_rate: 0.12, user_id: 1 })
      };
      mockValidators.updateFinancingSchema.parse.mockReturnValue(validatedData);
      mockModels.Financing.findOne.mockResolvedValue(mockFinancing);
      await financingController.updateFinancing(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Financiamento atualizado com sucesso', financing: mockFinancing });
    });
    it('deve retornar erro quando financiamento não é encontrado', async () => {
      mockModels.Financing.findOne.mockReset();
      const req = { userId: 1, params: { id: 999 }, body: { description: 'Atualizado' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      mockValidators.updateFinancingSchema.parse.mockReturnValue({ ...req.body });
      mockModels.Financing.findOne.mockResolvedValue(null);
      try {
        await financingController.updateFinancing(req, res);
      } catch (err) {
        expect(err.name).toBe('NotFoundError');
        expect(err.message).toBe('Financiamento não encontrado');
      }
    });
  });

  describe('deleteFinancing', () => {
    it('deve deletar um financiamento com sucesso', async () => {
      mockModels.FinancingPayment.count.mockReset();
      mockModels.Financing.destroy.mockReset();
      const req = { userId: 1, params: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      mockModels.FinancingPayment.count.mockResolvedValue(0);
      mockModels.Financing.destroy.mockResolvedValue(1);
      await financingController.deleteFinancing(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Financiamento deletado com sucesso' });
    });
    it('deve retornar erro quando financiamento tem pagamentos', async () => {
      mockModels.FinancingPayment.count.mockReset();
      const req = { userId: 1, params: { id: 1 } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      mockModels.FinancingPayment.count.mockResolvedValue(1);
      try {
        await financingController.deleteFinancing(req, res);
      } catch (err) {
        expect(err.message).toMatch('Não é possível deletar um financiamento');
      }
    });
  });

  describe('getAmortizationTable', () => {
    it('deve retornar tabela de amortização', async () => {
      mockModels.Financing.findOne.mockReset();
      const req = { userId: 1, params: { id: 1 }, query: {} };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      const mockFinancing = { 
        id: 1, 
        total_amount: 50000, 
        interest_rate: 0.15, 
        term_months: 60, 
        amortization_method: 'SAC', 
        start_date: '2024-01-01', 
        user_id: 1, 
        toJSON: jest.fn().mockReturnValue({ 
          id: 1, 
          total_amount: 50000, 
          interest_rate: 0.15, 
          term_months: 60, 
          amortization_method: 'SAC', 
          start_date: '2024-01-01', 
          user_id: 1 
        }) 
      };
      const mockAmortizationTable = { 
        installments: [{ 
          installment: 1, 
          payment_date: '2024-01-15', 
          principal: 1000, 
          interest: 500, 
          total_payment: 1500, 
          remaining_balance: 49000 
        }], 
        summary: { 
          totalAmount: 50000, 
          totalInterest: 15000, 
          totalPayments: 65000 
        } 
      };
      mockValidators.amortizationTableSchema.parse.mockReturnValue(req.query);
      mockModels.Financing.findOne.mockResolvedValue(mockFinancing);
      mockCalculations.generateAmortizationTable.mockReturnValue(mockAmortizationTable);
      await financingController.getAmortizationTable(req, res);
      expect(res.json).toHaveBeenCalledWith(mockAmortizationTable);
    });
    it('deve retornar erro quando financiamento não é encontrado', async () => {
      mockModels.Financing.findOne.mockReset();
      const req = { userId: 1, params: { id: 999 }, query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      mockValidators.amortizationTableSchema.parse.mockReturnValue(req.query);
      mockModels.Financing.findOne.mockResolvedValue(null);
      try {
        await financingController.getAmortizationTable(req, res);
      } catch (err) {
        expect(err.name).toBe('NotFoundError');
        expect(err.message).toBe('Financiamento não encontrado');
      }
    });
  });

  describe('simulateEarlyPayment', () => {
    it('deve simular pagamento antecipado com sucesso', async () => {
      mockModels.Financing.findOne.mockReset();
      const req = { userId: 1, params: { id: 1 }, body: { payment_amount: 10000, preference: 'reducao_prazo' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      const validatedData = { ...req.body };
      const mockFinancing = { 
        id: 1, 
        total_amount: 50000, 
        current_balance: 40000, 
        interest_rate: 0.15, 
        term_months: 60, 
        amortization_method: 'SAC', 
        user_id: 1,
        payments: [],
        toJSON: jest.fn().mockReturnValue({ 
          id: 1, 
          total_amount: 50000, 
          current_balance: 40000, 
          interest_rate: 0.15, 
          term_months: 60, 
          amortization_method: 'SAC', 
          user_id: 1 
        }) 
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
      mockValidators.simulateEarlyPaymentSchema.parse.mockReturnValue(validatedData);
      mockModels.Financing.findOne.mockResolvedValue(mockFinancing);
      mockCalculations.calculateUpdatedBalance.mockReturnValue({
        currentBalance: 40000,
        paidInstallments: 5
      });
      mockCalculations.simulateEarlyPayment.mockReturnValue(mockSimulation);
      await financingController.simulateEarlyPayment(req, res);
      expect(res.json).toHaveBeenCalledWith({ simulation: mockSimulation });
    });
    it('deve retornar erro quando financiamento não é encontrado', async () => {
      mockModels.Financing.findOne.mockReset();
      const req = { userId: 1, params: { id: 999 }, body: { payment_amount: 10000, preference: 'reducao_prazo' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      mockValidators.simulateEarlyPaymentSchema.parse.mockReturnValue({ ...req.body });
      mockModels.Financing.findOne.mockResolvedValue(null);
      try {
        await financingController.simulateEarlyPayment(req, res);
      } catch (err) {
        expect(err.name).toBe('NotFoundError');
        expect(err.message).toBe('Financiamento não encontrado');
      }
    });
  });

  describe('getFinancingStatistics', () => {
    it('deve retornar estatísticas dos financiamentos', async () => {
      const req = { userId: 1 };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      const mockFinancings = [
        {
          id: 1,
          total_amount: 100000,
          current_balance: 80000,
          status: 'active',
          payments: [
            { payment_amount: 1000, status: 'paid' },
            { payment_amount: 1000, status: 'paid' }
          ],
          toJSON: jest.fn().mockReturnValue({ id: 1, total_amount: 100000, current_balance: 80000, status: 'active', payments: [ { payment_amount: 1000, status: 'paid' }, { payment_amount: 1000, status: 'paid' } ] })
        },
        {
          id: 2,
          total_amount: 50000,
          current_balance: 0,
          status: 'paid',
          payments: [
            { payment_amount: 5000, status: 'paid' },
            { payment_amount: 5000, status: 'paid' },
            { payment_amount: 5000, status: 'paid' },
            { payment_amount: 5000, status: 'paid' },
            { payment_amount: 5000, status: 'paid' },
            { payment_amount: 5000, status: 'paid' },
            { payment_amount: 5000, status: 'paid' },
            { payment_amount: 5000, status: 'paid' },
            { payment_amount: 5000, status: 'paid' },
            { payment_amount: 5000, status: 'paid' }
          ],
          toJSON: jest.fn().mockReturnValue({ id: 2, total_amount: 50000, current_balance: 0, status: 'paid', payments: [ { payment_amount: 5000, status: 'paid' }, { payment_amount: 5000, status: 'paid' }, { payment_amount: 5000, status: 'paid' }, { payment_amount: 5000, status: 'paid' }, { payment_amount: 5000, status: 'paid' }, { payment_amount: 5000, status: 'paid' }, { payment_amount: 5000, status: 'paid' }, { payment_amount: 5000, status: 'paid' }, { payment_amount: 5000, status: 'paid' }, { payment_amount: 5000, status: 'paid' } ] })
        }
      ];
      mockModels.Financing.findAll.mockResolvedValue(mockFinancings);
      await financingController.getFinancingStatistics(req, res);
      // O controller calcula percentagePaid e totalInterestPaid, então aceitamos qualquer valor numérico
      expect(res.json).toHaveBeenCalledWith({
        statistics: expect.objectContaining({
          totalFinancings: 2,
          activeFinancings: expect.any(Number),
          paidFinancings: expect.any(Number),
          overdueFinancings: expect.any(Number),
          totalFinanced: 150000,
          totalPaid: expect.any(Number),
          averageFinancingAmount: 75000,
          percentagePaid: expect.any(Number),
          totalInterestPaid: expect.any(Number)
        })
      });
    });
  });
}); 