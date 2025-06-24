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

describe('CategoryController', () => {
  let categoryController;
  let mockModels, mockOp;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock do operador Sequelize
    mockOp = {
      ne: Symbol('ne')
    };

    // Mock do modelo Category
    mockModels = {
      Category: {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn()
      }
    };

    jest.mock('../../models', () => mockModels);
    jest.mock('sequelize', () => ({ Op: mockOp }));

    categoryController = require('../../controllers/categoryController');
  });

  describe('getCategories', () => {
    it('deve retornar todas as categorias do usuário', async () => {
      const req = { user: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      const mockCategories = [
        { id: 1, name: 'Alimentação', type: 'expense', color: '#F44336', is_default: false },
        { id: 2, name: 'Salário', type: 'income', color: '#4CAF50', is_default: true }
      ];
      mockModels.Category.findAll.mockResolvedValue(mockCategories);

      await categoryController.getCategories(req, res);

      expect(mockModels.Category.findAll).toHaveBeenCalledWith({
        where: { user_id: 1 },
        order: [['is_default', 'DESC'], ['name', 'ASC']],
        attributes: ['id', 'name', 'type', 'color', 'is_default', 'created_at', 'updated_at']
      });
      expect(res.json).toHaveBeenCalledWith(mockCategories);
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { user: { id: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      mockModels.Category.findAll.mockRejectedValue(new Error('Erro de banco'));

      await categoryController.getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar categorias' });
    });
  });

  describe('createCategory', () => {
    it('deve criar uma nova categoria com sucesso', async () => {
      const req = { user: { id: 1 }, body: { name: 'Nova Categoria', type: 'expense' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      mockModels.Category.findOne.mockResolvedValue(null);
      mockModels.Category.create.mockResolvedValue({ id: 10 });

      await categoryController.createCategory(req, res);

      expect(mockModels.Category.findOne).toHaveBeenCalledWith({
        where: { name: 'Nova Categoria', user_id: 1, type: 'expense' }
      });
      expect(mockModels.Category.create).toHaveBeenCalledWith({ 
        name: 'Nova Categoria', 
        type: 'expense', 
        color: '#F44336',
        is_default: false,
        user_id: 1 
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Categoria criada com sucesso', categoryId: 10 });
    });

    it('deve criar uma nova categoria com cor personalizada', async () => {
      const req = { user: { id: 1 }, body: { name: 'Nova Categoria', type: 'income', color: '#FF5722' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      mockModels.Category.findOne.mockResolvedValue(null);
      mockModels.Category.create.mockResolvedValue({ id: 10 });

      await categoryController.createCategory(req, res);

      expect(mockModels.Category.create).toHaveBeenCalledWith({ 
        name: 'Nova Categoria', 
        type: 'income', 
        color: '#FF5722',
        is_default: false,
        user_id: 1 
      });
    });

    it('deve retornar erro quando categoria já existe', async () => {
      const req = { user: { id: 1 }, body: { name: 'Existente', type: 'income' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      mockModels.Category.findOne.mockResolvedValue({ id: 2 });

      await categoryController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Já existe uma categoria com este nome e tipo' });
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { user: { id: 1 }, body: { name: 'Falha', type: 'expense' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      mockModels.Category.findOne.mockRejectedValue(new Error('Erro de banco'));

      await categoryController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao criar categoria' });
    });
  });

  describe('updateCategory', () => {
    it('deve atualizar uma categoria com sucesso', async () => {
      const req = { user: { id: 1 }, params: { id: 5 }, body: { name: 'Atualizada', type: 'income', color: '#FF5722' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      const mockCategory = { update: jest.fn().mockResolvedValue(true), is_default: false };
      mockModels.Category.findOne
        .mockResolvedValueOnce(mockCategory) // busca categoria
        .mockResolvedValueOnce(null); // não existe duplicada

      await categoryController.updateCategory(req, res);

      expect(mockModels.Category.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: 5, user_id: 1 }
      });
      expect(mockModels.Category.findOne).toHaveBeenNthCalledWith(2, {
        where: { name: 'Atualizada', type: 'income', user_id: 1, id: { [mockOp.ne]: 5 } }
      });
      expect(mockCategory.update).toHaveBeenCalledWith({ name: 'Atualizada', type: 'income', color: '#FF5722' });
      expect(res.json).toHaveBeenCalledWith({ message: 'Categoria atualizada com sucesso' });
    });

    it('deve retornar erro ao tentar editar categoria padrão', async () => {
      const req = { user: { id: 1 }, params: { id: 5 }, body: { name: 'Atualizada', type: 'income' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      const mockCategory = { is_default: true };
      mockModels.Category.findOne.mockResolvedValue(mockCategory);

      await categoryController.updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Não é possível editar categorias padrão do sistema' });
    });

    it('deve retornar 404 quando categoria não é encontrada', async () => {
      const req = { user: { id: 1 }, params: { id: 99 }, body: { name: 'Qualquer', type: 'expense' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      mockModels.Category.findOne.mockResolvedValue(null);

      await categoryController.updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Categoria não encontrada' });
    });

    it('deve retornar erro quando nova categoria já existe', async () => {
      const req = { user: { id: 1 }, params: { id: 5 }, body: { name: 'Duplicada', type: 'income' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      const mockCategory = { update: jest.fn(), is_default: false };
      mockModels.Category.findOne
        .mockResolvedValueOnce(mockCategory) // busca categoria
        .mockResolvedValueOnce({ id: 7 }); // já existe duplicada

      await categoryController.updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Já existe uma categoria com este nome e tipo' });
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { user: { id: 1 }, params: { id: 5 }, body: { name: 'Falha', type: 'income' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      mockModels.Category.findOne.mockRejectedValue(new Error('Erro de banco'));

      await categoryController.updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao atualizar categoria' });
    });
  });

  describe('deleteCategory', () => {
    it('deve excluir uma categoria com sucesso', async () => {
      const req = { user: { id: 1 }, params: { id: 3 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      const mockCategory = { destroy: jest.fn().mockResolvedValue(true), is_default: false };
      mockModels.Category.findOne.mockResolvedValue(mockCategory);

      await categoryController.deleteCategory(req, res);

      expect(mockModels.Category.findOne).toHaveBeenCalledWith({
        where: { id: 3, user_id: 1 }
      });
      expect(mockCategory.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Categoria excluída com sucesso' });
    });

    it('deve retornar erro ao tentar excluir categoria padrão', async () => {
      const req = { user: { id: 1 }, params: { id: 3 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      const mockCategory = { is_default: true };
      mockModels.Category.findOne.mockResolvedValue(mockCategory);

      await categoryController.deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Não é possível excluir categorias padrão do sistema' });
    });

    it('deve retornar 404 quando categoria não é encontrada', async () => {
      const req = { user: { id: 1 }, params: { id: 99 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      mockModels.Category.findOne.mockResolvedValue(null);

      await categoryController.deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Categoria não encontrada' });
    });

    it('deve lidar com erro interno do servidor', async () => {
      const req = { user: { id: 1 }, params: { id: 3 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      mockModels.Category.findOne.mockRejectedValue(new Error('Erro de banco'));

      await categoryController.deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao excluir categoria' });
    });
  });
}); 