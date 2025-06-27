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

// Mock do service
jest.mock('../../services/categoryService', () => ({
  getCategories: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
  getStats: jest.fn(),
  getCharts: jest.fn()
}));

// Mock dos schemas de validação
jest.mock('../../utils/validators', () => ({
  createCategorySchema: {
    parse: jest.fn()
  },
  updateCategorySchema: {
    parse: jest.fn()
  }
}));

let categoryService;
let createCategorySchema, updateCategorySchema;

describe('CategoryController', () => {
  let req, res, next, categoryController;

  beforeEach(() => {
    // Limpar cache do require para garantir mocks limpos
    jest.resetModules();
    delete require.cache[require.resolve('../../controllers/categoryController')];
    delete require.cache[require.resolve('../../services/categoryService')];
    delete require.cache[require.resolve('../../utils/validators')];
    
    // Reimportar módulos com mocks limpos
    categoryController = require('../../controllers/categoryController');
    categoryService = require('../../services/categoryService');
    const validators = require('../../utils/validators');
    
    createCategorySchema = validators.createCategorySchema;
    updateCategorySchema = validators.updateCategorySchema;

    // Limpar todos os mocks
    jest.clearAllMocks();

    req = { user: { id: 1 }, body: {}, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  describe('getCategories', () => {
    it('deve retornar todas as categorias do usuário', async () => {
      const mockCategories = [
        { id: 1, name: 'Alimentação', type: 'expense' },
        { id: 2, name: 'Salário', type: 'income' }
      ];
      categoryService.getCategories.mockResolvedValue(mockCategories);

      await categoryController.getCategories(req, res, next);

      expect(categoryService.getCategories).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { categories: mockCategories } });
    });

    it('deve passar erro para o next', async () => {
      const error = new Error('Erro de banco');
      categoryService.getCategories.mockRejectedValue(error);
      await categoryController.getCategories(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createCategory', () => {
    it('deve criar uma nova categoria com sucesso', async () => {
      req.body = { name: 'Nova Categoria', type: 'expense' };
      createCategorySchema.parse.mockReturnValue(req.body);
      categoryService.createCategory.mockResolvedValue({ id: 10 });

      await categoryController.createCategory(req, res, next);

      expect(createCategorySchema.parse).toHaveBeenCalledWith(req.body);
      expect(categoryService.createCategory).toHaveBeenCalledWith(1, req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { categoryId: 10 } });
    });

    it('deve passar erro para o next', async () => {
      const error = new Error('Erro de banco');
      req.body = { name: 'Falha', type: 'expense' };
      createCategorySchema.parse.mockReturnValue(req.body);
      categoryService.createCategory.mockRejectedValue(error);
      await categoryController.createCategory(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateCategory', () => {
    it('deve atualizar uma categoria com sucesso', async () => {
      req.params.id = '5';
      req.body = { name: 'Atualizada', type: 'income', color: '#FF5722' };
      updateCategorySchema.parse.mockReturnValue(req.body);
      categoryService.updateCategory.mockResolvedValue(true);

      await categoryController.updateCategory(req, res, next);

      expect(updateCategorySchema.parse).toHaveBeenCalledWith(req.body);
      expect(categoryService.updateCategory).toHaveBeenCalledWith(1, '5', req.body);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { message: 'Categoria atualizada com sucesso' } });
    });

    it('deve passar erro para o next', async () => {
      const error = new Error('Erro de banco');
      req.params.id = '5';
      req.body = { name: 'Falha', type: 'expense' };
      updateCategorySchema.parse.mockReturnValue(req.body);
      categoryService.updateCategory.mockRejectedValue(error);
      await categoryController.updateCategory(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteCategory', () => {
    it('deve deletar uma categoria com sucesso', async () => {
      req.params.id = '7';
      categoryService.deleteCategory.mockResolvedValue(true);

      await categoryController.deleteCategory(req, res, next);

      expect(categoryService.deleteCategory).toHaveBeenCalledWith(1, '7');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { message: 'Categoria excluída com sucesso' } });
    });

    it('deve passar erro para o next', async () => {
      const error = new Error('Erro de banco');
      req.params.id = '7';
      categoryService.deleteCategory.mockRejectedValue(error);
      await categoryController.deleteCategory(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas das categorias', async () => {
      const mockStats = { summary: { totalCategories: 2 } };
      categoryService.getStats.mockResolvedValue(mockStats);
      await categoryController.getStats(req, res, next);
      expect(categoryService.getStats).toHaveBeenCalledWith(1, undefined);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockStats });
    });
    it('deve passar erro para o next', async () => {
      const error = new Error('Erro de banco');
      categoryService.getStats.mockRejectedValue(error);
      await categoryController.getStats(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCharts', () => {
    it('deve retornar dados de gráficos', async () => {
      const mockCharts = { usageChart: [] };
      categoryService.getCharts.mockResolvedValue(mockCharts);
      await categoryController.getCharts(req, res, next);
      expect(categoryService.getCharts).toHaveBeenCalledWith(1, undefined, undefined);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockCharts });
    });
    it('deve passar erro para o next', async () => {
      const error = new Error('Erro de banco');
      categoryService.getCharts.mockRejectedValue(error);
      await categoryController.getCharts(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 