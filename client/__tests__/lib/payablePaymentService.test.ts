/**
 * Testes unitários para o serviço de pagamentos de pagáveis
 * @module tests/payablePaymentService
 */

import payablePaymentService, { 
  PayablePayment, 
  PayablePaymentFilters, 
  CreatePayablePaymentData 
} from '../../src/lib/payablePaymentService';
import api from '../../src/lib/axios';

// Mock do axios
jest.mock('../../src/lib/axios');
const mockedApi = api as jest.Mocked<typeof api>;

describe('PayablePaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  const mockPayment: PayablePayment = {
    id: 1,
    payable_id: 1,
    amount: 1500.00,
    payment_date: '2024-01-15',
    payment_method: 'pix',
    account_id: 1,
    notes: 'Pagamento de fatura',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    payable: {
      id: 1,
      description: 'Fatura de energia',
      amount: 1500.00,
      due_date: '2024-01-20',
      status: 'paid',
      supplier: {
        id: 1,
        name: 'Fornecedor Teste',
        document: '123456789',
        email: 'teste@fornecedor.com'
      },
      category: {
        id: 1,
        name: 'Energia',
        color: '#FF0000'
      }
    },
    account: {
      id: 1,
      bank_name: 'Banco Teste',
      account_type: 'corrente',
      balance: 5000.00
    }
  };

  describe('getPayments', () => {
    it('should fetch payments with filters and pagination', async () => {
      const mockResponse = {
        data: [mockPayment]
      };
      mockedApi.get.mockResolvedValueOnce(mockResponse);

      const filters: PayablePaymentFilters = {
        payable_id: 1,
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      };
      const pagination = { page: 1, limit: 10 };

      const result = await payablePaymentService.getPayments(filters, pagination);

      expect(mockedApi.get).toHaveBeenCalledWith('/payments?payable_id=1&start_date=2024-01-01&end_date=2024-01-31&page=1&limit=10');
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

      const result = await payablePaymentService.getPayments();

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockedApi.get.mockRejectedValueOnce(error);

      await expect(payablePaymentService.getPayments()).rejects.toThrow('API Error');
    });
  });

  describe('getPayment', () => {
    it('should fetch a specific payment', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: mockPayment });

      const result = await payablePaymentService.getPayment(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/payments/1');
      expect(result).toEqual(mockPayment);
    });

    it('should handle API errors', async () => {
      const error = new Error('Payment not found');
      mockedApi.get.mockRejectedValueOnce(error);

      await expect(payablePaymentService.getPayment(999)).rejects.toThrow('Payment not found');
    });
  });

  describe('createPayment', () => {
    it('should create a new payment', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: mockPayment });

      const paymentData: CreatePayablePaymentData = {
        payable_id: 1,
        amount: 1500.00,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        account_id: 1,
        notes: 'Pagamento de fatura'
      };

      const result = await payablePaymentService.createPayment(paymentData);

      expect(mockedApi.post).toHaveBeenCalledWith('/payments', paymentData);
      expect(result).toEqual(mockPayment);
    });

    it('should handle API errors', async () => {
      const error = new Error('Invalid payment data');
      mockedApi.post.mockRejectedValueOnce(error);

      const paymentData: CreatePayablePaymentData = {
        payable_id: 1,
        amount: 1500.00,
        payment_date: '2024-01-15',
        payment_method: 'pix',
        account_id: 1
      };

      await expect(payablePaymentService.createPayment(paymentData)).rejects.toThrow('Invalid payment data');
    });
  });

  describe('updatePayment', () => {
    it('should update an existing payment', async () => {
      const updatedPayment = { ...mockPayment, amount: 1600.00 };
      mockedApi.patch.mockResolvedValueOnce({ data: updatedPayment });

      const updateData = { amount: 1600.00 };

      const result = await payablePaymentService.updatePayment(1, updateData);

      expect(mockedApi.patch).toHaveBeenCalledWith('/payments/1', updateData);
      expect(result).toEqual(updatedPayment);
    });
  });

  describe('deletePayment', () => {
    it('should delete a payment', async () => {
      mockedApi.delete.mockResolvedValueOnce({});

      await payablePaymentService.deletePayment(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/payments/1');
    });
  });

  describe('getPaymentsByPayable', () => {
    it('should fetch payments for a specific payable', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: [mockPayment] });

      const result = await payablePaymentService.getPaymentsByPayable(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/payables/1/payments');
      expect(result).toEqual([mockPayment]);
    });
  });

  describe('getPaymentStats', () => {
    it('should fetch payment statistics', async () => {
      const mockStats = {
        total_payments: 10,
        total_amount: 15000,
        average_amount: 1500,
        payments_by_method: [],
        payments_by_month: [],
        top_suppliers: []
      };
      mockedApi.get.mockResolvedValueOnce({ data: mockStats });

      const result = await payablePaymentService.getPaymentStats('month');

      expect(mockedApi.get).toHaveBeenCalledWith('/payments/stats?period=month');
      expect(result).toEqual(mockStats);
    });
  });

  describe('exportPayments', () => {
    it('should export payments as CSV', async () => {
      const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
      mockedApi.get.mockResolvedValueOnce({ data: mockBlob });

      const filters: PayablePaymentFilters = { start_date: '2024-01-01' };

      const result = await payablePaymentService.exportPayments(filters);

      expect(mockedApi.get).toHaveBeenCalledWith('/payments/export?start_date=2024-01-01', {
        responseType: 'blob'
      });
      expect(result).toEqual(mockBlob);
    });
  });

  describe('utility methods', () => {
    describe('calculateDaysOverdue', () => {
      it('should calculate days overdue correctly', () => {
        const dueDate = '2024-01-10';
        const result = payablePaymentService.calculateDaysOverdue(dueDate);
        expect(result).toBeGreaterThanOrEqual(0);
      });

      it('should return 0 for future dates', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        const result = payablePaymentService.calculateDaysOverdue(futureDate.toISOString().split('T')[0]);
        expect(result).toBe(0);
      });
    });

    describe('isOverdue', () => {
      it('should return true for past dates', () => {
        const pastDate = '2024-01-01';
        const result = payablePaymentService.isOverdue(pastDate);
        expect(result).toBe(true);
      });

      it('should return false for future dates', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        const result = payablePaymentService.isOverdue(futureDate.toISOString().split('T')[0]);
        expect(result).toBe(false);
      });
    });

    describe('formatCurrency', () => {
      it('should format currency correctly', () => {
        const result = payablePaymentService.formatCurrency(1500.50);
        expect(result).toContain('R$');
        expect(result).toContain('1.500,50');
      });
    });

    describe('formatDate', () => {
      it('should format date correctly', () => {
        const result = payablePaymentService.formatDate('2024-01-15');
        expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      });
    });

    describe('getStatusLabel', () => {
      it('should return correct status labels', () => {
        expect(payablePaymentService.getStatusLabel('paid')).toBe('Pago');
        expect(payablePaymentService.getStatusLabel('pending')).toBe('Pendente');
        expect(payablePaymentService.getStatusLabel('overdue')).toBe('Vencido');
        expect(payablePaymentService.getStatusLabel('cancelled')).toBe('Cancelado');
        expect(payablePaymentService.getStatusLabel('unknown')).toBe('unknown');
      });
    });

    describe('getStatusColor', () => {
      it('should return correct status colors', () => {
        expect(payablePaymentService.getStatusColor('paid')).toContain('green');
        expect(payablePaymentService.getStatusColor('pending')).toContain('yellow');
        expect(payablePaymentService.getStatusColor('overdue')).toContain('red');
        expect(payablePaymentService.getStatusColor('cancelled')).toContain('gray');
      });
    });

    describe('getPaymentMethodLabel', () => {
      it('should return correct payment method labels', () => {
        expect(payablePaymentService.getPaymentMethodLabel('cash')).toBe('Dinheiro');
        expect(payablePaymentService.getPaymentMethodLabel('credit_card')).toBe('Cartão de Crédito');
        expect(payablePaymentService.getPaymentMethodLabel('debit_card')).toBe('Cartão de Débito');
        expect(payablePaymentService.getPaymentMethodLabel('pix')).toBe('PIX');
        expect(payablePaymentService.getPaymentMethodLabel('bank_transfer')).toBe('Transferência Bancária');
        expect(payablePaymentService.getPaymentMethodLabel('unknown')).toBe('unknown');
      });
    });
  });
}); 