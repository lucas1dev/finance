/**
 * Modelo Financing (Financiamento)
 * Representa os financiamentos no sistema
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Financing = sequelize.define('Financing', {
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
    creditor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'creditors',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    financing_type: {
      type: DataTypes.ENUM('hipoteca', 'emprestimo_pessoal', 'financiamento_veiculo', 'outros'),
      allowNull: false,
      validate: {
        isIn: [['hipoteca', 'emprestimo_pessoal', 'financiamento_veiculo', 'outros']]
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    interest_rate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      validate: {
        min: 0.0001,
        max: 1.0000
      }
    },
    term_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    contract_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    payment_method: {
      type: DataTypes.ENUM('boleto', 'debito_automatico', 'cartao'),
      allowNull: true,
      validate: {
        isIn: [['boleto', 'debito_automatico', 'cartao']]
      }
    },
    amortization_method: {
      type: DataTypes.ENUM('SAC', 'Price'),
      allowNull: false,
      defaultValue: 'SAC',
      validate: {
        isIn: [['SAC', 'Price']]
      }
    },
    monthly_payment: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    current_balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    paid_installments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    total_paid: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    total_interest_paid: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('ativo', 'quitado', 'inadimplente', 'cancelado'),
      allowNull: false,
      defaultValue: 'ativo',
      validate: {
        isIn: [['ativo', 'quitado', 'inadimplente', 'cancelado']]
      }
    },
    observations: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'financings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['creditor_id']
      },
      {
        fields: ['financing_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['start_date']
      }
    ]
  });

  /**
   * Define os relacionamentos do modelo Financing
   * @param {Object} models - Todos os modelos do Sequelize
   */
  Financing.associate = (models) => {
    // Um financiamento pertence a um usuário
    Financing.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Um financiamento pertence a um credor
    Financing.belongsTo(models.Creditor, {
      foreignKey: 'creditor_id',
      as: 'creditor'
    });

    // Um financiamento pode ter muitos pagamentos
    Financing.hasMany(models.FinancingPayment, {
      foreignKey: 'financing_id',
      as: 'payments'
    });
  };

  return Financing;
}; 