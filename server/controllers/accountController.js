const { ValidationError, NotFoundError, AppError } = require('../utils/errors');

/**
 * Controller responsável por gerenciar contas bancárias dos usuários.
 * Delega toda a lógica ao service e padroniza respostas.
 */
class AccountController {
  constructor(accountService) {
    this.accountService = accountService;
  }

  async createAccount(req, res) {
    try {
      const account = await this.accountService.createAccount(req.user.id, req.body);
      res.status(201).json({ 
        success: true, 
        data: { accountId: account.id } 
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAccounts(req, res) {
    try {
      const result = await this.accountService.getAccounts(req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAccount(req, res) {
    try {
      const account = await this.accountService.getAccount(req.user.id, req.params.id);
      res.json({ success: true, data: account });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateAccount(req, res) {
    try {
      await this.accountService.updateAccount(req.user.id, req.params.id, req.body);
      res.json({ 
        success: true, 
        data: { message: 'Conta atualizada com sucesso' } 
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deleteAccount(req, res) {
    try {
      await this.accountService.deleteAccount(req.user.id, req.params.id);
      res.json({ 
        success: true, 
        data: { message: 'Conta excluída com sucesso' } 
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Obtém estatísticas detalhadas das contas.
   */
  async getStats(req, res) {
    try {
      const userId = req.user.id;
      const result = await this.accountService.getAccounts(userId);
      const accounts = result.accounts || result; // Compatibilidade com diferentes retornos

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

      res.json({ success: true, data: stats });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Obtém dados para gráficos de contas.
   */
  async getCharts(req, res) {
    try {
      const userId = req.user.id;
      const { type = 'balance' } = req.query;
      
      const result = await this.accountService.getAccounts(userId);
      const accounts = result.accounts || result; // Compatibilidade com diferentes retornos

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

      res.json({ success: true, data });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Obtém dados de distribuição de saldo para gráficos.
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
  }

  /**
   * Obtém dados de distribuição por tipo para gráficos.
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
  }

  /**
   * Obtém dados de evolução de saldo para gráficos.
   */
  async getBalanceEvolutionData(accounts) {
    // Implementação simplificada - pode ser expandida no futuro
    const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0);
    
    return {
      evolution: [{
        date: new Date().toISOString().split('T')[0],
        balance: Math.round(totalBalance * 100) / 100
      }],
      totalBalance: Math.round(totalBalance * 100) / 100
    };
  }

  /**
   * Método helper para tratamento consistente de erros.
   */
  handleError(error, res) {
    // Verificar se é erro de validação Zod
    if (error.name === 'ZodError' || error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Dados inválidos'
      });
    }

    if (error instanceof NotFoundError || (error instanceof AppError && error.statusCode === 404)) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

module.exports = AccountController; 