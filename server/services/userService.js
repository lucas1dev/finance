const { User, Transaction, Account, Notification } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../utils/errors');
const { createUserSchema, updateUserSchema } = require('../utils/validators');

/**
 * Service responsável por gerenciar usuários.
 * Contém toda a lógica de negócio relacionada a usuários.
 */
class UserService {
  /**
   * Obtém a lista de usuários com filtros e paginação.
   * @param {Object} queryParams - Parâmetros de consulta.
   * @returns {Promise<Object>} Lista paginada de usuários.
   */
  async getUsers(queryParams) {
    const { page = 1, limit = 10, status, role, search } = queryParams;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.active = status === 'active';
    }
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'active', 'created_at', 'last_login'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    // Converter active para status string para compatibilidade
    const usersWithStatus = users.map(user => {
      const userData = user.toJSON();
      return {
        ...userData,
        status: userData.active ? 'active' : 'inactive'
      };
    });

    return {
      users: usersWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: totalPages
      }
    };
  }

  /**
   * Obtém estatísticas de usuários.
   * @param {Object} queryParams - Parâmetros de consulta.
   * @returns {Promise<Object>} Estatísticas de usuários.
   */
  async getUsersStats(queryParams) {
    const { period = 'month' } = queryParams;
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

    // Total de usuários
    const totalUsers = await User.count();

    // Usuários ativos/inativos
    const activeUsers = await User.count({ where: { active: true } });
    const inactiveUsers = await User.count({ where: { active: false } });

    // Novos usuários no período
    const newUsers = await User.count({
      where: {
        created_at: {
          [Op.gte]: startDate
        }
      }
    });

    // Usuários por role
    const adminUsers = await User.count({ where: { role: 'admin' } });
    const regularUsers = await User.count({ where: { role: 'user' } });

    // Usuários com atividade recente (últimos 30 dias)
    const recentActivityUsers = await User.count({
      where: {
        last_login: {
          [Op.gte]: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Estatísticas de crescimento (comparação com período anterior)
    const previousPeriodStart = new Date(startDate.getTime() - (currentDate.getTime() - startDate.getTime()));
    const previousPeriodUsers = await User.count({
      where: {
        created_at: {
          [Op.between]: [previousPeriodStart, startDate]
        }
      }
    });

    const growthRate = previousPeriodUsers > 0 
      ? ((newUsers - previousPeriodUsers) / previousPeriodUsers) * 100 
      : newUsers > 0 ? 100 : 0;

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      newUsers,
      adminUsers,
      regularUsers,
      recentActivityUsers,
      growthRate: Math.round(growthRate * 100) / 100,
      period,
      periodStart: startDate.toISOString()
    };
  }

  /**
   * Obtém detalhes de um usuário específico.
   * @param {string} userId - ID do usuário.
   * @returns {Promise<Object>} Detalhes do usuário.
   */
  async getUserById(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'role', 'active', 'created_at', 'last_login', 'updated_at']
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return user;
  }

  /**
   * Atualiza o status de um usuário.
   * @param {string} userId - ID do usuário.
   * @param {boolean} active - Novo status do usuário.
   * @returns {Promise<Object>} Usuário atualizado.
   */
  async updateUserStatus(userId, active) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    await user.update({ active });

    return {
      ...user.toJSON(),
      status: active ? 'active' : 'inactive'
    };
  }

  /**
   * Atualiza o role de um usuário.
   * @param {string} userId - ID do usuário.
   * @param {string} role - Novo role do usuário.
   * @returns {Promise<Object>} Usuário atualizado.
   */
  async updateUserRole(userId, role) {
    if (!['admin', 'user'].includes(role)) {
      throw new AppError('Role inválido. Deve ser "admin" ou "user"', 400);
    }

    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    await user.update({ role });

    return {
      ...user.toJSON(),
      status: user.active ? 'active' : 'inactive'
    };
  }

  /**
   * Exclui um usuário.
   * @param {string} userId - ID do usuário.
   */
  async deleteUser(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Verificar se o usuário tem dados associados
    const transactionCount = await Transaction.count({ where: { user_id: userId } });
    const accountCount = await Account.count({ where: { user_id: userId } });
    const notificationCount = await Notification.count({ where: { user_id: userId } });

    if (transactionCount > 0 || accountCount > 0 || notificationCount > 0) {
      throw new AppError(
        'Não é possível excluir um usuário que possui dados associados. Considere desativar o usuário em vez de excluí-lo.',
        400
      );
    }

    await user.destroy();
  }

  /**
   * Obtém estatísticas detalhadas de um usuário específico.
   * @param {string} userId - ID do usuário.
   * @returns {Promise<Object>} Estatísticas detalhadas do usuário.
   */
  async getUserDetailedStats(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Contar transações
    const totalTransactions = await Transaction.count({ where: { user_id: userId } });
    const monthlyTransactions = await Transaction.count({
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Contar contas
    const totalAccounts = await Account.count({ where: { user_id: userId } });

    // Calcular saldo total
    const accounts = await Account.findAll({
      where: { user_id: userId },
      attributes: ['balance']
    });

    const totalBalance = accounts.reduce((sum, account) => {
      return sum + parseFloat(account.balance || 0);
    }, 0);

    // Contar notificações não lidas
    const unreadNotifications = await Notification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });

    // Calcular receitas e despesas do mês
    const monthlyTransactionsData = await Transaction.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: startOfMonth
        }
      }
    });

    const monthlyIncome = monthlyTransactionsData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const monthlyExpenses = monthlyTransactionsData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        created_at: user.created_at,
        last_login: user.last_login
      },
      stats: {
        totalTransactions,
        monthlyTransactions,
        totalAccounts,
        totalBalance: parseFloat(totalBalance.toFixed(2)),
        unreadNotifications,
        monthlyIncome: parseFloat(monthlyIncome.toFixed(2)),
        monthlyExpenses: parseFloat(monthlyExpenses.toFixed(2)),
        monthlyNet: parseFloat((monthlyIncome - monthlyExpenses).toFixed(2))
      }
    };
  }

  /**
   * Obtém estatísticas de um usuário específico.
   * @param {string} userId - ID do usuário.
   * @returns {Promise<Object>} Estatísticas do usuário.
   */
  async getUserStats(userId) {
    const detailedStats = await this.getUserDetailedStats(userId);
    
    return {
      success: true,
      data: detailedStats,
      message: 'Estatísticas do usuário obtidas com sucesso'
    };
  }
}

module.exports = new UserService(); 