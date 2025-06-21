const { Transaction, Category, Account } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

const transactionController = {
  createTransaction: async (req, res) => {
    try {
      const { account_id, category_id, type, amount, description, date } = req.body;
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
            attributes: ['name']
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

  updateTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const { type, amount, category_id, description, date } = req.body;

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
  }
};

module.exports = transactionController; 