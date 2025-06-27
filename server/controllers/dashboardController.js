const { Transaction, Account, Category, FixedAccount, Notification, InvestmentGoal } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../utils/errors');
const { successResponse } = require('../utils/response');
const cacheService = require('../services/cacheService');

/**
 * Controller para endpoints do Dashboard Principal
 * Fornece métricas consolidadas, dados para gráficos e alertas
 */
class DashboardController {
  /**
   * Obtém métricas financeiras consolidadas para o dashboard.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Métricas consolidadas em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/dashboard/metrics
   * // Retorno: { totalBalance: 15000, monthlyIncome: 5000, monthlyExpenses: 3000, ... }
   */
  async getMetrics(req, res) {
    try {
      const userId = req.userId;
      // Chave de cache única por usuário
      const cacheKey = `dashboard:metrics:${userId}`;
      // Busca do cache, fallback para getMetricsData
      const metrics = await cacheService.getStats(cacheKey, async () => {
        const data = await this.getMetricsData(userId);
        return {
          ...data,
          lastUpdated: new Date().toISOString()
        };
      }, 600); // 10 minutos
      return successResponse(res, metrics, 'Métricas do dashboard obtidas com sucesso');
    } catch (error) {
      console.error('Erro ao obter métricas do dashboard:', error);
      return res.status(500).json({
        error: 'Erro ao obter métricas do dashboard'
      });
    }
  }

