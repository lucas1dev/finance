/**
 * Utilitários para cálculos de financiamentos
 * Implementa métodos de amortização SAC e Price
 */

/**
 * Calcula a parcela mensal usando o método SAC (Sistema de Amortização Constante)
 * @param {number} principal - Valor principal do financiamento
 * @param {number} interestRate - Taxa de juros mensal (decimal)
 * @param {number} termMonths - Prazo em meses
 * @returns {number} Valor da parcela mensal
 */
function calculateSACPayment(principal, interestRate, termMonths) {
  if (principal <= 0 || interestRate <= 0 || termMonths <= 0) {
    throw new Error('Parâmetros inválidos para cálculo SAC');
  }

  const monthlyInterestRate = interestRate / 12;
  const amortization = principal / termMonths;
  const firstPaymentInterest = principal * monthlyInterestRate;
  const firstPayment = amortization + firstPaymentInterest;

  return firstPayment;
}

/**
 * Calcula a parcela mensal usando o método Price (Sistema Francês)
 * @param {number} principal - Valor principal do financiamento
 * @param {number} interestRate - Taxa de juros mensal (decimal)
 * @param {number} termMonths - Prazo em meses
 * @returns {number} Valor da parcela mensal
 */
function calculatePricePayment(principal, interestRate, termMonths) {
  if (principal <= 0 || interestRate <= 0 || termMonths <= 0) {
    throw new Error('Parâmetros inválidos para cálculo Price');
  }

  const monthlyInterestRate = interestRate / 12;
  
  if (monthlyInterestRate === 0) {
    return principal / termMonths;
  }

  const payment = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, termMonths)) / 
                  (Math.pow(1 + monthlyInterestRate, termMonths) - 1);

  return payment;
}

/**
 * Gera a tabela de amortização completa
 * @param {number} principal - Valor principal do financiamento
 * @param {number} interestRate - Taxa de juros anual (decimal)
 * @param {number} termMonths - Prazo em meses
 * @param {string} method - Método de amortização ('SAC' ou 'Price')
 * @param {Date} startDate - Data de início do financiamento
 * @returns {Array} Array com a tabela de amortização
 */
function generateAmortizationTable(principal, interestRate, termMonths, method, startDate) {
  if (principal <= 0 || interestRate <= 0 || termMonths <= 0) {
    throw new Error('Parâmetros inválidos para geração da tabela');
  }

  const monthlyInterestRate = interestRate / 12;
  const table = [];
  let remainingBalance = principal;
  let totalInterest = 0;
  let totalAmortization = 0;

  for (let month = 1; month <= termMonths; month++) {
    const installmentDate = new Date(startDate);
    installmentDate.setMonth(installmentDate.getMonth() + month - 1);

    let payment, amortization, interest;

    if (method === 'SAC') {
      amortization = principal / termMonths;
      interest = remainingBalance * monthlyInterestRate;
      payment = amortization + interest;
    } else if (method === 'Price') {
      payment = calculatePricePayment(principal, interestRate, termMonths);
      interest = remainingBalance * monthlyInterestRate;
      amortization = payment - interest;
    } else {
      throw new Error('Método de amortização inválido');
    }

    // Ajusta a última parcela para garantir que o saldo seja zero
    if (month === termMonths) {
      amortization = remainingBalance;
      payment = amortization + interest;
    }

    remainingBalance -= amortization;
    totalInterest += interest;
    totalAmortization += amortization;

    table.push({
      installment: month,
      dueDate: installmentDate.toISOString().split('T')[0],
      payment: parseFloat(payment.toFixed(2)),
      amortization: parseFloat(amortization.toFixed(2)),
      interest: parseFloat(interest.toFixed(2)),
      remainingBalance: parseFloat(Math.max(0, remainingBalance).toFixed(2))
    });
  }

  return {
    table,
    summary: {
      totalPayments: parseFloat((totalAmortization + totalInterest).toFixed(2)),
      totalAmortization: parseFloat(totalAmortization.toFixed(2)),
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      principal: parseFloat(principal.toFixed(2))
    }
  };
}

/**
 * Calcula o saldo devedor atualizado após pagamentos
 * @param {number} principal - Valor principal original
 * @param {number} interestRate - Taxa de juros anual (decimal)
 * @param {number} termMonths - Prazo original em meses
 * @param {string} method - Método de amortização
 * @param {Date} startDate - Data de início
 * @param {Array} payments - Array de pagamentos realizados
 * @returns {Object} Saldo atualizado e estatísticas
 */
