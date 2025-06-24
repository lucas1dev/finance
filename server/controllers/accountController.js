const { Account } = require('../models');
const { createAccountSchema, updateAccountSchema } = require('../utils/validators');
const { successResponse } = require('../utils/response');

/**
 * Controlador responsável por gerenciar contas bancárias dos usuários.
 * Permite criar, listar, atualizar e excluir contas com diferentes tipos e saldos.
 */
const accountController = {
  /**
   * Cria uma nova conta bancária.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da conta.
   * @param {string} req.body.bank_name - Nome do banco.
   * @param {string} req.body.account_type - Tipo da conta (checking/savings/investment).
   * @param {number} req.body.balance - Saldo inicial.
   * @param {string} req.body.description - Descrição da conta (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com dados da conta criada.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // POST /accounts
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "bank_name": "Banco do Brasil", "account_type": "checking", "balance": 1000 }
   * // Retorno: { "message": "Conta criada com sucesso", "accountId": 1 }
   */
  createAccount: async (req, res) => {
    try {
      console.log('Dados recebidos:', req.body);
      console.log('Usuário:', req.user);
      
      // Validar dados de entrada
      const validatedData = createAccountSchema.parse(req.body);
      const { bank_name, account_type, balance, description } = validatedData;
      
      console.log('Dados validados:', validatedData);
      
      const account = await Account.create({
        user_id: req.user.id,
        bank_name,
        account_type,
        balance,
        description
      });

      console.log('Conta criada:', account.toJSON());

      res.status(201).json({
        message: 'Conta criada com sucesso',
        accountId: account.id
      });
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      console.error('Stack trace:', error.stack);
      
      // Se for erro de validação Zod, retorna 400
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        error: 'Erro ao criar conta',
        details: error.message 
      });
    }
  },

  /**
   * Obtém a lista de contas do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de contas em formato JSON.
   * @throws {Error} Se houver erro no banco de dados.
   * @example
   * // GET /accounts
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "accounts": [...], "totalBalance": 1000 }
   */
  getAccounts: async (req, res) => {
    try {
      const accounts = await Account.findAll({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']]
      });

      const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);

      res.json({ accounts, totalBalance });
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      res.status(500).json({ error: 'Erro ao buscar contas' });
    }
  },

  /**
   * Obtém uma conta específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID da conta.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Conta em formato JSON.
   * @throws {Error} Se a conta não for encontrada ou houver erro no banco.
   * @example
   * // GET /accounts/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { id: 1, bank_name: "Banco do Brasil", balance: 1000 }
   */
  getAccount: async (req, res) => {
    try {
      const { id } = req.params;
      const account = await Account.findByPk(id);

      if (!account) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      // Verificar se o usuário é dono da conta
      if (account.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      res.json(account);
    } catch (error) {
      console.error('Erro ao buscar conta:', error);
      res.status(500).json({ error: 'Erro ao buscar conta' });
    }
  },

  /**
   * Atualiza uma conta existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID da conta.
   * @param {Object} req.body - Dados para atualização.
   * @param {string} req.body.bank_name - Nome do banco (opcional).
   * @param {string} req.body.account_type - Tipo da conta (opcional).
   * @param {number} req.body.balance - Saldo (opcional).
   * @param {string} req.body.description - Descrição da conta (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se a conta não for encontrada ou houver erro no banco.
   * @example
   * // PUT /accounts/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Body: { "balance": 1500, "description": "Conta principal" }
   * // Retorno: { "message": "Conta atualizada com sucesso" }
   */
  updateAccount: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validar dados de entrada
      const validatedData = updateAccountSchema.parse(req.body);
      const { bank_name, account_type, balance, description } = validatedData;
      
      const account = await Account.findByPk(id);

      if (!account) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      // Verificar se o usuário é dono da conta
      if (account.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      await account.update({
        bank_name,
        account_type,
        balance,
        description
      });

      res.json({ message: 'Conta atualizada com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      res.status(500).json({ error: 'Erro ao atualizar conta' });
    }
  },

  /**
   * Remove uma conta.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID da conta.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se a conta não for encontrada ou houver erro no banco.
   * @example
   * // DELETE /accounts/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "message": "Conta excluída com sucesso" }
   */
  deleteAccount: async (req, res) => {
    try {
      const { id } = req.params;
      const account = await Account.findByPk(id);

      if (!account) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      // Verificar se o usuário é dono da conta
      if (account.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      await account.destroy();
      res.json({ message: 'Conta excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao remover conta:', error);
      res.status(500).json({ error: 'Erro ao remover conta' });
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
      const accounts = await Account.findAll({
        where: { user_id: userId },
        attributes: ['id', 'description', 'balance', 'account_type', 'created_at']
      });

      console.log(`📊 [AccountController] ${accounts.length} contas encontradas`);

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
      res.json(stats);
    } catch (error) {
      console.error('❌ [AccountController] Erro ao obter estatísticas das contas:', error);
      res.status(500).json({
        error: 'Erro ao obter estatísticas das contas',
        details: error.message
      });
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
      
      const accounts = await Account.findAll({
        where: { user_id: userId },
        attributes: ['id', 'description', 'balance', 'account_type', 'created_at']
      });

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
      return successResponse(res, data, 'Dados para gráficos obtidos com sucesso');
    } catch (error) {
      console.error('❌ [AccountController] Erro ao obter dados para gráficos:', error);
      return res.status(500).json({
        error: 'Erro ao obter dados para gráficos'
      });
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