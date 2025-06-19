/**
 * Testes unitários para o controlador de categorias.
 * @author AI
 */
const categoryController = require('../../controllers/categoryController');
const { Category } = require('../../models');
const { Op } = require('sequelize');

// Mock do modelo Category
jest.mock('../../models', () => ({
  Category: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

describe('Category Controller', () => {
  let mockReq;
  let mockRes;
  let mockCategory;

  beforeEach(() => {
    mockReq = {
      user: { id: 1 },
      body: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockCategory = {
      id: 1,
      user_id: 1,
      name: 'Categoria Teste',
      type: 'receita',
      update: jest.fn(),
      destroy: jest.fn()
    };

    // Limpar todos os mocks
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('deve retornar todas as categorias do usuário', async () => {
      // Arrange
      const mockCategories = [
        { ...mockCategory },
        { ...mockCategory, id: 2, name: 'Outra Categoria' }
      ];
      Category.findAll.mockResolvedValue(mockCategories);

      // Act
      await categoryController.getCategories(mockReq, mockRes);

      // Assert
      expect(Category.findAll).toHaveBeenCalledWith({
        where: { user_id: 1 },
        order: [['name', 'ASC']],
        attributes: ['id', 'name', 'type', 'created_at', 'updated_at']
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockCategories);
    });
  });

  describe('createCategory', () => {
    it('deve criar uma nova categoria com sucesso', async () => {
      // Arrange
      mockReq.body = {
        name: 'Nova Categoria',
        type: 'despesa'
      };
      Category.findOne.mockResolvedValue(null);
      Category.create.mockResolvedValue(mockCategory);

      // Act
      await categoryController.createCategory(mockReq, mockRes);

      // Assert
      expect(Category.findOne).toHaveBeenCalledWith({
        where: {
          name: 'Nova Categoria',
          user_id: 1,
          type: 'despesa'
        }
      });
      expect(Category.create).toHaveBeenCalledWith({
        name: 'Nova Categoria',
        type: 'despesa',
        user_id: 1
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Categoria criada com sucesso',
        categoryId: 1
      });
    });

    it('deve retornar erro quando categoria já existe', async () => {
      // Arrange
      mockReq.body = {
        name: 'Categoria Existente',
        type: 'receita'
      };
      Category.findOne.mockResolvedValue(mockCategory);

      // Act
      await categoryController.createCategory(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Já existe uma categoria com este nome e tipo'
      });
    });
  });

  describe('updateCategory', () => {
    it('deve atualizar uma categoria com sucesso', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockReq.body = {
        name: 'Categoria Atualizada',
        type: 'receita'
      };
      Category.findOne.mockResolvedValueOnce(mockCategory); // Primeira chamada para encontrar a categoria
      Category.findOne.mockResolvedValueOnce(null); // Segunda chamada para verificar duplicidade
      mockCategory.update.mockResolvedValue([1]);

      // Act
      await categoryController.updateCategory(mockReq, mockRes);

      // Assert
      expect(Category.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          user_id: 1
        }
      });
      expect(mockCategory.update).toHaveBeenCalledWith({
        name: 'Categoria Atualizada',
        type: 'receita'
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Categoria atualizada com sucesso'
      });
    });

    it('deve retornar 404 quando categoria não é encontrada', async () => {
      // Arrange
      mockReq.params = { id: 999 };
      Category.findOne.mockResolvedValue(null);

      // Act
      await categoryController.updateCategory(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Categoria não encontrada'
      });
    });

    it('deve retornar erro quando nova categoria já existe', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockReq.body = {
        name: 'Categoria Existente',
        type: 'receita'
      };
      Category.findOne.mockResolvedValueOnce(mockCategory); // Primeira chamada para encontrar a categoria
      Category.findOne.mockResolvedValueOnce({ id: 2 }); // Segunda chamada para verificar duplicidade

      // Act
      await categoryController.updateCategory(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Já existe uma categoria com este nome e tipo'
      });
    });
  });

  describe('deleteCategory', () => {
    it('deve excluir uma categoria com sucesso', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      Category.findOne.mockResolvedValue(mockCategory);
      mockCategory.destroy.mockResolvedValue(1);

      // Act
      await categoryController.deleteCategory(mockReq, mockRes);

      // Assert
      expect(Category.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          user_id: 1
        }
      });
      expect(mockCategory.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Categoria excluída com sucesso'
      });
    });

    it('deve retornar 404 quando categoria não é encontrada', async () => {
      // Arrange
      mockReq.params = { id: 999 };
      Category.findOne.mockResolvedValue(null);

      // Act
      await categoryController.deleteCategory(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Categoria não encontrada'
      });
    });
  });
}); 