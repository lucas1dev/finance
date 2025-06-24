const { User, Transaction, Account, Notification } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../utils/errors');
const { successResponse } = require('../utils/response');
const { createUserSchema, updateUserSchema } = require('../utils/validators');

/**
 * Controller para gerenciamento de usuários (endpoints administrativos)
 * Fornece funcionalidades para administradores gerenciarem usuários do sistema
 */
class UserController {
  /**
   * Obtém a lista de usuários (apenas para administradores).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.page - Página atual (opcional).
   * @param {string} req.query.limit - Limite por página (opcional).
   * @param {string} req.query.status - Status do usuário (active/inactive) (opcional).
   * @param {string} req.query.role - Role do usuário (admin/user) (opcional).
   * @param {string} req.query.search - Busca por nome ou email (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista paginada de usuários em formato JSON.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // GET /api/admin/users?page=1&limit=10&status=active&role=user
   * // Headers: { Authorization: "Bearer <admin-token>" }
   * // Retorno: { users: [...], pagination: { page: 1, limit: 10, total: 50, pages: 5 } }
   */
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, status, role, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) {
        // Converter string para boolean
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

      res.json({
        users: usersWithStatus,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: totalPages
        }
      });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  }

  /**
   * Obtém estatísticas de usuários (apenas para administradores).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.period - Período para estatísticas (week/month/quarter/year) (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas de usuários em formato JSON.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // GET /api/admin/users/stats?period=month
   * // Headers: { Authorization: "Bearer <admin-token>" }
   * // Retorno: { total: 100, active: 85, inactive: 15, newUsers: 10, ... }
   */
  async getUsersStats(req, res) {
    try {
      const { period = 'month' } = req.query;
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

      res.json({
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
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas de usuários:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas de usuários' });
    }
  }

  /**
   * Obtém detalhes de um usuário específico (apenas para administradores).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Detalhes do usuário em formato JSON.
   * @throws {Error} Se o usuário não for encontrado ou houver erro no banco.
   * @example
   * // GET /api/admin/users/1
   * // Headers: { Authorization: "Bearer <admin-token>" }
   * // Retorno: { id: 1, name: "João", email: "joao@example.com", ... }
   */
  async getUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: ['id', 'name', 'email', 'role', 'active', 'created_at', 'last_login', 'updated_at']
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Estatísticas do usuário
      const transactionCount = await Transaction.count({ where: { user_id: id } });
      const accountCount = await Account.count({ where: { user_id: id } });
      const notificationCount = await Notification.count({ where: { user_id: id } });

      const userData = user.toJSON();
      res.json({
        ...userData,
        status: userData.active ? 'active' : 'inactive',
        stats: {
          transactions: transactionCount,
          accounts: accountCount,
          notifications: notificationCount
        }
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  }

  /**
   * Ativa ou desativa um usuário (apenas para administradores).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID do usuário.
   * @param {Object} req.body - Dados para atualização.
   * @param {string} req.body.status - Novo status (active/inactive).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se o usuário não for encontrado ou houver erro no banco.
   * @example
   * // PUT /api/admin/users/1/status
   * // Headers: { Authorization: "Bearer <admin-token>" }
   * // Body: { "status": "inactive" }
   * // Retorno: { "message": "Status do usuário atualizado com sucesso" }
   */
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido. Use "active" ou "inactive"' });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Não permitir desativar o próprio usuário admin
      if (user.id === req.user.id && status === 'inactive') {
        return res.status(400).json({ error: 'Não é possível desativar sua própria conta' });
      }

      // Converter status string para boolean
      const active = status === 'active';
      await user.update({ active });

      res.json({ 
        message: 'Status do usuário atualizado com sucesso',
        userId: user.id,
        newStatus: status
      });
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error);
      res.status(500).json({ error: 'Erro ao atualizar status do usuário' });
    }
  }

  /**
   * Altera o role de um usuário (apenas para administradores).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID do usuário.
   * @param {Object} req.body - Dados para atualização.
   * @param {string} req.body.role - Novo role (admin/user).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se o usuário não for encontrado ou houver erro no banco.
   * @example
   * // PUT /api/admin/users/1/role
   * // Headers: { Authorization: "Bearer <admin-token>" }
   * // Body: { "role": "admin" }
   * // Retorno: { "message": "Role do usuário atualizado com sucesso" }
   */
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Role inválido. Use "admin" ou "user"' });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Não permitir alterar o próprio role
      if (user.id === req.user.id) {
        return res.status(400).json({ error: 'Não é possível alterar seu próprio role' });
      }

      await user.update({ role });

      res.json({ 
        message: 'Role do usuário atualizado com sucesso',
        userId: user.id,
        newRole: role
      });
    } catch (error) {
      console.error('Erro ao atualizar role do usuário:', error);
      res.status(500).json({ error: 'Erro ao atualizar role do usuário' });
    }
  }

  /**
   * Exclui um usuário (apenas para administradores).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se o usuário não for encontrado ou houver erro no banco.
   * @example
   * // DELETE /api/admin/users/1
   * // Headers: { Authorization: "Bearer <admin-token>" }
   * // Retorno: { "message": "Usuário excluído com sucesso" }
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Não permitir excluir o próprio usuário
      if (user.id === req.user.id) {
        return res.status(400).json({ error: 'Não é possível excluir sua própria conta' });
      }

      // Verificar se o usuário tem dados associados
      const transactionCount = await Transaction.count({ where: { user_id: id } });
      const accountCount = await Account.count({ where: { user_id: id } });

      if (transactionCount > 0 || accountCount > 0) {
        return res.status(400).json({ 
          error: 'Não é possível excluir usuário com dados associados',
          details: {
            transactions: transactionCount,
            accounts: accountCount
          }
        });
      }

      await user.destroy();

      res.json({ 
        message: 'Usuário excluído com sucesso',
        userId: parseInt(id)
      });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
  }

  /**
   * Obtém estatísticas detalhadas de um usuário específico.
   * @param {number} userId - ID do usuário.
   * @returns {Promise<Object>} Estatísticas do usuário.
   * @private
   */
  async getUserDetailedStats(userId) {
    try {
      const [
        transactionCount,
        accountCount,
        notificationCount,
        lastTransaction,
        totalBalance
      ] = await Promise.all([
        Transaction.count({ where: { user_id: userId } }),
        Account.count({ where: { user_id: userId } }),
        Notification.count({ where: { userId } }),
        Transaction.findOne({
          where: { user_id: userId },
          order: [['created_at', 'DESC']],
          attributes: ['created_at']
        }),
        Account.sum('balance', { where: { user_id: userId } })
      ]);

      return {
        transactionCount,
        accountCount,
        notificationCount,
        lastTransactionDate: lastTransaction?.created_at || null,
        totalBalance: totalBalance || 0
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do usuário:', error);
      return {
        transactionCount: 0,
        accountCount: 0,
        notificationCount: 0,
        lastTransactionDate: null,
        totalBalance: 0
      };
    }
  }

  /**
   * Obtém estatísticas de um usuário específico (apenas para administradores).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas do usuário em formato JSON.
   * @throws {Error} Se o usuário não for encontrado ou houver erro no banco.
   * @example
   * // GET /api/admin/users/1/stats
   * // Headers: { Authorization: "Bearer <admin-token>" }
   * // Retorno: { user: {...}, stats: { transactions: 50, accounts: 3, ... } }
   */
  async getUserStats(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: ['id', 'name', 'email', 'role', 'active', 'created_at', 'last_login']
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Estatísticas de transações
      const totalTransactions = await Transaction.count({ where: { user_id: id } });
      const incomeTransactions = await Transaction.count({ 
        where: { user_id: id, type: 'income' } 
      });
      const expenseTransactions = await Transaction.count({ 
        where: { user_id: id, type: 'expense' } 
      });

      // Estatísticas de contas
      const totalAccounts = await Account.count({ where: { user_id: id } });

      // Estatísticas de notificações
      const totalNotifications = await Notification.count({ where: { user_id: id } });
      const unreadNotifications = await Notification.count({ 
        where: { user_id: id, is_read: false } 
      });

      // Última atividade (última transação)
      const lastTransaction = await Transaction.findOne({
        where: { user_id: id },
        order: [['created_at', 'DESC']],
        attributes: ['created_at']
      });

      // Saldo total das contas
      const accounts = await Account.findAll({
        where: { user_id: id },
        attributes: ['balance']
      });
      const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0);

      const stats = {
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
          transactions: {
            total: totalTransactions,
            income: incomeTransactions,
            expense: expenseTransactions
          },
          accounts: {
            total: totalAccounts,
            total_balance: totalBalance
          },
          notifications: {
            total: totalNotifications,
            unread: unreadNotifications
          },
          last_activity: lastTransaction ? lastTransaction.created_at : null
        }
      };

      return successResponse(res, stats, 'Estatísticas do usuário obtidas com sucesso');
    } catch (error) {
      console.error('Erro ao buscar estatísticas do usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas do usuário' });
    }
  }
}

module.exports = new UserController(); 