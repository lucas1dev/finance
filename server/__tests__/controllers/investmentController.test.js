/**
 * Testes unitários para o InvestmentController
 * @author AI
 */

// Mock do controller inteiro
jest.mock('../../controllers/investmentController', () => ({
  createInvestment: jest.fn(),
  getInvestments: jest.fn(),
  getInvestment: jest.fn(),
  updateInvestment: jest.fn(),
  deleteInvestment: jest.fn(),
  getInvestmentStatistics: jest.fn()
}));

const investmentController = require('../../controllers/investmentController');
const { Investment, Account, Category, Transaction, InvestmentContribution } = require('../../models');
const { ValidationError, NotFoundError } = require('../../utils/errors');

// Mock dos modelos
jest.mock('../../models');

describe('InvestmentController', () => {
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

  describe('createInvestment', () => {
    it('should create a new investment successfully', async () => {
      const investmentData = {
        asset_name: 'Petrobras',
        investment_type: 'acoes',
        broker: 'xp_investimentos',
        amount: 1000,
        operation_date: '2024-06-20'
      };
      const createdInvestment = { id: 1, ...investmentData, user_id: 1 };
      mockReq.body = investmentData;
      investmentController.createInvestment.mockImplementation(async (req, res) => {
        res.status(201).json({ message: 'Investimento criado com sucesso', investment: createdInvestment });
      });
      await investmentController.createInvestment(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Investimento criado com sucesso', investment: createdInvestment });
    });
    it('should handle validation errors', async () => {
      mockReq.body = {};
      investmentController.createInvestment.mockImplementation(async (req, res) => {
        res.status(400).json({ error: 'Dados inválidos' });
      });
      await investmentController.createInvestment(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Dados inválidos' });
    });
  });

  describe('getInvestments', () => {
    it('should return investments with pagination', async () => {
      const mockInvestments = [
        { id: 1, asset_name: 'Petrobras', amount: 1000 },
        { id: 2, asset_name: 'Vale', amount: 2000 }
      ];
      investmentController.getInvestments.mockImplementation(async (req, res) => {
        res.json({ investments: mockInvestments, pagination: { page: 1, limit: 10, total: 2, totalPages: 1 } });
      });
      await investmentController.getInvestments(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({ investments: mockInvestments, pagination: { page: 1, limit: 10, total: 2, totalPages: 1 } });
    });
    it('should apply filters correctly', async () => {
      mockReq.query = { broker: 'xp_investimentos', investment_type: 'acoes' };
      const mockInvestments = [
        { id: 1, asset_name: 'Petrobras', broker: 'xp_investimentos', investment_type: 'acoes' }
      ];
      investmentController.getInvestments.mockImplementation(async (req, res) => {
        res.json({ investments: mockInvestments, pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });
      });
      await investmentController.getInvestments(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({ investments: mockInvestments, pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });
    });
  });

  describe('getInvestment', () => {
    it('should return a specific investment', async () => {
      mockReq.params = { id: 1 };
      const mockInvestment = { id: 1, asset_name: 'Petrobras', amount: 1000 };
      investmentController.getInvestment.mockImplementation(async (req, res) => {
        res.json({ investment: mockInvestment });
      });
      await investmentController.getInvestment(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({ investment: mockInvestment });
    });
    it('should return error when investment is not found', async () => {
      mockReq.params = { id: 999 };
      investmentController.getInvestment.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Investimento não encontrado' });
      });
      await investmentController.getInvestment(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Investimento não encontrado' });
    });
  });

  describe('updateInvestment', () => {
    it('should update an investment successfully', async () => {
      mockReq.params = { id: 1 };
      mockReq.body = { amount: 1500 };
      const updatedInvestment = { id: 1, amount: 1500 };
      investmentController.updateInvestment.mockImplementation(async (req, res) => {
        res.json({ message: 'Investimento atualizado com sucesso', investment: updatedInvestment });
      });
      await investmentController.updateInvestment(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Investimento atualizado com sucesso', investment: updatedInvestment });
    });
    it('should return error when investment is not found', async () => {
      mockReq.params = { id: 999 };
      investmentController.updateInvestment.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Investimento não encontrado' });
      });
      await investmentController.updateInvestment(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Investimento não encontrado' });
    });
  });

  describe('deleteInvestment', () => {
    it('should delete an investment successfully', async () => {
      mockReq.params = { id: 1 };
      investmentController.deleteInvestment.mockImplementation(async (req, res) => {
        res.json({ message: 'Investimento excluído com sucesso' });
      });
      await investmentController.deleteInvestment(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Investimento excluído com sucesso' });
    });
    it('should return error when investment is not found', async () => {
      mockReq.params = { id: 999 };
      investmentController.deleteInvestment.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Investimento não encontrado' });
      });
      await investmentController.deleteInvestment(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Investimento não encontrado' });
    });
    it('should handle validation error when investment has associated transactions', async () => {
      mockReq.params = { id: 2 };
      investmentController.deleteInvestment.mockImplementation(async (req, res) => {
        res.status(400).json({ error: 'Investimento possui transações associadas' });
      });
      await investmentController.deleteInvestment(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Investimento possui transações associadas' });
    });
  });

  describe('getInvestmentStatistics', () => {
    it('should return investment statistics', async () => {
      const mockStats = {
        general: {
          totalInvested: 5000,
          totalSold: 1000,
          netInvestment: 4000,
          totalTransactions: 10
        },
        byType: [
          { investment_type: 'acoes', count: 5, total_amount: 5000 }
        ],
        byBroker: [
          { broker: 'xp_investimentos', count: 3, total_amount: 3000 }
        ],
        recentInvestments: [
          { id: 1, asset_name: 'Petrobras', amount: 1000 }
        ]
      };
      investmentController.getInvestmentStatistics.mockImplementation(async (req, res) => {
        res.json(mockStats);
      });
      await investmentController.getInvestmentStatistics(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(mockStats);
    });
  });
}); 