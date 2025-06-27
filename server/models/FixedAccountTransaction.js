/**
 * Modelo FixedAccountTransaction (Lançamentos de Contas Fixas)
 * Representa os lançamentos individuais de contas fixas com controle de vencimento e pagamento
 */
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class FixedAccountTransaction extends Model {
    /**
     * Verifica se o lançamento está vencido
     * @returns {boolean}
     */
    isOverdue() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(this.due_date);
      return dueDate < today && this.status === 'pending';
    }

    /**
     * Verifica se o lançamento vence em breve (baseado no reminder_days)
     * @param {number} reminderDays - Dias de antecedência para lembrete
     * @returns {boolean}
     */
    isDueSoon(reminderDays = 3) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(this.due_date);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - reminderDays);
      return reminderDate <= today && this.status === 'pending';
    }

    /**
     * Marca o lançamento como pago
     * @param {Object} paymentData - Dados do pagamento
     * @param {string} paymentData.payment_date - Data do pagamento
     * @param {string} paymentData.payment_method - Método de pagamento
     * @param {string} paymentData.observations - Observações
     * @param {number} paymentData.transaction_id - ID da transação criada
     * @returns {Promise<FixedAccountTransaction>}
     */
    async markAsPaid(paymentData) {
      return await this.update({
        status: 'paid',
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method,
        observations: paymentData.observations,
        transaction_id: paymentData.transaction_id
      });
    }
  }

  FixedAccountTransaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fixed_account_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'fixed_accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: true,
          notNull: true
        }
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0.01
        }
      },
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'overdue', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'paid', 'overdue', 'cancelled']]
        }
      },
      payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: true
        }
      },
      payment_method: {
        type: DataTypes.ENUM('card', 'boleto', 'automatic_debit', 'pix', 'transfer'),
        allowNull: true,
        validate: {
          isIn: [['card', 'boleto', 'automatic_debit', 'pix', 'transfer']]
        }
      },
      observations: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    },
    {
      sequelize,
      modelName: 'FixedAccountTransaction',
      tableName: 'fixed_account_transactions',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['fixed_account_id']
        },
        {
          fields: ['status']
        },
        {
          fields: ['due_date']
        },
        {
          fields: ['transaction_id']
        },
        {
          unique: true,
          fields: ['fixed_account_id', 'due_date'],
          name: 'unique_fixed_account_due_date'
        }
      ],
      hooks: {
        beforeCreate: (transaction) => {
          // Verificar se já existe um lançamento para a mesma data
          if (transaction.status === 'pending') {
            const today = new Date();
            const dueDate = new Date(transaction.due_date);
            if (dueDate < today) {
              transaction.status = 'overdue';
            }
          }
        },
        beforeUpdate: (transaction) => {
          // Atualizar status para overdue se necessário
          if (transaction.status === 'pending') {
            const today = new Date();
            const dueDate = new Date(transaction.due_date);
            if (dueDate < today) {
              transaction.status = 'overdue';
            }
          }
        }
      }
    }
  );

  /**
   * Define os relacionamentos do modelo FixedAccountTransaction
   * @param {Object} models - Todos os modelos do Sequelize
   */
  FixedAccountTransaction.associate = (models) => {
    // Um lançamento pertence a uma conta fixa
    FixedAccountTransaction.belongsTo(models.FixedAccount, {
      foreignKey: 'fixed_account_id',
      as: 'fixedAccount'
    });

    // Um lançamento pertence a um usuário
    FixedAccountTransaction.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Um lançamento pode estar vinculado a uma transação
    FixedAccountTransaction.belongsTo(models.Transaction, {
      foreignKey: 'transaction_id',
      as: 'transaction'
    });
  };

  return FixedAccountTransaction;
}; 