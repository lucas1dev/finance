/**
 * Formata um valor monetário para o formato brasileiro.
 * @param {number|string} amount - Valor a ser formatado.
 * @returns {string} Valor formatado (ex: R$ 1.234,56).
 */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'R$ 0,00';
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value).replace(/\u00A0/g, ' '); // Remove o espaço não-quebrável
};

/**
 * Formata uma data para o formato brasileiro.
 * @param {string|Date} date - Data a ser formatada.
 * @returns {string} Data formatada (ex: 01/01/2024).
 */
const formatDate = (date) => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    if (isNaN(dateObj.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC'
    }).format(dateObj);
  } catch (error) {
    return '';
  }
};

/**
 * Formata um documento (CPF ou CNPJ).
 * @param {string} document - Documento a ser formatado.
 * @returns {string} Documento formatado.
 */
const formatDocument = (document) => {
  if (!document) return '';
  const cleanDoc = document.replace(/\D/g, '');
  if (cleanDoc.length === 11) {
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (cleanDoc.length === 14) {
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return cleanDoc;
};

/**
 * Formata um número de telefone.
 * @param {string} phone - Telefone a ser formatado.
 * @returns {string} Telefone formatado.
 */
const formatPhone = (phone) => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return cleanPhone;
};

/**
 * Calcula a data de vencimento baseada em uma data e número de dias.
 * @param {string|Date} date - Data base.
 * @param {number} days - Número de dias para adicionar.
 * @returns {string} Data de vencimento no formato YYYY-MM-DD.
 */
const calculateDueDate = (date, days) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dueDate = new Date(dateObj);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate.toISOString().split('T')[0];
};

/**
 * Calcula o valor dos juros.
 * @param {number} amount - Valor principal.
 * @param {number} rate - Taxa de juros (em decimal).
 * @param {number} days - Número de dias.
 * @returns {number} Valor dos juros.
 */
const calculateInterest = (amount, rate, days) => {
  if (!amount || !rate || !days) return 0;
  return amount * rate * (days / 30);
};

/**
 * Calcula o valor total (principal + juros).
 * @param {number} amount - Valor principal.
 * @param {number} interest - Valor dos juros.
 * @returns {number} Valor total.
 */
const calculateTotalAmount = (amount, interest) => {
  if (!amount) return 0;
  return amount + (interest || 0);
};

/**
 * Gera parcelas para um valor.
 * @param {number} amount - Valor total.
 * @param {number} installments - Número de parcelas.
 * @param {string} baseDate - Data base para as parcelas.
 * @returns {Array<{number: number, amount: number, due_date: string}>} Array de parcelas.
 */
const generateInstallments = (amount, installments, baseDate) => {
  if (!amount || !installments || !baseDate) return [];
  
  const installmentsList = [];
  const installmentAmount = Number((amount / installments).toFixed(2));
  const baseDateObj = new Date(baseDate);

  for (let i = 1; i <= installments; i++) {
    const dueDate = new Date(baseDateObj);
    dueDate.setDate(dueDate.getDate() + (i - 1) * 30); // 30 dias entre cada parcela

    installmentsList.push({
      number: i,
      amount: i === installments ? amount - (installmentAmount * (installments - 1)) : installmentAmount,
      due_date: dueDate.toISOString().split('T')[0]
    });
  }

  return installmentsList;
};

/**
 * Calcula o saldo baseado em uma lista de transações.
 * @param {Array<{type: string, amount: number}>} transactions - Lista de transações.
 * @returns {number} Saldo final.
 */
const calculateBalance = (transactions) => {
  if (!transactions || !Array.isArray(transactions)) return 0;
  return transactions.reduce((balance, transaction) => {
    const amount = parseFloat(transaction.amount) || 0;
    return transaction.type === 'income' ? balance + amount : balance - amount;
  }, 0);
};

/**
 * Gera um token JWT para autenticação de testes.
 * @param {number} userId - ID do usuário.
 * @returns {string} Token JWT.
 */
const jwt = require('jsonwebtoken');
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1h' });
}

module.exports = {
  formatCurrency,
  formatDate,
  formatDocument,
  formatPhone,
  calculateDueDate,
  calculateInterest,
  calculateTotalAmount,
  generateInstallments,
  calculateBalance,
  generateToken
}; 