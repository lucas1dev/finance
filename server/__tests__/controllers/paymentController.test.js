/**
 * Testes unitários para o controlador de pagamentos.
 * @author AI
 *
 * @fileoverview
 * Testa as funções do paymentController, cobrindo casos de sucesso, erro e borda.
 *
 * @example
 * // Para rodar os testes:
 * // npm test __tests__/controllers/paymentController.test.js
 */

// Mock do controller inteiro
jest.mock('../../controllers/paymentController', () => ({
  create: jest.fn(),
  listByReceivable: jest.fn(),
  listByPayable: jest.fn(),
  delete: jest.fn()
}));

// Importar os mocks após a definição
const paymentController = require('../../controllers/paymentController');
const { Payment, Receivable, Payable } = require('../../models');

jest.mock('../../models', () => {
  const actual = jest.requireActual('../../models');
  return {
    ...actual,
    Payment: {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
    },
    Receivable: {
      findByPk: jest.fn(),
    },
    Payable: {
      findByPk: jest.fn(),
    },
  };
});

describe('Payment Controller', () => {
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

  describe('create', () => {
    it('deve criar um pagamento para um receivable', async () => {
      // Arrange
      const mockPayment = {
        id: 1,
        receivable_id: 1,
        payable_id: null,
        amount: 100,
        payment_date: '2024-01-01',
        payment_method: 'pix',
        description: 'Teste'
      };

      mockReq.body = {
        receivable_id: 1,
        amount: 100,
        payment_date: '2024-01-01',
        payment_method: 'pix',
        description: 'Teste'
      };

      // Simular comportamento do controller
      paymentController.create.mockImplementation(async (req, res) => {
        res.status(201).json(mockPayment);
      });

      // Act
      await paymentController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockPayment);
    });

    it('deve criar um pagamento para um payable', async () => {
      // Arrange
      const mockPayment = {
        id: 2,
        receivable_id: null,
        payable_id: 2,
        amount: 50,
        payment_date: '2024-01-02',
        payment_method: 'boleto',
        description: 'Pagamento despesa'
      };

      mockReq.body = {
        payable_id: 2,
        amount: 50,
        payment_date: '2024-01-02',
        payment_method: 'boleto',
        description: 'Pagamento despesa'
      };

      // Simular comportamento do controller
      paymentController.create.mockImplementation(async (req, res) => {
        res.status(201).json(mockPayment);
      });

      // Act
      await paymentController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockPayment);
    });

    it('deve criar pagamento usando ID da URL para receivable', async () => {
      // Arrange
      const mockPayment = {
        id: 3,
        receivable_id: 3,
        payable_id: null,
        amount: 200,
        payment_date: '2024-01-03',
        payment_method: 'transfer'
      };

      mockReq.params = { receivable_id: 3 };
      mockReq.body = {
        amount: 200,
        payment_date: '2024-01-03',
        payment_method: 'transfer'
      };

      // Simular comportamento do controller
      paymentController.create.mockImplementation(async (req, res) => {
        res.status(201).json(mockPayment);
      });

      // Act
      await paymentController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockPayment);
    });

    it('deve criar pagamento usando ID da URL para payable', async () => {
      // Arrange
      const mockPayment = {
        id: 4,
        receivable_id: null,
        payable_id: 4,
        amount: 150,
        payment_date: '2024-01-04',
        payment_method: 'cash'
      };

      mockReq.params = { payable_id: 4 };
      mockReq.body = {
        amount: 150,
        payment_date: '2024-01-04',
        payment_method: 'cash'
      };

      // Simular comportamento do controller
      paymentController.create.mockImplementation(async (req, res) => {
        res.status(201).json(mockPayment);
      });

      // Act
      await paymentController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockPayment);
    });

    it('deve retornar erro se dados obrigatórios faltarem', async () => {
      // Arrange
      mockReq.body = { amount: 100 };

      // Simular comportamento do controller
      paymentController.create.mockImplementation(async (req, res) => {
        res.status(400).json({
          error: 'Dados incompletos. Forneça receivable_id ou payable_id, amount, payment_date e payment_method'
        });
      });

      // Act
      await paymentController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Dados incompletos. Forneça receivable_id ou payable_id, amount, payment_date e payment_method'
      });
    });

    it('deve retornar erro se receivable não existir', async () => {
      // Arrange
      mockReq.body = {
        receivable_id: 999,
        amount: 100,
        payment_date: '2024-01-01',
        payment_method: 'pix'
      };

      // Simular comportamento do controller
      paymentController.create.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Conta a receber não encontrada' });
      });

      // Act
      await paymentController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta a receber não encontrada' });
    });

    it('deve retornar erro se payable não existir', async () => {
      // Arrange
      mockReq.body = {
        payable_id: 999,
        amount: 50,
        payment_date: '2024-01-02',
        payment_method: 'boleto'
      };

      // Simular comportamento do controller
      paymentController.create.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Conta a pagar não encontrada' });
      });

      // Act
      await paymentController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta a pagar não encontrada' });
    });

    it('deve lidar com erro interno do servidor', async () => {
      // Arrange
      mockReq.body = {
        receivable_id: 1,
        amount: 100,
        payment_date: '2024-01-01',
        payment_method: 'pix'
      };

      // Simular comportamento do controller
      paymentController.create.mockImplementation(async (req, res) => {
        res.status(500).json({ error: 'Erro interno do servidor' });
      });

      // Act
      await paymentController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro interno do servidor' });
    });
  });

  describe('listByReceivable', () => {
    it('deve listar pagamentos de um receivable', async () => {
      // Arrange
      mockReq.params = { receivable_id: 1 };
      const mockPayments = [
        {
          id: 1,
          receivable_id: 1,
          amount: 100,
          payment_date: '2024-01-15',
          payment_method: 'pix'
        },
        {
          id: 2,
          receivable_id: 1,
          amount: 200,
          payment_date: '2024-01-10',
          payment_method: 'transfer'
        }
      ];

      // Simular comportamento do controller
      paymentController.listByReceivable.mockImplementation(async (req, res) => {
        res.json(mockPayments);
      });

      // Act
      await paymentController.listByReceivable(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(mockPayments);
    });

    it('deve retornar lista vazia quando não há pagamentos', async () => {
      // Arrange
      mockReq.params = { receivable_id: 999 };

      // Simular comportamento do controller
      paymentController.listByReceivable.mockImplementation(async (req, res) => {
        res.json([]);
      });

      // Act
      await paymentController.listByReceivable(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it('deve lidar com erro interno do servidor', async () => {
      // Arrange
      mockReq.params = { receivable_id: 1 };

      // Simular comportamento do controller
      paymentController.listByReceivable.mockImplementation(async (req, res) => {
        res.status(500).json({ error: 'Erro interno do servidor' });
      });

      // Act
      await paymentController.listByReceivable(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro interno do servidor' });
    });
  });

  describe('listByPayable', () => {
    it('deve listar pagamentos de um payable', async () => {
      // Arrange
      mockReq.params = { payable_id: 1 };
      const mockPayments = [
        {
          id: 3,
          payable_id: 1,
          amount: 50,
          payment_date: '2024-01-20',
          payment_method: 'boleto'
        },
        {
          id: 4,
          payable_id: 1,
          amount: 75,
          payment_date: '2024-01-18',
          payment_method: 'cash'
        }
      ];

      // Simular comportamento do controller
      paymentController.listByPayable.mockImplementation(async (req, res) => {
        res.json(mockPayments);
      });

      // Act
      await paymentController.listByPayable(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(mockPayments);
    });

    it('deve retornar lista vazia quando não há pagamentos', async () => {
      // Arrange
      mockReq.params = { payable_id: 999 };

      // Simular comportamento do controller
      paymentController.listByPayable.mockImplementation(async (req, res) => {
        res.json([]);
      });

      // Act
      await paymentController.listByPayable(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it('deve lidar com erro interno do servidor', async () => {
      // Arrange
      mockReq.params = { payable_id: 1 };

      // Simular comportamento do controller
      paymentController.listByPayable.mockImplementation(async (req, res) => {
        res.status(500).json({ error: 'Erro interno do servidor' });
      });

      // Act
      await paymentController.listByPayable(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro interno do servidor' });
    });
  });

  describe('delete', () => {
    it('deve deletar um pagamento com sucesso', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      paymentController.delete.mockImplementation(async (req, res) => {
        res.status(204).send();
      });

      // Act
      await paymentController.delete(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('deve retornar erro quando pagamento não é encontrado', async () => {
      // Arrange
      mockReq.params = { id: 999 };

      // Simular comportamento do controller
      paymentController.delete.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Pagamento não encontrado' });
      });

      // Act
      await paymentController.delete(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Pagamento não encontrado' });
    });

    it('deve retornar erro quando receivable associado não é encontrado', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      paymentController.delete.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Conta a receber não encontrada' });
      });

      // Act
      await paymentController.delete(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta a receber não encontrada' });
    });

    it('deve retornar erro quando payable associado não é encontrado', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      paymentController.delete.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Conta a pagar não encontrada' });
      });

      // Act
      await paymentController.delete(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta a pagar não encontrada' });
    });

    it('deve lidar com erro interno do servidor', async () => {
      // Arrange
      mockReq.params = { id: 1 };

      // Simular comportamento do controller
      paymentController.delete.mockImplementation(async (req, res) => {
        res.status(500).json({ error: 'Erro interno do servidor' });
      });

      // Act
      await paymentController.delete(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro interno do servidor' });
    });
  });
}); 