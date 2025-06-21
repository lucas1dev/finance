const { Account } = require('../models');

/**
 * Controlador responsável por gerenciar contas bancárias dos usuários.
 * Permite criar, listar, atualizar e excluir contas com diferentes tipos e saldos.
 */
const accountController = {
  /**
   * Cria uma nova conta bancária para o usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da conta.
   * @param {string} req.body.bank_name - Nome do banco.
   * @param {string} req.body.account_type - Tipo da conta ('checking', 'savings', 'investment').
   * @param {number} req.body.balance - Saldo inicial da conta.
   * @param {string} [req.body.description] - Descrição opcional da conta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso e ID da conta criada.
   * @throws {Error} Se houver erro ao criar a conta no banco de dados.
   * @example
   * // POST /accounts
   * // Body: { "bank_name": "Banco do Brasil", "account_type": "checking", "balance": 1000.00 }
   * // Retorno: { "message": "Conta criada com sucesso", "accountId": 1 }
   */
  createAccount: async (req, res) => {
    try {
      const { bank_name, account_type, balance, description } = req.body;
      const userId = req.userId;

      const account = await Account.create({
        user_id: userId,
        bank_name,
        account_type,
        balance,
        description
      });

      res.status(201).json({ message: 'Conta criada com sucesso', accountId: account.id });
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      res.status(500).json({ error: 'Erro ao criar conta' });
    }
  },

  /**
   * Lista todas as contas do usuário autenticado com o saldo total.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com lista de contas e saldo total.
   * @throws {Error} Se houver erro ao consultar o banco de dados.
   * @example
   * // GET /accounts
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "accounts": [...], "totalBalance": 5000.00 }
   */
  getAccounts: async (req, res) => {
    try {
      console.log('User ID:', req.userId);
      const userId = req.userId;
      
      console.log('Buscando contas para o usuário:', userId);
      const accounts = await Account.findAll({
        where: { user_id: userId }
      });
      
      console.log('Contas encontradas:', accounts.length);
      const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
      console.log('Saldo total:', totalBalance);

      res.json({ accounts, totalBalance });
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ error: 'Erro ao buscar contas' });
    }
  },

  /**
   * Obtém uma conta específica do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.id - ID da conta a ser consultada.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com os dados da conta.
   * @throws {Error} Se a conta não for encontrada, não pertencer ao usuário ou houver erro no banco.
   * @example
   * // GET /accounts/1
   * // Retorno: { "id": 1, "bank_name": "Banco do Brasil", "balance": 1000.00, ... }
   */
  getAccount: async (req, res) => {
    try {
      const { id } = req.params;
      const account = await Account.findByPk(id);

      if (!account) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      if (account.user_id !== req.userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      res.json(account);
    } catch (error) {
      console.error('Erro ao buscar conta:', error);
      res.status(500).json({ error: 'Erro ao buscar conta' });
    }
  },

  /**
   * Atualiza uma conta existente do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.id - ID da conta a ser atualizada.
   * @param {Object} req.body - Novos dados da conta.
   * @param {string} req.body.bank_name - Novo nome do banco.
   * @param {string} req.body.account_type - Novo tipo da conta.
   * @param {number} req.body.balance - Novo saldo da conta.
   * @param {string} [req.body.description] - Nova descrição da conta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se a conta não for encontrada, não pertencer ao usuário ou houver erro no banco.
   * @example
   * // PUT /accounts/1
   * // Body: { "bank_name": "Banco Itaú", "balance": 1500.00 }
   * // Retorno: { "message": "Conta atualizada com sucesso" }
   */
  updateAccount: async (req, res) => {
    try {
      const { id } = req.params;
      const { bank_name, account_type, balance, description } = req.body;

      const account = await Account.findByPk(id);
      if (!account) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      if (account.user_id !== req.userId) {
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
   * Exclui uma conta do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.id - ID da conta a ser excluída.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se a conta não for encontrada, não pertencer ao usuário ou houver erro no banco.
   * @example
   * // DELETE /accounts/1
   * // Retorno: { "message": "Conta excluída com sucesso" }
   */
  deleteAccount: async (req, res) => {
    try {
      const { id } = req.params;
      const account = await Account.findByPk(id);

      if (!account) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      if (account.user_id !== req.userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      await account.destroy();
      res.json({ message: 'Conta excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      res.status(500).json({ error: 'Erro ao excluir conta' });
    }
  }
};

module.exports = accountController; 