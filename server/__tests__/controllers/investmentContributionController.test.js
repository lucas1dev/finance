const { InvestmentContributionController } = require('../../controllers/investmentContributionController');
const { ValidationError, NotFoundError } = require('../../utils/errors');

// Mock do logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('InvestmentContributionController', () => {
  let controller;
  let mockService;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Mock do service
    mockService = {
      createContribution: jest.fn(),
      getContributions: jest.fn(),
      getContribution: jest.fn(),
      getContributionsByInvestment: jest.fn(),
      updateContribution: jest.fn(),
      deleteContribution: jest.fn(),
      getContributionStatistics: jest.fn()
    };

    // Instanciar controller com mock do service
    controller = new InvestmentContributionController(mockService);

    // Mock do request
    mockReq = {
      userId: 1,
      body: {},
      params: {},
      query: {}
    };

    // Mock do response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createContribution', () => {
    it('deve criar um aporte com sucesso', async () => {
      const contributionData = {
        investment_id: 1,
        contribution_date: '2024-01-15',
        amount: 1000,
        quantity: 100,
        unit_price: 10
      };

      const mockResult = {
        contribution: { id: 1, ...contributionData },
        transactions: []
      };

      mockReq.body = contributionData;
      mockService.createContribution.mockResolvedValue(mockResult);

      await controller.createContribution(mockReq, mockRes);

      expect(mockService.createContribution).toHaveBeenCalledWith(1, contributionData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Aporte criado com sucesso'
      });
    });

    it('deve retornar erro 400 para ValidationError', async () => {
      const error = new ValidationError('Dados inválidos');
      mockService.createContribution.mockRejectedValue(error);

      await controller.createContribution(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados inválidos'
      });
    });

    it('deve retornar erro 404 para NotFoundError', async () => {
      const error = new NotFoundError('Investimento não encontrado');
      mockService.createContribution.mockRejectedValue(error);

      await controller.createContribution(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Investimento não encontrado'
      });
    });

    it('deve retornar erro 500 para outros erros', async () => {
      const error = new Error('Erro interno');
      mockService.createContribution.mockRejectedValue(error);

      await controller.createContribution(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('getContributions', () => {
    it('deve listar aportes com sucesso', async () => {
      const mockResult = {
        contributions: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        statistics: { totalAmount: 0, totalQuantity: 0, averageUnitPrice: 0, totalContributions: 0 }
      };

      mockService.getContributions.mockResolvedValue(mockResult);

      await controller.getContributions(mockReq, mockRes);

      expect(mockService.getContributions).toHaveBeenCalledWith(1, {});
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro 400 para ValidationError', async () => {
      const error = new ValidationError('Parâmetros inválidos');
      mockService.getContributions.mockRejectedValue(error);

      await controller.getContributions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Parâmetros inválidos'
      });
    });

    it('deve retornar erro 500 para outros erros', async () => {
      const error = new Error('Erro interno');
      mockService.getContributions.mockRejectedValue(error);

      await controller.getContributions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('getContribution', () => {
    it('deve obter um aporte específico com sucesso', async () => {
      const mockResult = {
        contribution: { id: 1, investment_id: 1, amount: 1000 }
      };

      mockReq.params.id = '1';
      mockService.getContribution.mockResolvedValue(mockResult);

      await controller.getContribution(mockReq, mockRes);

      expect(mockService.getContribution).toHaveBeenCalledWith(1, '1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro 404 para NotFoundError', async () => {
      const error = new NotFoundError('Aporte não encontrado');
      mockReq.params.id = '999';
      mockService.getContribution.mockRejectedValue(error);

      await controller.getContribution(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Aporte não encontrado'
      });
    });

    it('deve retornar erro 500 para outros erros', async () => {
      const error = new Error('Erro interno');
      mockReq.params.id = '1';
      mockService.getContribution.mockRejectedValue(error);

      await controller.getContribution(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('getContributionsByInvestment', () => {
    it('deve listar aportes de um investimento com sucesso', async () => {
      const mockResult = {
        investment: { id: 1, asset_name: 'Ação XYZ' },
        contributions: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        statistics: { totalAmount: 0, totalQuantity: 0, averageUnitPrice: 0, totalContributions: 0 }
      };

      mockReq.params.investmentId = '1';
      mockService.getContributionsByInvestment.mockResolvedValue(mockResult);

      await controller.getContributionsByInvestment(mockReq, mockRes);

      expect(mockService.getContributionsByInvestment).toHaveBeenCalledWith(1, '1', {});
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro 404 para NotFoundError', async () => {
      const error = new NotFoundError('Investimento não encontrado');
      mockReq.params.investmentId = '999';
      mockService.getContributionsByInvestment.mockRejectedValue(error);

      await controller.getContributionsByInvestment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Investimento não encontrado'
      });
    });

    it('deve retornar erro 500 para outros erros', async () => {
      const error = new Error('Erro interno');
      mockReq.params.investmentId = '1';
      mockService.getContributionsByInvestment.mockRejectedValue(error);

      await controller.getContributionsByInvestment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('updateContribution', () => {
    it('deve atualizar um aporte com sucesso', async () => {
      const updateData = { amount: 1500, quantity: 150 };
      const mockResult = {
        contribution: { id: 1, ...updateData }
      };

      mockReq.params.id = '1';
      mockReq.body = updateData;
      mockService.updateContribution.mockResolvedValue(mockResult);

      await controller.updateContribution(mockReq, mockRes);

      expect(mockService.updateContribution).toHaveBeenCalledWith(1, '1', updateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Aporte atualizado com sucesso'
      });
    });

    it('deve retornar erro 400 para ValidationError', async () => {
      const error = new ValidationError('Dados inválidos');
      mockReq.params.id = '1';
      mockService.updateContribution.mockRejectedValue(error);

      await controller.updateContribution(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados inválidos'
      });
    });

    it('deve retornar erro 404 para NotFoundError', async () => {
      const error = new NotFoundError('Aporte não encontrado');
      mockReq.params.id = '999';
      mockService.updateContribution.mockRejectedValue(error);

      await controller.updateContribution(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Aporte não encontrado'
      });
    });

    it('deve retornar erro 500 para outros erros', async () => {
      const error = new Error('Erro interno');
      mockReq.params.id = '1';
      mockService.updateContribution.mockRejectedValue(error);

      await controller.updateContribution(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('deleteContribution', () => {
    it('deve deletar um aporte com sucesso', async () => {
      const mockResult = { message: 'Aporte removido com sucesso' };

      mockReq.params.id = '1';
      mockService.deleteContribution.mockResolvedValue(mockResult);

      await controller.deleteContribution(mockReq, mockRes);

      expect(mockService.deleteContribution).toHaveBeenCalledWith(1, '1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro 404 para NotFoundError', async () => {
      const error = new NotFoundError('Aporte não encontrado');
      mockReq.params.id = '999';
      mockService.deleteContribution.mockRejectedValue(error);

      await controller.deleteContribution(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Aporte não encontrado'
      });
    });

    it('deve retornar erro 500 para outros erros', async () => {
      const error = new Error('Erro interno');
      mockReq.params.id = '1';
      mockService.deleteContribution.mockRejectedValue(error);

      await controller.deleteContribution(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('getContributionStatistics', () => {
    it('deve obter estatísticas com sucesso', async () => {
      const mockResult = {
        totalContributions: 10,
        totalAmount: 50000,
        totalQuantity: 5000,
        averageAmount: 5000,
        averageQuantity: 500,
        contributionsByMonth: [],
        topInvestments: []
      };

      mockService.getContributionStatistics.mockResolvedValue(mockResult);

      await controller.getContributionStatistics(mockReq, mockRes);

      expect(mockService.getContributionStatistics).toHaveBeenCalledWith(1, {});
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro 500 para qualquer erro', async () => {
      const error = new Error('Erro interno');
      mockService.getContributionStatistics.mockRejectedValue(error);

      await controller.getContributionStatistics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });
}); 