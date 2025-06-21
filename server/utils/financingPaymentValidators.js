/**
 * Esquemas de validação para FinancingPayment (Pagamento de Financiamento)
 * Utiliza Zod para validação de dados de entrada
 */
const { z } = require('zod');

/**
 * Esquema para validação de data passada ou presente
 */
const paymentDateSchema = z.string()
  .refine((date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return inputDate <= today;
  }, 'Data do pagamento não pode ser futura');

/**
 * Esquema para criação de pagamento de financiamento
 */
const createFinancingPaymentSchema = z.object({
  financing_id: z.number()
    .int()
    .positive('ID do financiamento deve ser um número positivo'),
  account_id: z.number()
    .int()
    .positive('ID da conta deve ser um número positivo'),
  installment_number: z.number()
    .int()
    .positive('Número da parcela deve ser um número inteiro positivo'),
  payment_amount: z.number()
    .positive('Valor do pagamento deve ser positivo')
    .max(999999999999.99, 'Valor do pagamento muito alto'),
  principal_amount: z.number()
    .min(0, 'Valor da amortização deve ser maior ou igual a zero')
    .max(999999999999.99, 'Valor da amortização muito alto'),
  interest_amount: z.number()
    .min(0, 'Valor dos juros deve ser maior ou igual a zero')
    .max(999999999999.99, 'Valor dos juros muito alto'),
  payment_date: paymentDateSchema,
  payment_method: z.enum(['boleto', 'debito_automatico', 'cartao', 'pix', 'transferencia'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' })
  }),
  payment_type: z.enum(['parcela', 'parcial', 'antecipado'], {
    errorMap: () => ({ message: 'Tipo de pagamento inválido' })
  }).default('parcela'),
  balance_before: z.number()
    .min(0, 'Saldo anterior deve ser maior ou igual a zero')
    .max(999999999999.99, 'Saldo anterior muito alto'),
  balance_after: z.number()
    .min(0, 'Saldo posterior deve ser maior ou igual a zero')
    .max(999999999999.99, 'Saldo posterior muito alto'),
  status: z.enum(['pago', 'pendente', 'atrasado', 'cancelado'], {
    errorMap: () => ({ message: 'Status inválido' })
  }).default('pago'),
  observations: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .nullable()
});

/**
 * Esquema para atualização de pagamento de financiamento
 */
const updateFinancingPaymentSchema = z.object({
  account_id: z.number()
    .int()
    .positive('ID da conta deve ser um número positivo')
    .optional(),
  payment_amount: z.number()
    .positive('Valor do pagamento deve ser positivo')
    .max(999999999999.99, 'Valor do pagamento muito alto')
    .optional(),
  principal_amount: z.number()
    .min(0, 'Valor da amortização deve ser maior ou igual a zero')
    .max(999999999999.99, 'Valor da amortização muito alto')
    .optional(),
  interest_amount: z.number()
    .min(0, 'Valor dos juros deve ser maior ou igual a zero')
    .max(999999999999.99, 'Valor dos juros muito alto')
    .optional(),
  payment_date: paymentDateSchema.optional(),
  payment_method: z.enum(['boleto', 'debito_automatico', 'cartao', 'pix', 'transferencia'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' })
  }).optional(),
  payment_type: z.enum(['parcela', 'parcial', 'antecipado'], {
    errorMap: () => ({ message: 'Tipo de pagamento inválido' })
  }).optional(),
  balance_before: z.number()
    .min(0, 'Saldo anterior deve ser maior ou igual a zero')
    .max(999999999999.99, 'Saldo anterior muito alto')
    .optional(),
  balance_after: z.number()
    .min(0, 'Saldo posterior deve ser maior ou igual a zero')
    .max(999999999999.99, 'Saldo posterior muito alto')
    .optional(),
  status: z.enum(['pago', 'pendente', 'atrasado', 'cancelado'], {
    errorMap: () => ({ message: 'Status inválido' })
  }).optional(),
  observations: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .nullable()
});

/**
 * Esquema para listagem de pagamentos com filtros
 */
const listFinancingPaymentsSchema = z.object({
  financing_id: z.number().int().positive().optional(),
  account_id: z.number().int().positive().optional(),
  payment_method: z.enum(['boleto', 'debito_automatico', 'cartao', 'pix', 'transferencia']).optional(),
  payment_type: z.enum(['parcela', 'parcial', 'antecipado']).optional(),
  status: z.enum(['pago', 'pendente', 'atrasado', 'cancelado']).optional(),
  payment_date_from: z.string().optional(),
  payment_date_to: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
});

/**
 * Esquema para pagamento de parcela específica
 */
const payInstallmentSchema = z.object({
  account_id: z.number()
    .int()
    .positive('ID da conta deve ser um número positivo'),
  payment_amount: z.number()
    .positive('Valor do pagamento deve ser positivo')
    .max(999999999999.99, 'Valor do pagamento muito alto'),
  payment_date: paymentDateSchema,
  payment_method: z.enum(['boleto', 'debito_automatico', 'cartao', 'pix', 'transferencia'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' })
  }),
  observations: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .nullable()
});

/**
 * Esquema para pagamento antecipado
 */
const earlyPaymentSchema = z.object({
  account_id: z.number()
    .int()
    .positive('ID da conta deve ser um número positivo'),
  payment_amount: z.number()
    .positive('Valor do pagamento deve ser positivo')
    .max(999999999999.99, 'Valor do pagamento muito alto'),
  payment_date: paymentDateSchema,
  payment_method: z.enum(['boleto', 'debito_automatico', 'cartao', 'pix', 'transferencia'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' })
  }),
  preference: z.enum(['reducao_prazo', 'reducao_parcela'], {
    errorMap: () => ({ message: 'Preferência deve ser redução de prazo ou redução de parcela' })
  }),
  observations: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .nullable()
});

module.exports = {
  createFinancingPaymentSchema,
  updateFinancingPaymentSchema,
  listFinancingPaymentsSchema,
  payInstallmentSchema,
  earlyPaymentSchema
}; 