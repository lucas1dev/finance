/**
 * Testes unitários para FinancingPaymentController
 * Testa operações CRUD, validações e integração com transações
 */

// Mock do FinancingPaymentService
jest.mock('../../services/financingPaymentService', () => ({
  createFinancingPayment: jest.fn(),
  listFinancingPayments: jest.fn(),
  getFinancingPayment: jest.fn(),
  updateFinancingPayment: jest.fn(),
  deleteFinancingPayment: jest.fn(),
  payInstallment: jest.fn(),
  registerEarlyPayment: jest.fn()
}));

// Mock do logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

// Importar o controller DEPOIS de todos os mocks
const financingPaymentController = require('../../controllers/financingPaymentController');
const FinancingPaymentService = require('../../services/financingPaymentService');
const { ValidationError, NotFoundError } = require('../../utils/errors');

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
        payment_method: 'pix'
      };

      const mockResult = {
        payment: {
          id: 1,
          financing_id: 1,
          account_id: 1,
          installment_number: 1,
          payment_amount: 1000,
          payment_date: '2024-01-15',
          payment_method: 'pix'
        },
        transaction: {
          id: 1,
          type: 'expense',
          amount: 1000
        }
      };

      mockReq.body = paymentData;
      FinancingPaymentService.createFinancingPayment.mockResolvedValue(mockResult);

      // Act
      await financingPaymentController.createFinancingPayment(mockReq, mockRes);

      // Assert
      expect(FinancingPaymentService.createFinancingPayment).toHaveBeenCalledWith(1, paymentData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Pagamento registrado com sucesso'
      });
    });

    it('deve retornar erro se financiamento não for encontrado', async () => {
      // Arrange
      const paymentData = {
        financing_id: 999,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        principal_amount: 800,
        interest_amount: 200,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      mockReq.body = paymentData;
      FinancingPaymentService.createFinancingPayment.mockRejectedValue(new NotFoundError('Financiamento não encontrado'));

      // Act
      await financingPaymentController.createFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Financiamento não encontrado'
      });
    });

    it('deve retornar erro se conta não for encontrada', async () => {
      // Arrange
      const paymentData = {
        financing_id: 1,
        account_id: 999,
        installment_number: 1,
        payment_amount: 1000,
        principal_amount: 800,
        interest_amount: 200,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      mockReq.body = paymentData;
      FinancingPaymentService.createFinancingPayment.mockRejectedValue(new NotFoundError('Conta não encontrada'));

      // Act
      await financingPaymentController.createFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Conta não encontrada'
      });
    });

    it('deve retornar erro se parcela já foi paga', async () => {
      // Arrange
      const paymentData = {
        financing_id: 1,
        account_id: 1,
        installment_number: 1,
        payment_amount: 1000,
        principal_amount: 800,
        interest_amount: 200,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      mockReq.body = paymentData;
      FinancingPaymentService.createFinancingPayment.mockRejectedValue(new ValidationError('Esta parcela já foi paga'));

      // Act
      await financingPaymentController.createFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Esta parcela já foi paga'
      });
    });

    it('deve retornar erro de validação para dados inválidos', async () => {
      // Arrange
      const paymentData = {};
      mockReq.body = paymentData;
      FinancingPaymentService.createFinancingPayment.mockRejectedValue(new ValidationError('Dados inválidos'));

      // Act
      await financingPaymentController.createFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados inválidos'
      });
    });
  });

  describe('listFinancingPayments', () => {
    it('deve listar pagamentos com sucesso', async () => {
      // Arrange
      const mockResult = {
        payments: [
          {
            id: 1,
            financing_id: 1,
            account_id: 1,
            installment_number: 1,
            payment_amount: 1000,
            payment_date: '2024-01-15',
            payment_method: 'pix',
            financing: { id: 1, description: 'Financiamento teste' },
            account: { id: 1, name: 'Conta teste' }
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        },
        statistics: {
          totalAmount: 1000,
          totalInterest: 200,
          totalPrincipal: 800,
          totalPayments: 1
        }
      };

      mockReq.query = { page: 1, limit: 10 };
      FinancingPaymentService.listFinancingPayments.mockResolvedValue(mockResult);

      // Act
      await financingPaymentController.listFinancingPayments(mockReq, mockRes);

      // Assert
      expect(FinancingPaymentService.listFinancingPayments).toHaveBeenCalledWith(1, { page: 1, limit: 10 });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve lidar com erro de validação', async () => {
      // Arrange
      mockReq.query = { financing_id: 'invalid' };
      FinancingPaymentService.listFinancingPayments.mockRejectedValue(new ValidationError('Parâmetros de consulta inválidos'));

      // Act
      await financingPaymentController.listFinancingPayments(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Parâmetros de consulta inválidos'
      });
    });
  });

  describe('getFinancingPayment', () => {
    it('deve obter um pagamento específico', async () => {
      // Arrange
      const mockResult = {
        payment: {
          id: 1,
          financing_id: 1,
          account_id: 1,
          installment_number: 1,
          payment_amount: 1000,
          payment_date: '2024-01-15',
          payment_method: 'pix',
          financing: { id: 1, description: 'Financiamento teste' },
          account: { id: 1, name: 'Conta teste' },
          transaction: { id: 1 }
        }
      };

      mockReq.params.id = '1';
      FinancingPaymentService.getFinancingPayment.mockResolvedValue(mockResult);

      // Act
      await financingPaymentController.getFinancingPayment(mockReq, mockRes);

      // Assert
      expect(FinancingPaymentService.getFinancingPayment).toHaveBeenCalledWith(1, '1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro se pagamento não for encontrado', async () => {
      // Arrange
      mockReq.params.id = '999';
      FinancingPaymentService.getFinancingPayment.mockRejectedValue(new NotFoundError('Pagamento não encontrado'));

      // Act
      await financingPaymentController.getFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Pagamento não encontrado'
      });
    });
  });

  describe('updateFinancingPayment', () => {
    it('deve atualizar um pagamento com sucesso', async () => {
      // Arrange
      const updateData = {
        payment_amount: 1200,
        payment_date: '2024-01-20'
      };

      const mockResult = {
        payment: {
          id: 1,
          payment_amount: 1200,
          payment_date: '2024-01-20'
        }
      };

      mockReq.params.id = '1';
      mockReq.body = updateData;
      FinancingPaymentService.updateFinancingPayment.mockResolvedValue(mockResult);

      // Act
      await financingPaymentController.updateFinancingPayment(mockReq, mockRes);

      // Assert
      expect(FinancingPaymentService.updateFinancingPayment).toHaveBeenCalledWith(1, '1', updateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Pagamento atualizado com sucesso'
      });
    });

    it('deve retornar erro se pagamento não for encontrado', async () => {
      // Arrange
      const updateData = { payment_amount: 1200 };
      mockReq.params.id = '999';
      mockReq.body = updateData;
      FinancingPaymentService.updateFinancingPayment.mockRejectedValue(new NotFoundError('Pagamento não encontrado'));

      // Act
      await financingPaymentController.updateFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Pagamento não encontrado'
      });
    });

    it('deve retornar erro de validação para dados inválidos', async () => {
      // Arrange
      const updateData = { payment_amount: 'invalid' };
      mockReq.params.id = '1';
      mockReq.body = updateData;
      FinancingPaymentService.updateFinancingPayment.mockRejectedValue(new ValidationError('Dados inválidos'));

      // Act
      await financingPaymentController.updateFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados inválidos'
      });
    });
  });

  describe('deleteFinancingPayment', () => {
    it('deve deletar um pagamento com sucesso', async () => {
      // Arrange
      const mockResult = { message: 'Pagamento removido com sucesso' };
      mockReq.params.id = '1';
      FinancingPaymentService.deleteFinancingPayment.mockResolvedValue(mockResult);

      // Act
      await financingPaymentController.deleteFinancingPayment(mockReq, mockRes);

      // Assert
      expect(FinancingPaymentService.deleteFinancingPayment).toHaveBeenCalledWith(1, '1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro se pagamento não for encontrado', async () => {
      // Arrange
      mockReq.params.id = '999';
      FinancingPaymentService.deleteFinancingPayment.mockRejectedValue(new NotFoundError('Pagamento não encontrado'));

      // Act
      await financingPaymentController.deleteFinancingPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Pagamento não encontrado'
      });
    });
  });

  describe('payInstallment', () => {
    it('deve pagar uma parcela com sucesso', async () => {
      // Arrange
      const paymentData = {
        account_id: 1,
        installment_number: 1,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      const mockResult = {
        payment: {
          id: 1,
          financing_id: 1,
          installment_number: 1,
          payment_amount: 1000
        },
        transaction: {
          id: 1,
          type: 'expense',
          amount: 1000
        }
      };

      mockReq.params.financingId = '1';
      mockReq.body = paymentData;
      FinancingPaymentService.payInstallment.mockResolvedValue(mockResult);

      // Act
      await financingPaymentController.payInstallment(mockReq, mockRes);

      // Assert
      expect(FinancingPaymentService.payInstallment).toHaveBeenCalledWith(1, '1', paymentData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Parcela paga com sucesso'
      });
    });

    it('deve retornar erro se parcela já foi paga', async () => {
      // Arrange
      const paymentData = {
        account_id: 1,
        installment_number: 1,
        payment_date: '2024-01-15',
        payment_method: 'pix'
      };

      mockReq.params.financingId = '1';
      mockReq.body = paymentData;
      FinancingPaymentService.payInstallment.mockRejectedValue(new ValidationError('Esta parcela já foi paga'));

      // Act
      await financingPaymentController.payInstallment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Esta parcela já foi paga'
      });
    });
  });

  describe('registerEarlyPayment', () => {
    it('deve registrar pagamento antecipado com sucesso', async () => {
      // Arrange
      const paymentData = {
        account_id: 1,
        payment_amount: 5000,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        preference: 'reducao_prazo'
      };

      const mockResult = {
        payment: {
          id: 1,
          financing_id: 1,
          payment_amount: 5000,
          payment_type: 'early'
        },
        transaction: {
          id: 1,
          type: 'expense',
          amount: 5000
        }
      };

      mockReq.params.financingId = '1';
      mockReq.body = paymentData;
      FinancingPaymentService.registerEarlyPayment.mockResolvedValue(mockResult);

      // Act
      await financingPaymentController.registerEarlyPayment(mockReq, mockRes);

      // Assert
      expect(FinancingPaymentService.registerEarlyPayment).toHaveBeenCalledWith(1, '1', paymentData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Pagamento antecipado registrado com sucesso'
      });
    });

    it('deve retornar erro se valor for maior que saldo devedor', async () => {
      // Arrange
      const paymentData = {
        account_id: 1,
        payment_amount: 15000,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        preference: 'reducao_prazo'
      };

      mockReq.params.financingId = '1';
      mockReq.body = paymentData;
      FinancingPaymentService.registerEarlyPayment.mockRejectedValue(new ValidationError('Valor do pagamento antecipado deve ser menor que o saldo devedor'));

      // Act
      await financingPaymentController.registerEarlyPayment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Valor do pagamento antecipado deve ser menor que o saldo devedor'
      });
    });
  });
}); 