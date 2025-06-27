/**
 * Testes unitários para FixedAccountController
 */
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { FixedAccountController } = require('../../controllers/fixedAccountController');

// Mock do FixedAccountService
jest.mock('../../services/fixedAccountService');
const FixedAccountService = require('../../services/fixedAccountService');

describe('FixedAccountController', () => {
  let mockReq;
  let mockRes;
  let mockJson;
  let mockStatus;
  let controller;

  beforeEach(() => {
    controller = new FixedAccountController(FixedAccountService);
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRes = {
      json: mockJson,
      status: mockStatus
    };
    mockReq = {
      userId: 1,
      body: {},
      params: {},
      query: {}
    };
    jest.clearAllMocks();
  });

  describe('createFixedAccount', () => {
    it('deve criar uma conta fixa com sucesso', async () => {
      const mockFixedAccount = { id: 1, description: 'Aluguel', amount: 1500 };
      const mockFirstTransaction = { id: 1, amount: 1500 };
      const mockResult = { fixedAccount: mockFixedAccount, firstTransaction: mockFirstTransaction };

      FixedAccountService.createFixedAccount.mockResolvedValue(mockResult);

      mockReq.body = {
        description: 'Aluguel',
        amount: 1500,
        periodicity: 'monthly',
        start_date: '2024-01-01',
        category_id: 1
      };

      await controller.createFixedAccount(mockReq, mockRes);

      expect(FixedAccountService.createFixedAccount).toHaveBeenCalledWith({
        ...mockReq.body,
        user_id: mockReq.userId
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const validationError = new ValidationError('Dados inválidos');
      FixedAccountService.createFixedAccount.mockRejectedValue(validationError);

      mockReq.body = { description: '' };

      await controller.createFixedAccount(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Dados inválidos'
      });
    });

    it('deve retornar erro 404 para recurso não encontrado', async () => {
      const notFoundError = new NotFoundError('Categoria não encontrada');
      FixedAccountService.createFixedAccount.mockRejectedValue(notFoundError);

      mockReq.body = {
        description: 'Aluguel',
        category_id: 999
      };

      await controller.createFixedAccount(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Categoria não encontrada'
      });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      FixedAccountService.createFixedAccount.mockRejectedValue(new Error('Erro interno'));

      mockReq.body = { description: 'Aluguel' };

      await controller.createFixedAccount(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('getFixedAccounts', () => {
    it('deve listar contas fixas com sucesso', async () => {
      const mockFixedAccounts = [
        { id: 1, description: 'Aluguel' },
        { id: 2, description: 'Energia' }
      ];
      const mockResult = {
        fixedAccounts: mockFixedAccounts,
        pagination: { page: 1, total: 2 }
      };

      FixedAccountService.getFixedAccounts.mockResolvedValue(mockResult);

      mockReq.query = { page: 1, limit: 10 };

      await controller.getFixedAccounts(mockReq, mockRes);

      expect(FixedAccountService.getFixedAccounts).toHaveBeenCalledWith(mockReq.userId, mockReq.query);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro 400 para filtros inválidos', async () => {
      const validationError = new ValidationError('Filtros inválidos');
      FixedAccountService.getFixedAccounts.mockRejectedValue(validationError);

      mockReq.query = { page: 'invalid' };

      await controller.getFixedAccounts(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Filtros inválidos'
      });
    });
  });

  describe('getFixedAccountById', () => {
    it('deve obter uma conta fixa específica com sucesso', async () => {
      const mockFixedAccount = { id: 1, description: 'Aluguel' };
      const mockResult = { fixedAccount: mockFixedAccount };

      FixedAccountService.getFixedAccountById.mockResolvedValue(mockResult);

      mockReq.params.id = '1';

      await controller.getFixedAccountById(mockReq, mockRes);

      expect(FixedAccountService.getFixedAccountById).toHaveBeenCalledWith(mockReq.userId, '1');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro 404 para conta fixa não encontrada', async () => {
      const notFoundError = new NotFoundError('Conta fixa não encontrada');
      FixedAccountService.getFixedAccountById.mockRejectedValue(notFoundError);

      mockReq.params.id = '999';

      await controller.getFixedAccountById(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Conta fixa não encontrada'
      });
    });
  });

  describe('updateFixedAccount', () => {
    it('deve atualizar uma conta fixa com sucesso', async () => {
      const mockFixedAccount = { id: 1, description: 'Aluguel Atualizado', amount: 1600 };
      const mockResult = { fixedAccount: mockFixedAccount };

      FixedAccountService.updateFixedAccount.mockResolvedValue(mockResult);

      mockReq.params.id = '1';
      mockReq.body = { amount: 1600, description: 'Aluguel Atualizado' };

      await controller.updateFixedAccount(mockReq, mockRes);

      expect(FixedAccountService.updateFixedAccount).toHaveBeenCalledWith(
        mockReq.userId,
        '1',
        mockReq.body
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const validationError = new ValidationError('Dados inválidos');
      FixedAccountService.updateFixedAccount.mockRejectedValue(validationError);

      mockReq.params.id = '1';
      mockReq.body = { amount: -100 };

      await controller.updateFixedAccount(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Dados inválidos'
      });
    });

    it('deve retornar erro 404 para conta fixa não encontrada', async () => {
      const notFoundError = new NotFoundError('Conta fixa não encontrada');
      FixedAccountService.updateFixedAccount.mockRejectedValue(notFoundError);

      mockReq.params.id = '999';
      mockReq.body = { amount: 1600 };

      await controller.updateFixedAccount(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Conta fixa não encontrada'
      });
    });
  });

  describe('toggleFixedAccount', () => {
    it('deve alternar o status de uma conta fixa com sucesso', async () => {
      const mockFixedAccount = { id: 1, description: 'Aluguel', is_active: false };
      const mockResult = { fixedAccount: mockFixedAccount };

      FixedAccountService.toggleFixedAccount.mockResolvedValue(mockResult);

      mockReq.params.id = '1';

      await controller.toggleFixedAccount(mockReq, mockRes);

      expect(FixedAccountService.toggleFixedAccount).toHaveBeenCalledWith(mockReq.userId, '1');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro 404 para conta fixa não encontrada', async () => {
      const notFoundError = new NotFoundError('Conta fixa não encontrada');
      FixedAccountService.toggleFixedAccount.mockRejectedValue(notFoundError);

      mockReq.params.id = '999';

      await controller.toggleFixedAccount(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Conta fixa não encontrada'
      });
    });
  });

  describe('payFixedAccount', () => {
    it('deve pagar uma conta fixa com sucesso', async () => {
      const mockTransaction = { id: 1, amount: 1500, type: 'expense' };
      const mockResult = { transaction: mockTransaction };

      FixedAccountService.payFixedAccount.mockResolvedValue(mockResult);

      mockReq.params.id = '1';
      mockReq.body = { payment_date: '2024-01-15' };

      await controller.payFixedAccount(mockReq, mockRes);

      expect(FixedAccountService.payFixedAccount).toHaveBeenCalledWith(
        mockReq.userId,
        '1',
        mockReq.body
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const validationError = new ValidationError('Saldo insuficiente');
      FixedAccountService.payFixedAccount.mockRejectedValue(validationError);

      mockReq.params.id = '1';
      mockReq.body = { payment_date: '2024-01-15' };

      await controller.payFixedAccount(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Saldo insuficiente'
      });
    });

    it('deve retornar erro 404 para conta fixa não encontrada', async () => {
      const notFoundError = new NotFoundError('Conta fixa não encontrada');
      FixedAccountService.payFixedAccount.mockRejectedValue(notFoundError);

      mockReq.params.id = '999';
      mockReq.body = { payment_date: '2024-01-15' };

      await controller.payFixedAccount(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Conta fixa não encontrada'
      });
    });
  });

  describe('deleteFixedAccount', () => {
    it('deve remover uma conta fixa com sucesso', async () => {
      const mockResult = { message: 'Conta fixa removida com sucesso' };

      FixedAccountService.deleteFixedAccount.mockResolvedValue(mockResult);

      mockReq.params.id = '1';

      await controller.deleteFixedAccount(mockReq, mockRes);

      expect(FixedAccountService.deleteFixedAccount).toHaveBeenCalledWith(mockReq.userId, '1');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro 404 para conta fixa não encontrada', async () => {
      const notFoundError = new NotFoundError('Conta fixa não encontrada');
      FixedAccountService.deleteFixedAccount.mockRejectedValue(notFoundError);

      mockReq.params.id = '999';

      await controller.deleteFixedAccount(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Conta fixa não encontrada'
      });
    });
  });

  describe('getFixedAccountStatistics', () => {
    it('deve obter estatísticas com sucesso', async () => {
      const mockStatistics = {
        total: 5,
        totalAmount: 5000,
        active: 4,
        inactive: 1
      };

      FixedAccountService.getFixedAccountStatistics.mockResolvedValue(mockStatistics);

      mockReq.query = { is_active: true };

      await controller.getFixedAccountStatistics(mockReq, mockRes);

      expect(FixedAccountService.getFixedAccountStatistics).toHaveBeenCalledWith(mockReq.userId, mockReq.query);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockStatistics
      });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      FixedAccountService.getFixedAccountStatistics.mockRejectedValue(new Error('Erro interno'));

      await controller.getFixedAccountStatistics(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });
}); 