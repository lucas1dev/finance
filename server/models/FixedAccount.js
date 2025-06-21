const { Model, DataTypes } = require('sequelize');

/**
 * Modelo para contas fixas do sistema financeiro.
 * Representa despesas recorrentes com periodicidade definida.
 */
module.exports = (sequelize) => {
  class FixedAccount extends Model {}

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
    
    FixedAccount.hasMany(models.Transaction, {
      foreignKey: 'fixed_account_id',
      as: 'transactions'
    });
  };

  return FixedAccount;
}; 