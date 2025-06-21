/**
 * Esquemas de validação para Financing (Financiamento)
 * Utiliza Zod para validação de dados de entrada
 */
const { z } = require('zod');

/**
 * Esquema para validação de data futura ou presente
 */
const dateSchema = z.string()
  .refine((date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
  }, 'Data deve ser hoje ou uma data futura');

/**
 * Esquema para criação de financiamento
 */
const createFinancingSchema = z.object({
  creditor_id: z.number()
    .int()
    .positive('ID do credor deve ser um número positivo'),
  financing_type: z.enum(['hipoteca', 'emprestimo_pessoal', 'financiamento_veiculo', 'outros'], {
    errorMap: () => ({ message: 'Tipo de financiamento inválido' })
  }),
  total_amount: z.number()
    .positive('Valor total deve ser positivo')
    .max(999999999999.99, 'Valor total muito alto'),
  interest_rate: z.number()
    .positive('Taxa de juros deve ser positiva')
    .max(1, 'Taxa de juros deve ser menor que 100%')
    .min(0.0001, 'Taxa de juros deve ser maior que 0'),
  term_months: z.number()
    .int()
    .positive('Prazo deve ser um número inteiro positivo')
    .max(600, 'Prazo máximo é de 50 anos (600 meses)'),
  start_date: dateSchema,
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .trim(),
  contract_number: z.string()
    .max(100, 'Número do contrato deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),
  payment_method: z.enum(['boleto', 'debito_automatico', 'cartao'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' })
  }).optional()
    .nullable(),
  amortization_method: z.enum(['SAC', 'Price'], {
    errorMap: () => ({ message: 'Método de amortização deve ser SAC ou Price' })
  }).default('SAC'),
  observations: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .nullable()
});

/**
 * Esquema para atualização de financiamento
 */
const updateFinancingSchema = z.object({
  creditor_id: z.number()
    .int()
    .positive('ID do credor deve ser um número positivo')
    .optional(),
  financing_type: z.enum(['hipoteca', 'emprestimo_pessoal', 'financiamento_veiculo', 'outros'], {
    errorMap: () => ({ message: 'Tipo de financiamento inválido' })
  }).optional(),
  total_amount: z.number()
    .positive('Valor total deve ser positivo')
    .max(999999999999.99, 'Valor total muito alto')
    .optional(),
  interest_rate: z.number()
    .positive('Taxa de juros deve ser positiva')
    .max(1, 'Taxa de juros deve ser menor que 100%')
    .min(0.0001, 'Taxa de juros deve ser maior que 0')
    .optional(),
  term_months: z.number()
    .int()
    .positive('Prazo deve ser um número inteiro positivo')
    .max(600, 'Prazo máximo é de 50 anos (600 meses)')
    .optional(),
  start_date: dateSchema.optional(),
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .trim()
    .optional(),
  contract_number: z.string()
    .max(100, 'Número do contrato deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),
  payment_method: z.enum(['boleto', 'debito_automatico', 'cartao'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' })
  }).optional()
    .nullable(),
  amortization_method: z.enum(['SAC', 'Price'], {
    errorMap: () => ({ message: 'Método de amortização deve ser SAC ou Price' })
  }).optional(),
  status: z.enum(['ativo', 'quitado', 'inadimplente', 'cancelado'], {
    errorMap: () => ({ message: 'Status inválido' })
  }).optional(),
  observations: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .nullable()
});

/**
 * Esquema para listagem de financiamentos com filtros
 */
const listFinancingsSchema = z.object({
  financing_type: z.enum(['hipoteca', 'emprestimo_pessoal', 'financiamento_veiculo', 'outros']).optional(),
  creditor_id: z.number().int().positive().optional(),
  status: z.enum(['ativo', 'quitado', 'inadimplente', 'cancelado']).optional(),
  amortization_method: z.enum(['SAC', 'Price']).optional(),
  start_date_from: z.string().optional(),
  start_date_to: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
});

/**
 * Esquema para simulação de pagamento antecipado
 */
const simulateEarlyPaymentSchema = z.object({
  payment_amount: z.number()
    .positive('Valor do pagamento deve ser positivo')
    .max(999999999999.99, 'Valor do pagamento muito alto'),
  preference: z.enum(['reducao_prazo', 'reducao_parcela'], {
    errorMap: () => ({ message: 'Preferência deve ser redução de prazo ou redução de parcela' })
  })
});

/**
 * Esquema para cálculo de tabela de amortização
 */
const amortizationTableSchema = z.object({
  include_payments: z.boolean().default(false)
});

module.exports = {
  createFinancingSchema,
  updateFinancingSchema,
  listFinancingsSchema,
  simulateEarlyPaymentSchema,
  amortizationTableSchema
}; 