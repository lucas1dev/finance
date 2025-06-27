const { Model, DataTypes } = require('sequelize');

/**
 * Modelo para contas fixas do sistema financeiro.
 * Representa despesas ou receitas recorrentes com periodicidade definida.
 */
module.exports = (sequelize) => {
  class FixedAccount extends Model {
    /**
     * Calcula a próxima data de vencimento baseada na periodicidade
     * @param {string} currentDate - Data atual (YYYY-MM-DD)
     * @param {string} periodicity - Periodicidade
     * @returns {string} Próxima data de vencimento (YYYY-MM-DD)
     */
    static calculateNextDueDate(currentDate, periodicity) {
      const date = new Date(currentDate);
      
      switch (periodicity) {
        case 'daily':
          date.setDate(date.getDate() + 1);
          break;
        case 'weekly':
          date.setDate(date.getDate() + 7);
          break;
        case 'monthly':
          date.setMonth(date.getMonth() + 1);
          break;
        case 'quarterly':
          date.setMonth(date.getMonth() + 3);
          break;
        case 'yearly':
          date.setFullYear(date.getFullYear() + 1);
          break;
        default:
          date.setMonth(date.getMonth() + 1);
      }
      
      return date.toISOString().split('T')[0];
    }

    /**
     * Verifica se a conta fixa está vencida
     * @returns {boolean}
     */
    isOverdue() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(this.next_due_date);
      return dueDate < today && !this.is_paid;
    }

    /**
     * Verifica se a conta fixa vence em breve (baseado no reminder_days)
     * @returns {boolean}
     */
    isDueSoon() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(this.next_due_date);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - this.reminder_days);
      return reminderDate <= today && !this.is_paid;
    }
  }

  FixedAccount.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255]
        }
      },
      type: {
        type: DataTypes.ENUM('expense', 'income'),
        allowNull: false,
        defaultValue: 'expense',
        validate: {
          isIn: [['expense', 'income']]
        }
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isPositive(value) {
            if (parseFloat(value) <= 0) {
              throw new Error('O valor deve ser positivo');
            }
          }
        }
      },
      periodicity: {
        type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
        allowNull: false,
        defaultValue: 'monthly'
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: true,
          notNull: true
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
      supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'suppliers',
          key: 'id'
        }
      },
      account_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        }
      },
      payment_method: {
        type: DataTypes.ENUM('card', 'boleto', 'automatic_debit'),
        allowNull: true
      },
      observations: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      /**
       * Indica se a conta fixa já foi paga no ciclo atual.
       * @type {boolean}
       */
      is_paid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      reminder_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
        validate: {
          min: 0,
          max: 30
        }
      },
      next_due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'FixedAccount',
      tableName: 'fixed_accounts',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: (fixedAccount) => {
          // Calcula a próxima data de vencimento baseada na periodicidade
          if (!fixedAccount.next_due_date) {
            fixedAccount.next_due_date = fixedAccount.start_date;
          }
        },
        beforeUpdate: (fixedAccount) => {
          // Atualiza a próxima data de vencimento se necessário
          if (fixedAccount.changed('start_date') || fixedAccount.changed('periodicity')) {
            fixedAccount.next_due_date = fixedAccount.start_date;
          }
        }
      }
    }
  );

  FixedAccount.associate = (models) => {
    FixedAccount.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    FixedAccount.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });
    
    FixedAccount.belongsTo(models.Supplier, {
      foreignKey: 'supplier_id',
      as: 'supplier'
    });
    
    FixedAccount.belongsTo(models.Account, {
      foreignKey: 'account_id',
      as: 'account'
    });
    
    FixedAccount.hasMany(models.Transaction, {
      foreignKey: 'fixed_account_id',
      as: 'transactions'
    });

    // Relacionamento com os lançamentos de conta fixa
    FixedAccount.hasMany(models.FixedAccountTransaction, {
      foreignKey: 'fixed_account_id',
      as: 'fixedAccountTransactions'
    });
  };

  return FixedAccount;
}; 