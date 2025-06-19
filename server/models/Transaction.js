const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Account = require('./Account');

module.exports = (sequelize) => {
  class Transaction extends Model {}

  Transaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      account_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id',
        },
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id',
        },
      },
      supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'suppliers',
          key: 'id',
        },
      },
      fixed_account_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'fixed_accounts',
          key: 'id',
        },
      },
      type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_method: {
        type: DataTypes.ENUM('card', 'boleto', 'automatic_debit', 'pix', 'transfer'),
        allowNull: true,
      },
      payment_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Transaction',
      tableName: 'transactions',
      timestamps: true,
      underscored: true,
      hooks: {
        afterCreate: async (transaction) => {
          const account = await transaction.getAccount();
          const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
          await account.update({
            balance: account.balance + amount
          });
        },
        afterUpdate: async (transaction) => {
          const account = await transaction.getAccount();
          const oldAmount = transaction._previousDataValues.type === 'income' 
            ? transaction._previousDataValues.amount 
            : -transaction._previousDataValues.amount;
          const newAmount = transaction.type === 'income' 
            ? transaction.amount 
            : -transaction.amount;
          await account.update({
            balance: account.balance - oldAmount + newAmount
          });
        },
        afterDestroy: async (transaction) => {
          const account = await transaction.getAccount();
          const amount = transaction.type === 'income' 
            ? -transaction.amount 
            : transaction.amount;
          await account.update({
            balance: account.balance + amount
          });
        }
      }
    }
  );

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Transaction.belongsTo(models.Account, {
      foreignKey: 'account_id',
      as: 'account'
    });
    Transaction.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });
    Transaction.belongsTo(models.Supplier, {
      foreignKey: 'supplier_id',
      as: 'supplier'
    });
    Transaction.belongsTo(models.FixedAccount, {
      foreignKey: 'fixed_account_id',
      as: 'fixedAccount'
    });
  };

  return Transaction;
}; 