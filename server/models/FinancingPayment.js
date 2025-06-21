/**
 * Modelo FinancingPayment (Pagamento de Financiamento)
 * Representa os pagamentos de parcelas de financiamentos
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FinancingPayment = sequelize.define('FinancingPayment', {
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
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    financing_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'financings',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
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
    },
    installment_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    payment_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    principal_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.00
      }
    },
    interest_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.00
      }
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    payment_method: {
      type: DataTypes.ENUM('boleto', 'debito_automatico', 'cartao', 'pix', 'transferencia'),
      allowNull: false,
      validate: {
        isIn: [['boleto', 'debito_automatico', 'cartao', 'pix', 'transferencia']]
      }
    },
    payment_type: {
      type: DataTypes.ENUM('parcela', 'parcial', 'antecipado'),
      allowNull: false,
      defaultValue: 'parcela',
      validate: {
        isIn: [['parcela', 'parcial', 'antecipado']]
      }
    },
    balance_before: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.00
      }
    },
    balance_after: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.00
      }
    },
    status: {
      type: DataTypes.ENUM('pago', 'pendente', 'atrasado', 'cancelado'),
      allowNull: false,
      defaultValue: 'pago',
      validate: {
        isIn: [['pago', 'pendente', 'atrasado', 'cancelado']]
      }
    },
    observations: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'financing_payments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['financing_id']
      },
      {
        fields: ['account_id']
      },
      {
        fields: ['transaction_id']
      },
      {
        fields: ['payment_date']
      },
      {
        fields: ['status']
      },
      {
        unique: true,
        fields: ['financing_id', 'installment_number']
      }
    ]
  });

  /**
   * Define os relacionamentos do modelo FinancingPayment
   * @param {Object} models - Todos os modelos do Sequelize
   */
  FinancingPayment.associate = (models) => {
    // Um pagamento pertence a um usuário
    FinancingPayment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Um pagamento pertence a um financiamento
    FinancingPayment.belongsTo(models.Financing, {
      foreignKey: 'financing_id',
      as: 'financing'
    });

    // Um pagamento pertence a uma conta
    FinancingPayment.belongsTo(models.Account, {
      foreignKey: 'account_id',
      as: 'account'
    });

    // Um pagamento pode estar vinculado a uma transação
    FinancingPayment.belongsTo(models.Transaction, {
      foreignKey: 'transaction_id',
      as: 'transaction'
    });
  };

  return FinancingPayment;
}; 