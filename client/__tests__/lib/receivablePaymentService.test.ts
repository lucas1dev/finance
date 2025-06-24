/**
 * Testes unitários para o serviço de pagamentos de recebíveis
 * @module tests/receivablePaymentService
 */

import receivablePaymentService, { 
  ReceivablePayment, 
  ReceivablePaymentFilters, 
  CreateReceivablePaymentData 
} from '../../src/lib/receivablePaymentService';
import api from '../../src/lib/axios';

// Mock do axios
jest.mock('../../src/lib/axios');
const mockedApi = api as jest.Mocked<typeof api>;

describe('ReceivablePaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  const mockPayment: ReceivablePayment = {
    id: 1,
    receivable_id: 1,
    amount: 2500.00,
    payment_date: '2024-01-15',
    payment_method: 'pix',
    account_id: 1,
    reference: 'REF001',
    notes: 'Pagamento de fatura',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    receivable: {
      id: 1,
      description: 'Fatura de serviços',
      amount: 2500.00,
      due_date: '2024-01-20',
      status: 'paid',
      customer: {
        id: 1,
        name: 'Cliente Teste',
        document: '123456789',
        email: 'teste@cliente.com'
      },
      category: {
        id: 1,
        name: 'Serviços',
        color: '#00FF00'
      }
    },
    account: {
      id: 1,
      bank_name: 'Banco Teste',
      account_type: 'corrente',
      balance: 10000.00
    }
  };

  describe('getPayments', () => {
    it('should fetch payments with filters and pagination', async () => {
      const mockResponse = {
        data: [mockPayment]
      };
      mockedApi.get.mockResolvedValueOnce(mockResponse);

      const filters: ReceivablePaymentFilters = {
        receivable_id: 1,
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      };
      const pagination = { page: 1, limit: 10 };

      const result = await receivablePaymentService.getPayments(filters, pagination);

      expect(mockedApi.get).toHaveBeenCalledWith('/receivable-payments?receivable_id=1&start_date=2024-01-01&end_date=2024-01-31&page=1&limit=10');
      expect(result.data).toEqual([mockPayment]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1
      });
    });

    it('should handle empty response', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: [] });

      const result = await receivablePaymentService.getPayments();

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockedApi.get.mockRejectedValueOnce(error);

      await expect(receivablePaymentService.getPayments()).rejects.toThrow('API Error');
    });
  });

  describe('getPayment', () => {
    it('should fetch a specific payment', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: mockPayment });

      const result = await receivablePaymentService.getPayment(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/receivable-payments/1');
      expect(result).toEqual(mockPayment);
    });

    it('should handle API errors', async () => {
      const error = new Error('Payment not found');
      mockedApi.get.mockRejectedValueOnce(error);

      await expect(receivablePaymentService.getPayment(999)).rejects.toThrow('Payment not found');
    });
  });

  describe('createPayment', () => {
    it('should create a new payment', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: mockPayment });

      const paymentData: CreateReceivablePaymentData = {
        receivable_id: 1,
        amount: 2500.00,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        account_id: 1,
        reference: 'REF001',
        notes: 'Pagamento de fatura'
      };

      const result = await receivablePaymentService.createPayment(paymentData);

      expect(mockedApi.post).toHaveBeenCalledWith('/receivable-payments', paymentData);
      expect(result).toEqual(mockPayment);
    });

    it('should handle API errors', async () => {
      const error = new Error('Invalid payment data');
      mockedApi.post.mockRejectedValueOnce(error);

      const paymentData: CreateReceivablePaymentData = {
        receivable_id: 1,
        amount: 2500.00,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        account_id: 1
      };

      await expect(receivablePaymentService.createPayment(paymentData)).rejects.toThrow('Invalid payment data');
    });
  });

  describe('updatePayment', () => {
    it('should update an existing payment', async () => {
      const updatedPayment = { ...mockPayment, amount: 2600.00 };
      mockedApi.patch.mockResolvedValueOnce({ data: updatedPayment });

      const updateData = { amount: 2600.00 };

      const result = await receivablePaymentService.updatePayment(1, updateData);

      expect(mockedApi.patch).toHaveBeenCalledWith('/receivable-payments/1', updateData);
      expect(result).toEqual(updatedPayment);
    });
  });

  describe('deletePayment', () => {
    it('should delete a payment', async () => {
      mockedApi.delete.mockResolvedValueOnce({});

      await receivablePaymentService.deletePayment(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/receivable-payments/1');
    });
  });

  describe('getPaymentsByReceivable', () => {
    it('should fetch payments for a specific receivable', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: [mockPayment] });

      const result = await receivablePaymentService.getPaymentsByReceivable(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/receivables/1/payments');
      expect(result).toEqual([mockPayment]);
    });
  });

  describe('getPaymentStats', () => {
    it('should fetch payment statistics', async () => {
      const mockStats = {
        total_payments: 15,
        total_amount: 25000,
        average_amount: 1666.67,
        payments_by_method: [],
        payments_by_month: [],
        top_customers: []
      };
      mockedApi.get.mockResolvedValueOnce({ data: mockStats });

      const result = await receivablePaymentService.getPaymentStats('month');

      expect(mockedApi.get).toHaveBeenCalledWith('/receivable-payments/stats?period=month');
      expect(result).toEqual(mockStats);
    });
  });

  describe('exportPayments', () => {
    it('should export payments as CSV', async () => {
      const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
      mockedApi.get.mockResolvedValueOnce({ data: mockBlob });

      const filters: ReceivablePaymentFilters = { start_date: '2024-01-01' };

      const result = await receivablePaymentService.exportPayments(filters);

      expect(mockedApi.get).toHaveBeenCalledWith('/receivable-payments/export?start_date=2024-01-01', {
        responseType: 'blob'
      });
      expect(result).toEqual(mockBlob);
    });
  });

  describe('utility methods', () => {
    describe('calculateDaysOverdue', () => {
      it('should calculate days overdue correctly', () => {
        const dueDate = '2024-01-10';
        const result = receivablePaymentService.calculateDaysOverdue(dueDate);
        expect(result).toBeGreaterThanOrEqual(0);
      });

      it('should return 0 for future dates', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        const result = receivablePaymentService.calculateDaysOverdue(futureDate.toISOString().split('T')[0]);
        expect(result).toBe(0);
      });
    });

    describe('isOverdue', () => {
      it('should return true for past dates', () => {
        const pastDate = '2024-01-01';
        const result = receivablePaymentService.isOverdue(pastDate);
        expect(result).toBe(true);
      });

      it('should return false for future dates', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        const result = receivablePaymentService.isOverdue(futureDate.toISOString().split('T')[0]);
        expect(result).toBe(false);
      });
    });

    describe('formatCurrency', () => {
      it('should format currency correctly', () => {
        const result = receivablePaymentService.formatCurrency(2500.75);
        expect(result).toContain('R$');
        expect(result).toContain('2.500,75');
      });
    });

    describe('formatDate', () => {
      it('should format date correctly', () => {
        const result = receivablePaymentService.formatDate('2024-01-15');
        expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      });
    });

    describe('getStatusLabel', () => {
      it('should return correct status labels', () => {
        expect(receivablePaymentService.getStatusLabel('paid')).toBe('Pago');
        expect(receivablePaymentService.getStatusLabel('partially_paid')).toBe('Parcialmente Pago');
        expect(receivablePaymentService.getStatusLabel('pending')).toBe('Pendente');
        expect(receivablePaymentService.getStatusLabel('overdue')).toBe('Vencido');
        expect(receivablePaymentService.getStatusLabel('unknown')).toBe('unknown');
      });
    });

    describe('getStatusColor', () => {
      it('should return correct status colors', () => {
        expect(receivablePaymentService.getStatusColor('paid')).toContain('green');
        expect(receivablePaymentService.getStatusColor('partially_paid')).toContain('blue');
        expect(receivablePaymentService.getStatusColor('pending')).toContain('yellow');
        expect(receivablePaymentService.getStatusColor('overdue')).toContain('red');
      });
    });

    describe('getPaymentMethodLabel', () => {
      it('should return correct payment method labels', () => {
        expect(receivablePaymentService.getPaymentMethodLabel('cash')).toBe('Dinheiro');
        expect(receivablePaymentService.getPaymentMethodLabel('credit_card')).toBe('Cartão de Crédito');
        expect(receivablePaymentService.getPaymentMethodLabel('debit_card')).toBe('Cartão de Débito');
        expect(receivablePaymentService.getPaymentMethodLabel('pix')).toBe('PIX');
        expect(receivablePaymentService.getPaymentMethodLabel('bank_transfer')).toBe('Transferência Bancária');
        expect(receivablePaymentService.getPaymentMethodLabel('unknown')).toBe('unknown');
      });
    });
  });
}); 