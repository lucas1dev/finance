'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Receivable extends Model {
    static associate(models) {
      Receivable.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      Receivable.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });

      Receivable.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category'
      });

      Receivable.hasMany(models.Payment, {
        foreignKey: 'receivable_id',
        as: 'payments'
      });
    }

    // Método para calcular o valor restante
    async getRemainingAmount() {
      const payments = await this.getPayments();
      const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      return parseFloat(this.amount) - totalPaid;
    }
  }

  Receivable.init({
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
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    invoice_number: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    payment_terms: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    remaining_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'partially_paid', 'paid'),
      allowNull: true,
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Receivable',
    tableName: 'receivables',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Receivable;
}; 