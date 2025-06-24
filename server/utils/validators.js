const { z } = require('zod');

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

// Esquemas de validação Zod para endpoints

/**
 * Esquema de validação para registro de usuário.
 */
const registerUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

/**
 * Esquema de validação para login de usuário.
 */
const loginUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

/**
 * Esquema de validação para atualização de perfil.
 */
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo').optional(),
  email: z.string().email('Email inválido').optional()
});

/**
 * Esquema de validação para atualização de senha.
 */
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres')
});

/**
 * Esquema de validação para recuperação de senha.
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
});

/**
 * Esquema de validação para reset de senha.
 */
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres')
});

/**
 * Esquema de validação para criação de transação.
 */
const createTransactionSchema = z.object({
  account_id: z.number().int().positive('ID da conta deve ser um número positivo'),
  category_id: z.number().int().positive('ID da categoria deve ser um número positivo').optional(),
  type: z.enum(['income', 'expense'], { errorMap: () => ({ message: 'Tipo deve ser income ou expense' }) }),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória').max(255, 'Descrição muito longa'),
  date: z.string().optional().or(z.date().optional())
});

/**
 * Esquema de validação para atualização de transação.
 */
const updateTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], { errorMap: () => ({ message: 'Tipo deve ser income ou expense' }) }).optional(),
  amount: z.number().positive('Valor deve ser positivo').optional(),
  category_id: z.number().int().positive('ID da categoria deve ser um número positivo').optional(),
  description: z.string().min(1, 'Descrição é obrigatória').max(255, 'Descrição muito longa').optional(),
  date: z.string().optional().or(z.date().optional())
});

/**
 * Esquema de validação para criação de conta.
 */
const createAccountSchema = z.object({
  bank_name: z.string().min(1, 'Nome do banco é obrigatório').max(100, 'Nome do banco muito longo'),
  account_type: z.enum(['checking', 'savings', 'investment'], { 
    errorMap: () => ({ message: 'Tipo de conta deve ser checking, savings ou investment' }) 
  }),
  balance: z.number().min(0, 'Saldo não pode ser negativo'),
  description: z.string().max(255, 'Descrição muito longa').optional()
});

/**
 * Esquema de validação para atualização de conta.
 */
const updateAccountSchema = z.object({
  bank_name: z.string().min(1, 'Nome do banco é obrigatório').max(100, 'Nome do banco muito longo').optional(),
  account_type: z.enum(['checking', 'savings', 'investment'], { 
    errorMap: () => ({ message: 'Tipo de conta deve ser checking, savings ou investment' }) 
  }).optional(),
  balance: z.number().min(0, 'Saldo não pode ser negativo').optional(),
  description: z.string().max(255, 'Descrição muito longa').optional()
});

/**
 * Esquema de validação para criação de categoria.
 */
const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo'),
  type: z.enum(['income', 'expense'], { errorMap: () => ({ message: 'Tipo deve ser income ou expense' }) }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um código hexadecimal válido (ex: #FF5722)').optional()
});

/**
 * Esquema de validação para atualização de categoria.
 */
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo').optional(),
  type: z.enum(['income', 'expense'], { errorMap: () => ({ message: 'Tipo deve ser income ou expense' }) }).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um código hexadecimal válido (ex: #FF5722)').optional()
});

/**
 * Esquema de validação para criação de cliente.
 */
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  documentType: z.enum(['CPF', 'CNPJ'], { errorMap: () => ({ message: 'Tipo de documento deve ser CPF ou CNPJ' }) }),
  document: z.string().min(1, 'Número do documento é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal(''))
});

/**
 * Esquema de validação para atualização de cliente.
 */
const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  documentType: z.enum(['CPF', 'CNPJ'], { errorMap: () => ({ message: 'Tipo de documento deve ser CPF ou CNPJ' }) }).optional(),
  document: z.string().min(1, 'Número do documento é obrigatório').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal(''))
});

/**
 * Esquema de validação para criação de fornecedor.
 */
const createSupplierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  document_type: z.enum(['CPF', 'CNPJ'], { errorMap: () => ({ message: 'Tipo de documento deve ser CPF ou CNPJ' }) }),
  document_number: z.string().min(1, 'Número do documento é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().max(255, 'Endereço muito longo').optional().or(z.literal(''))
});

/**
 * Esquema de validação para atualização de fornecedor.
 */
const updateSupplierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  document_type: z.enum(['CPF', 'CNPJ'], { errorMap: () => ({ message: 'Tipo de documento deve ser CPF ou CNPJ' }) }).optional(),
  document_number: z.string().min(1, 'Número do documento é obrigatório').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().max(255, 'Endereço muito longo').optional().or(z.literal(''))
});

