/**
 * Testes unitários para o CategoryController
 * @author Lucas Santos
 *
 * @fileoverview
 * Testa as funções do categoryController, cobrindo casos de sucesso, erro e borda.
 *
 * @example
 * // Para rodar os testes:
 * // npm test __tests__/controllers/categoryController.test.js
 */

const { ValidationError, NotFoundError, AppError } = require('../../utils/errors');

describe('CategoryController', () => {
  let controller;
  let mockCategoryService;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockCategoryService = {
      getCategories: jest.fn(),
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      getStats: jest.fn(),
      getCharts: jest.fn(),
      getCategoryById: jest.fn()
    };

    controller = new (require('../../controllers/categoryController'))(mockCategoryService);

    mockReq = {
      user: { id: 1 },
      body: {},
      params: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Limpar mocks
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('deve retornar todas as categorias do usuário', async () => {
      const mockCategories = [
        { id: 1, name: 'Alimentação', type: 'expense' },
        { id: 2, name: 'Salário', type: 'income' }
      ];

      mockCategoryService.getCategories.mockResolvedValue(mockCategories);

      await controller.getCategories(mockReq, mockRes);

      expect(mockCategoryService.getCategories).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockCategories });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      const internalError = new Error('Erro interno');
      mockCategoryService.getCategories.mockRejectedValue(internalError);

      await controller.getCategories(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('createCategory', () => {
    it('deve criar uma nova categoria com sucesso', async () => {
      const categoryData = {
        name: 'Nova Categoria',
        type: 'expense',
        color: '#FF5722'
      };

      const mockCategory = {
        id: 10,
        ...categoryData
      };

      mockReq.body = categoryData;
      mockCategoryService.createCategory.mockResolvedValue(mockCategory);

      await controller.createCategory(mockReq, mockRes);

      expect(mockCategoryService.createCategory).toHaveBeenCalledWith(1, categoryData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { categoryId: mockCategory.id }
      });
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const categoryData = { name: '' };
      mockReq.body = categoryData;
      
      // Mock do erro Zod
      const zodError = new Error('Nome da categoria é obrigatório');
      zodError.name = 'ZodError';
      mockCategoryService.createCategory.mockRejectedValue(zodError);

      await controller.createCategory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Nome da categoria é obrigatório'
      });
    });

    it('deve retornar erro 404 para categoria não encontrada', async () => {
      const categoryData = { name: 'Categoria Teste' };
      mockReq.body = categoryData;
      
      const notFoundError = new AppError('Categoria não encontrada', 404);
      mockCategoryService.createCategory.mockRejectedValue(notFoundError);

      await controller.createCategory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Categoria não encontrada'
      });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      const categoryData = { name: 'Categoria Teste' };
      mockReq.body = categoryData;
      
      const internalError = new Error('Erro interno');
      mockCategoryService.createCategory.mockRejectedValue(internalError);

      await controller.createCategory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('updateCategory', () => {
    it('deve atualizar uma categoria com sucesso', async () => {
      const updateData = {
        name: 'Categoria Atualizada',
        type: 'income',
        color: '#FF5722'
      };

      mockReq.params = { id: 5 };
      mockReq.body = updateData;
      mockCategoryService.updateCategory.mockResolvedValue();

      await controller.updateCategory(mockReq, mockRes);

      expect(mockCategoryService.updateCategory).toHaveBeenCalledWith(1, 5, updateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Categoria atualizada com sucesso' }
      });
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const updateData = { name: '' };
      mockReq.params = { id: 5 };
      mockReq.body = updateData;
      
      // Mock do erro Zod
      const zodError = new Error('Nome da categoria é obrigatório');
      zodError.name = 'ZodError';
      mockCategoryService.updateCategory.mockRejectedValue(zodError);

      await controller.updateCategory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Nome da categoria é obrigatório'
      });
    });

    it('deve retornar erro 404 para categoria não encontrada', async () => {
      const updateData = { name: 'Categoria Teste' };
      mockReq.params = { id: 999 };
      mockReq.body = updateData;
      
      const notFoundError = new NotFoundError('Categoria não encontrada');
      mockCategoryService.updateCategory.mockRejectedValue(notFoundError);

      await controller.updateCategory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Categoria não encontrada'
      });
    });
  });

  describe('deleteCategory', () => {
    it('deve excluir uma categoria com sucesso', async () => {
      mockReq.params = { id: 7 };
      mockCategoryService.deleteCategory.mockResolvedValue();

      await controller.deleteCategory(mockReq, mockRes);

      expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith(1, 7);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Categoria excluída com sucesso' }
      });
    });

    it('deve retornar erro 404 quando categoria não é encontrada', async () => {
      mockReq.params = { id: 999 };
      const notFoundError = new NotFoundError('Categoria não encontrada');
      mockCategoryService.deleteCategory.mockRejectedValue(notFoundError);

      await controller.deleteCategory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Categoria não encontrada'
      });
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas das categorias', async () => {
      const mockStats = { 
        summary: { totalCategories: 2 },
        usageStats: [],
        performanceStats: []
      };

      mockCategoryService.getStats.mockResolvedValue(mockStats);

      await controller.getStats(mockReq, mockRes);

      expect(mockCategoryService.getStats).toHaveBeenCalledWith(1, undefined);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      const internalError = new Error('Erro interno');
      mockCategoryService.getStats.mockRejectedValue(internalError);

      await controller.getStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('getCharts', () => {
    it('deve retornar dados de gráficos', async () => {
      const mockCharts = { 
        usageChart: [],
        valueChart: [],
        typeChart: []
      };

      mockCategoryService.getCharts.mockResolvedValue(mockCharts);

      await controller.getCharts(mockReq, mockRes);

      expect(mockCategoryService.getCharts).toHaveBeenCalledWith(1, undefined, undefined);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCharts
      });
    });

    it('deve retornar dados de gráficos com parâmetros', async () => {
      const mockCharts = { usageChart: [] };
      mockReq.query = { type: 'usage', period: 'month' };

      mockCategoryService.getCharts.mockResolvedValue(mockCharts);

      await controller.getCharts(mockReq, mockRes);

      expect(mockCategoryService.getCharts).toHaveBeenCalledWith(1, 'usage', 'month');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCharts
      });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      const internalError = new Error('Erro interno');
      mockCategoryService.getCharts.mockRejectedValue(internalError);

      await controller.getCharts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('getCategoryById', () => {
    it('deve retornar uma categoria específica do usuário', async () => {
      const mockCategory = { id: 1, name: 'Alimentação', type: 'expense' };
      mockReq.params = { id: 1 };
      mockCategoryService.getCategoryById.mockResolvedValue(mockCategory);

      await controller.getCategoryById(mockReq, mockRes);

      expect(mockCategoryService.getCategoryById).toHaveBeenCalledWith(1, 1);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockCategory });
    });

    it('deve retornar 404 se a categoria não existir', async () => {
      mockReq.params = { id: 999 };
      mockCategoryService.getCategoryById.mockResolvedValue(null);

      await controller.getCategoryById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Categoria não encontrada' });
    });

    it('deve retornar erro 500 para erro interno', async () => {
      mockReq.params = { id: 1 };
      const internalError = new Error('Erro interno');
      mockCategoryService.getCategoryById.mockRejectedValue(internalError);

      await controller.getCategoryById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Erro interno do servidor' });
    });
  });

  describe('handleError', () => {
    it('deve tratar ValidationError corretamente', () => {
      const error = new ValidationError('Erro de validação');
      
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro de validação'
      });
    });

    it('deve tratar NotFoundError corretamente', () => {
      const error = new NotFoundError('Recurso não encontrado');
      
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Recurso não encontrado'
      });
    });

    it('deve tratar AppError com statusCode 404 corretamente', () => {
      const error = new AppError('Recurso não encontrado', 404);
      
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Recurso não encontrado'
      });
    });

    it('deve tratar erro genérico como 500', () => {
      const error = new Error('Erro interno');
      
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });
}); 