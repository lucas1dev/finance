const { FixedAccount, Category, Supplier, Transaction, Account } = require('../models');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { z } = require('zod');
const { Op } = require('sequelize');
const FixedAccountService = require('../services/fixedAccountService');

/**
 * Esquema de validação para criação de conta fixa
 */
const createFixedAccountSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(255, 'Descrição deve ter no máximo 255 caracteres'),
  type: z.enum(['expense', 'income'], {
    errorMap: () => ({ message: 'Tipo deve ser: expense ou income' })
  }).optional(),
  amount: z.number().positive('Valor deve ser positivo'),
  periodicity: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], {
    errorMap: () => ({ message: 'Periodicidade deve ser: daily, weekly, monthly, quarterly, yearly' })
  }),
  start_date: z.string().refine((date) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }, 'Data de início deve ser uma data válida'),
  category_id: z.number().int().positive('Categoria é obrigatória'),
  supplier_id: z.number().int().positive().optional(),
  account_id: z.number().int().positive().optional(),
  payment_method: z.enum(['card', 'boleto', 'automatic_debit']).optional(),
  observations: z.string().optional(),
  reminder_days: z.number().int().min(0).max(30).default(3)
});

/**
 * Esquema de validação para atualização de conta fixa
 */
const updateFixedAccountSchema = createFixedAccountSchema.partial();

/**
 * Cria uma nova conta fixa.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} req.body - Dados da conta fixa.
 * @param {string} req.body.description - Descrição da conta fixa.
 * @param {string} [req.body.type] - Tipo da conta fixa (expense/income).
 * @param {number} req.body.amount - Valor da conta fixa.
 * @param {string} req.body.periodicity - Periodicidade (daily, weekly, monthly, quarterly, yearly).
 * @param {string} req.body.start_date - Data de início (YYYY-MM-DD).
 * @param {number} req.body.category_id - ID da categoria.
 * @param {number} [req.body.supplier_id] - ID do fornecedor (opcional).
 * @param {number} [req.body.account_id] - ID da conta bancária (opcional).
 * @param {string} [req.body.payment_method] - Método de pagamento (opcional).
 * @param {string} [req.body.observations] - Observações (opcional).
 * @param {number} [req.body.reminder_days] - Dias de antecedência para lembretes (padrão: 3).
 * @param {number} req.userId - ID do usuário autenticado.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Resposta JSON com a conta fixa criada.
 * @throws {ValidationError} Se os dados forem inválidos.
 * @throws {NotFoundError} Se a categoria ou fornecedor não forem encontrados.
 * @example
 * // POST /fixed-accounts
 * // Body: { "description": "Aluguel", "type": "expense", "amount": 1500.00, "periodicity": "monthly", "start_date": "2024-01-01", "category_id": 1 }
 * // Retorno: { "id": 1, "description": "Aluguel", "type": "expense", "amount": "1500.00", ... }
 */
async function createFixedAccount(req, res) {
  try {
    const validatedData = createFixedAccountSchema.parse(req.body);
    
    // Verifica se a categoria existe e pertence ao usuário ou é uma categoria padrão
    const category = await Category.findOne({
      where: {
        id: validatedData.category_id,
        [Op.or]: [
          { user_id: req.userId },
          { is_default: true }
        ]
      }
    });
    
    if (!category) {
      throw new NotFoundError('Categoria não encontrada');
    }
    
    // Verifica se o fornecedor existe (se fornecido)
    if (validatedData.supplier_id) {
      const supplier = await Supplier.findOne({
        where: { id: validatedData.supplier_id, user_id: req.userId }
      });
      
      if (!supplier) {
        throw new NotFoundError('Fornecedor não encontrado');
      }
    }
    
    // Verifica se a conta bancária existe (se fornecida)
    if (validatedData.account_id) {
      const account = await Account.findOne({
        where: { id: validatedData.account_id, user_id: req.userId }
      });
      
      if (!account) {
        throw new NotFoundError('Conta bancária não encontrada');
      }
    }
    
    // Usar o novo FixedAccountService para criar a conta fixa
    const result = await FixedAccountService.createFixedAccount({
      ...validatedData,
      user_id: req.userId
    });
    
    // Carrega as associações para retornar dados completos
    await result.fixedAccount.reload({
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' },
        { model: Account, as: 'account' }
      ]
    });
    
    res.status(201).json({
      success: true,
      data: result.fixedAccount,
      firstTransaction: result.firstTransaction
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Dados inválidos', error.errors);
    }
    throw error;
  }
}

/**
 * Lista todas as contas fixas do usuário.
 * @param {Object} req - Objeto de requisição Express.
 * @param {number} req.userId - ID do usuário autenticado.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Lista de contas fixas em formato JSON.
 * @example
 * // GET /fixed-accounts
 * // Retorno: [{ "id": 1, "description": "Aluguel", "amount": "1500.00", ... }, ...]
 */
