/**
 * Testes unitários para o InvestmentController
 * @author Lucas Santos
 */

// Mock do service
jest.mock('../../services/investmentService', () => ({
  createInvestment: jest.fn(),
  getInvestments: jest.fn(),
  getInvestment: jest.fn(),
  updateInvestment: jest.fn(),
  deleteInvestment: jest.fn(),
  getInvestmentStatistics: jest.fn(),
  getActivePositions: jest.fn(),
  getAssetPosition: jest.fn(),
  sellAsset: jest.fn()
}));

// Mock das validações
jest.mock('../../utils/investmentValidators', () => ({
  createInvestmentSchema: {
    parse: jest.fn()
  },
  updateInvestmentSchema: {
    parse: jest.fn()
  },
  sellAssetSchema: {
    parse: jest.fn()
  },
  listPositionsSchema: {
    parse: jest.fn()
  }
}));

describe('InvestmentController', () => {
  let mockReq, mockRes, mockNext, investmentController, investmentService;
  let createInvestmentSchema, updateInvestmentSchema, sellAssetSchema, listPositionsSchema;

  beforeEach(() => {
    jest.resetModules();
    
    investmentController = require('../../controllers/investmentController');
    investmentService = require('../../services/investmentService');
    ({ createInvestmentSchema, updateInvestmentSchema, sellAssetSchema, listPositionsSchema } = require('../../utils/investmentValidators'));

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

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('createInvestment', () => {
    it('deve criar um investimento com dados válidos', async () => {
      const investmentData = {
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 1000.00,
        quantity: 100,
        operation_date: '2024-01-15',
        operation_type: 'compra',
        account_id: 1,
        source_account_id: 1,
        destination_account_id: 2,
        category_id: 1
      };

      const mockResult = {
        investment: { id: 1, ...investmentData },
        transactions: [
          { id: 1, type: 'expense', amount: 1000.00 },
          { id: 2, type: 'income', amount: 1000.00 }
        ]
      };

      createInvestmentSchema.parse.mockReturnValue(investmentData);
      investmentService.createInvestment.mockResolvedValue(mockResult);

      mockReq.body = investmentData;

      await investmentController.createInvestment(mockReq, mockRes, mockNext);

      expect(createInvestmentSchema.parse).toHaveBeenCalledWith(investmentData);
      expect(investmentService.createInvestment).toHaveBeenCalledWith(1, investmentData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Investimento criado com sucesso',
          investment: mockResult.investment,
          transactions: mockResult.transactions
        }
      });
    });

    it('deve lidar com erro do service', async () => {
      const error = new Error('Erro no service');
      createInvestmentSchema.parse.mockReturnValue({});
      investmentService.createInvestment.mockRejectedValue(error);

      await investmentController.createInvestment(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('deve lidar com erro de validação', async () => {
      const zodError = new Error('Validation failed');
      zodError.name = 'ZodError';
      zodError.errors = [{ message: 'Invalid data' }];
      
      createInvestmentSchema.parse.mockImplementation(() => { 
        throw zodError; 
      });

      mockReq.body = {};

      await investmentController.createInvestment(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(zodError);
    });
  });

  describe('getInvestments', () => {
    it('deve listar investimentos com filtros', async () => {
      const filters = {
        investment_type: 'acoes',
        page: 1,
        limit: 10
      };

      const mockResult = {
        investments: [{ id: 1, investment_type: 'acoes' }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
        statistics: { totalInvested: 1000, totalSold: 0, netInvestment: 1000 }
      };

      investmentService.getInvestments.mockResolvedValue(mockResult);

      mockReq.query = filters;

      await investmentController.getInvestments(mockReq, mockRes, mockNext);

      expect(investmentService.getInvestments).toHaveBeenCalledWith(1, {
        investment_type: 'acoes',
        operation_type: undefined,
        status: undefined,
        broker: undefined,
        page: 1,
        limit: 10
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve lidar com erro do service', async () => {
      const error = new Error('Erro ao buscar investimentos');
      investmentService.getInvestments.mockRejectedValue(error);

      await investmentController.getInvestments(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getInvestment', () => {
    it('deve retornar um investimento específico', async () => {
      const mockInvestment = { id: 1, investment_type: 'acoes', asset_name: 'Petrobras' };
      
      investmentService.getInvestment.mockResolvedValue(mockInvestment);
      mockReq.params.id = '1';

      await investmentController.getInvestment(mockReq, mockRes, mockNext);

      expect(investmentService.getInvestment).toHaveBeenCalledWith(1, '1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { investment: mockInvestment }
      });
    });

    it('deve lidar com erro do service', async () => {
      const error = new Error('Investimento não encontrado');
      investmentService.getInvestment.mockRejectedValue(error);
      mockReq.params.id = '999';

      await investmentController.getInvestment(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateInvestment', () => {
    it('deve atualizar um investimento', async () => {
      const updateData = { observations: 'Nova observação' };
      const mockInvestment = { id: 1, observations: 'Nova observação' };

      updateInvestmentSchema.parse.mockReturnValue(updateData);
      investmentService.updateInvestment.mockResolvedValue(mockInvestment);
      mockReq.params.id = '1';
      mockReq.body = updateData;

      await investmentController.updateInvestment(mockReq, mockRes, mockNext);

      expect(updateInvestmentSchema.parse).toHaveBeenCalledWith(updateData);
      expect(investmentService.updateInvestment).toHaveBeenCalledWith(1, '1', updateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Investimento atualizado com sucesso',
          investment: mockInvestment
        }
      });
    });

    it('deve lidar com erro do service', async () => {
      const error = new Error('Erro ao atualizar');
      updateInvestmentSchema.parse.mockReturnValue({});
      investmentService.updateInvestment.mockRejectedValue(error);

      await investmentController.updateInvestment(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteInvestment', () => {
    it('deve excluir um investimento', async () => {
      investmentService.deleteInvestment.mockResolvedValue(true);
      mockReq.params.id = '1';

      await investmentController.deleteInvestment(mockReq, mockRes, mockNext);

      expect(investmentService.deleteInvestment).toHaveBeenCalledWith(1, '1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Investimento excluído com sucesso' }
      });
    });

    it('deve lidar com erro do service', async () => {
      const error = new Error('Erro ao excluir');
      investmentService.deleteInvestment.mockRejectedValue(error);
      mockReq.params.id = '1';

      await investmentController.deleteInvestment(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getInvestmentStatistics', () => {
    it('deve retornar estatísticas dos investimentos', async () => {
      const mockStatistics = {
        general: { totalInvested: 5000, totalSold: 1000, netInvestment: 4000 },
        byType: [{ investment_type: 'acoes', total_amount: 3000 }],
        byBroker: [{ broker: 'XP', total_amount: 2000 }],
        recentInvestments: [{ id: 1, investment_type: 'acoes' }]
      };

      investmentService.getInvestmentStatistics.mockResolvedValue(mockStatistics);

      await investmentController.getInvestmentStatistics(mockReq, mockRes, mockNext);

      expect(investmentService.getInvestmentStatistics).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatistics
      });
    });

    it('deve lidar com erro do service', async () => {
      const error = new Error('Erro ao buscar estatísticas');
      investmentService.getInvestmentStatistics.mockRejectedValue(error);

      await investmentController.getInvestmentStatistics(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getActivePositions', () => {
    it('deve listar posições ativas com filtros', async () => {
      const filters = {
        investment_type: 'acoes',
        page: 1,
        limit: 10
      };

      const mockResult = {
        positions: [{ assetName: 'Petrobras', totalQuantity: 100 }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
      };

      listPositionsSchema.parse.mockReturnValue(filters);
      investmentService.getActivePositions.mockResolvedValue(mockResult);

      mockReq.query = filters;

      await investmentController.getActivePositions(mockReq, mockRes, mockNext);

      expect(listPositionsSchema.parse).toHaveBeenCalledWith(filters);
      expect(investmentService.getActivePositions).toHaveBeenCalledWith(1, filters);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve lidar com erro do service', async () => {
      const error = new Error('Erro ao buscar posições');
      listPositionsSchema.parse.mockReturnValue({});
      investmentService.getActivePositions.mockRejectedValue(error);

      await investmentController.getActivePositions(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAssetPosition', () => {
    it('deve retornar posição de um ativo específico', async () => {
      const mockResult = {
        position: { assetName: 'Petrobras', totalQuantity: 100 },
        operations: [{ id: 1, operation_type: 'compra' }]
      };

      investmentService.getAssetPosition.mockResolvedValue(mockResult);
      mockReq.params = { assetName: 'Petrobras', ticker: 'PETR4' };

      await investmentController.getAssetPosition(mockReq, mockRes, mockNext);

      expect(investmentService.getAssetPosition).toHaveBeenCalledWith(1, 'Petrobras', 'PETR4');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve lidar com erro do service', async () => {
      const error = new Error('Posição não encontrada');
      investmentService.getAssetPosition.mockRejectedValue(error);
      mockReq.params = { assetName: 'Inexistente' };

      await investmentController.getAssetPosition(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('sellAsset', () => {
    it('deve realizar venda de ativo', async () => {
      const sellData = {
        quantity: 10,
        unit_price: 30,
        operation_date: '2024-01-15',
        account_id: 1,
        broker: 'XP'
      };

      const mockResult = {
        investment: { id: 1, operation_type: 'venda' },
        transaction: { id: 1, type: 'income', amount: 300 }
      };

      sellAssetSchema.parse.mockReturnValue(sellData);
      investmentService.sellAsset.mockResolvedValue(mockResult);
      mockReq.params = { assetName: 'Petrobras', ticker: 'PETR4' };
      mockReq.body = sellData;

      await investmentController.sellAsset(mockReq, mockRes, mockNext);

      expect(sellAssetSchema.parse).toHaveBeenCalledWith(sellData);
      expect(investmentService.sellAsset).toHaveBeenCalledWith(1, 'Petrobras', 'PETR4', sellData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Venda registrada com sucesso',
          investment: mockResult.investment,
          transaction: mockResult.transaction
        }
      });
    });

    it('deve lidar com erro do service', async () => {
      const error = new Error('Quantidade insuficiente');
      sellAssetSchema.parse.mockReturnValue({});
      investmentService.sellAsset.mockRejectedValue(error);

      await investmentController.sellAsset(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
}); 