function calculateUpdatedBalance(principal, interestRate, termMonths, method, startDate, payments) {
  const amortizationTable = generateAmortizationTable(principal, interestRate, termMonths, method, startDate);
  const table = amortizationTable.table;
  
  let totalPaid = 0;
  let totalInterestPaid = 0;
  let paidInstallments = 0;
  let currentBalance = principal;

  // Processa os pagamentos realizados
  payments.forEach(payment => {
    const installment = table.find(row => row.installment === payment.installment_number);
    if (installment) {
      totalPaid += payment.payment_amount;
      totalInterestPaid += payment.interest_amount;
      paidInstallments++;
      currentBalance -= payment.principal_amount;
    }
  });

  // Calcula o saldo restante baseado na tabela de amortização
  const remainingInstallments = table.filter(row => 
    !payments.some(payment => payment.installment_number === row.installment)
  );

  const remainingBalance = remainingInstallments.reduce((sum, row) => sum + row.amortization, 0);

  return {
    currentBalance: parseFloat(Math.max(0, remainingBalance).toFixed(2)),
    totalPaid: parseFloat(totalPaid.toFixed(2)),
    totalInterestPaid: parseFloat(totalInterestPaid.toFixed(2)),
    paidInstallments,
    remainingInstallments: termMonths - paidInstallments,
    percentagePaid: parseFloat(((totalPaid / (principal + amortizationTable.summary.totalInterest)) * 100).toFixed(2))
  };
}

/**
 * Simula o impacto de um pagamento antecipado
 * @param {number} principal - Valor principal atual
 * @param {number} interestRate - Taxa de juros anual (decimal)
 * @param {number} remainingMonths - Meses restantes
 * @param {string} method - Método de amortização
 * @param {number} earlyPaymentAmount - Valor do pagamento antecipado
 * @param {string} preference - Preferência ('reducao_prazo' ou 'reducao_parcela')
 * @returns {Object} Resultado da simulação
 */
function simulateEarlyPayment(principal, interestRate, remainingMonths, method, earlyPaymentAmount, preference) {
  if (earlyPaymentAmount >= principal) {
    throw new Error('Pagamento antecipado não pode ser maior ou igual ao saldo devedor');
  }

  const newPrincipal = principal - earlyPaymentAmount;
  const monthlyInterestRate = interestRate / 12;

  let result = {
    originalPrincipal: parseFloat(principal.toFixed(2)),
    earlyPaymentAmount: parseFloat(earlyPaymentAmount.toFixed(2)),
    newPrincipal: parseFloat(newPrincipal.toFixed(2)),
    interestSaved: 0,
    newPayment: 0,
    newTerm: remainingMonths
  };

  if (preference === 'reducao_prazo') {
    // Mantém a parcela original, reduz o prazo
    const originalPayment = method === 'SAC' 
      ? calculateSACPayment(principal, interestRate, remainingMonths)
      : calculatePricePayment(principal, interestRate, remainingMonths);

    // Calcula o novo prazo
    if (method === 'SAC') {
      const amortization = newPrincipal / remainingMonths;
      const interest = newPrincipal * monthlyInterestRate;
      const newPayment = amortization + interest;
      result.newPayment = parseFloat(newPayment.toFixed(2));
    } else {
      // Para Price, calcula o novo prazo
      const newTerm = Math.log(originalPayment / (originalPayment - newPrincipal * monthlyInterestRate)) / 
                      Math.log(1 + monthlyInterestRate);
      result.newTerm = Math.ceil(newTerm);
      result.newPayment = parseFloat(originalPayment.toFixed(2));
    }
  } else if (preference === 'reducao_parcela') {
    // Mantém o prazo original, reduz a parcela
    result.newPayment = method === 'SAC'
      ? calculateSACPayment(newPrincipal, interestRate, remainingMonths)
      : calculatePricePayment(newPrincipal, interestRate, remainingMonths);
  }

  // Calcula economia de juros
  const originalTotalInterest = (method === 'SAC' 
    ? calculateSACPayment(principal, interestRate, remainingMonths) * remainingMonths - principal
    : calculatePricePayment(principal, interestRate, remainingMonths) * remainingMonths - principal);

  const newTotalInterest = (method === 'SAC'
    ? result.newPayment * result.newTerm - newPrincipal
    : result.newPayment * result.newTerm - newPrincipal);

  result.interestSaved = parseFloat((originalTotalInterest - newTotalInterest).toFixed(2));

  return result;
}

module.exports = {
  calculateSACPayment,
  calculatePricePayment,
  generateAmortizationTable,
  calculateUpdatedBalance,
  simulateEarlyPayment
}; 