async function getFixedAccounts(req, res) {
  const fixedAccounts = await FixedAccount.findAll({
    where: { user_id: req.userId },
    include: [
      { model: Category, as: 'category' },
      { model: Supplier, as: 'supplier' }
    ],
    order: [['created_at', 'DESC']]
  });
  
  res.json({
    success: true,
    data: fixedAccounts
  });
}

/**
 * Obtém uma conta fixa específica por ID.
 * @param {Object} req - Objeto de requisição Express.
 * @param {number} req.params.id - ID da conta fixa.
 * @param {number} req.userId - ID do usuário autenticado.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Conta fixa em formato JSON.
 * @throws {NotFoundError} Se a conta fixa não for encontrada.
 * @example
 * // GET /fixed-accounts/1
 * // Retorno: { "id": 1, "description": "Aluguel", "amount": "1500.00", ... }
 */
async function getFixedAccountById(req, res) {
  const { id } = req.params;
  
  const fixedAccount = await FixedAccount.findOne({
    where: { id, user_id: req.userId },
    include: [
      { model: Category, as: 'category' },
      { model: Supplier, as: 'supplier' }
    ]
  });
  
  if (!fixedAccount) {
    throw new NotFoundError('Conta fixa não encontrada');
  }
  
  res.json({
    success: true,
    data: fixedAccount
  });
}

/**
 * Atualiza uma conta fixa existente.
 * @param {Object} req - Objeto de requisição Express.
 * @param {number} req.params.id - ID da conta fixa.
 * @param {Object} req.body - Dados para atualização.
 * @param {number} req.userId - ID do usuário autenticado.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Conta fixa atualizada em formato JSON.
 * @throws {ValidationError} Se os dados forem inválidos.
 * @throws {NotFoundError} Se a conta fixa não for encontrada.
 * @example
 * // PUT /fixed-accounts/1
 * // Body: { "amount": 1600.00, "observations": "Aumento do aluguel" }
 * // Retorno: { "id": 1, "amount": "1600.00", "observations": "Aumento do aluguel", ... }
 */
async function updateFixedAccount(req, res) {
  try {
    const { id } = req.params;
    const validatedData = updateFixedAccountSchema.parse(req.body);
    
    const fixedAccount = await FixedAccount.findOne({
      where: { id, user_id: req.userId }
    });
    
    if (!fixedAccount) {
      throw new NotFoundError('Conta fixa não encontrada');
    }
    
    // Verifica se a categoria existe (se fornecida)
    if (validatedData.category_id) {
      const category = await Category.findOne({
        where: {
          id: validatedData.category_id,
          [Op.or]: [
            { user_id: req.userId },
            { is_default: true }
          ]
        }
      });
      
      if (!category) {
        throw new NotFoundError('Categoria não encontrada');
      }
    }
    
    // Verifica se o fornecedor existe (se fornecido)
    if (validatedData.supplier_id) {
      const supplier = await Supplier.findOne({
        where: { id: validatedData.supplier_id, user_id: req.userId }
      });
      
      if (!supplier) {
        throw new NotFoundError('Fornecedor não encontrado');
      }
    }
    
    // Verifica se a conta bancária existe (se fornecida)
    if (validatedData.account_id) {
      const account = await Account.findOne({
        where: { id: validatedData.account_id, user_id: req.userId }
      });
      
      if (!account) {
        throw new NotFoundError('Conta bancária não encontrada');
      }
    }
    
    await fixedAccount.update(validatedData);
    
    // Carrega as associações para retornar dados completos
    await fixedAccount.reload({
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' },
        { model: Account, as: 'account' }
      ]
    });
    
    res.json({
      success: true,
      data: fixedAccount
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Dados inválidos', error.errors);
    }
    throw error;
  }
}

/**
 * Ativa ou desativa uma conta fixa (toggle automático).
 * @param {Object} req - Objeto de requisição Express.
 * @param {number} req.params.id - ID da conta fixa.
 * @param {number} req.userId - ID do usuário autenticado.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Conta fixa atualizada em formato JSON.
 * @throws {NotFoundError} Se a conta fixa não for encontrada.
 * @example
 * // PATCH /fixed-accounts/1/toggle
 * // Retorno: { "id": 1, "is_active": false, ... }
 */
async function toggleFixedAccount(req, res) {
  const { id } = req.params;
  const fixedAccount = await FixedAccount.findOne({
    where: { id, user_id: req.userId }
  });
  if (!fixedAccount) {
    throw new NotFoundError('Conta fixa não encontrada');
  }
  // Alternar o valor de is_active
  const newIsActive = !fixedAccount.is_active;
  await fixedAccount.update({ is_active: newIsActive });
  // Carrega as associações para retornar dados completos
  await fixedAccount.reload({
    include: [
      { model: Category, as: 'category' },
      { model: Supplier, as: 'supplier' },
      { model: Account, as: 'account' }
    ]
  });
  res.json({
    success: true,
    data: fixedAccount
  });
}

