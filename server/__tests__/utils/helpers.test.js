/**
 * Testes unitários para as funções utilitárias (helpers).
 * @author AI
 */
const {
  formatCurrency,
  formatDate,
  formatDocument,
  formatPhone,
  calculateDueDate,
  calculateInterest,
  calculateTotalAmount,
  generateInstallments,
  calculateBalance
} = require('../../utils/helpers');

describe('Helpers', () => {
  describe('formatCurrency', () => {
    it('deve formatar valor monetário corretamente', () => {
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
      expect(formatCurrency('1234.56')).toBe('R$ 1.234,56');
    });

    it('deve retornar R$ 0,00 para valores nulos ou indefinidos', () => {
      expect(formatCurrency(null)).toBe('R$ 0,00');
      expect(formatCurrency(undefined)).toBe('R$ 0,00');
    });
  });

  describe('formatDate', () => {
    it('deve formatar data corretamente', () => {
      // Usando UTC para evitar problemas com fuso horário
      const date = new Date(Date.UTC(2024, 0, 1));
      expect(formatDate(date)).toBe('01/01/2024');
      expect(formatDate('2024-01-01')).toBe('01/01/2024');
    });

    it('deve retornar string vazia para datas inválidas', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('data-invalida')).toBe('');
    });
  });

  describe('formatDocument', () => {
    it('deve formatar CPF corretamente', () => {
      expect(formatDocument('12345678901')).toBe('123.456.789-01');
    });

    it('deve formatar CNPJ corretamente', () => {
      expect(formatDocument('12345678000199')).toBe('12.345.678/0001-99');
    });

    it('deve retornar string vazia para documentos inválidos', () => {
      expect(formatDocument(null)).toBe('');
      expect(formatDocument(undefined)).toBe('');
    });
  });

  describe('formatPhone', () => {
    it('deve formatar telefone com 11 dígitos corretamente', () => {
      expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
    });

    it('deve formatar telefone com 10 dígitos corretamente', () => {
      expect(formatPhone('1199999999')).toBe('(11) 9999-9999');
    });

    it('deve retornar string vazia para telefones inválidos', () => {
      expect(formatPhone(null)).toBe('');
      expect(formatPhone(undefined)).toBe('');
    });
  });

  describe('calculateDueDate', () => {
    it('deve calcular data de vencimento corretamente', () => {
      const baseDate = '2024-01-01';
      expect(calculateDueDate(baseDate, 30)).toBe('2024-01-31');
    });

    it('deve retornar string vazia para datas inválidas', () => {
      expect(calculateDueDate(null, 30)).toBe('');
      expect(calculateDueDate(undefined, 30)).toBe('');
    });
  });

  describe('calculateInterest', () => {
    it('deve calcular juros corretamente', () => {
      expect(calculateInterest(1000, 0.01, 30)).toBe(10);
    });

    it('deve retornar 0 para valores inválidos', () => {
      expect(calculateInterest(null, 0.01, 30)).toBe(0);
      expect(calculateInterest(1000, null, 30)).toBe(0);
      expect(calculateInterest(1000, 0.01, null)).toBe(0);
    });
  });

  describe('calculateTotalAmount', () => {
    it('deve calcular valor total corretamente', () => {
      expect(calculateTotalAmount(1000, 100)).toBe(1100);
    });

    it('deve retornar 0 para valor principal inválido', () => {
      expect(calculateTotalAmount(null, 100)).toBe(0);
      expect(calculateTotalAmount(undefined, 100)).toBe(0);
    });
  });

  describe('generateInstallments', () => {
    it('deve gerar parcelas corretamente', () => {
      const installments = generateInstallments(1000, 3, '2024-01-01');
      expect(installments).toHaveLength(3);
      expect(installments[0]).toEqual({
        number: 1,
        amount: 333.33,
        due_date: '2024-01-01'
      });
    });

    it('deve retornar array vazio para valores inválidos', () => {
      expect(generateInstallments(null, 3, '2024-01-01')).toEqual([]);
      expect(generateInstallments(1000, null, '2024-01-01')).toEqual([]);
      expect(generateInstallments(1000, 3, null)).toEqual([]);
    });
  });

  describe('calculateBalance', () => {
    it('deve calcular saldo corretamente', () => {
      const transactions = [
        { type: 'income', amount: 1000 },
        { type: 'expense', amount: 500 }
      ];
      expect(calculateBalance(transactions)).toBe(500);
    });

    it('deve retornar 0 para transações inválidas', () => {
      expect(calculateBalance(null)).toBe(0);
      expect(calculateBalance(undefined)).toBe(0);
      expect(calculateBalance([])).toBe(0);
    });
  });
}); 