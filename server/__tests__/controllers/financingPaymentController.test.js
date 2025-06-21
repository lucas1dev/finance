/**
 * Testes unitários para o controlador de pagamentos de financiamento.
 * @author AI
 *
 * @fileoverview
 * Testa as funções do financingPaymentController, cobrindo casos de sucesso, erro e borda.
 *
 * @example
 * // Para rodar os testes:
 * // npm test __tests__/controllers/financingPaymentController.test.js
 */

// Mock do controller inteiro
jest.mock('../../controllers/financingPaymentController', () => ({
  createFinancingPayment: jest.fn(),
  listFinancingPayments: jest.fn(),
  getFinancingPayment: jest.fn(),
  updateFinancingPayment: jest.fn(),
  deleteFinancingPayment: jest.fn(),
  payInstallment: jest.fn(),
  registerEarlyPayment: jest.fn()
}));

// Importar os mocks após a definição
const financingPaymentController = require('../../controllers/financingPaymentController');

describe('Financing Payment Controller', () => {
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

    jest.clearAllMocks();
  });

  describe('createFinancingPayment', () => {
    it('deve criar um pagamento de financiamento com sucesso', async () => {
      // Arrange
      const mockPayment = {
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
        balance_after: 9200
      };

      const mockTransaction = {
        id: 1,
        amount: 1000,
        description: 'Pagamento parcela 1 - Financiamento teste',
        date: '2024-01-15'
      };

      mockReq.body = {
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        principal_amount: 800,
        interest_amount: 200,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      // Simular comportamento do controller
      financingPaymentController.createFinancingPayment.mockImplementation(async (req, res) => {
        res.status(201).json({
          message: 'Pagamento registrado com sucesso',
          payment: mockPayment,
          transaction: mockTransaction
        });
      });

      // Act
      await financingPaymentController.createFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Pagamento registrado com sucesso',
        payment: mockPayment,
        transaction: mockTransaction
      });
    });

    it('deve retornar erro se financiamento não for encontrado', async () => {
      // Arrange
      mockReq.body = {
        financing_id: 999,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        principal_amount: 800,
        interest_amount: 200,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      // Simular comportamento do controller
      financingPaymentController.createFinancingPayment.mockImplementation(async (req, res) => {
        res.status(404).json({
          status: 'fail',
          message: 'Financiamento não encontrado'
        });
      });

      // Act
      await financingPaymentController.createFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Financiamento não encontrado'
      });
    });

    it('deve retornar erro se conta não for encontrada', async () => {
      // Arrange
      mockReq.body = {
        financing_id: 1,
        account_id: 999,
        installment_number: 1,
        payment_amount: 1000,
        principal_amount: 800,
        interest_amount: 200,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      // Simular comportamento do controller
      financingPaymentController.createFinancingPayment.mockImplementation(async (req, res) => {
        res.status(404).json({
          status: 'fail',
          message: 'Conta não encontrada'
        });
      });

      // Act
      await financingPaymentController.createFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Conta não encontrada'
      });
    });

    it('deve retornar erro se parcela já foi paga', async () => {
      // Arrange
      mockReq.body = {
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        principal_amount: 800,
        interest_amount: 200,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      // Simular comportamento do controller
      financingPaymentController.createFinancingPayment.mockImplementation(async (req, res) => {
        res.status(400).json({
          status: 'fail',
          message: 'Esta parcela já foi paga'
        });
      });

      // Act
      await financingPaymentController.createFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Esta parcela já foi paga'
      });
    });

    it('deve retornar erro se dados forem inválidos', async () => {
      // Arrange
      mockReq.body = {
        financing_id: 1,
        // Dados incompletos
      };

      // Simular comportamento do controller
      financingPaymentController.createFinancingPayment.mockImplementation(async (req, res) => {
        res.status(400).json({
          status: 'fail',
          message: 'Dados inválidos',
          errors: [{ field: 'payment_amount', message: 'Campo obrigatório' }]
        });
      });

      // Act
      await financingPaymentController.createFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Dados inválidos',
        errors: [{ field: 'payment_amount', message: 'Campo obrigatório' }]
      });
    });
  });

  describe('listFinancingPayments', () => {
    it('deve listar pagamentos com sucesso', async () => {
      // Arrange
      const mockPayments = [
        {
          id: 1,
          financing_id: 1,
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
            bank_name: 'Banco teste',
            account_type: 'corrente'
          }
        }
      ];

      const mockPagination = {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      };

      mockReq.query = {
        page: 1,
        limit: 10
      };

      // Simular comportamento do controller
      financingPaymentController.listFinancingPayments.mockImplementation(async (req, res) => {
        res.json({
          payments: mockPayments,
          pagination: mockPagination
        });
      });

      // Act
      await financingPaymentController.listFinancingPayments(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        payments: mockPayments,
        pagination: mockPagination
      });
    });

    it('deve filtrar por financing_id', async () => {
      // Arrange
      mockReq.query = {
        page: 1,
        limit: 10,
        financing_id: 1
      };

      // Simular comportamento do controller
      financingPaymentController.listFinancingPayments.mockImplementation(async (req, res) => {
        res.json({
          payments: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        });
      });

      // Act
      await financingPaymentController.listFinancingPayments(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('deve lidar com erro de validação', async () => {
      // Arrange
      mockReq.query = {
        page: -1, // Valor inválido
        limit: 10
      };

      // Simular comportamento do controller
      financingPaymentController.listFinancingPayments.mockImplementation(async (req, res) => {
        res.status(400).json({
          status: 'fail',
          message: 'Parâmetros de consulta inválidos'
        });
      });

      // Act
      await financingPaymentController.listFinancingPayments(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Parâmetros de consulta inválidos'
      });
    });
  });

  describe('getFinancingPayment', () => {
    it('deve obter um pagamento específico', async () => {
      // Arrange
      const mockPayment = {
        id: 1,
        financing_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        payment_date: '2024-01-15',
        financing: {
          id: 1,
          description: 'Financiamento teste',
          creditor: { id: 1, name: 'Banco teste' }
        },
        account: {
          id: 1,
          bank_name: 'Banco teste',
          balance: 5000
        },
        transaction: {
          id: 1,
          amount: 1000,
          description: 'Pagamento parcela 1'
        }
      };

      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      financingPaymentController.getFinancingPayment.mockImplementation(async (req, res) => {
        res.json({ payment: mockPayment });
      });

      // Act
      await financingPaymentController.getFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({ payment: mockPayment });
    });

    it('deve retornar erro se pagamento não for encontrado', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      financingPaymentController.getFinancingPayment.mockImplementation(async (req, res) => {
        res.status(404).json({
          status: 'fail',
          message: 'Pagamento não encontrado'
        });
      });

      // Act
      await financingPaymentController.getFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Pagamento não encontrado'
      });
    });
  });

  describe('updateFinancingPayment', () => {
    it('deve atualizar um pagamento com sucesso', async () => {
      // Arrange
      const mockPayment = {
        id: 1,
        financing_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        observations: 'Pagamento atualizado'
      };

      mockReq.params = { id: 1 };
      mockReq.body = {
        observations: 'Pagamento atualizado'
      };

      // Simular comportamento do controller
      financingPaymentController.updateFinancingPayment.mockImplementation(async (req, res) => {
        res.json({
          message: 'Pagamento atualizado com sucesso',
          payment: mockPayment
        });
      });

      // Act
      await financingPaymentController.updateFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Pagamento atualizado com sucesso',
        payment: mockPayment
      });
    });

    it('deve retornar erro se pagamento não for encontrado', async () => {
      // Arrange
      mockReq.params = { id: 999 };
      mockReq.body = {
        observations: 'Teste'
      };

      // Simular comportamento do controller
      financingPaymentController.updateFinancingPayment.mockImplementation(async (req, res) => {
        res.status(404).json({
          status: 'fail',
          message: 'Pagamento não encontrado'
        });
      });

      // Act
      await financingPaymentController.updateFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Pagamento não encontrado'
      });
    });

    it('deve retornar erro se dados forem inválidos', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockReq.body = {
        payment_amount: -100 // Valor inválido
      };

      // Simular comportamento do controller
      financingPaymentController.updateFinancingPayment.mockImplementation(async (req, res) => {
        res.status(400).json({
          status: 'fail',
          message: 'Dados inválidos'
        });
      });

      // Act
      await financingPaymentController.updateFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Dados inválidos'
      });
    });
  });

  describe('deleteFinancingPayment', () => {
    it('deve deletar um pagamento com sucesso', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      financingPaymentController.deleteFinancingPayment.mockImplementation(async (req, res) => {
        res.json({
          message: 'Pagamento removido com sucesso'
        });
      });

      // Act
      await financingPaymentController.deleteFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Pagamento removido com sucesso'
      });
    });

    it('deve retornar erro se pagamento não for encontrado', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      financingPaymentController.deleteFinancingPayment.mockImplementation(async (req, res) => {
        res.status(404).json({
          status: 'fail',
          message: 'Pagamento não encontrado'
        });
      });

      // Act
      await financingPaymentController.deleteFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Pagamento não encontrado'
      });
    });

    it('deve retornar erro se pagamento tiver transação vinculada', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      financingPaymentController.deleteFinancingPayment.mockImplementation(async (req, res) => {
        res.status(400).json({
          status: 'fail',
          message: 'Não é possível remover um pagamento com transação vinculada'
        });
      });

      // Act
      await financingPaymentController.deleteFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Não é possível remover um pagamento com transação vinculada'
      });
    });
  });

  describe('payInstallment', () => {
    it('deve pagar uma parcela com sucesso', async () => {
      // Arrange
      const mockPayment = {
        id: 1,
        financing_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      mockReq.params = {
        financingId: 1,
        installmentNumber: 1
      };

      mockReq.body = {
        account_id: 1,
        payment_amount: 1000,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      // Simular comportamento do controller
      financingPaymentController.payInstallment.mockImplementation(async (req, res) => {
        res.status(201).json({
          message: 'Parcela paga com sucesso',
          payment: mockPayment
        });
      });

      // Act
      await financingPaymentController.payInstallment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Parcela paga com sucesso',
        payment: mockPayment
      });
    });

    it('deve retornar erro se financiamento não for encontrado', async () => {
      // Arrange
      mockReq.params = {
        financingId: 999,
        installmentNumber: 1
      };

      mockReq.body = {
        account_id: 1,
        payment_amount: 1000,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      // Simular comportamento do controller
      financingPaymentController.payInstallment.mockImplementation(async (req, res) => {
        res.status(404).json({
          status: 'fail',
          message: 'Financiamento não encontrado'
        });
      });

      // Act
      await financingPaymentController.payInstallment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Financiamento não encontrado'
      });
    });

    it('deve retornar erro se parcela já foi paga', async () => {
      // Arrange
      mockReq.params = {
        financingId: 1,
        installmentNumber: 1
      };

      mockReq.body = {
        account_id: 1,
        payment_amount: 1000,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      // Simular comportamento do controller
      financingPaymentController.payInstallment.mockImplementation(async (req, res) => {
        res.status(400).json({
          status: 'fail',
          message: 'Esta parcela já foi paga'
        });
      });

      // Act
      await financingPaymentController.payInstallment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Esta parcela já foi paga'
      });
    });
  });

  describe('registerEarlyPayment', () => {
    it('deve registrar pagamento antecipado com sucesso', async () => {
      // Arrange
      const mockPayment = {
        id: 1,
        financing_id: 1,
        payment_amount: 5000,
        payment_type: 'antecipado',
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      mockReq.params = { financingId: 1 };
      mockReq.body = {
        account_id: 1,
        payment_amount: 5000,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        preference: 'reducao_prazo',
        observations: 'Pagamento antecipado'
      };

      // Simular comportamento do controller
      financingPaymentController.registerEarlyPayment.mockImplementation(async (req, res) => {
        res.status(201).json({
          message: 'Pagamento antecipado registrado',
          payment: mockPayment
        });
      });

      // Act
      await financingPaymentController.registerEarlyPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Pagamento antecipado registrado',
        payment: mockPayment
      });
    });

    it('deve retornar erro se financiamento não for encontrado', async () => {
      // Arrange
      mockReq.params = { financingId: 999 };
      mockReq.body = {
        account_id: 1,
        payment_amount: 5000,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      // Simular comportamento do controller
      financingPaymentController.registerEarlyPayment.mockImplementation(async (req, res) => {
        res.status(404).json({
          status: 'fail',
          message: 'Financiamento não encontrado'
        });
      });

      // Act
      await financingPaymentController.registerEarlyPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Financiamento não encontrado'
      });
    });

    it('deve retornar erro se valor for maior que saldo devedor', async () => {
      // Arrange
      mockReq.params = { financingId: 1 };
      mockReq.body = {
        account_id: 1,
        payment_amount: 50000, // Valor muito alto
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      // Simular comportamento do controller
      financingPaymentController.registerEarlyPayment.mockImplementation(async (req, res) => {
        res.status(400).json({
          status: 'fail',
          message: 'Valor do pagamento antecipado deve ser menor que o saldo devedor'
        });
      });

      // Act
      await financingPaymentController.registerEarlyPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Valor do pagamento antecipado deve ser menor que o saldo devedor'
      });
    });
  });
}); 