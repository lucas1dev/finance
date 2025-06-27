const accountService = require('../services/accountService');
const { createAccountSchema, updateAccountSchema } = require('../utils/validators');

/**
 * Controller responsável por gerenciar contas bancárias dos usuários.
 * Agora delega toda a lógica ao service e padroniza respostas.
 */
const accountController = {
  async createAccount(req, res, next) {
    try {
      const validatedData = createAccountSchema.parse(req.body);
      const account = await accountService.createAccount(req.user.id, validatedData);
      res.status(201).json({ success: true, data: { accountId: account.id } });
    } catch (err) {
      next(err);
    }
  },

  async getAccounts(req, res, next) {
    try {
      const result = await accountService.getAccounts(req.user.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getAccount(req, res, next) {
    try {
      const account = await accountService.getAccount(req.user.id, req.params.id);
      res.json({ success: true, data: account });
    } catch (err) {
      next(err);
    }
  },

  async updateAccount(req, res, next) {
    try {
      const validatedData = updateAccountSchema.parse(req.body);
      await accountService.updateAccount(req.user.id, req.params.id, validatedData);
      res.json({ success: true, data: { message: 'Conta atualizada com sucesso' } });
    } catch (err) {
      next(err);
    }
  },

  async deleteAccount(req, res, next) {
    try {
      await accountService.deleteAccount(req.user.id, req.params.id);
      res.json({ success: true, data: { message: 'Conta excluída com sucesso' } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Obtém estatísticas detalhadas das contas.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {number} req.user.id - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas detalhadas em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/accounts/stats
   * // Retorno: { total_balance: 15000, account_count: 3, average_balance: 5000 }
   */
  async getStats(req, res) {
    try {
      console.log('🔍 [AccountController] Buscando estatísticas para usuário:', req.user.id);
      
      const userId = req.user.id;
      
      // Buscar todas as contas do usuário
      const accounts = await accountService.getAccounts(userId);

      console.log(`�� [AccountController] ${accounts.length} contas encontradas`);

      // Calcular estatísticas básicas
      const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0);
      const averageBalance = accounts.length > 0 ? totalBalance / accounts.length : 0;
      
      const stats = {
        total_balance: Math.round(totalBalance * 100) / 100,
        account_count: accounts.length,
        average_balance: Math.round(averageBalance * 100) / 100,
        highest_balance: accounts.length > 0 ? Math.round(Math.max(...accounts.map(a => parseFloat(a.balance || 0))) * 100) / 100 : 0,
        lowest_balance: accounts.length > 0 ? Math.round(Math.min(...accounts.map(a => parseFloat(a.balance || 0))) * 100) / 100 : 0
      };

      console.log('✅ [AccountController] Estatísticas calculadas:', stats);
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('❌ [AccountController] Erro ao obter estatísticas das contas:', error);
      res.status(500).json({ success: false, error: 'Erro ao obter estatísticas das contas', details: error.message });
    }
  },

  /**
   * Obtém dados para gráficos de contas.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado.
   * @param {number} req.user.id - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Dados para gráficos em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/accounts/charts
   * // Retorno: { balanceDistribution: [...], typeDistribution: [...], evolution: [...] }
   */
  async getCharts(req, res) {
    try {
      const userId = req.user.id;
      const { type = 'balance' } = req.query;
      
      console.log(`🔍 [AccountController] Buscando dados de gráficos para usuário ${userId}, tipo: ${type}`);
      
      const accounts = await accountService.getAccounts(userId);

      let data;
      switch (type) {
        case 'balance':
          data = this.getBalanceDistributionData(accounts);
          break;
        case 'type':
          data = this.getTypeDistributionData(accounts);
          break;
        case 'evolution':
          data = await this.getBalanceEvolutionData(accounts);
          break;
        default:
          data = this.getBalanceDistributionData(accounts);
      }

      console.log('✅ [AccountController] Dados de gráficos obtidos:', data);
      return res.json({ success: true, data });
    } catch (error) {
      console.error('❌ [AccountController] Erro ao obter dados para gráficos:', error);
      return res.status(500).json({ success: false, error: 'Erro ao obter dados para gráficos' });
    }
  },

  /**
   * Obtém dados de distribuição de saldo para gráficos.
   * @param {Array} accounts - Lista de contas.
   * @returns {Object} Dados de distribuição de saldo.
   */
  getBalanceDistributionData(accounts) {
    const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0);
    
    const balanceDistribution = accounts.map(account => ({
      id: account.id,
      name: account.description,
      balance: Math.round(parseFloat(account.balance || 0) * 100) / 100,
      percentage: totalBalance > 0 ? Math.round((parseFloat(account.balance || 0) / totalBalance) * 100 * 100) / 100 : 0,
      type: account.account_type || 'outro'
    })).sort((a, b) => b.balance - a.balance);

    return {
      balanceDistribution,
      totalBalance: Math.round(totalBalance * 100) / 100
    };
  },

  /**
   * Obtém dados de distribuição por tipo para gráficos.
   * @param {Array} accounts - Lista de contas.
   * @returns {Object} Dados de distribuição por tipo.
   */
  getTypeDistributionData(accounts) {
    const typeDistribution = accounts.reduce((acc, account) => {
      const type = account.account_type || 'outro';
      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          totalBalance: 0
        };
      }
      acc[type].count++;
      acc[type].totalBalance += parseFloat(account.balance || 0);
      return acc;
    }, {});

    const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0);

    const typeData = Object.values(typeDistribution).map(typeStats => ({
      ...typeStats,
      totalBalance: Math.round(typeStats.totalBalance * 100) / 100,
      percentage: totalBalance > 0 ? Math.round((typeStats.totalBalance / totalBalance) * 100 * 100) / 100 : 0
    })).sort((a, b) => b.totalBalance - a.totalBalance);

    return {
      typeDistribution: typeData,
      totalAccounts: accounts.length,
      totalBalance: Math.round(totalBalance * 100) / 100
    };
  },

  /**
   * Obtém dados de evolução de saldo para gráficos.
   * @param {Array} accounts - Lista de contas.
   * @returns {Promise<Object>} Dados de evolução de saldo.
   */
  async getBalanceEvolutionData(accounts) {
    const evolution = [];
    const currentDate = new Date();
    
    // Últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      
      // Simular evolução baseada na data de criação das contas
      const monthAccounts = accounts.filter(account => 
        new Date(account.created_at) <= month
      );
      
      const monthBalance = monthAccounts.reduce((sum, account) => 
        sum + parseFloat(account.balance || 0), 0
      );

      evolution.push({
        month: month.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        balance: Math.round(monthBalance * 100) / 100,
        accountsCount: monthAccounts.length,
        date: month.toISOString()
      });
    }

    return { evolution };
  }
};

module.exports = accountController; 