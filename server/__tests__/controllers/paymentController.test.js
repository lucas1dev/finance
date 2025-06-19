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
  let mockReq;
  let mockRes;
  let mockPayment;

  beforeEach(() => {
    mockReq = { body: {}, params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    mockPayment = {
      id: 1,
      receivable_id: 1,
      payable_id: null,
      amount: 100,
      payment_date: '2024-01-01',
      payment_method: 'pix',
      description: 'Teste',
      destroy: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um pagamento para um receivable', async () => {
      mockReq.body = {
        receivable_id: 1,
        amount: 100,
        payment_date: '2024-01-01',
        payment_method: 'pix',
        description: 'Teste'
      };
      Receivable.findByPk.mockResolvedValue({ id: 1 });
      Payment.create.mockResolvedValue(mockPayment);
      await paymentController.create(mockReq, mockRes);
      expect(Payment.create).toHaveBeenCalledWith({
        receivable_id: 1,
        payable_id: null,
        amount: 100,
        payment_date: '2024-01-01',
        payment_method: 'pix',
        description: 'Teste'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockPayment);
    });
    it('deve criar um pagamento para um payable', async () => {
      mockReq.body = {
        payable_id: 2,
        amount: 50,
        payment_date: '2024-01-02',
        payment_method: 'boleto',
        description: 'Pagamento despesa'
      };
      Payable.findByPk.mockResolvedValue({ id: 2 });
      Payment.create.mockResolvedValue({ ...mockPayment, id: 2, receivable_id: null, payable_id: 2 });
      await paymentController.create(mockReq, mockRes);
      expect(Payment.create).toHaveBeenCalledWith({
        receivable_id: null,
        payable_id: 2,
        amount: 50,
        payment_date: '2024-01-02',
        payment_method: 'boleto',
        description: 'Pagamento despesa'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ ...mockPayment, id: 2, receivable_id: null, payable_id: 2 });
    });
    it('deve retornar erro se dados obrigatórios faltarem', async () => {
      mockReq.body = { amount: 100 };
      await paymentController.create(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Dados incompletos')
      });
    });
    it('deve retornar erro se receivable não existir', async () => {
      mockReq.body = {
        receivable_id: 99,
        amount: 100,
        payment_date: '2024-01-01',
        payment_method: 'pix'
      };
      Receivable.findByPk.mockResolvedValue(null);
      await paymentController.create(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta a receber não encontrada' });
    });
    it('deve retornar erro se payable não existir', async () => {
      mockReq.body = {
        payable_id: 99,
        amount: 100,
        payment_date: '2024-01-01',
        payment_method: 'pix'
      };
      Payable.findByPk.mockResolvedValue(null);
      await paymentController.create(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta a pagar não encontrada' });
    });
  });

  describe('listByReceivable', () => {
    it('deve listar pagamentos de um receivable', async () => {
      mockReq.params = { receivable_id: 1 };
      Payment.findAll.mockResolvedValue([mockPayment]);
      await paymentController.listByReceivable(mockReq, mockRes);
      expect(Payment.findAll).toHaveBeenCalledWith({
        where: { receivable_id: 1 },
        order: [['payment_date', 'DESC']]
      });
      expect(mockRes.json).toHaveBeenCalledWith([mockPayment]);
    });
  });

  describe('listByPayable', () => {
    it('deve listar pagamentos de um payable', async () => {
      mockReq.params = { payable_id: 2 };
      Payment.findAll.mockResolvedValue([{ ...mockPayment, id: 2, receivable_id: null, payable_id: 2 }]);
      await paymentController.listByPayable(mockReq, mockRes);
      expect(Payment.findAll).toHaveBeenCalledWith({
        where: { payable_id: 2 },
        order: [['payment_date', 'DESC']]
      });
      expect(mockRes.json).toHaveBeenCalledWith([{ ...mockPayment, id: 2, receivable_id: null, payable_id: 2 }]);
    });
  });

  describe('delete', () => {
    it('deve excluir um pagamento de receivable', async () => {
      mockReq.params = { id: 1 };
      const destroyFn = jest.fn();
      Payment.findByPk.mockResolvedValue({ ...mockPayment, receivable_id: 1, destroy: destroyFn });
      Receivable.findByPk.mockResolvedValue({ id: 1 });
      await paymentController.delete(mockReq, mockRes);
      expect(Payment.findByPk).toHaveBeenCalledWith(1);
      expect(Receivable.findByPk).toHaveBeenCalledWith(1);
      expect(destroyFn).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });
    it('deve excluir um pagamento de payable', async () => {
      mockReq.params = { id: 2 };
      Payment.findByPk.mockResolvedValue({ ...mockPayment, id: 2, receivable_id: null, payable_id: 2, destroy: jest.fn() });
      Payable.findByPk.mockResolvedValue({ id: 2 });
      await paymentController.delete(mockReq, mockRes);
      expect(Payment.findByPk).toHaveBeenCalledWith(2);
      expect(Payable.findByPk).toHaveBeenCalledWith(2);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });
    it('deve retornar erro se pagamento não existir', async () => {
      mockReq.params = { id: 99 };
      Payment.findByPk.mockResolvedValue(null);
      await paymentController.delete(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Pagamento não encontrado' });
    });
    it('deve retornar erro se receivable não existir ao excluir', async () => {
      mockReq.params = { id: 1 };
      Payment.findByPk.mockResolvedValue({ ...mockPayment, receivable_id: 1, destroy: jest.fn() });
      Receivable.findByPk.mockResolvedValue(null);
      await paymentController.delete(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta a receber não encontrada' });
    });
    it('deve retornar erro se payable não existir ao excluir', async () => {
      mockReq.params = { id: 2 };
      Payment.findByPk.mockResolvedValue({ ...mockPayment, id: 2, receivable_id: null, payable_id: 2, destroy: jest.fn() });
      Payable.findByPk.mockResolvedValue(null);
      await paymentController.delete(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conta a pagar não encontrada' });
    });
  });
}); 