/**
 * Serviço para gerenciamento de contas bancárias
 * Centraliza a lógica de negócio de contas
 */
const { Account } = require('../models');
const { AppError } = require('../utils/errors');

class AccountService {
  async createAccount(userId, data) {
    const { bank_name, account_type, balance, description } = data;
    const account = await Account.create({
      user_id: userId,
      bank_name,
      account_type,
      balance,
      description
    });
    return account;
  }

  async getAccounts(userId) {
    const accounts = await Account.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    return { accounts, totalBalance };
  }

  async getAccount(userId, accountId) {
    const account = await Account.findByPk(accountId);
    if (!account) throw new AppError('Conta não encontrada', 404);
    if (account.user_id !== userId) throw new AppError('Acesso negado', 403);
    return account;
  }

  async updateAccount(userId, accountId, data) {
    const account = await Account.findByPk(accountId);
    if (!account) throw new AppError('Conta não encontrada', 404);
    if (account.user_id !== userId) throw new AppError('Acesso negado', 403);
    await account.update(data);
    return account;
  }

  async deleteAccount(userId, accountId) {
    const account = await Account.findByPk(accountId);
    if (!account) throw new AppError('Conta não encontrada', 404);
    if (account.user_id !== userId) throw new AppError('Acesso negado', 403);
    await account.destroy();
    return true;
  }
}

module.exports = new AccountService(); 