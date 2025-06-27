const { Transaction, Account, Category, FixedAccount, Notification, InvestmentGoal } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../utils/errors');
const cacheService = require('./cacheService');

/**
 * Service responsável por gerenciar dados do dashboard.
 * Contém toda a lógica de negócio relacionada a métricas e gráficos.
 */
class DashboardService {
  /**
   * Obtém métricas financeiras consolidadas para o dashboard.
   * @param {number} userId - ID do usuário autenticado.
   * @returns {Promise<Object>} Métricas consolidadas.
   */
  async getMetrics(userId) {
    const cacheKey = `dashboard:metrics:${userId}`;
    
    return await cacheService.getStats(cacheKey, async () => {
      const data = await this.getMetricsData(userId);
      return {
        ...data,
        lastUpdated: new Date().toISOString()
      };
    }, 600); // 10 minutos
  }

  /**
   * Obtém dados para gráficos do dashboard.
   * @param {number} userId - ID do usuário autenticado.
   * @returns {Promise<Object>} Dados para gráficos.
   */
  async getCharts(userId) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Evolução de saldo nos últimos 12 meses
    const balanceEvolution = await this.getBalanceEvolution(userId, currentYear, currentMonth);

    // Distribuição por categoria do mês atual
    const categoryDistribution = await this.getCategoryDistribution(userId, currentYear, currentMonth);

    // Comparativo mensal (atual vs anterior)
    const monthlyComparison = await this.getMonthlyComparison(userId, currentYear, currentMonth);

    // Projeção de fluxo de caixa
    const cashFlowProjection = await this.getCashFlowProjection(balanceEvolution);