/**
 * Marca uma conta fixa como paga e cria uma transação.
 * @param {Object} req - Objeto de requisição Express.
 * @param {number} req.params.id - ID da conta fixa.
 * @param {Object} req.body - Dados do pagamento.
 * @param {string} req.body.payment_date - Data do pagamento (YYYY-MM-DD).
 * @param {number} req.userId - ID do usuário autenticado.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Transação criada em formato JSON.
 * @throws {NotFoundError} Se a conta fixa não for encontrada.
 * @example
 * // POST /fixed-accounts/1/pay
 * // Body: { "payment_date": "2024-01-15" }
 * // Retorno: { "id": 1, "amount": "1500.00", "type": "expense", ... }
 */
async function payFixedAccount(req, res) {
  const { id } = req.params;
  const { payment_date } = req.body;
  const fixedAccount = await FixedAccount.findOne({
    where: { id, user_id: req.userId },
    include: [
      { model: Category, as: 'category' },
      { model: Supplier, as: 'supplier' }
    ]
  });
  if (!fixedAccount) {
    throw new NotFoundError('Conta fixa não encontrada');
  }
  if (!fixedAccount.is_active) {
    throw new ValidationError('Conta fixa está inativa');
  }
  
  // Busca a primeira conta do usuário ou cria uma padrão
  let account = await Account.findOne({
    where: { user_id: req.userId }
  });
  if (!account) {
    account = await Account.create({
      user_id: req.userId,
      bank_name: 'Conta Padrão',
      account_type: 'corrente',
      balance: 0,
      description: 'Conta criada automaticamente para transações de contas fixas'
    });
  }

  // Verificar se há saldo suficiente
  if (parseFloat(account.balance) < parseFloat(fixedAccount.amount)) {
    throw new ValidationError('Saldo insuficiente na conta bancária');
  }

  // Cria a transação
  const transaction = await Transaction.create({
    user_id: req.userId,
    account_id: account.id,
    type: 'expense',
    amount: fixedAccount.amount,
    description: fixedAccount.description,
    category_id: fixedAccount.category_id,
    supplier_id: fixedAccount.supplier_id,
    payment_method: fixedAccount.payment_method,
    payment_date: payment_date || new Date(),
    fixed_account_id: fixedAccount.id
  });

  // Atualizar saldo da conta bancária manualmente
  const newBalance = parseFloat(account.balance) - parseFloat(fixedAccount.amount);
  await account.update({ balance: newBalance });

  // Atualiza o campo is_paid para true
  await fixedAccount.update({ is_paid: true });
  
  // Calcula a próxima data de vencimento
  const nextDueDate = calculateNextDueDate(fixedAccount.next_due_date, fixedAccount.periodicity);
  await fixedAccount.update({ next_due_date: nextDueDate });
  
  res.status(201).json({
    success: true,
    data: transaction,
    transaction,
    message: 'Conta fixa paga com sucesso'
  });
}

/**
 * Remove uma conta fixa (soft delete).
 * @param {Object} req - Objeto de requisição Express.
 * @param {number} req.params.id - ID da conta fixa.
 * @param {number} req.userId - ID do usuário autenticado.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Mensagem de confirmação.
 * @throws {NotFoundError} Se a conta fixa não for encontrada.
 * @example
 * // DELETE /fixed-accounts/1
 * // Retorno: { "success": true, "message": "Conta fixa removida com sucesso" }
 */
async function deleteFixedAccount(req, res) {
  const { id } = req.params;
  
  const fixedAccount = await FixedAccount.findOne({
    where: { id, user_id: req.userId }
  });
  
  if (!fixedAccount) {
    throw new NotFoundError('Conta fixa não encontrada');
  }
  
  await fixedAccount.destroy();
  
  res.json({
    success: true,
    message: 'Conta fixa removida com sucesso'
  });
}

/**
 * Calcula a próxima data de vencimento baseada na periodicidade.
 * @param {string} currentDate - Data atual (YYYY-MM-DD).
 * @param {string} periodicity - Periodicidade (daily, weekly, monthly, quarterly, yearly).
 * @returns {string} Próxima data de vencimento (YYYY-MM-DD).
 */
function calculateNextDueDate(currentDate, periodicity) {
  const date = new Date(currentDate);
  
  switch (periodicity) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  
  return date.toISOString().split('T')[0];
}

