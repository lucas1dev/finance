/**
 * Valida se um email é válido.
 * @param {string} email - Email a ser validado.
 * @returns {boolean} true se o email for válido, false caso contrário.
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida se uma senha é válida.
 * @param {string} password - Senha a ser validada.
 * @returns {boolean} true se a senha for válida, false caso contrário.
 */
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Valida se um CPF é válido.
 * @param {string} cpf - CPF a ser validado.
 * @returns {boolean} true se o CPF for válido, false caso contrário.
 */
const isValidCPF = (cpf) => {
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

/**
 * Valida se um CNPJ é válido.
 * @param {string} cnpj - CNPJ a ser validado.
 * @returns {boolean} true se o CNPJ for válido, false caso contrário.
 */
const isValidCNPJ = (cnpj) => {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Validação do primeiro dígito verificador
  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  let digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Validação do segundo dígito verificador
  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

/**
 * Valida se um telefone é válido.
 * @param {string} phone - Telefone a ser validado.
 * @returns {boolean} true se o telefone for válido, false caso contrário.
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  return phoneRegex.test(phone);
};

/**
 * Valida se uma data é válida.
 * @param {string} date - Data a ser validada (formato YYYY-MM-DD).
 * @returns {boolean} true se a data for válida, false caso contrário.
 */
const isValidDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  return dateObj.getFullYear() === year &&
         dateObj.getMonth() === month - 1 &&
         dateObj.getDate() === day;
};

/**
 * Valida se um valor monetário é válido.
 * @param {string|number} amount - Valor a ser validado.
 * @returns {boolean} true se o valor for válido, false caso contrário.
 */
const isValidAmount = (amount) => {
  if (typeof amount === 'number') return amount >= 0;
  if (typeof amount === 'string') {
    const parsedAmount = parseFloat(amount);
    return !isNaN(parsedAmount) && parsedAmount >= 0;
  }
  return false;
};

/**
 * Valida se um documento (CPF ou CNPJ) é válido.
 * @param {string} document - Documento a ser validado.
 * @returns {boolean} true se o documento for válido, false caso contrário.
 */
const isValidDocument = (document) => {
  const cleanDocument = document.replace(/[^\d]/g, '');
  return cleanDocument.length === 11 ? isValidCPF(document) : isValidCNPJ(document);
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidCPF,
  isValidCNPJ,
  isValidPhone,
  isValidDate,
  isValidAmount,
  isValidDocument
}; 