    return {
      balanceEvolution,
      categoryDistribution,
      monthlyComparison,
      cashFlowProjection
    };
  }

  /**
   * Obtém alertas e notificações para o dashboard.
   * @param {number} userId - ID do usuário autenticado.
   * @returns {Promise<Object>} Alertas e notificações.
   */
  async getAlerts(userId) {
    const currentDate = new Date();
    const alerts = [];

    // Alertas de contas fixas vencendo
    const upcomingFixedAccounts = await FixedAccount.findAll({
      where: {
        user_id: userId,
        due_date: {
          [Op.between]: [currentDate, new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)]
        },
        is_paid: false
      },
      include: [{
        model: Account,
        as: 'account',
        attributes: ['name']
      }]
    });

    upcomingFixedAccounts.forEach(account => {
      const daysUntilDue = Math.ceil((new Date(account.due_date) - currentDate) / (1000 * 60 * 60 * 24));
      alerts.push({
        type: 'fixed_account_due',
        title: 'Conta fixa vencendo',
        message: `${account.description} vence em ${daysUntilDue} dias`,
        severity: daysUntilDue <= 3 ? 'high' : 'medium',
        data: {
          account_id: account.id,
          due_date: account.due_date,
          amount: account.amount
        }
      });
    });

    // Alertas de saldo baixo
    const accounts = await Account.findAll({
      where: { user_id: userId }
    });

    accounts.forEach(account => {
      const balance = parseFloat(account.balance || 0);
      const minBalance = parseFloat(account.min_balance || 0);
      
      if (balance <= minBalance) {
        alerts.push({
          type: 'low_balance',
          title: 'Saldo baixo',
          message: `Conta ${account.name} está com saldo baixo`,
          severity: 'high',
          data: {
            account_id: account.id,
            current_balance: balance,
            min_balance: minBalance
          }
        });
      }
    });

    // Alertas de metas de investimento
    const investmentGoals = await InvestmentGoal.findAll({
      where: { user_id: userId }
    });

    investmentGoals.forEach(goal => {
      const currentAmount = parseFloat(goal.current_amount || 0);
      const targetAmount = parseFloat(goal.target_amount);
      const progress = (currentAmount / targetAmount) * 100;
      const daysUntilDeadline = Math.ceil((new Date(goal.deadline) - currentDate) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline <= 30 && progress < 80) {
        alerts.push({
          type: 'investment_goal_at_risk',
          title: 'Meta de investimento em risco',
          message: `${goal.name} está ${(100 - progress).toFixed(1)}% atrasada`,
          severity: 'high',
          data: {
            goal_id: goal.id,
            progress: progress,
            days_until_deadline: daysUntilDeadline
          }
        });
      }
    });

    // Notificações não lidas
    const unreadNotifications = await Notification.findAll({
      where: {
        user_id: userId,
        is_read: false
      },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    return {
      alerts,
      unreadNotifications,
      totalAlerts: alerts.length,
      totalUnreadNotifications: unreadNotifications.length
    };
  }

  /**
   * Obtém todos os dados do dashboard de uma vez.
   * @param {number} userId - ID do usuário autenticado.
   * @returns {Promise<Object>} Todos os dados do dashboard.
   */
  async getAllDashboardData(userId) {
    const [metrics, charts, alerts] = await Promise.all([
      this.getMetrics(userId),
      this.getCharts(userId),
      this.getAlerts(userId)
    ]);

    return {
      metrics,
      charts,
      alerts,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calcula a evolução de saldo nos últimos 12 meses.
   * @param {number} userId - ID do usuário.
   * @param {number} currentYear - Ano atual.
   * @param {number} currentMonth - Mês atual.
   * @returns {Promise<Array>} Array com evolução do saldo.
   */
  async getBalanceEvolution(userId, currentYear, currentMonth) {
    const balanceEvolution = [];
    
    for (let i = 11; i >= 0; i--) {
      const month = currentMonth - i;
      const year = currentYear + Math.floor(month / 12);
      const adjustedMonth = month < 0 ? month + 12 : month % 12;
      
      const startOfMonth = new Date(year, adjustedMonth, 1);
      const endOfMonth = new Date(year, adjustedMonth + 1, 0, 23, 59, 59);

      const transactions = await Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.lte]: endOfMonth
          }
        }
      });

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

    return balanceEvolution;
  }

  /**
   * Calcula a distribuição por categoria do mês atual.
   * @param {number} userId - ID do usuário.
   * @param {number} currentYear - Ano atual.
   * @param {number} currentMonth - Mês atual.
   * @returns {Promise<Array>} Array com distribuição por categoria.
   */
  async getCategoryDistribution(userId, currentYear, currentMonth) {
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

    return Object.values(categoryDistribution).map(cat => ({
      ...cat,
      income: parseFloat(cat.income.toFixed(2)),
      expenses: parseFloat(cat.expenses.toFixed(2))
    }));
  }

  /**
   * Calcula o comparativo mensal (atual vs anterior).
   * @param {number} userId - ID do usuário.
   * @param {number} currentYear - Ano atual.
   * @param {number} currentMonth - Mês atual.
   * @returns {Promise<Object>} Comparativo mensal.
   */
  async getMonthlyComparison(userId, currentYear, currentMonth) {
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    const startOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfPreviousMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const [currentMonthTransactions, previousMonthTransactions] = await Promise.all([
      Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [startOfMonth, endOfMonth]
          }
        }
      }),
      Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [startOfPreviousMonth, endOfPreviousMonth]
          }
        }
      })
    ]);

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

    return {
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
  }

  /**
   * Calcula a projeção de fluxo de caixa.
   * @param {Array} balanceEvolution - Evolução do saldo.
   * @returns {Promise<Array>} Projeção de fluxo de caixa.
   */
  async getCashFlowProjection(balanceEvolution) {
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

    let currentBalance = balanceEvolution[balanceEvolution.length - 1].balance;

    for (let i = 1; i <= 6; i++) {
      const projectedIncome = averageMonthlyIncome * 0.1; // 10% de variação
      const projectedExpenses = averageMonthlyExpenses * 0.1; // 10% de variação
      
      currentBalance += projectedIncome - projectedExpenses;
      
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      cashFlowProjection.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        projectedBalance: parseFloat(currentBalance.toFixed(2)),
        projectedIncome: parseFloat(projectedIncome.toFixed(2)),
        projectedExpenses: parseFloat(projectedExpenses.toFixed(2))
      });
    }

    return cashFlowProjection;
  }

  /**
   * Obtém dados de métricas do usuário.
   * @param {number} userId - ID do usuário.
   * @returns {Promise<Object>} Dados de métricas.
   */
  async getMetricsData(userId) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Períodos para cálculos
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // Buscar transações dos períodos
    const [monthlyTransactions, yearlyTransactions, allTransactions] = await Promise.all([
      Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [startOfMonth, endOfMonth]
          }
        }
      }),
      Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [startOfYear, endOfYear]
          }
        }
      }),
      Transaction.findAll({
        where: { user_id: userId }
      })
    ]);

    // Calcular métricas
    const totalBalance = allTransactions.reduce((sum, t) => {
      if (t.type === 'income') {
        return sum + parseFloat(t.amount || 0);
      } else {
        return sum - parseFloat(t.amount || 0);
      }
    }, 0);

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const yearlyIncome = yearlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const yearlyExpenses = yearlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Contas bancárias
    const accounts = await Account.findAll({
      where: { user_id: userId }
    });

    const totalAccountBalance = accounts.reduce((sum, account) => {
      return sum + parseFloat(account.balance || 0);
    }, 0);

    // Contas fixas
    const fixedAccounts = await FixedAccount.findAll({
      where: {
        user_id: userId,
        is_paid: false
      }
    });

    const totalFixedAccounts = fixedAccounts.reduce((sum, account) => {
      return sum + parseFloat(account.amount || 0);
    }, 0);

    // Metas de investimento
    const investmentGoals = await InvestmentGoal.findAll({
      where: { user_id: userId }
    });

    const totalInvestmentGoals = investmentGoals.reduce((sum, goal) => {
      return sum + parseFloat(goal.target_amount || 0);
    }, 0);

    const totalCurrentInvestment = investmentGoals.reduce((sum, goal) => {
      return sum + parseFloat(goal.current_amount || 0);
    }, 0);

    return {
      totalBalance: parseFloat(totalBalance.toFixed(2)),
      totalAccountBalance: parseFloat(totalAccountBalance.toFixed(2)),
      monthlyIncome: parseFloat(monthlyIncome.toFixed(2)),
      monthlyExpenses: parseFloat(monthlyExpenses.toFixed(2)),
      monthlyNet: parseFloat((monthlyIncome - monthlyExpenses).toFixed(2)),
      yearlyIncome: parseFloat(yearlyIncome.toFixed(2)),
      yearlyExpenses: parseFloat(yearlyExpenses.toFixed(2)),
      yearlyNet: parseFloat((yearlyIncome - yearlyExpenses).toFixed(2)),
      totalFixedAccounts: parseFloat(totalFixedAccounts.toFixed(2)),
      totalInvestmentGoals: parseFloat(totalInvestmentGoals.toFixed(2)),
      totalCurrentInvestment: parseFloat(totalCurrentInvestment.toFixed(2)),
      investmentProgress: totalInvestmentGoals > 0 
        ? parseFloat(((totalCurrentInvestment / totalInvestmentGoals) * 100).toFixed(2))
        : 0,
      accountsCount: accounts.length,
      fixedAccountsCount: fixedAccounts.length,
      investmentGoalsCount: investmentGoals.length
    };
  }
}

module.exports = new DashboardService(); 