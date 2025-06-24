const { Transaction, Category, Account } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const { createTransactionSchema, updateTransactionSchema } = require('../utils/validators');

// Funções auxiliares para gráficos de transações
async function getTimelineData(userId, period) {
  const currentDate = new Date();
  const data = [];
  
  let intervals, intervalType;
  switch (period) {
    case 'week':
      intervals = 7;
      intervalType = 'day';
      break;
    case 'month':
      intervals = 30;
      intervalType = 'day';
      break;
    case 'quarter':
      intervals = 12;
      intervalType = 'week';
      break;
    case 'year':
      intervals = 12;
      intervalType = 'month';
      break;
    default:
      intervals = 30;
      intervalType = 'day';
  }

  for (let i = intervals - 1; i >= 0; i--) {
    let startDate, endDate, label;
    
    if (intervalType === 'day') {
      startDate = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
      label = startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else if (intervalType === 'week') {
      startDate = new Date(currentDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      label = `Semana ${Math.ceil((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
    } else {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
      label = startDate.toLocaleDateString('pt-BR', { month: 'short' });
    }

    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    data.push({
      label,
      date: startDate.toISOString(),
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      net: Math.round((income - expenses) * 100) / 100,
      count: transactions.length
    });
  }

  return { timeline: data };
}

async function getCategoryChartData(userId, period) {
  const currentDate = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(currentDate.getMonth() / 3);
      startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }

  const transactions = await Transaction.findAll({
    where: {
      user_id: userId,
      date: {
        [Op.gte]: startDate
      }
    },
    include: [{
      model: Category,
      as: 'category',
      attributes: ['name', 'type', 'color']
    }]
  });

  const categoryData = transactions
    .filter(t => t.category)
    .reduce((acc, t) => {
      const categoryName = t.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          type: t.category.type,
          color: t.category.color,
          total: 0,
          count: 0
        };
      }
      acc[categoryName].total += parseFloat(t.amount || 0);
      acc[categoryName].count++;
      return acc;
    }, {});

  const incomeCategories = Object.values(categoryData)
    .filter(cat => cat.type === 'income')
    .map(cat => ({
      ...cat,
      total: Math.round(cat.total * 100) / 100
    }))
    .sort((a, b) => b.total - a.total);

  const expenseCategories = Object.values(categoryData)
    .filter(cat => cat.type === 'expense')
    .map(cat => ({
      ...cat,
      total: Math.round(cat.total * 100) / 100
    }))
    .sort((a, b) => b.total - a.total);

  return {
    income: incomeCategories,
    expenses: expenseCategories
  };
}

async function getTrendChartData(userId, period) {
  const currentDate = new Date();
  const data = [];
  // Últimos 12 períodos
  for (let i = 11; i >= 0; i--) {
    let startDate, endDate, label;
    if (period === 'month') {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
      label = startDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    } else {
      startDate = new Date(currentDate.getTime() - i * 30 * 24 * 60 * 60 * 1000);
      endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000 - 1);
      label = startDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    }
    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const count = transactions.length;
    const average = count > 0 ? total / count : 0;
    data.push({
      label,
      date: startDate.toISOString(),
      total: Math.round(total * 100) / 100,
      count,
      average: Math.round(average * 100) / 100
    });
  }
  return { trend: data };
}

const transactionController = {
  /**
   * Cria uma nova transação.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da transação.
   * @param {number} req.body.account_id - ID da conta.
   * @param {number} req.body.category_id - ID da categoria (opcional).
   * @param {string} req.body.type - Tipo da transação (income/expense).
   * @param {number} req.body.amount - Valor da transação.
   * @param {string} req.body.description - Descrição da transação.
   * @param {string} req.body.date - Data da transação (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com dados da transação criada.
   * @throws {Error} Se a conta não for encontrada ou houver erro no banco.
   * @example
   * // POST /transactions
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "account_id": 1, "type": "income", "amount": 100, "description": "Salário" }
   * // Retorno: { "message": "Transação criada com sucesso", "transactionId": 1, "newBalance": 100 }
   */
  createTransaction: async (req, res) => {
    try {
      // Validar dados de entrada
      const validatedData = createTransactionSchema.parse(req.body);
      const { account_id, category_id, type, amount, description, date } = validatedData;
      const user_id = req.user.id;

      // Busca a conta
      const account = await Account.findOne({
        where: {
          id: account_id,
          user_id
        }
      });

      if (!account) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      // Calcula o novo saldo
      const newBalance = type === 'income' 
        ? Number(account.balance) + Number(amount)
        : Number(account.balance) - Number(amount);

      // Atualiza o saldo da conta
      await account.update({ balance: newBalance });

      // Cria a transação
      const transaction = await Transaction.create({
        user_id,
        account_id,
        category_id,
        type,
        amount,
        description,
        date: date || new Date()
      });

      res.status(201).json({
        message: 'Transação criada com sucesso',
        transactionId: transaction.id,
        newBalance
      });
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      res.status(500).json({ error: 'Erro ao criar transação' });
    }
  },

  /**
   * Obtém a lista de transações do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.startDate - Data de início (opcional).
   * @param {string} req.query.endDate - Data de fim (opcional).
   * @param {string} req.query.type - Tipo da transação (opcional).
   * @param {number} req.query.category_id - ID da categoria (opcional).
   * @param {number} req.query.account_id - ID da conta (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de transações em formato JSON.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // GET /transactions?startDate=2024-01-01&endDate=2024-12-31&type=income
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: [{ id: 1, amount: 100, type: "income", description: "Salário" }, ...]
   */
  getTransactions: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { startDate, endDate, type, category_id, account_id } = req.query;

      const where = { user_id };
      if (startDate) where.date = { ...where.date, [Op.gte]: startDate };
      if (endDate) where.date = { ...where.date, [Op.lte]: endDate };
      if (type) where.type = type;
      if (category_id) where.category_id = category_id;
      if (account_id) where.account_id = account_id;

      const transactions = await Transaction.findAll({
        where,
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['bank_name', 'account_type']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['name', 'color', 'is_default']
          }
        ],
        order: [['date', 'DESC']]
      });

      res.json(transactions);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      res.status(500).json({ error: 'Erro ao buscar transações' });
    }
  },

  /**
   * Obtém uma transação específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID da transação.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Transação em formato JSON.
   * @throws {Error} Se a transação não for encontrada ou houver erro no banco.
   * @example
   * // GET /transactions/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { id: 1, amount: 100, type: "income", description: "Salário" }
   */
  getTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await Transaction.findOne({
        where: {
          id,
          user_id: req.user.id
        }
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar transação' });
    }
  },

  /**
   * Atualiza uma transação existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID da transação.
   * @param {Object} req.body - Dados para atualização.
   * @param {string} req.body.type - Tipo da transação (opcional).
   * @param {number} req.body.amount - Valor da transação (opcional).
   * @param {number} req.body.category_id - ID da categoria (opcional).
   * @param {string} req.body.description - Descrição da transação (opcional).
   * @param {string} req.body.date - Data da transação (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se a transação não for encontrada ou houver erro no banco.
   * @example
   * // PUT /transactions/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "amount": 150, "description": "Salário atualizado" }
   * // Retorno: { "message": "Transação atualizada com sucesso", "newBalance": 150 }
   */
  updateTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validar dados de entrada
      const validatedData = updateTransactionSchema.parse(req.body);
      const { type, amount, category_id, description, date } = validatedData;

      const transaction = await Transaction.findOne({
        where: {
          id,
          user_id: req.user.id
        }
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }

      // Busca a conta
      const account = await Account.findOne({
        where: {
          id: transaction.account_id,
          user_id: req.user.id
        }
      });

      if (!account) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      // Reverte o saldo da transação antiga
      const oldBalance = transaction.type === 'income'
        ? Number(account.balance) - Number(transaction.amount)
        : Number(account.balance) + Number(transaction.amount);

      // Aplica o novo saldo
      const newBalance = type === 'income'
        ? oldBalance + Number(amount)
        : oldBalance - Number(amount);

      // Atualiza o saldo da conta
      await account.update({ balance: newBalance });

      // Atualiza a transação
      await transaction.update({
        type,
        amount,
        category_id,
        description,
        date
      });

      res.json({ 
        message: 'Transação atualizada com sucesso',
        newBalance
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar transação' });
    }
  },

  deleteTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await Transaction.findOne({
        where: {
          id,
          user_id: req.user.id
        }
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }

      // Busca a conta
      const account = await Account.findOne({
        where: {
          id: transaction.account_id,
          user_id: req.user.id
        }
      });

      if (!account) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      // Reverte o saldo da transação
      const newBalance = transaction.type === 'income'
        ? Number(account.balance) - Number(transaction.amount)
        : Number(account.balance) + Number(transaction.amount);

      // Atualiza o saldo da conta
      await account.update({ balance: newBalance });

      // Exclui a transação
      await transaction.destroy();
      
      res.json({ 
        message: 'Transação excluída com sucesso',
        newBalance
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir transação' });
    }
  },

  getCategories: async (req, res) => {
    try {
      const user_id = req.user.id;
      const categories = await Category.findAll({
        attributes: ['id', 'name', 'type', 'color', 'is_default'],
        include: [
          {
            model: Transaction,
            as: 'transactions',
            where: { user_id },
            required: true
          }
        ],
        distinct: true
      });

      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
  },

  getSummary: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { startDate, endDate } = req.query;

      const summary = await Transaction.findAll({
        attributes: [
          'type',
          [sequelize.col('category.name'), 'category'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total']
        ],
        include: [
          {
            model: Category,
            as: 'category',
            attributes: []
          }
        ],
        where: {
          user_id,
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        group: ['type', 'category.name']
      });

      // Se não há dados, retornar objeto padrão
      if (!summary || summary.length === 0) {
        return res.json({ income: 0, expense: 0 });
      }

      // Calcular totais por tipo
      const totals = summary.reduce((acc, item) => {
        const type = item.dataValues.type;
        const total = parseFloat(item.dataValues.total) || 0;
        acc[type] = (acc[type] || 0) + total;
        return acc;
      }, {});

      res.json({
        income: totals.income || 0,
        expense: totals.expense || 0
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar resumo' });
    }
  },

  getBalanceByPeriod: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { startDate, endDate } = req.query;

      const balance = await Transaction.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('date')), 'date'],
          [
            sequelize.fn(
              'SUM',
              sequelize.literal('CASE WHEN type = "income" THEN amount ELSE -amount END')
            ),
            'daily_balance'
          ]
        ],
        where: {
          user_id,
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        group: [sequelize.fn('DATE', sequelize.col('date'))],
        order: [[sequelize.fn('DATE', sequelize.col('date')), 'ASC']]
      });

      // Se não há dados, retornar objeto padrão
      if (!balance || balance.length === 0) {
        return res.json({ balance: 0 });
      }

      // Calcular saldo total do período
      const totalBalance = balance.reduce((acc, item) => {
        return acc + (parseFloat(item.dataValues.daily_balance) || 0);
      }, 0);

      res.json({ balance: totalBalance });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar saldo por período' });
    }
  },

  /**
   * Obtém estatísticas detalhadas de transações.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas detalhadas em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/transactions/stats
   * // Retorno: { monthlyStats: {...}, categoryStats: {...}, trendStats: {...} }
   */
  async getStats(req, res) {
    try {
      const userId = req.userId;
      const { period = 'month' } = req.query;
      
      const currentDate = new Date();
      let startDate, endDate;
      
      // Definir período baseado no parâmetro
      switch (period) {
        case 'week':
          startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = currentDate;
          break;
        case 'month':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'quarter':
          const quarter = Math.floor(currentDate.getMonth() / 3);
          startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
          endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
          break;
        case 'year':
          startDate = new Date(currentDate.getFullYear(), 0, 1);
          endDate = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59);
          break;
        default:
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      }

      // Buscar transações do período
      const transactions = await Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['name', 'type', 'color']
        }]
      });

      // Estatísticas por tipo
      const incomeTransactions = transactions.filter(t => t.type === 'income');
      const expenseTransactions = transactions.filter(t => t.type === 'expense');

      const totalIncome = incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const netAmount = totalIncome - totalExpenses;

      // Estatísticas por categoria
      const categoryStats = transactions
        .filter(t => t.category)
        .reduce((acc, t) => {
          const categoryName = t.category.name;
          if (!acc[categoryName]) {
            acc[categoryName] = {
              name: categoryName,
              type: t.category.type,
              color: t.category.color,
              count: 0,
              total: 0,
              average: 0
            };
          }
          acc[categoryName].count++;
          acc[categoryName].total += parseFloat(t.amount || 0);
          return acc;
        }, {});

      // Calcular médias
      Object.values(categoryStats).forEach(cat => {
        cat.average = cat.count > 0 ? cat.total / cat.count : 0;
        cat.total = Math.round(cat.total * 100) / 100;
        cat.average = Math.round(cat.average * 100) / 100;
      });

      // Top categorias
      const topIncomeCategories = Object.values(categoryStats)
        .filter(cat => cat.type === 'income')
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      const topExpenseCategories = Object.values(categoryStats)
        .filter(cat => cat.type === 'expense')
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Estatísticas de tendência (comparação com período anterior)
      const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
      const previousEndDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);

      const previousTransactions = await Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [previousStartDate, previousEndDate]
          }
        }
      });

      const previousIncome = previousTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      const previousExpenses = previousTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const incomeChange = previousIncome > 0 ? ((totalIncome - previousIncome) / previousIncome) * 100 : 0;
      const expensesChange = previousExpenses > 0 ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 : 0;
      
      const previousNet = previousIncome - previousExpenses;
      const currentNet = totalIncome - totalExpenses;
      const netChange = previousNet !== 0 ? ((currentNet - previousNet) / Math.abs(previousNet)) * 100 : 0;

      const stats = {
        period,
        summary: {
          totalTransactions: transactions.length,
          totalIncome: Math.round(totalIncome * 100) / 100,
          totalExpenses: Math.round(totalExpenses * 100) / 100,
          netAmount: Math.round(netAmount * 100) / 100,
          averageTransaction: transactions.length > 0 ? Math.round((totalIncome + totalExpenses) / transactions.length * 100) / 100 : 0
        },
        trends: {
          incomeChange: Math.round(incomeChange * 100) / 100,
          expensesChange: Math.round(expensesChange * 100) / 100,
          netChange: Math.round(netChange * 100) / 100
        },
        categories: {
          all: Object.values(categoryStats),
          topIncome: topIncomeCategories,
          topExpenses: topExpenseCategories
        },
        distribution: {
          incomeCount: incomeTransactions.length,
          expenseCount: expenseTransactions.length,
          incomePercentage: transactions.length > 0 ? Math.round((incomeTransactions.length / transactions.length) * 100) : 0,
          expensePercentage: transactions.length > 0 ? Math.round((expenseTransactions.length / transactions.length) * 100) : 0
        }
      };

      return res.json(stats);
    } catch (error) {
      console.error('Erro ao obter estatísticas de transações:', error);
      return res.status(500).json({
        error: 'Erro ao obter estatísticas de transações'
      });
    }
  },

  /**
   * Obtém dados para gráficos de transações.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Dados para gráficos em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/transactions/charts
   * // Retorno: { timeline: [...], categoryChart: [...], trendChart: [...] }
   */
  async getCharts(req, res) {
    try {
      const userId = req.userId;
      const { type = 'timeline', period = 'month' } = req.query;
      
      const currentDate = new Date();
      let data;

      switch (type) {
        case 'timeline':
          data = await getTimelineData(userId, period);
          break;
        case 'category':
          data = await getCategoryChartData(userId, period);
          break;
        case 'trend':
          data = await getTrendChartData(userId, period);
          break;
        default:
          data = await getTimelineData(userId, period);
      }

      return res.json(data);
    } catch (error) {
      console.error('Erro ao obter dados para gráficos:', error);
      return res.status(500).json({
        error: 'Erro ao obter dados para gráficos'
      });
    }
  },

  /**
   * Obtém dados de timeline para gráficos.
   * @param {string} userId - ID do usuário.
   * @param {string} period - Período (week, month, quarter, year).
   * @returns {Promise<Object>} Dados de timeline.
   */
  async getTimelineData(userId, period) {
    const currentDate = new Date();
    const data = [];
    
    let intervals, intervalType;
    switch (period) {
      case 'week':
        intervals = 7;
        intervalType = 'day';
        break;
      case 'month':
        intervals = 30;
        intervalType = 'day';
        break;
      case 'quarter':
        intervals = 12;
        intervalType = 'week';
        break;
      case 'year':
        intervals = 12;
        intervalType = 'month';
        break;
      default:
        intervals = 30;
        intervalType = 'day';
    }

    for (let i = intervals - 1; i >= 0; i--) {
      let startDate, endDate, label;
      
      if (intervalType === 'day') {
        startDate = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
        label = startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      } else if (intervalType === 'week') {
        startDate = new Date(currentDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        label = `Semana ${Math.ceil((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
      } else {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
        label = startDate.toLocaleDateString('pt-BR', { month: 'short' });
      }

      const transactions = await Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      data.push({
        label,
        date: startDate.toISOString(),
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        net: Math.round((income - expenses) * 100) / 100,
        count: transactions.length
      });
    }

    return { timeline: data };
  },

  /**
   * Obtém dados de categoria para gráficos.
   * @param {string} userId - ID do usuário.
   * @param {string} period - Período.
   * @returns {Promise<Object>} Dados de categoria.
   */
  async getCategoryChartData(userId, period) {
    const currentDate = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(currentDate.getMonth() / 3);
        startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    }

    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.gte]: startDate
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'type', 'color']
      }]
    });

    const categoryData = transactions
      .filter(t => t.category)
      .reduce((acc, t) => {
        const categoryName = t.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            type: t.category.type,
            color: t.category.color,
            total: 0,
            count: 0
          };
        }
        acc[categoryName].total += parseFloat(t.amount || 0);
        acc[categoryName].count++;
        return acc;
      }, {});

    const incomeCategories = Object.values(categoryData)
      .filter(cat => cat.type === 'income')
      .map(cat => ({
        ...cat,
        total: Math.round(cat.total * 100) / 100
      }))
      .sort((a, b) => b.total - a.total);

    const expenseCategories = Object.values(categoryData)
      .filter(cat => cat.type === 'expense')
      .map(cat => ({
        ...cat,
        total: Math.round(cat.total * 100) / 100
      }))
      .sort((a, b) => b.total - a.total);

    return {
      income: incomeCategories,
      expenses: expenseCategories
    };
  },

  /**
   * Obtém dados de tendência para gráficos.
   * @param {string} userId - ID do usuário.
   * @param {string} period - Período.
   * @returns {Promise<Object>} Dados de tendência.
   */
  async getTrendChartData(userId, period) {
    const currentDate = new Date();
    const data = [];
    
    // Últimos 12 períodos
    for (let i = 11; i >= 0; i--) {
      let startDate, endDate, label;
      
      if (period === 'month') {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
        label = startDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      } else {
        startDate = new Date(currentDate.getTime() - i * 30 * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000 - 1);
        label = startDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      }

      const transactions = await Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const count = transactions.length;
      const average = count > 0 ? total / count : 0;

      data.push({
        label,
        date: startDate.toISOString(),
        total: Math.round(total * 100) / 100,
        count,
        average: Math.round(average * 100) / 100
      });
    }

    return { trend: data };
  }
};

module.exports = transactionController; 