/**
 * Obtém estatísticas das contas fixas do usuário.
 * @param {Object} req - Objeto de requisição Express.
 * @param {number} req.userId - ID do usuário autenticado.
 * @param {Object} res - Objeto de resposta Express.
 * @returns {Promise<Object>} Estatísticas em formato JSON.
 * @example
 * // GET /fixed-accounts/statistics
 * // Retorno: { "total": 10, "totalAmount": 5000.00, "active": 8, "inactive": 2, ... }
 */
async function getFixedAccountStatistics(req, res) {
  try {
    // Busca todas as contas fixas do usuário
    const fixedAccounts = await FixedAccount.findAll({
      where: { user_id: req.userId },
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' }
      ]
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calcula estatísticas
    const statistics = {
      total: fixedAccounts.length,
      totalAmount: 0,
      active: 0,
      inactive: 0,
      paid: 0,
      unpaid: 0,
      overdue: 0,
      dueThisMonth: 0,
      dueNextMonth: 0,
      byPeriodicity: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        quarterly: 0,
        yearly: 0
      },
      byCategory: {},
      bySupplier: {},
      totalMonthlyValue: 0,
      totalYearlyValue: 0
    };

    fixedAccounts.forEach(account => {
      // Total de valores
      statistics.totalAmount += parseFloat(account.amount);

      // Status ativo/inativo
      if (account.is_active) {
        statistics.active++;
      } else {
        statistics.inactive++;
      }

      // Status pago/não pago
      if (account.is_paid) {
        statistics.paid++;
      } else {
        statistics.unpaid++;
      }

      // Verifica se está vencida
      const dueDate = new Date(account.next_due_date);
      if (dueDate < today && !account.is_paid) {
        statistics.overdue++;
      }

      // Vencimentos deste mês
      const dueDateMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      if (dueDate >= today && dueDate < nextMonth) {
        statistics.dueThisMonth++;
      }

      // Vencimentos do próximo mês
      const nextNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);
      if (dueDate >= nextMonth && dueDate < nextNextMonth) {
        statistics.dueNextMonth++;
      }

      // Por periodicidade
      statistics.byPeriodicity[account.periodicity]++;

      // Por categoria
      if (account.category) {
        const categoryName = account.category.name;
        if (!statistics.byCategory[categoryName]) {
          statistics.byCategory[categoryName] = {
            count: 0,
            totalAmount: 0,
            color: account.category.color
          };
        }
        statistics.byCategory[categoryName].count++;
        statistics.byCategory[categoryName].totalAmount += parseFloat(account.amount);
      }

      // Por fornecedor
      if (account.supplier) {
        const supplierName = account.supplier.name;
        if (!statistics.bySupplier[supplierName]) {
          statistics.bySupplier[supplierName] = {
            count: 0,
            totalAmount: 0
          };
        }
        statistics.bySupplier[supplierName].count++;
        statistics.bySupplier[supplierName].totalAmount += parseFloat(account.amount);
      }

      // Calcula valor mensal e anual baseado na periodicidade
      const amount = parseFloat(account.amount);
      switch (account.periodicity) {
        case 'daily':
          statistics.totalMonthlyValue += amount * 30;
          statistics.totalYearlyValue += amount * 365;
          break;
        case 'weekly':
          statistics.totalMonthlyValue += amount * 4.33; // 52 semanas / 12 meses
          statistics.totalYearlyValue += amount * 52;
          break;
        case 'monthly':
          statistics.totalMonthlyValue += amount;
          statistics.totalYearlyValue += amount * 12;
          break;
        case 'quarterly':
          statistics.totalMonthlyValue += amount / 3;
          statistics.totalYearlyValue += amount * 4;
          break;
        case 'yearly':
          statistics.totalMonthlyValue += amount / 12;
          statistics.totalYearlyValue += amount;
          break;
      }
    });

    // Converte para números com 2 casas decimais
    statistics.totalAmount = Math.round(statistics.totalAmount * 100) / 100;
    statistics.totalMonthlyValue = Math.round(statistics.totalMonthlyValue * 100) / 100;
    statistics.totalYearlyValue = Math.round(statistics.totalYearlyValue * 100) / 100;

    // Arredonda valores por categoria e fornecedor
    Object.keys(statistics.byCategory).forEach(category => {
      statistics.byCategory[category].totalAmount = Math.round(statistics.byCategory[category].totalAmount * 100) / 100;
    });

    Object.keys(statistics.bySupplier).forEach(supplier => {
      statistics.bySupplier[supplier].totalAmount = Math.round(statistics.bySupplier[supplier].totalAmount * 100) / 100;
    });

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createFixedAccount,
  getFixedAccounts,
  getFixedAccountById,
  updateFixedAccount,
  toggleFixedAccount,
  payFixedAccount,
  deleteFixedAccount,
  calculateNextDueDate,
  getFixedAccountStatistics,
  createFixedAccountSchema,
  updateFixedAccountSchema
}; 