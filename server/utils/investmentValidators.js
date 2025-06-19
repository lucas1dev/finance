const { z } = require('zod');

/**
 * Esquemas de validação para investimentos e metas de investimento.
 * Utiliza Zod para validação de dados de entrada.
 */

/**
 * Esquema para validação de criação de investimento.
 * @type {z.ZodObject}
 */
const createInvestmentSchema = z.object({
  /**
   * Tipo de investimento.
   * @type {string}
   */
  investment_type: z.enum(['acoes', 'fundos', 'titulos', 'criptomoedas', 'outros'], {
    required_error: 'Tipo de investimento é obrigatório',
    invalid_type_error: 'Tipo de investimento deve ser: acoes, fundos, titulos, criptomoedas ou outros'
  }),

  /**
   * Nome do ativo.
   * @type {string}
   */
  asset_name: z.string({
    required_error: 'Nome do ativo é obrigatório',
    invalid_type_error: 'Nome do ativo deve ser uma string'
  })
    .min(1, 'Nome do ativo não pode estar vazio')
    .max(255, 'Nome do ativo deve ter no máximo 255 caracteres'),

  /**
   * Ticker do ativo (opcional).
   * @type {string}
   */
  ticker: z.string()
    .max(20, 'Ticker deve ter no máximo 20 caracteres')
    .optional(),

  /**
   * Valor investido.
   * @type {number}
   */
  invested_amount: z.number({
    required_error: 'Valor investido é obrigatório',
    invalid_type_error: 'Valor investido deve ser um número'
  })
    .positive('Valor investido deve ser positivo')
    .min(0.01, 'Valor investido deve ser pelo menos R$ 0,01'),

  /**
   * Quantidade de ativos.
   * @type {number}
   */
  quantity: z.number({
    required_error: 'Quantidade é obrigatória',
    invalid_type_error: 'Quantidade deve ser um número'
  })
    .positive('Quantidade deve ser positiva')
    .min(0.000001, 'Quantidade deve ser pelo menos 0,000001'),

  /**
   * Data da operação.
   * @type {string}
   */
  operation_date: z.string({
    required_error: 'Data da operação é obrigatória',
    invalid_type_error: 'Data da operação deve ser uma string'
  })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine((date) => {
      const inputDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return inputDate <= today;
    }, 'Data da operação não pode ser futura'),

  /**
   * Tipo de operação.
   * @type {string}
   */
  operation_type: z.enum(['compra', 'venda'], {
    required_error: 'Tipo de operação é obrigatório',
    invalid_type_error: 'Tipo de operação deve ser: compra ou venda'
  }),

  /**
   * Corretora (opcional).
   * @type {string}
   */
  broker: z.enum([
    'xp_investimentos',
    'rico',
    'clear',
    'modalmais',
    'inter',
    'nubank',
    'itau',
    'bradesco',
    'santander',
    'caixa',
    'outros'
  ], {
    invalid_type_error: 'Corretora deve ser uma das opções válidas'
  }).optional(),

  /**
   * Observações (opcional).
   * @type {string}
   */
  observations: z.string().optional(),

  /**
   * ID da conta.
   * @type {number}
   */
  account_id: z.number({
    required_error: 'ID da conta é obrigatório',
    invalid_type_error: 'ID da conta deve ser um número'
  })
    .int('ID da conta deve ser um número inteiro')
    .positive('ID da conta deve ser positivo'),

  /**
   * ID da categoria (opcional).
   * @type {number}
   */
  category_id: z.number({
    invalid_type_error: 'ID da categoria deve ser um número'
  })
    .int('ID da categoria deve ser um número inteiro')
    .positive('ID da categoria deve ser positivo')
    .optional()
});

/**
 * Esquema para validação de atualização de investimento.
 * @type {z.ZodObject}
 */
