/**
 * Esquemas de validação para Creditor (Credor)
 * Utiliza Zod para validação de dados de entrada
 */
const { z } = require('zod');

/**
 * Esquema para validação de CPF brasileiro
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean} - true se válido, false caso contrário
 */
function validateCPF(cpf) {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

/**
 * Esquema para validação de CNPJ brasileiro
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {boolean} - true se válido, false caso contrário
 */
function validateCNPJ(cnpj) {
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  // Verifica se tem 14 dígitos
  if (cnpj.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  const weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weights[i];
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cnpj.charAt(12))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cnpj.charAt(13))) return false;
  
  return true;
}

/**
 * Esquema para validação de documento (CPF ou CNPJ)
 */
const documentSchema = z.string()
  .min(1, 'Documento é obrigatório')
  .refine((doc) => {
    const cleanDoc = doc.replace(/[^\d]/g, '');
    if (cleanDoc.length === 11) {
      return validateCPF(doc);
    } else if (cleanDoc.length === 14) {
      return validateCNPJ(doc);
    }
    return false;
  }, 'CPF ou CNPJ inválido');

/**
 * Esquema para criação de credor
 */
const createCreditorSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .trim(),
  document_type: z.enum(['CPF', 'CNPJ'], {
    errorMap: () => ({ message: 'Tipo de documento deve ser CPF ou CNPJ' })
  }),
  document_number: documentSchema,
  address: z.string()
    .min(1, 'Endereço é obrigatório')
    .trim(),
  phone: z.string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional()
    .nullable(),
  email: z.string()
    .email('Email inválido')
    .optional()
    .nullable(),
  observations: z.string()
    .optional()
    .nullable()
});

/**
 * Esquema para atualização de credor
 */
const updateCreditorSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .trim()
    .optional(),
  document_type: z.enum(['CPF', 'CNPJ'], {
    errorMap: () => ({ message: 'Tipo de documento deve ser CPF ou CNPJ' })
  }).optional(),
  document_number: documentSchema.optional(),
  address: z.string()
    .min(1, 'Endereço é obrigatório')
    .trim()
    .optional(),
  phone: z.string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional()
    .nullable(),
  email: z.string()
    .email('Email inválido')
    .optional()
    .nullable(),
  status: z.enum(['ativo', 'inativo'], {
    errorMap: () => ({ message: 'Status deve ser ativo ou inativo' })
  }).optional(),
  observations: z.string()
    .optional()
    .nullable()
});

/**
 * Esquema para listagem de credores com filtros
 */
const listCreditorsSchema = z.object({
  name: z.string().optional(),
  document_type: z.enum(['CPF', 'CNPJ']).optional(),
  status: z.enum(['ativo', 'inativo']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

module.exports = {
  createCreditorSchema,
  updateCreditorSchema,
  listCreditorsSchema,
  validateCPF,
  validateCNPJ
}; 