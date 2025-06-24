'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payable extends Model {
    static associate(models) {
      Payable.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      Payable.belongsTo(models.Supplier, {
        foreignKey: 'supplier_id',
        as: 'supplier'
      });

      Payable.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category'
      });

      Payable.hasMany(models.Payment, {
        foreignKey: 'payable_id',
        as: 'payments',
        onDelete: 'CASCADE'
      });
    }

    // Método para calcular o valor restante
    async getRemainingAmount() {
      const { Payment } = require('./index');
      const payments = await Payment.findAll({
        where: { payable_id: this.id },
        attributes: ['amount']
      });
      const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      return parseFloat(this.amount) - totalPaid;
    }
  }

  Payable.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'overdue', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer'),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Payable',
    tableName: 'payables',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Payable;
}; 