const updateInvestmentSchema = z.object({
  /**
   * Tipo de investimento.
   * @type {string}
   */
  investment_type: z.enum(['acoes', 'fundos', 'titulos', 'criptomoedas', 'outros'], {
    invalid_type_error: 'Tipo de investimento deve ser: acoes, fundos, titulos, criptomoedas ou outros'
  }).optional(),

  /**
   * Nome do ativo.
   * @type {string}
   */
  asset_name: z.string({
    invalid_type_error: 'Nome do ativo deve ser uma string'
  })
    .min(1, 'Nome do ativo não pode estar vazio')
    .max(255, 'Nome do ativo deve ter no máximo 255 caracteres')
    .optional(),

  /**
   * Ticker do ativo.
   * @type {string}
   */
  ticker: z.string()
    .max(20, 'Ticker deve ter no máximo 20 caracteres')
    .optional(),

  /**
   * Valor investido.
   * @type {number}
   */
  invested_amount: z.number({
    invalid_type_error: 'Valor investido deve ser um número'
  })
    .positive('Valor investido deve ser positivo')
    .min(0.01, 'Valor investido deve ser pelo menos R$ 0,01')
    .optional(),

  /**
   * Quantidade de ativos.
   * @type {number}
   */
  quantity: z.number({
    invalid_type_error: 'Quantidade deve ser um número'
  })
    .positive('Quantidade deve ser positiva')
    .min(0.000001, 'Quantidade deve ser pelo menos 0,000001')
    .optional(),

  /**
   * Data da operação.
   * @type {string}
   */
  operation_date: z.string({
    invalid_type_error: 'Data da operação deve ser uma string'
  })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine((date) => {
      const inputDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return inputDate <= today;
    }, 'Data da operação não pode ser futura')
    .optional(),

  /**
   * Tipo de operação.
   * @type {string}
   */
  operation_type: z.enum(['compra', 'venda'], {
    invalid_type_error: 'Tipo de operação deve ser: compra ou venda'
  }).optional(),

  /**
   * Corretora.
   * @type {string}
   */
  broker: z.enum([
    'xp_investimentos',
    'rico',
    'clear',
    'modalmais',
    'inter',
    'nubank',
    'itau',
    'bradesco',
    'santander',
    'caixa',
    'outros'
  ], {
    invalid_type_error: 'Corretora deve ser uma das opções válidas'
  }).optional(),

  /**
   * Observações.
   * @type {string}
   */
  observations: z.string().optional(),

  /**
   * Status do investimento.
   * @type {string}
   */
  status: z.enum(['ativo', 'vendido', 'cancelado'], {
    invalid_type_error: 'Status deve ser: ativo, vendido ou cancelado'
  }).optional(),

  /**
   * ID da conta.
   * @type {number}
   */
  account_id: z.number({
    invalid_type_error: 'ID da conta deve ser um número'
  })
    .int('ID da conta deve ser um número inteiro')
    .positive('ID da conta deve ser positivo')
    .optional(),

  /**
   * ID da categoria.
   * @type {number}
   */
  category_id: z.number({
    invalid_type_error: 'ID da categoria deve ser um número'
  })
    .int('ID da categoria deve ser um número inteiro')
    .positive('ID da categoria deve ser positivo')
    .optional()
});

/**
 * Esquema para validação de criação de meta de investimento.
 * @type {z.ZodObject}
 */