  /**
   * Obtém dados para gráficos do dashboard.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Dados para gráficos em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/dashboard/charts
   * // Retorno: { balanceEvolution: [...], categoryDistribution: [...], ... }
   */
  async getCharts(req, res) {
    try {
      const userId = req.userId;
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      // Evolução de saldo nos últimos 12 meses
      const balanceEvolution = [];
      for (let i = 11; i >= 0; i--) {
        const month = currentMonth - i;
        const year = currentYear + Math.floor(month / 12);
        const adjustedMonth = month < 0 ? month + 12 : month % 12;
        
        const startOfMonth = new Date(year, adjustedMonth, 1);
        const endOfMonth = new Date(year, adjustedMonth + 1, 0, 23, 59, 59);

        // Buscar transações até o final do mês
        const transactions = await Transaction.findAll({
          where: {
            user_id: userId,
            date: {
              [Op.lte]: endOfMonth
            }
          }
        });

        // Calcular saldo acumulado até o final do mês
        const balance = transactions.reduce((sum, t) => {
          if (t.type === 'income') {
            return sum + parseFloat(t.amount || 0);
          } else {
            return sum - parseFloat(t.amount || 0);
          }
        }, 0);

        balanceEvolution.push({
          month: `${year}-${String(adjustedMonth + 1).padStart(2, '0')}`,
          balance: parseFloat(balance.toFixed(2))
        });
      }

      // Distribuição por categoria (receitas/despesas) do mês atual
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

      const currentMonthTransactions = await Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [startOfMonth, endOfMonth]
          }
        },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['name', 'type', 'color', 'is_default']
        }]
      });

      const categoryDistribution = currentMonthTransactions.reduce((acc, t) => {
        if (!t.category) return acc;
        
        const categoryName = t.category.name;
        const categoryType = t.category.type;
        const amount = parseFloat(t.amount || 0);
        
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            type: categoryType,
            color: t.category.color,
            income: 0,
            expenses: 0
          };
        }
        
        if (t.type === 'income') {
          acc[categoryName].income += amount;
        } else {
          acc[categoryName].expenses += amount;
        }
        
        return acc;
      }, {});

      const categoryDistributionArray = Object.values(categoryDistribution).map(cat => ({
        ...cat,
        income: parseFloat(cat.income.toFixed(2)),
        expenses: parseFloat(cat.expenses.toFixed(2))
      }));

      // Comparativo mensal (atual vs anterior)
      const startOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfPreviousMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

      const previousMonthTransactions = await Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [startOfPreviousMonth, endOfPreviousMonth]
          }
        }
      });

      const currentMonthIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      const currentMonthExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const previousMonthIncome = previousMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      const previousMonthExpenses = previousMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const monthlyComparison = {
        current: {
          income: parseFloat(currentMonthIncome.toFixed(2)),
          expenses: parseFloat(currentMonthExpenses.toFixed(2)),
          net: parseFloat((currentMonthIncome - currentMonthExpenses).toFixed(2))
        },
        previous: {
          income: parseFloat(previousMonthIncome.toFixed(2)),
          expenses: parseFloat(previousMonthExpenses.toFixed(2)),
          net: parseFloat((previousMonthIncome - previousMonthExpenses).toFixed(2))
        }
      };

      // Projeção de fluxo de caixa (próximos 6 meses)
      const cashFlowProjection = [];
      const averageMonthlyIncome = balanceEvolution
        .slice(-6)
        .reduce((sum, month) => sum + month.balance, 0) / 6;
      
      const averageMonthlyExpenses = Math.abs(balanceEvolution
        .slice(-6)
        .reduce((sum, month, index, array) => {
          if (index > 0) {
            return sum + (array[index - 1].balance - month.balance);
          }
          return sum;
        }, 0) / 5);

      let projectedBalance = balanceEvolution[balanceEvolution.length - 1].balance;
      
      for (let i = 1; i <= 6; i++) {
        const month = currentMonth + i;
        const year = currentYear + Math.floor(month / 12);
        const adjustedMonth = month % 12;
        
        projectedBalance += averageMonthlyIncome - averageMonthlyExpenses;
        
        cashFlowProjection.push({
          month: `${year}-${String(adjustedMonth + 1).padStart(2, '0')}`,
          projectedBalance: parseFloat(projectedBalance.toFixed(2))
        });
      }

      const charts = {
        balanceEvolution,
        categoryDistribution: categoryDistributionArray,
        monthlyComparison,
        cashFlowProjection,
        lastUpdated: new Date().toISOString()
      };

      return successResponse(res, charts, 'Dados para gráficos obtidos com sucesso');
    } catch (error) {
      console.error('Erro ao obter dados para gráficos:', error);
      return res.status(500).json({
        error: 'Erro ao obter dados para gráficos'
      });
    }
  }

  /**
   * Obtém alertas e notificações para o dashboard.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Alertas e notificações em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/dashboard/alerts
   * // Retorno: { overdueAccounts: [...], lowBalance: [...], ... }
   */
  async getAlerts(req, res) {
    try {
      const userId = req.userId;
      const currentDate = new Date();

      // Contas vencidas
      const overdueFixedAccounts = await FixedAccount.findAll({
        where: {
          user_id: userId,
          next_due_date: {
            [Op.lt]: currentDate
          },
          is_paid: false
        },
        attributes: ['id', 'description', 'amount', 'next_due_date'],
        order: [['next_due_date', 'ASC']]
      });
      console.log('overdueFixedAccounts', overdueFixedAccounts);

      // Saldo baixo (contas com saldo menor que 10% do valor médio)
      const accounts = await Account.findAll({
        where: { user_id: userId },
        attributes: ['id', 'description', 'balance']
      });
      console.log('accounts', accounts);

      const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0);
      const averageBalance = accounts.length > 0 ? totalBalance / accounts.length : 0;
      const lowBalanceThreshold = averageBalance * 0.1;

      const lowBalanceAccounts = averageBalance > 0 ? accounts.filter(account => 
        parseFloat(account.balance || 0) < lowBalanceThreshold
      ) : [];
      console.log('lowBalanceAccounts', lowBalanceAccounts);

      // Pagamentos pendentes (contas fixas vencendo nos próximos 7 dias)
      const nextWeek = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingPayments = await FixedAccount.findAll({
        where: {
          user_id: userId,
          next_due_date: {
            [Op.between]: [currentDate, nextWeek]
          },
          is_paid: false
        },
        attributes: ['id', 'description', 'amount', 'next_due_date'],
        order: [['next_due_date', 'ASC']]
      });
      console.log('upcomingPayments', upcomingPayments);

      // Notificações não lidas
      const unreadNotifications = await Notification.findAll({
        where: {
          user_id: userId,
          is_read: false
        },
        attributes: ['id', 'title', 'message', 'type', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 10
      });
      console.log('unreadNotifications', unreadNotifications);

      // Metas não atingidas (investimentos com progresso baixo)
      const investmentGoals = await InvestmentGoal.findAll({
        where: { user_id: userId }
      });
      console.log('investmentGoals', investmentGoals);

      const unmetGoals = (investmentGoals || []).filter(goal => {
        const currentAmount = goal.current_amount || 0;
        const progress = goal.target_amount > 0 ? (currentAmount / goal.target_amount) * 100 : 0;
        return progress < 50; // Considera meta não atingida se progresso < 50%
      }).map(goal => ({
        id: goal.id,
        name: goal.title,
        targetAmount: goal.target_amount,
        currentAmount: goal.current_amount || 0,
        progress: goal.target_amount > 0 ? Math.round((goal.current_amount || 0) / goal.target_amount * 100 * 100) / 100 : 0
      }));
      console.log('unmetGoals', unmetGoals);

      const alerts = {
        overdueAccounts: (overdueFixedAccounts || []).map(account => ({
          id: account.id,
          name: account.description,
          amount: parseFloat(account.amount),
          dueDate: account.next_due_date,
          daysOverdue: Math.floor((currentDate - account.next_due_date) / (1000 * 60 * 60 * 24))
        })),
        lowBalance: (lowBalanceAccounts || []).map(account => ({
          id: account.id,
          name: account.description,
          balance: parseFloat(account.balance || 0),
          threshold: parseFloat(lowBalanceThreshold.toFixed(2))
        })),
        upcomingPayments: (upcomingPayments || []).map(payment => ({
          id: payment.id,
          name: payment.description,
          amount: parseFloat(payment.amount),
          dueDate: payment.next_due_date,
          daysUntilDue: Math.ceil((payment.next_due_date - currentDate) / (1000 * 60 * 60 * 24))
        })),
        unreadNotifications: (unreadNotifications || []).map(notification => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.created_at
        })),
        unmetGoals,
        summary: {
          totalOverdue: overdueFixedAccounts.length,
          totalLowBalance: lowBalanceAccounts.length,
          totalUpcoming: upcomingPayments.length,
          totalUnread: unreadNotifications.length,
          totalUnmetGoals: unmetGoals.length
        },
        lastUpdated: new Date().toISOString()
      };

      return successResponse(res, alerts, 'Alertas obtidos com sucesso');
    } catch (error) {
      console.error('Erro ao obter alertas:', error);
      return res.status(500).json({
        error: 'Erro ao obter alertas',
        details: error?.message || error
      });
    }
  }

  /**
   * Obtém todos os dados do dashboard de uma vez.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Todos os dados do dashboard em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/dashboard
   * // Retorno: { metrics: {...}, charts: {...}, alerts: {...} }
   */
  async getDashboard(req, res) {
    try {
      const userId = req.userId;
      const controller = new DashboardController();
      
      // Buscar métricas, gráficos e alertas em paralelo
      const [metrics, charts, alerts] = await Promise.all([
        controller.getMetricsData(userId),
        controller.getChartsData(userId),
        controller.getAlertsData(userId)
      ]);

      const dashboardData = {
        metrics,
        charts,
        alerts,
        lastUpdated: new Date().toISOString()
      };

      return successResponse(res, dashboardData, 'Dados do dashboard obtidos com sucesso');
    } catch (error) {
      console.error('Erro ao obter dados do dashboard:', error);
      return res.status(500).json({
        error: 'Erro ao obter dados do dashboard'
      });
    }
  }

  /**
   * Obtém dados de métricas para uso interno.
   * @param {string} userId - ID do usuário.
   * @returns {Promise<Object>} Dados de métricas.
   */
  async getMetricsData(userId) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Data de início e fim do mês atual
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    
    // Data de início e fim do mês anterior
    const startOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfPreviousMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Buscar saldo total atual
    const accounts = await Account.findAll({
      where: { user_id: userId },
      attributes: ['id', 'balance', 'description']
    });
    
    const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0);

    // Buscar transações do mês atual
    const currentMonthTransactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'type', 'color', 'is_default']
      }]
    });

    // Buscar transações do mês anterior
    const previousMonthTransactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.between]: [startOfPreviousMonth, endOfPreviousMonth]
        }
      }
    });

    // Calcular receitas e despesas do mês atual
    const currentMonthIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const currentMonthExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Calcular receitas e despesas do mês anterior
    const previousMonthIncome = previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const previousMonthExpenses = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Calcular variações percentuais
    const incomeVariation = previousMonthIncome > 0 
      ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100 
      : 0;
    
    const expensesVariation = previousMonthExpenses > 0 
      ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 
      : 0;

    // Top 5 categorias de gastos
    const expenseCategories = currentMonthTransactions
      .filter(t => t.type === 'expense' && t.category)
      .reduce((acc, t) => {
        const categoryName = t.category.name;
        acc[categoryName] = (acc[categoryName] || 0) + parseFloat(t.amount || 0);
        return acc;
      }, {});

    const topExpenseCategories = Object.entries(expenseCategories)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Buscar contas vencidas
    const overdueFixedAccounts = await FixedAccount.findAll({
      where: {
        user_id: userId,
        next_due_date: {
          [Op.lt]: currentDate
        },
        is_paid: false
      },
      attributes: ['id', 'description', 'amount', 'next_due_date']
    });

    const overdueAmount = overdueFixedAccounts.reduce((sum, account) => 
      sum + parseFloat(account.amount || 0), 0
    );

    // Projeção para o próximo mês (baseada na média dos últimos 3 meses)
    const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
    const threeMonthsTransactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.gte]: threeMonthsAgo
        }
      }
    });

    const monthlyAverages = threeMonthsTransactions.reduce((acc, t) => {
      const month = t.date.getMonth();
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0, count: 0 };
      }
      if (t.type === 'income') {
        acc[month].income += parseFloat(t.amount || 0);
      } else {
        acc[month].expenses += parseFloat(t.amount || 0);
      }
      acc[month].count++;
      return acc;
    }, {});

    const averageIncome = Object.values(monthlyAverages).length > 0
      ? Object.values(monthlyAverages).reduce((sum, month) => sum + month.income, 0) / Object.values(monthlyAverages).length
      : 0;
    
    const averageExpenses = Object.values(monthlyAverages).length > 0
      ? Object.values(monthlyAverages).reduce((sum, month) => sum + month.expenses, 0) / Object.values(monthlyAverages).length
      : 0;

    const projectedBalance = totalBalance + averageIncome - averageExpenses;

    return {
      totalBalance: Math.round(totalBalance * 100) / 100,
      monthlyIncome: Math.round(currentMonthIncome * 100) / 100,
      monthlyExpenses: Math.round(currentMonthExpenses * 100) / 100,
      monthlyNet: Math.round((currentMonthIncome - currentMonthExpenses) * 100) / 100,
      incomeVariation: Math.round(incomeVariation * 100) / 100,
      expensesVariation: Math.round(expensesVariation * 100) / 100,
      topExpenseCategories,
      overdueAccounts: overdueFixedAccounts.length,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      projectedBalance: Math.round(projectedBalance * 100) / 100,
      accountsCount: accounts.length
    };
  }

  /**
   * Obtém dados de gráficos para uso interno.
   * @param {string} userId - ID do usuário.
   * @returns {Promise<Object>} Dados de gráficos.
   */
  async getChartsData(userId) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Evolução de saldo nos últimos 12 meses
    const balanceEvolution = [];
    for (let i = 11; i >= 0; i--) {
      const month = new Date(currentYear, currentMonth - i, 1);
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

      const monthTransactions = await Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [startOfMonth, endOfMonth]
          }
        }
      });

      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      balanceEvolution.push({
        month: month.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        income: Math.round(monthIncome * 100) / 100,
        expenses: Math.round(monthExpenses * 100) / 100,
        net: Math.round((monthIncome - monthExpenses) * 100) / 100
      });
    }

    // Distribuição por categoria (últimos 3 meses)
    const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
    const categoryTransactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.gte]: threeMonthsAgo
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'type', 'color']
      }]
    });

    const categoryDistribution = categoryTransactions
      .filter(t => t.category)
      .reduce((acc, t) => {
        const categoryName = t.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            type: t.category.type,
            color: t.category.color,
            income: 0,
            expenses: 0
          };
        }
        if (t.type === 'income') {
          acc[categoryName].income += parseFloat(t.amount || 0);
        } else {
          acc[categoryName].expenses += parseFloat(t.amount || 0);
        }
        return acc;
      }, {});

    const categoryData = Object.values(categoryDistribution).map(cat => ({
      ...cat,
      income: Math.round(cat.income * 100) / 100,
      expenses: Math.round(cat.expenses * 100) / 100
    }));

    return {
      balanceEvolution,
      categoryDistribution: categoryData
    };
  }

  /**
   * Obtém dados de alertas para uso interno.
   * @param {string} userId - ID do usuário.
   * @returns {Promise<Object>} Dados de alertas.
   */
  async getAlertsData(userId) {
    const currentDate = new Date();
    const sevenDaysFromNow = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Contas vencidas
    const overdueAccounts = await FixedAccount.findAll({
      where: {
        user_id: userId,
        next_due_date: {
          [Op.lt]: currentDate
        },
        is_paid: false
      },
      attributes: ['id', 'description', 'amount', 'next_due_date'],
      order: [['next_due_date', 'ASC']]
    });

    // Contas próximas do vencimento (próximos 7 dias)
    const upcomingAccounts = await FixedAccount.findAll({
      where: {
        user_id: userId,
        next_due_date: {
          [Op.between]: [currentDate, sevenDaysFromNow]
        },
        is_paid: false
      },
      attributes: ['id', 'description', 'amount', 'next_due_date'],
      order: [['next_due_date', 'ASC']]
    });

    // Notificações não lidas
    const unreadNotifications = await Notification.findAll({
      where: {
        user_id: userId,
        is_read: false
      },
      attributes: ['id', 'title', 'message', 'type', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Contas com saldo baixo (menor que 10% da média)
    const accounts = await Account.findAll({
      where: { user_id: userId },
      attributes: ['id', 'balance', 'description']
    });

    const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0);
    const averageBalance = totalBalance / accounts.length;
    const lowBalanceThreshold = averageBalance * 0.1;

    const lowBalanceAccounts = accounts.filter(account => 
      parseFloat(account.balance || 0) < lowBalanceThreshold
    );

    return {
      overdueAccounts: overdueAccounts.map(account => ({
        id: account.id,
        description: account.description,
        amount: Math.round(parseFloat(account.amount || 0) * 100) / 100,
        dueDate: account.next_due_date,
        daysOverdue: Math.floor((currentDate - account.next_due_date) / (1000 * 60 * 60 * 24))
      })),
      upcomingAccounts: upcomingAccounts.map(account => ({
        id: account.id,
        description: account.description,
        amount: Math.round(parseFloat(account.amount || 0) * 100) / 100,
        dueDate: account.next_due_date,
        daysUntilDue: Math.ceil((account.next_due_date - currentDate) / (1000 * 60 * 60 * 24))
      })),
      unreadNotifications: unreadNotifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.created_at
      })),
      lowBalanceAccounts: lowBalanceAccounts.map(account => ({
        id: account.id,
        description: account.description,
        balance: Math.round(parseFloat(account.balance || 0) * 100) / 100,
        threshold: Math.round(lowBalanceThreshold * 100) / 100
      })),
      summary: {
        totalOverdue: overdueAccounts.length,
        totalUpcoming: upcomingAccounts.length,
        totalUnread: unreadNotifications.length,
        totalLowBalance: lowBalanceAccounts.length
      }
    };
  }

  /**
   * Carrega todos os dados do dashboard em uma única requisição
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   * @returns {Promise<Object>} Dados completos do dashboard
   * @throws {Error} Se houver erro ao carregar os dados
   * @example
   * // GET /api/dashboard/all
   * // Retorno: { metrics: {...}, charts: {...}, transactions: [...], alerts: [...] }
   */
  async getAllDashboardData(req, res) {
    try {
      const userId = req.userId;
      const period = req.query.period || 'month';
      const days = parseInt(req.query.days) || 30;
      const limit = parseInt(req.query.limit) || 10;

      // Carrega todos os dados em paralelo
      const [
        metrics,
        charts,
        alerts
      ] = await Promise.all([
        this.getMetricsData(userId),
        this.getChartsData(userId),
        this.getAlertsData(userId)
      ]);

      // Busca transações recentes
      const recentTransactions = await Transaction.findAll({
        where: { user_id: userId },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['name', 'type', 'color']
        }],
        order: [['date', 'DESC']],
        limit: limit
      });

      const formattedTransactions = recentTransactions.map(transaction => ({
        id: transaction.id,
        description: transaction.description,
        amount: Math.round(parseFloat(transaction.amount || 0) * 100) / 100,
        type: transaction.type,
        date: transaction.date,
        category: transaction.category ? {
          name: transaction.category.name,
          type: transaction.category.type,
          color: transaction.category.color
        } : null
      }));

      // Retorna todos os dados em uma única resposta
      return successResponse(res, {
        metrics,
        charts,
        recentTransactions: formattedTransactions,
        alerts,
        timestamp: new Date().toISOString()
      }, 'Dados completos do dashboard carregados com sucesso');

    } catch (error) {
      console.error('Erro ao carregar dados completos do dashboard:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
}

module.exports = new DashboardController(); 