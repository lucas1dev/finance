const { z } = require('zod');

/**
 * Esquemas de validação para aportes de investimentos usando Zod.
 * Valida os dados de entrada para criação e atualização de aportes.
 */

/**
 * Esquema para criação de aporte de investimento.
 * @type {z.ZodObject}
 */
const createContributionSchema = z.object({
  investment_id: z.number({
    required_error: 'ID do investimento é obrigatório',
    invalid_type_error: 'ID do investimento deve ser um número'
  }).int().positive('ID do investimento deve ser um número positivo'),

  contribution_date: z.string({
    required_error: 'Data do aporte é obrigatória'
  }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),

  amount: z.number({
    required_error: 'Valor do aporte é obrigatório',
    invalid_type_error: 'Valor do aporte deve ser um número'
  }).positive('Valor do aporte deve ser maior que zero')
    .max(999999999.99, 'Valor do aporte não pode exceder 999.999.999,99'),

  quantity: z.number({
    required_error: 'Quantidade é obrigatória',
    invalid_type_error: 'Quantidade deve ser um número'
  }).positive('Quantidade deve ser maior que zero')
    .max(999999.9999, 'Quantidade não pode exceder 999.999,9999'),

  unit_price: z.number({
    required_error: 'Preço unitário é obrigatório',
    invalid_type_error: 'Preço unitário deve ser um número'
  }).positive('Preço unitário deve ser maior que zero')
    .max(999999.9999, 'Preço unitário não pode exceder 999.999,9999'),

  broker: z.enum([
    'xp_investimentos',
    'rico_investimentos',
    'clear_corretora',
    'modal_mais',
    'inter_invest',
    'nubank_invest',
    'itau_corretora',
    'bradesco_corretora',
    'santander_corretora',
    'outros'
  ], {
    errorMap: () => ({ message: 'Corretora deve ser uma das opções válidas' })
  }).optional(),

  observations: z.string({
    invalid_type_error: 'Observações devem ser um texto'
  }).max(1000, 'Observações não podem exceder 1000 caracteres').optional(),

  /**
   * ID da conta bancária de origem do aporte.
   * @type {number}
   */
  source_account_id: z.number({
    required_error: 'ID da conta de origem é obrigatório',
    invalid_type_error: 'ID da conta de origem deve ser um número'
  })
    .int('ID da conta de origem deve ser um número inteiro')
    .positive('ID da conta de origem deve ser positivo'),

  /**
   * ID da conta bancária de destino do aporte.
   * @type {number}
   */
  destination_account_id: z.number({
    required_error: 'ID da conta de destino é obrigatório',
    invalid_type_error: 'ID da conta de destino deve ser um número'
  })
    .int('ID da conta de destino deve ser um número inteiro')
    .positive('ID da conta de destino deve ser positivo')
});

/**
 * Esquema para atualização de aporte de investimento.
 * @type {z.ZodObject}
 */
const updateContributionSchema = z.object({
  contribution_date: z.string({
    required_error: 'Data do aporte é obrigatória'
  }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),

  amount: z.number({
    invalid_type_error: 'Valor do aporte deve ser um número'
  }).positive('Valor do aporte deve ser maior que zero')
    .max(999999999.99, 'Valor do aporte não pode exceder 999.999.999,99').optional(),

  quantity: z.number({
    invalid_type_error: 'Quantidade deve ser um número'
  }).positive('Quantidade deve ser maior que zero')
    .max(999999.9999, 'Quantidade não pode exceder 999.999,9999').optional(),

  unit_price: z.number({
    invalid_type_error: 'Preço unitário deve ser um número'
  }).positive('Preço unitário deve ser maior que zero')
    .max(999999.9999, 'Preço unitário não pode exceder 999.999,9999').optional(),

  broker: z.enum([
    'xp_investimentos',
    'rico_investimentos',
    'clear_corretora',
    'modal_mais',
    'inter_invest',
    'nubank_invest',
    'itau_corretora',
    'bradesco_corretora',
    'santander_corretora',
    'outros'
  ], {
    errorMap: () => ({ message: 'Corretora deve ser uma das opções válidas' })
  }).optional(),

  observations: z.string({
    invalid_type_error: 'Observações devem ser um texto'
  }).max(1000, 'Observações não podem exceder 1000 caracteres').optional(),

  /**
   * ID da conta bancária de origem do aporte.
   * @type {number}
   */
  source_account_id: z.number({
    required_error: 'ID da conta de origem é obrigatório',
    invalid_type_error: 'ID da conta de origem deve ser um número'
  })
    .int('ID da conta de origem deve ser um número inteiro')
    .positive('ID da conta de origem deve ser positivo'),

  /**
   * ID da conta bancária de destino do aporte.
   * @type {number}
   */
  destination_account_id: z.number({
    required_error: 'ID da conta de destino é obrigatório',
    invalid_type_error: 'ID da conta de destino deve ser um número'
  })
    .int('ID da conta de destino deve ser um número inteiro')
    .positive('ID da conta de destino deve ser positivo')
});

/**
 * Esquema para validação de ID de aporte.
 * @type {z.ZodObject}
 */
const contributionIdSchema = z.object({
  id: z.number({
    required_error: 'ID do aporte é obrigatório',
    invalid_type_error: 'ID do aporte deve ser um número'
  }).int().positive('ID do aporte deve ser um número positivo')
});

/**
 * Esquema para validação de ID de investimento.
 * @type {z.ZodObject}
 */
const investmentIdSchema = z.object({
  investment_id: z.number({
    required_error: 'ID do investimento é obrigatório',
    invalid_type_error: 'ID do investimento deve ser um número'
  }).int().positive('ID do investimento deve ser um número positivo')
});

/**
 * Esquema para filtros de busca de aportes.
 * @type {z.ZodObject}
 */
const contributionFiltersSchema = z.object({
  investment_id: z.number().int().positive().optional(),
  broker: z.enum([
    'xp_investimentos',
    'rico_investimentos',
    'clear_corretora',
    'modal_mais',
    'inter_invest',
    'nubank_invest',
    'itau_corretora',
    'bradesco_corretora',
    'santander_corretora',
    'outros'
  ]).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial deve estar no formato YYYY-MM-DD').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final deve estar no formato YYYY-MM-DD').optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});

module.exports = {
  createContributionSchema,
  updateContributionSchema,
  contributionIdSchema,
  investmentIdSchema,
  contributionFiltersSchema
}; 