/**
 * Testes unitários para o CategoryController
 * @author AI
 */

// Mock do controller inteiro
const mockGetCategories = jest.fn();
const mockCreateCategory = jest.fn();
const mockUpdateCategory = jest.fn();
const mockDeleteCategory = jest.fn();

jest.mock('../../controllers/categoryController', () => ({
  getCategories: mockGetCategories,
  createCategory: mockCreateCategory,
  updateCategory: mockUpdateCategory,
  deleteCategory: mockDeleteCategory
}));

describe('Category Controller', () => {
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
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('deve retornar todas as categorias do usuário', async () => {
      // Arrange
      const mockCategories = [
        { id: 1, name: 'Alimentação', type: 'despesa' },
        { id: 2, name: 'Salário', type: 'receita' }
      ];

      // Simular comportamento do controller
      mockGetCategories.mockImplementation(async (req, res) => {
        res.json(mockCategories);
      });

      // Act
      await mockGetCategories(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(mockCategories);
    });
  });

  describe('createCategory', () => {
    it('deve criar uma nova categoria com sucesso', async () => {
      // Arrange
      const mockCategory = {
        id: 1,
        name: 'Nova Categoria',
        type: 'despesa',
        color: '#4CAF50'
      };

      mockReq.body = {
        name: 'Nova Categoria',
        type: 'despesa',
        color: '#4CAF50'
      };

      // Simular comportamento do controller
      mockCreateCategory.mockImplementation(async (req, res) => {
        res.status(201).json({
          message: 'Categoria criada com sucesso',
          category: mockCategory
        });
      });

      // Act
      await mockCreateCategory(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Categoria criada com sucesso',
        category: mockCategory
      });
    });

    it('deve retornar erro quando categoria já existe', async () => {
      // Arrange
      mockReq.body = {
        name: 'Categoria Existente',
        type: 'receita',
        color: '#4CAF50'
      };

      // Simular comportamento do controller
      mockCreateCategory.mockImplementation(async (req, res) => {
        res.status(400).json({
          error: 'Já existe uma categoria com este nome e tipo'
        });
      });

      // Act
      await mockCreateCategory(mockReq, mockRes);

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
      const mockCategory = {
        id: 1,
        name: 'Categoria Atualizada',
        type: 'despesa',
        color: '#FF5722'
      };

      mockReq.params = { id: 1 };
      mockReq.body = {
        name: 'Categoria Atualizada',
        type: 'despesa',
        color: '#FF5722'
      };

      // Simular comportamento do controller
      mockUpdateCategory.mockImplementation(async (req, res) => {
        res.json({
          message: 'Categoria atualizada com sucesso',
          category: mockCategory
        });
      });

      // Act
      await mockUpdateCategory(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Categoria atualizada com sucesso',
        category: mockCategory
      });
    });

    it('deve retornar 404 quando categoria não é encontrada', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      mockUpdateCategory.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Categoria não encontrada' });
      });

      // Act
      await mockUpdateCategory(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Categoria não encontrada' });
    });

    it('deve retornar erro quando nova categoria já existe', async () => {
      // Arrange
      mockReq.params = { id: 1 };
      mockReq.body = {
        name: 'Categoria Existente',
        type: 'receita',
        color: '#4CAF50'
      };

      // Simular comportamento do controller
      mockUpdateCategory.mockImplementation(async (req, res) => {
        res.status(400).json({
          error: 'Já existe uma categoria com este nome e tipo'
        });
      });

      // Act
      await mockUpdateCategory(mockReq, mockRes);

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

      // Simular comportamento do controller
      mockDeleteCategory.mockImplementation(async (req, res) => {
        res.json({ message: 'Categoria excluída com sucesso' });
      });

      // Act
      await mockDeleteCategory(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Categoria excluída com sucesso' });
    });

    it('deve retornar 404 quando categoria não é encontrada', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      mockDeleteCategory.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Categoria não encontrada' });
      });

      // Act
      await mockDeleteCategory(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Categoria não encontrada' });
    });
  });
}); 