/**
 * Esquema de validação para criação de pagamento de recebível.
 */
const createReceivablePaymentSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  payment_date: z.string().min(1, 'Data do pagamento é obrigatória'),
  payment_method: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' })
  }),
  account_id: z.number().int().positive('ID da conta deve ser um número positivo'),
  description: z.string().max(255, 'Descrição muito longa').optional().or(z.literal(''))
});

/**
 * Esquema de validação para criação de pagamento.
 */
const createPaymentSchema = z.object({
  receivable_id: z.number().int().positive('ID do recebível deve ser um número positivo').optional(),
  payable_id: z.number().int().positive('ID do pagável deve ser um número positivo').optional(),
  amount: z.number().positive('Valor deve ser positivo'),
  payment_date: z.string().optional(),
  payment_method: z.string().min(1, 'Método de pagamento é obrigatório'),
  description: z.string().max(255, 'Descrição muito longa').optional().or(z.literal(''))
});

/**
 * Esquema de validação para criação de conta a receber.
 */
const createReceivableSchema = z.object({
  customer_id: z.number().int().positive('ID do cliente deve ser um número positivo'),
  category_id: z.number().int().positive('ID da categoria deve ser um número positivo').optional().nullable(),
  amount: z.number().positive('Valor deve ser positivo'),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória').optional().or(z.literal('')),
  description: z.string().min(1, 'Descrição é obrigatória').max(255, 'Descrição muito longa'),
  invoice_number: z.string().max(100, 'Número da nota fiscal muito longo').optional().or(z.literal('')),
  payment_terms: z.string().max(255, 'Termos de pagamento muito longos').optional().or(z.literal('')),
  notes: z.string().max(500, 'Observações muito longas').optional().or(z.literal(''))
});

/**
 * Esquema de validação para atualização de conta a receber.
 */
const updateReceivableSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(255, 'Descrição muito longa').optional(),
  amount: z.number().positive('Valor deve ser positivo').optional(),
  due_date: z.string().optional(),
  category_id: z.number().int().positive('ID da categoria deve ser um número positivo').optional(),
  notes: z.string().max(500, 'Observações muito longas').optional().or(z.literal(''))
});

/**
 * Esquema de validação para criação de conta a pagar.
 */
const createPayableSchema = z.object({
  supplier_id: z.number().int().positive('ID do fornecedor deve ser um número positivo'),
  category_id: z.number().int().positive('ID da categoria deve ser um número positivo').optional(),
  description: z.string().min(1, 'Descrição é obrigatória').max(255, 'Descrição muito longa'),
  amount: z.number().positive('Valor deve ser positivo'),
  due_date: z.string().optional(),
  notes: z.string().max(500, 'Observações muito longas').optional().or(z.literal(''))
});

/**
 * Esquema de validação para atualização de conta a pagar.
 */
const updatePayableSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(255, 'Descrição muito longa').optional(),
  amount: z.number().positive('Valor deve ser positivo').optional(),
  due_date: z.string().optional(),
  category_id: z.number().int().positive('ID da categoria deve ser um número positivo').optional(),
  notes: z.string().max(500, 'Observações muito longas').optional().or(z.literal(''))
});

/**
 * Esquema de validação para adição de pagamento a conta a pagar.
 */
const addPaymentSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  payment_date: z.string().min(1, 'Data do pagamento é obrigatória'),
  payment_method: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer'], {
    errorMap: () => ({ message: 'Método de pagamento deve ser cash, credit_card, debit_card, pix ou bank_transfer' })
  }),
  account_id: z.number().int().positive('ID da conta bancária deve ser um número positivo'),
  notes: z.string().max(500, 'Observações muito longas').optional().or(z.literal(''))
});

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidCPF,
  isValidCNPJ,
  isValidPhone,
  isValidDate,
  isValidAmount,
  isValidDocument,
  // Esquemas Zod
  registerUserSchema,
  loginUserSchema,
  updateProfileSchema,
  updatePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createTransactionSchema,
  updateTransactionSchema,
  createAccountSchema,
  updateAccountSchema,
  createCategorySchema,
  updateCategorySchema,
  createCustomerSchema,
  updateCustomerSchema,
  createSupplierSchema,
  updateSupplierSchema,
  createReceivablePaymentSchema,
  createReceivableSchema,
  updateReceivableSchema,
  createPayableSchema,
  updatePayableSchema,
  addPaymentSchema
}; 