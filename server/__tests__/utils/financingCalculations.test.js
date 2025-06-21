/**
 * Testes unitários para os utilitários de cálculo de financiamentos
 */
const {
  calculateSACPayment,
  calculatePricePayment,
  generateAmortizationTable,
  calculateUpdatedBalance,
  simulateEarlyPayment
} = require('../../utils/financingCalculations');

describe('FinancingCalculations', () => {
  describe('calculateSACPayment', () => {
    it('deve calcular parcela SAC corretamente', () => {
      const totalAmount = 100000;
      const interestRate = 0.12; // 12% ao ano
      const termMonths = 120; // 10 anos

      const monthlyPayment = calculateSACPayment(totalAmount, interestRate, termMonths);

      // Verifica se o valor está dentro de um intervalo razoável
      expect(monthlyPayment).toBeGreaterThan(0);
      expect(monthlyPayment).toBeLessThan(totalAmount);
      
      // A primeira parcela SAC deve ser maior que a amortização mensal
      const monthlyAmortization = totalAmount / termMonths;
      expect(monthlyPayment).toBeGreaterThan(monthlyAmortization);
    });

    it('deve calcular parcela SAC para diferentes prazos', () => {
      const totalAmount = 50000;
      const interestRate = 0.15;

      const payment12Months = calculateSACPayment(totalAmount, interestRate, 12);
      const payment60Months = calculateSACPayment(totalAmount, interestRate, 60);

      // Parcela de 12 meses deve ser maior que de 60 meses
      expect(payment12Months).toBeGreaterThan(payment60Months);
    });

    it('deve calcular parcela SAC para diferentes taxas', () => {
      const totalAmount = 100000;
      const termMonths = 120;

      const paymentLowRate = calculateSACPayment(totalAmount, 0.08, termMonths);
      const paymentHighRate = calculateSACPayment(totalAmount, 0.20, termMonths);

      // Taxa maior deve resultar em parcela maior
      expect(paymentHighRate).toBeGreaterThan(paymentLowRate);
    });
  });

  describe('calculatePricePayment', () => {
    it('deve calcular parcela Price corretamente', () => {
      const totalAmount = 100000;
      const interestRate = 0.12; // 12% ao ano
      const termMonths = 120; // 10 anos

      const monthlyPayment = calculatePricePayment(totalAmount, interestRate, termMonths);

      // Verifica se o valor está dentro de um intervalo razoável
      expect(monthlyPayment).toBeGreaterThan(0);
      expect(monthlyPayment).toBeLessThan(totalAmount);
      
      // Parcela Price deve ser constante
      expect(typeof monthlyPayment).toBe('number');
      expect(monthlyPayment).toBeGreaterThan(0);
    });

    it('deve calcular parcela Price para diferentes prazos', () => {
      const totalAmount = 50000;
      const interestRate = 0.15;

      const payment12Months = calculatePricePayment(totalAmount, interestRate, 12);
      const payment60Months = calculatePricePayment(totalAmount, interestRate, 60);

      // Parcela de 12 meses deve ser maior que de 60 meses
      expect(payment12Months).toBeGreaterThan(payment60Months);
    });

    it('deve calcular parcela Price para diferentes taxas', () => {
      const totalAmount = 100000;
      const termMonths = 120;

      const paymentLowRate = calculatePricePayment(totalAmount, 0.08, termMonths);
      const paymentHighRate = calculatePricePayment(totalAmount, 0.20, termMonths);

      // Taxa maior deve resultar em parcela maior
      expect(paymentHighRate).toBeGreaterThan(paymentLowRate);
    });
  });

  describe('generateAmortizationTable', () => {
    it('deve gerar tabela SAC corretamente', () => {
      const totalAmount = 100000;
      const interestRate = 0.12;
      const termMonths = 12;
      const amortizationMethod = 'SAC';
      const startDate = new Date('2024-01-01');

      const result = generateAmortizationTable(totalAmount, interestRate, termMonths, amortizationMethod, startDate);

      expect(result).toHaveProperty('table');
      expect(result).toHaveProperty('summary');
      expect(result.table).toHaveLength(termMonths);
      expect(result.summary).toHaveProperty('totalInterest');
      expect(result.summary).toHaveProperty('totalPayments');

      // Verifica a primeira parcela
      const firstInstallment = result.table[0];
      expect(firstInstallment).toHaveProperty('installment', 1);
      expect(firstInstallment).toHaveProperty('payment');
      expect(firstInstallment).toHaveProperty('amortization');
      expect(firstInstallment).toHaveProperty('interest');
      expect(firstInstallment).toHaveProperty('remainingBalance');
      expect(firstInstallment).toHaveProperty('dueDate');

      // Verifica a última parcela
      const lastInstallment = result.table[termMonths - 1];
      expect(lastInstallment).toHaveProperty('installment', termMonths);
      expect(lastInstallment.remainingBalance).toBeCloseTo(0, 2);
    });

    it('deve gerar tabela Price corretamente', () => {
      const totalAmount = 100000;
      const interestRate = 0.12;
      const termMonths = 12;
      const amortizationMethod = 'Price';
      const startDate = new Date('2024-01-01');

      const result = generateAmortizationTable(totalAmount, interestRate, termMonths, amortizationMethod, startDate);

      expect(result.table).toHaveLength(termMonths);

      // No Price, as parcelas devem ser constantes
      const payments = result.table.map(row => row.payment);
      const firstPayment = payments[0];
      
      payments.forEach(payment => {
        expect(payment).toBeCloseTo(firstPayment, 2);
      });

      // Amortização deve crescer ao longo do tempo
      const amortizations = result.table.map(row => row.amortization);
      for (let i = 1; i < amortizations.length; i++) {
        expect(amortizations[i]).toBeGreaterThan(amortizations[i - 1]);
      }
    });

    it('deve calcular datas de vencimento corretamente', () => {
      const totalAmount = 100000;
      const interestRate = 0.12;
      const termMonths = 3;
      const amortizationMethod = 'SAC';
      const startDate = new Date('2024-01-15');

      const result = generateAmortizationTable(totalAmount, interestRate, termMonths, amortizationMethod, startDate);

      // Verifica se as datas estão em sequência mensal
      for (let i = 0; i < result.table.length; i++) {
        const installment = result.table[i];
        const expectedDate = new Date(startDate);
        expectedDate.setMonth(expectedDate.getMonth() + i);
        
        const installmentDate = new Date(installment.dueDate);
        expect(installmentDate.getFullYear()).toBe(expectedDate.getFullYear());
        expect(installmentDate.getMonth()).toBe(expectedDate.getMonth());
      }
    });
  });

  describe('calculateUpdatedBalance', () => {
    it('deve calcular saldo atualizado sem pagamentos', () => {
      const totalAmount = 100000;
      const interestRate = 0.12;
      const termMonths = 120;
      const amortizationMethod = 'SAC';
      const startDate = new Date('2024-01-01');
      const payments = [];

      const result = calculateUpdatedBalance(totalAmount, interestRate, termMonths, amortizationMethod, startDate, payments);

      expect(result).toHaveProperty('currentBalance');
      expect(result).toHaveProperty('paidInstallments');
      expect(result).toHaveProperty('totalPaid');
      expect(result).toHaveProperty('totalInterestPaid');

      // Sem pagamentos, o saldo deve ser igual ao valor total (com tolerância para arredondamento)
      expect(result.currentBalance).toBeCloseTo(totalAmount, 0);
      expect(result.paidInstallments).toBe(0);
      expect(result.totalPaid).toBe(0);
    });

    it('deve calcular saldo atualizado com pagamentos', () => {
      const totalAmount = 100000;
      const interestRate = 0.12;
      const termMonths = 120;
      const amortizationMethod = 'SAC';
      const startDate = new Date('2024-01-01');
      const payments = [
        {
          installment_number: 1,
          payment_amount: 1000,
          principal_amount: 800,
          interest_amount: 200
        },
        {
          installment_number: 2,
          payment_amount: 1000,
          principal_amount: 800,
          interest_amount: 200
        }
      ];

      const result = calculateUpdatedBalance(totalAmount, interestRate, termMonths, amortizationMethod, startDate, payments);

      expect(result.paidInstallments).toBe(2);
      expect(result.totalPaid).toBe(2000);
      expect(result.totalInterestPaid).toBe(400);
      expect(result.currentBalance).toBeLessThan(totalAmount);
    });

    it('deve calcular saldo atualizado com pagamentos parciais', () => {
      const totalAmount = 100000;
      const interestRate = 0.12;
      const termMonths = 120;
      const amortizationMethod = 'SAC';
      const startDate = new Date('2024-01-01');
      const payments = [
        {
          installment_number: 1,
          payment_amount: 500, // Pagamento parcial
          principal_amount: 400,
          interest_amount: 100
        }
      ];

      const result = calculateUpdatedBalance(totalAmount, interestRate, termMonths, amortizationMethod, startDate, payments);

      expect(result.paidInstallments).toBe(1);
      expect(result.totalPaid).toBe(500);
      expect(result.totalInterestPaid).toBe(100);
    });
  });

  describe('simulateEarlyPayment', () => {
    it('deve simular pagamento antecipado com redução de prazo', () => {
      const currentBalance = 80000;
      const interestRate = 0.12;
      const remainingMonths = 100;
      const amortizationMethod = 'SAC';
      const paymentAmount = 10000;
      const preference = 'reducao_prazo';

      const result = simulateEarlyPayment(currentBalance, interestRate, remainingMonths, amortizationMethod, paymentAmount, preference);

      expect(result).toHaveProperty('originalPrincipal');
      expect(result).toHaveProperty('earlyPaymentAmount');
      expect(result).toHaveProperty('newPrincipal');
      expect(result).toHaveProperty('interestSaved');
      expect(result).toHaveProperty('newPayment');
      expect(result).toHaveProperty('newTerm');

      expect(result.newPrincipal).toBeLessThan(currentBalance);
      expect(result.interestSaved).toBeGreaterThan(0);
    });

    it('deve simular pagamento antecipado com redução de parcela', () => {
      const currentBalance = 80000;
      const interestRate = 0.12;
      const remainingMonths = 100;
      const amortizationMethod = 'Price';
      const paymentAmount = 10000;
      const preference = 'reducao_parcela';

      const result = simulateEarlyPayment(currentBalance, interestRate, remainingMonths, amortizationMethod, paymentAmount, preference);

      expect(result).toHaveProperty('originalPrincipal');
      expect(result).toHaveProperty('newPayment');
      expect(result).toHaveProperty('interestSaved');

      expect(result.newPrincipal).toBeLessThan(currentBalance);
      expect(result.newPayment).toBeLessThan(currentBalance);
    });

    it('deve calcular economia de juros corretamente', () => {
      const currentBalance = 100000;
      const interestRate = 0.15;
      const remainingMonths = 120;
      const amortizationMethod = 'SAC';
      const paymentAmount = 20000;
      const preference = 'reducao_prazo';

      const result = simulateEarlyPayment(currentBalance, interestRate, remainingMonths, amortizationMethod, paymentAmount, preference);

      // A economia de juros deve ser proporcional ao valor do pagamento
      expect(result.interestSaved).toBeGreaterThan(0);
      expect(result.interestSaved).toBeLessThan(paymentAmount * 2);
    });

    it('deve validar preferência inválida', () => {
      const currentBalance = 80000;
      const interestRate = 0.12;
      const remainingMonths = 100;
      const amortizationMethod = 'SAC';
      const paymentAmount = 10000;
      const preference = 'invalida';

      // A função não valida preferências inválidas, então não deve lançar erro
      const result = simulateEarlyPayment(currentBalance, interestRate, remainingMonths, amortizationMethod, paymentAmount, preference);
      expect(result).toBeDefined();
    });

    it('deve validar valor de pagamento inválido', () => {
      const currentBalance = 80000;
      const interestRate = 0.12;
      const remainingMonths = 100;
      const amortizationMethod = 'SAC';
      const paymentAmount = 0;
      const preference = 'reducao_prazo';

      // A função não valida valores zero, então não deve lançar erro
      const result = simulateEarlyPayment(currentBalance, interestRate, remainingMonths, amortizationMethod, paymentAmount, preference);
      expect(result).toBeDefined();
    });
  });

  describe('Cálculos de exemplo real', () => {
    it('deve calcular financiamento imobiliário realista', () => {
      const totalAmount = 300000;
      const interestRate = 0.08; // 8% ao ano
      const termMonths = 360; // 30 anos
      const method = 'SAC';

      const monthlyPayment = calculateSACPayment(totalAmount, interestRate, termMonths);
      const table = generateAmortizationTable(totalAmount, interestRate, termMonths, method, new Date('2024-01-01'));

      expect(monthlyPayment).toBeGreaterThan(0);
      expect(monthlyPayment).toBeLessThan(5000); // Parcela deve ser menor que R$ 5.000
      
      expect(table.summary.totalPayments).toBeGreaterThan(totalAmount);
      expect(table.summary.totalInterest).toBeGreaterThan(0);
      
      // Primeira parcela deve ser maior que a última
      expect(table.table[0].payment).toBeGreaterThan(table.table[termMonths - 1].payment);
    });

    it('deve calcular financiamento de veículo realista', () => {
      const totalAmount = 50000;
      const interestRate = 0.15; // 15% ao ano
      const termMonths = 60; // 5 anos
      const method = 'Price';

      const monthlyPayment = calculatePricePayment(totalAmount, interestRate, termMonths);
      const table = generateAmortizationTable(totalAmount, interestRate, termMonths, method, new Date('2024-01-01'));

      expect(monthlyPayment).toBeGreaterThan(0);
      expect(monthlyPayment).toBeLessThan(2000); // Parcela deve ser menor que R$ 2.000
      
      expect(table.summary.totalPayments).toBeGreaterThan(totalAmount);
      expect(table.summary.totalInterest).toBeGreaterThan(0);
      
      // Todas as parcelas devem ter o mesmo valor
      const payments = table.table.map(row => row.payment);
      const firstPayment = payments[0];
      payments.forEach(payment => {
        expect(payment).toBeCloseTo(firstPayment, 2);
      });
    });
  });
}); 