const createInvestmentGoalSchema = z.object({
  /**
   * Título da meta.
   * @type {string}
   */
  title: z.string({
    required_error: 'Título da meta é obrigatório',
    invalid_type_error: 'Título da meta deve ser uma string'
  })
    .min(1, 'Título da meta não pode estar vazio')
    .max(255, 'Título da meta deve ter no máximo 255 caracteres'),

  /**
   * Descrição da meta.
   * @type {string}
   */
  description: z.string({
    required_error: 'Descrição da meta é obrigatória',
    invalid_type_error: 'Descrição da meta deve ser uma string'
  })
    .min(1, 'Descrição da meta não pode estar vazia'),

  /**
   * Valor alvo.
   * @type {number}
   */
  target_amount: z.number({
    required_error: 'Valor alvo é obrigatório',
    invalid_type_error: 'Valor alvo deve ser um número'
  })
    .positive('Valor alvo deve ser positivo')
    .min(0.01, 'Valor alvo deve ser pelo menos R$ 0,01'),

  /**
   * Data alvo.
   * @type {string}
   */
  target_date: z.string({
    required_error: 'Data alvo é obrigatória',
    invalid_type_error: 'Data alvo deve ser uma string'
  })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine((date) => {
      const inputDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return inputDate > today;
    }, 'Data alvo deve ser futura'),

  /**
   * Valor atual (opcional).
   * @type {number}
   */
  current_amount: z.number({
    invalid_type_error: 'Valor atual deve ser um número'
  })
    .min(0, 'Valor atual não pode ser negativo')
    .optional(),

  /**
   * Cor da meta (opcional).
   * @type {string}
   */
  color: z.string({
    invalid_type_error: 'Cor deve ser uma string'
  })
    .regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)')
    .optional(),

  /**
   * ID da categoria (opcional).
   * @type {number}
   */
  category_id: z.number({
    invalid_type_error: 'ID da categoria deve ser um número'
  })
    .int('ID da categoria deve ser um número inteiro')
    .positive('ID da categoria deve ser positivo')
    .optional()
});

/**
 * Esquema para validação de atualização de meta de investimento.
 * @type {z.ZodObject}
 */
const updateInvestmentGoalSchema = z.object({
  /**
   * Título da meta.
   * @type {string}
   */
  title: z.string({
    invalid_type_error: 'Título da meta deve ser uma string'
  })
    .min(1, 'Título da meta não pode estar vazio')
    .max(255, 'Título da meta deve ter no máximo 255 caracteres')
    .optional(),

  /**
   * Descrição da meta.
   * @type {string}
   */
  description: z.string({
    invalid_type_error: 'Descrição da meta deve ser uma string'
  })
    .min(1, 'Descrição da meta não pode estar vazia')
    .optional(),

  /**
   * Valor alvo.
   * @type {number}
   */
  target_amount: z.number({
    invalid_type_error: 'Valor alvo deve ser um número'
  })
    .positive('Valor alvo deve ser positivo')
    .min(0.01, 'Valor alvo deve ser pelo menos R$ 0,01')
    .optional(),

  /**
   * Data alvo.
   * @type {string}
   */
  target_date: z.string({
    invalid_type_error: 'Data alvo deve ser uma string'
  })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine((date) => {
      const inputDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return inputDate > today;
    }, 'Data alvo deve ser futura')
    .optional(),

  /**
   * Valor atual.
   * @type {number}
   */
  current_amount: z.number({
    invalid_type_error: 'Valor atual deve ser um número'
  })
    .min(0, 'Valor atual não pode ser negativo')
    .optional(),

  /**
   * Status da meta.
   * @type {string}
   */
  status: z.enum(['ativa', 'concluida', 'cancelada'], {
    invalid_type_error: 'Status deve ser: ativa, concluida ou cancelada'
  }).optional(),

  /**
   * Cor da meta.
   * @type {string}
   */
  color: z.string({
    invalid_type_error: 'Cor deve ser uma string'
  })
    .regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)')
    .optional(),

  /**
   * ID da categoria.
   * @type {number}
   */
  category_id: z.number({
    invalid_type_error: 'ID da categoria deve ser um número'
  })
    .int('ID da categoria deve ser um número inteiro')
    .positive('ID da categoria deve ser positivo')
    .optional()
});

/**
 * Esquema para validação de atualização de valor atual da meta.
 * @type {z.ZodObject}
 */
const updateGoalAmountSchema = z.object({
  /**
   * Valor atual.
   * @type {number}
   */
  current_amount: z.number({
    required_error: 'Valor atual é obrigatório',
    invalid_type_error: 'Valor atual deve ser um número'
  })
    .min(0, 'Valor atual não pode ser negativo')
});

module.exports = {
  createInvestmentSchema,
  updateInvestmentSchema,
  createInvestmentGoalSchema,
  updateInvestmentGoalSchema,
  updateGoalAmountSchema
}; 