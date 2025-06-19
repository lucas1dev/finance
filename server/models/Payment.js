'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Receivable, {
        foreignKey: 'receivable_id',
        as: 'receivable'
      });

      Payment.belongsTo(models.Payable, {
        foreignKey: 'payable_id',
        as: 'payable'
      });
    }
  }

  Payment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    receivable_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'receivables',
        key: 'id'
      }
    },
    payable_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'payables',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer'),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Payment;
}; 