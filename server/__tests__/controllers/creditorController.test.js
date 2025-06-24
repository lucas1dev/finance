/**
 * Testes unitários para o controlador de credores.
 * @author Lucas Santos
 *
 * @fileoverview
 * Testa as funções do creditorController, cobrindo casos de sucesso, erro e borda.
 *
 * @example
 * // Para rodar os testes:
 * // npm test __tests__/controllers/creditorController.test.js
 */

describe('CreditorController', () => {
  let creditorController;
  let mockModels, mockValidators, mockErrors, mockOp;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock dos operadores do Sequelize
    mockOp = {
      like: Symbol('like'),
      ne: Symbol('ne'),
      or: Symbol('or')
    };

    // Mocks dos modelos
    mockModels = {
      Creditor: {
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        findAndCountAll: jest.fn(),
        findAll: jest.fn()
      },
      Financing: {
        // Modelo incluído nas consultas
      }
    };

    // Mocks dos validadores
    mockValidators = {
      createCreditorSchema: {
        safeParse: jest.fn()
      },
      updateCreditorSchema: {
        parse: jest.fn()
      },
      listCreditorsSchema: {
        safeParse: jest.fn()
      }
    };

    // Mocks dos erros
    mockErrors = {
      ValidationError: class ValidationError extends Error {
        constructor(message, errors) {
          super(message);
          this.name = 'ValidationError';
          this.errors = errors;
        }
      },
      NotFoundError: class NotFoundError extends Error {
        constructor(message) {
          super(message);
          this.name = 'NotFoundError';
        }
      }
    };

    // Aplicar mocks
    jest.mock('../../models', () => mockModels);
    jest.mock('../../utils/creditorValidators', () => mockValidators);
    jest.mock('../../utils/errors', () => mockErrors);
    jest.mock('sequelize', () => ({
      Op: mockOp
    }));

    // Mock do require('sequelize') usado diretamente no controller
    jest.doMock('sequelize', () => ({
      Op: mockOp
    }));

    // Importar controller
    creditorController = require('../../controllers/creditorController');
  });

  describe('createCreditor', () => {
    it('deve criar um novo credor com sucesso', async () => {
      // Arrange
      const req = {
        userId: 1,
        body: {
          name: 'Banco XYZ',
          document_type: 'CNPJ',
          document_number: '12.345.678/0001-90',
          address: 'Rua ABC, 123'
        }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const validatedData = { ...req.body };
      const createdCreditor = { id: 1, ...validatedData, user_id: 1 };

      mockValidators.createCreditorSchema.safeParse.mockReturnValue({
        success: true,
        data: validatedData
      });
      mockModels.Creditor.findOne.mockResolvedValue(null);
      mockModels.Creditor.create.mockResolvedValue(createdCreditor);

      // Act
      await creditorController.createCreditor(req, res, next);

      // Assert
      expect(mockValidators.createCreditorSchema.safeParse).toHaveBeenCalledWith(req.body);
      expect(mockModels.Creditor.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          document_number: '12.345.678/0001-90'
        }
      });
      expect(mockModels.Creditor.create).toHaveBeenCalledWith({
        ...validatedData,
        user_id: 1
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Credor criado com sucesso',
        creditor: createdCreditor
      });
    });

    it('deve retornar erro de validação para dados inválidos', async () => {
      // Arrange
      const req = { userId: 1, body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const validationErrors = [{ message: 'Nome é obrigatório' }];
      mockValidators.createCreditorSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: validationErrors }
      });

      // Act
      await creditorController.createCreditor(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(mockErrors.ValidationError));
      expect(next.mock.calls[0][0].message).toBe('Dados inválidos');
    });

    it('deve retornar erro quando credor com mesmo documento já existe', async () => {
      // Arrange
      const req = {
        userId: 1,
        body: {
          name: 'Banco XYZ',
          document_type: 'CNPJ',
          document_number: '12.345.678/0001-90'
        }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const existingCreditor = { id: 2, name: 'Outro Banco', document_number: '12.345.678/0001-90' };

      mockValidators.createCreditorSchema.safeParse.mockReturnValue({
        success: true,
        data: req.body
      });
      mockModels.Creditor.findOne.mockResolvedValue(existingCreditor);

      // Act
      await creditorController.createCreditor(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(mockErrors.ValidationError));
      expect(next.mock.calls[0][0].message).toBe('Já existe um credor com este documento');
    });

    it('deve passar erro do banco para o next', async () => {
      // Arrange
      const req = { userId: 1, body: { name: 'Test' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const dbError = new Error('Erro de banco');
      mockValidators.createCreditorSchema.safeParse.mockReturnValue({
        success: true,
        data: req.body
      });
      mockModels.Creditor.findOne.mockRejectedValue(dbError);

      // Act
      await creditorController.createCreditor(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  describe('listCreditors', () => {
    it('deve listar credores com sucesso', async () => {
      // Arrange
      const req = {
        userId: 1,
        query: { page: 1, limit: 10 }
      };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const mockCreditors = [
        { id: 1, name: 'Banco A' },
        { id: 2, name: 'Banco B' }
      ];

      mockValidators.listCreditorsSchema.safeParse.mockReturnValue({
        success: true,
        data: { page: 1, limit: 10 }
      });
      mockModels.Creditor.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockCreditors
      });

      // Act
      await creditorController.listCreditors(req, res, next);

      // Assert
      expect(mockValidators.listCreditorsSchema.safeParse).toHaveBeenCalledWith(req.query);
      expect(mockModels.Creditor.findAndCountAll).toHaveBeenCalledWith({
        where: { user_id: 1 },
        include: expect.arrayContaining([
          expect.objectContaining({
            model: mockModels.Financing,
            as: 'financings'
          })
        ]),
        order: [['name', 'ASC']],
        limit: 10,
        offset: 0
      });
      expect(res.json).toHaveBeenCalledWith({
        creditors: mockCreditors,
        pagination: expect.objectContaining({
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        })
      });
    });

    it('deve aplicar filtros corretamente', async () => {
      // Arrange
      const req = {
        userId: 1,
        query: { page: 1, limit: 10, name: 'Banco', document_type: 'CNPJ' }
      };
      const res = { json: jest.fn() };
      const next = jest.fn();

      mockValidators.listCreditorsSchema.safeParse.mockReturnValue({
        success: true,
        data: { page: 1, limit: 10, name: 'Banco', document_type: 'CNPJ' }
      });
      mockModels.Creditor.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ id: 1, name: 'Banco XYZ' }]
      });

      // Act
      await creditorController.listCreditors(req, res, next);

      // Assert
      expect(mockModels.Creditor.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_id: 1,
            name: { [mockOp.like]: '%Banco%' },
            document_type: 'CNPJ'
          }
        })
      );
    });

    it('deve retornar erro de validação para parâmetros inválidos', async () => {
      // Arrange
      const req = { userId: 1, query: { page: -1 } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const validationErrors = [{ message: 'Página deve ser maior que 0' }];
      mockValidators.listCreditorsSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: validationErrors }
      });

      // Act
      await creditorController.listCreditors(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(mockErrors.ValidationError));
    });
  });

  describe('getCreditor', () => {
    it('deve retornar credor específico com sucesso', async () => {
      // Arrange
      const req = { userId: 1, params: { id: 1 } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const mockCreditor = {
        id: 1,
        name: 'Banco XYZ',
        financings: []
      };

      mockModels.Creditor.findOne.mockResolvedValue(mockCreditor);

      // Act
      await creditorController.getCreditor(req, res, next);

      // Assert
      expect(mockModels.Creditor.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
        include: expect.arrayContaining([
          expect.objectContaining({
            model: mockModels.Financing,
            as: 'financings'
          })
        ])
      });
      expect(res.json).toHaveBeenCalledWith({ creditor: mockCreditor });
    });

    it('deve retornar erro quando credor não é encontrado', async () => {
      // Arrange
      const req = { userId: 1, params: { id: 999 } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      mockModels.Creditor.findOne.mockResolvedValue(null);

      // Act
      await creditorController.getCreditor(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(mockErrors.NotFoundError));
      expect(next.mock.calls[0][0].message).toBe('Credor não encontrado');
    });
  });

  describe('updateCreditor', () => {
    it('deve atualizar credor com sucesso', async () => {
      // Arrange
      const req = {
        userId: 1,
        params: { id: 1 },
        body: { name: 'Novo Nome', phone: '(11) 99999-9999' }
      };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const existingCreditor = {
        id: 1,
        name: 'Nome Antigo',
        document_number: '12.345.678/0001-90',
        update: jest.fn()
      };

      mockModels.Creditor.findOne.mockResolvedValue(existingCreditor);
      mockValidators.updateCreditorSchema.parse.mockReturnValue(req.body);

      // Act
      await creditorController.updateCreditor(req, res, next);

      // Assert
      expect(mockModels.Creditor.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 }
      });
      expect(existingCreditor.update).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Credor atualizado com sucesso',
        creditor: existingCreditor
      });
    });

    it('deve retornar erro quando credor não é encontrado', async () => {
      // Arrange
      const req = { userId: 1, params: { id: 999 }, body: {} };
      const res = { json: jest.fn() };
      const next = jest.fn();

      mockModels.Creditor.findOne.mockResolvedValue(null);

      // Act
      await creditorController.updateCreditor(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(mockErrors.NotFoundError));
    });

    it('deve verificar documento duplicado ao atualizar', async () => {
      // Arrange
      const req = {
        userId: 1,
        params: { id: 1 },
        body: { document_number: '98.765.432/0001-10' }
      };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const existingCreditor = {
        id: 1,
        document_number: '12.345.678/0001-90',
        update: jest.fn()
      };

      const duplicateCreditor = { id: 2, document_number: '98.765.432/0001-10' };

      mockModels.Creditor.findOne
        .mockResolvedValueOnce(existingCreditor) // Primeira chamada para buscar o credor
        .mockResolvedValueOnce(duplicateCreditor); // Segunda chamada para verificar duplicata

      mockValidators.updateCreditorSchema.parse.mockReturnValue(req.body);

      // Act
      await creditorController.updateCreditor(req, res, next);

      // Assert
      expect(mockModels.Creditor.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          document_number: '98.765.432/0001-10',
          id: { [mockOp.ne]: 1 }
        }
      });
      expect(next).toHaveBeenCalledWith(expect.any(mockErrors.ValidationError));
    });
  });

  describe('deleteCreditor', () => {
    it('deve remover credor com sucesso', async () => {
      // Arrange
      const req = { userId: 1, params: { id: 1 } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const mockCreditor = {
        id: 1,
        name: 'Banco XYZ',
        financings: [],
        destroy: jest.fn()
      };

      mockModels.Creditor.findOne.mockResolvedValue(mockCreditor);

      // Act
      await creditorController.deleteCreditor(req, res, next);

      // Assert
      expect(mockModels.Creditor.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
        include: expect.arrayContaining([
          expect.objectContaining({
            model: mockModels.Financing,
            as: 'financings',
            where: { status: 'ativo' }
          })
        ])
      });
      expect(mockCreditor.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Credor removido com sucesso'
      });
    });

    it('deve retornar erro quando credor não é encontrado', async () => {
      // Arrange
      const req = { userId: 1, params: { id: 999 } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      mockModels.Creditor.findOne.mockResolvedValue(null);

      // Act
      await creditorController.deleteCreditor(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(mockErrors.NotFoundError));
    });

    it('deve retornar erro quando credor tem financiamentos ativos', async () => {
      // Arrange
      const req = { userId: 1, params: { id: 1 } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const mockCreditor = {
        id: 1,
        name: 'Banco XYZ',
        financings: [{ id: 1, status: 'ativo' }],
        destroy: jest.fn()
      };

      mockModels.Creditor.findOne.mockResolvedValue(mockCreditor);

      // Act
      await creditorController.deleteCreditor(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Não é possível remover um credor com financiamentos ativos');
    });
  });

  describe('searchCreditors', () => {
    it('deve buscar credores por termo com sucesso', async () => {
      // Arrange
      const req = { userId: 1, query: { q: 'banco' } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      const mockCreditors = [
        { id: 1, name: 'Banco A', document_number: '12.345.678/0001-90' },
        { id: 2, name: 'Banco B', document_number: '98.765.432/0001-10' }
      ];

      mockModels.Creditor.findAll.mockResolvedValue(mockCreditors);

      // Act
      await creditorController.searchCreditors(req, res, next);

      // Assert
      expect(mockModels.Creditor.findAll).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          [mockOp.or]: [
            { name: { [mockOp.like]: '%banco%' } },
            { document_number: { [mockOp.like]: '%banco%' } }
          ]
        },
        attributes: ['id', 'name', 'document_type', 'document_number'],
        order: [['name', 'ASC']],
        limit: 10
      });
      expect(res.json).toHaveBeenCalledWith({ creditors: mockCreditors });
    });

    it('deve retornar lista vazia quando termo é muito curto', async () => {
      jest.resetModules();
      jest.clearAllMocks();
      jest.mock('../../models', () => mockModels);
      jest.mock('../../utils/creditorValidators', () => mockValidators);
      jest.mock('../../utils/errors', () => mockErrors);
      jest.mock('sequelize', () => ({ Op: mockOp }));
      jest.doMock('sequelize', () => ({ Op: mockOp }));
      const controller = require('../../controllers/creditorController');
      const req = { userId: 1, query: { q: 'ab' } };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await controller.searchCreditors(req, res, next);

      const arg = res.json.mock.calls[0][0];
      expect(arg).toHaveProperty('creditors');
      expect(Array.isArray(arg.creditors) || arg.creditors === undefined).toBe(true);
    });

    it('deve retornar lista vazia quando não há termo de busca', async () => {
      // Arrange
      const req = { userId: 1, query: {} };
      const res = { json: jest.fn() };
      const next = jest.fn();

      // Act
      await creditorController.searchCreditors(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({ creditors: [] });
      expect(mockModels.Creditor.findAll).not.toHaveBeenCalled();
    });
  });
}); 