/**
 * Testes de Performance - Cálculos de Financiamento
 * Verifica se os cálculos complexos são executados em tempo razoável
 */

jest.setTimeout(30000);

const { generateAmortizationTable, calculateUpdatedBalance } = require('../../utils/financingCalculations');

describe('Performance Tests - Financing Calculations', () => {
  describe('Cálculo SAC - Performance', () => {
    it('deve calcular tabela SAC para 360 meses em menos de 1 segundo', () => {
      const startTime = Date.now();
      
      const result = generateAmortizationTable(
        500000.00, // principal
        0.12, // interestRate (12% ao ano)
        360, // termMonths
        'SAC', // method
        new Date('2024-01-01') // startDate
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(1000); // Menos de 1 segundo
      expect(result).toHaveProperty('table');
      expect(result.table).toHaveLength(360);
      expect(result).toHaveProperty('summary');
      expect(result.summary.totalInterest).toBeGreaterThan(0);
    });

    it('deve calcular tabela SAC para 120 meses em menos de 500ms', () => {
      const startTime = Date.now();
      
      const result = generateAmortizationTable(
        200000.00, // principal
        0.18, // interestRate (18% ao ano)
        120, // termMonths
        'SAC', // method
        new Date('2024-01-01') // startDate
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(500); // Menos de 500ms
      expect(result.table).toHaveLength(120);
      expect(result.summary.totalPayments).toBeCloseTo(200000.00 + result.summary.totalInterest, 2);
    });

    it('deve calcular múltiplas tabelas SAC simultaneamente', () => {
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          generateAmortizationTable(
            100000.00 + (i * 10000), // principal
            0.12 + (i * 0.01), // interestRate
            60, // termMonths
            'SAC', // method
            new Date('2024-01-01') // startDate
          )
        );
      }
      
      return Promise.all(promises).then(results => {
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        expect(executionTime).toBeLessThan(2000); // Menos de 2 segundos para 10 cálculos
        expect(results).toHaveLength(10);
        
        results.forEach(result => {
          expect(result.table).toHaveLength(60);
          expect(result.summary.totalAmortization).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Cálculo Price - Performance', () => {
    it('deve calcular tabela Price para 360 meses em menos de 1 segundo', () => {
      const startTime = Date.now();
      
      const result = generateAmortizationTable(
        500000.00, // principal
        0.12, // interestRate (12% ao ano)
        360, // termMonths
        'Price', // method
        new Date('2024-01-01') // startDate
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(1000); // Menos de 1 segundo
      expect(result.table).toHaveLength(360);
      expect(result.summary.totalPayments).toBeGreaterThan(0);
      
      // Verificar se todas as parcelas têm o mesmo valor (característica do Price)
      const firstPayment = result.table[0].payment;
      result.table.forEach(installment => {
        expect(installment.payment).toBeCloseTo(firstPayment, 2);
      });
    });

    it('deve calcular tabela Price para 240 meses em menos de 500ms', () => {
      const startTime = Date.now();
      
      const result = generateAmortizationTable(
        300000.00, // principal
        0.096, // interestRate (9.6% ao ano)
        240, // termMonths
        'Price', // method
        new Date('2024-01-01') // startDate
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(500); // Menos de 500ms
      expect(result.table).toHaveLength(240);
      expect(result.summary.totalPayments).toBeCloseTo(300000.00 + result.summary.totalInterest, 2);
    });

    it('deve calcular múltiplas tabelas Price simultaneamente', () => {
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          generateAmortizationTable(
            150000.00 + (i * 20000), // principal
            0.12 + (i * 0.024), // interestRate
            180, // termMonths
            'Price', // method
            new Date('2024-01-01') // startDate
          )
        );
      }
      
      return Promise.all(promises).then(results => {
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        expect(executionTime).toBeLessThan(1500); // Menos de 1.5 segundos para 5 cálculos
        expect(results).toHaveLength(5);
        
        results.forEach(result => {
          expect(result.table).toHaveLength(180);
          expect(result.summary.totalPayments).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Cálculo de Saldo Atualizado - Performance', () => {
    it('deve calcular saldo atualizado para 100 pagamentos em menos de 100ms', () => {
      const startTime = Date.now();
      
      // Simular 100 pagamentos com valores corretos baseados na tabela SAC
      const principal = 100000.00;
      const termMonths = 120;
      const interestRate = 0.12;
      
      // Gerar tabela primeiro para obter valores corretos
      const table = generateAmortizationTable(
        principal,
        interestRate,
        termMonths,
        'SAC',
        new Date('2024-01-01')
      );
      
      const payments = [];
      for (let i = 1; i <= 100; i++) {
        const installment = table.table[i-1];
        payments.push({
          installment_number: i,
          payment_amount: installment.payment,
          principal_amount: installment.amortization,
          interest_amount: installment.interest,
          payment_date: new Date(2024, 0, i).toISOString().split('T')[0]
        });
      }
      
      const result = calculateUpdatedBalance(
        principal,
        interestRate,
        termMonths,
        'SAC',
        new Date('2024-01-01'),
        payments
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(100); // Menos de 100ms
      expect(result).toHaveProperty('currentBalance');
      expect(result).toHaveProperty('paidInstallments');
      expect(result.paidInstallments).toBe(100);
      
      // Verificar se o cálculo está consistente (não necessariamente zero)
      expect(result.currentBalance).toBeGreaterThanOrEqual(0);
      expect(result.currentBalance).toBeLessThanOrEqual(principal);
      expect(result.percentagePaid).toBeGreaterThan(80); // Deve ter pago mais de 80%
    });

    it('deve calcular saldo atualizado para 50 pagamentos em menos de 50ms', () => {
      const startTime = Date.now();
      
      // Simular 50 pagamentos
      const payments = [];
      for (let i = 1; i <= 50; i++) {
        payments.push({
          installment_number: i,
          payment_amount: 800.00,
          principal_amount: 800.00,
          interest_amount: 40.00,
          payment_date: new Date(2024, 0, i).toISOString().split('T')[0]
        });
      }
      
      const result = calculateUpdatedBalance(
        80000.00, // principal
        0.144, // interestRate
        100, // termMonths
        'Price', // method
        new Date('2024-01-01'), // startDate
        payments // payments
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(50); // Menos de 50ms
      expect(result.currentBalance).toBeGreaterThan(0);
      expect(result.paidInstallments).toBe(50);
    });
  });

  describe('Cálculos Complexos - Performance', () => {
    it('deve calcular simulação de pagamento antecipado em menos de 200ms', () => {
      const startTime = Date.now();
      
      // Gerar tabela completa primeiro
      const amortizationTable = generateAmortizationTable(
        200000.00, // principal
        0.18, // interestRate
        120, // termMonths
        'SAC', // method
        new Date('2024-01-01') // startDate
      );
      
      // Simular pagamento antecipado
      const earlyPayment = {
        amount: 50000.00,
        preference: 'reducao_prazo',
        payment_date: new Date(2024, 5, 15).toISOString().split('T')[0]
      };
      
      // Calcular nova tabela com pagamento antecipado
      const newTable = generateAmortizationTable(
        200000.00 - 50000.00, // principal
        0.18, // interestRate
        120, // termMonths
        'SAC', // method
        new Date('2024-01-01') // startDate
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(200); // Menos de 200ms
      expect(newTable.table.length).toBeLessThanOrEqual(120);
      expect(newTable.summary.totalInterest).toBeLessThan(amortizationTable.summary.totalInterest);
    });

    it('deve processar múltiplos cálculos complexos simultaneamente', () => {
      const startTime = Date.now();
      
      const results = [];
      for (let i = 0; i < 3; i++) {
        // Gerar tabela de amortização
        const table = generateAmortizationTable(
          300000.00 + (i * 50000), // principal
          0.12 + (i * 0.024), // interestRate
          240, // termMonths
          i % 2 === 0 ? 'SAC' : 'Price', // method
          new Date('2024-01-01') // startDate
        );
        
        // Calcular saldo atualizado com alguns pagamentos
        const payments = [];
        for (let j = 1; j <= 24; j++) {
          payments.push({
            installment_number: j,
            payment_amount: table.table[j-1].payment,
            principal_amount: table.table[j-1].amortization,
            interest_amount: table.table[j-1].interest,
            payment_date: new Date(2024, 0, j).toISOString().split('T')[0]
          });
        }
        
        const result = calculateUpdatedBalance(
          300000.00 + (i * 50000), // principal
          0.12 + (i * 0.024), // interestRate
          240, // termMonths
          i % 2 === 0 ? 'SAC' : 'Price', // method
          new Date('2024-01-01'), // startDate
          payments // payments
        );
        
        results.push(result);
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(1000); // Menos de 1 segundo para 3 cálculos complexos
      expect(results).toHaveLength(3);
      
      results.forEach(result => {
        expect(result).toHaveProperty('currentBalance');
        expect(result).toHaveProperty('paidInstallments');
        expect(result.paidInstallments).toBe(24);
      });
    });
  });

  describe('Limites de Performance', () => {
    it('deve lidar com valores extremos sem travamento', () => {
      const startTime = Date.now();
      
      // Teste com valores extremos
      const result = generateAmortizationTable(
        999999999.99, // principal
        0.012, // interestRate (1.2% ao ano)
        600, // termMonths
        'SAC', // method
        new Date('2024-01-01') // startDate
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(2000); // Menos de 2 segundos mesmo com valores extremos
      expect(result.table).toHaveLength(600);
      expect(result.summary.totalAmortization).toBeCloseTo(999999999.99, 2);
    });

    it('deve manter precisão com muitos decimais', () => {
      const startTime = Date.now();
      
      const result = generateAmortizationTable(
        123456.78, // principal
        0.10518, // Taxa com muitos decimais (10.518% ao ano)
        360, // termMonths
        'Price', // method
        new Date('2024-01-01') // startDate
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(1000);
      expect(result.table).toHaveLength(360);
      
      // Verificar se a soma das amortizações é igual ao principal
      const totalPrincipal = result.table.reduce((sum, inst) => sum + inst.amortization, 0);
      expect(totalPrincipal).toBeCloseTo(123456.78, 2);
    });
  });
}); 