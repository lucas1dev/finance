const { Model, DataTypes } = require('sequelize');

/**
 * Modelo para aportes de investimentos.
 * Permite registrar múltiplos aportes para um mesmo investimento,
 * somando as quantidades e valores ao longo do tempo.
 */
module.exports = (sequelize) => {
  class InvestmentContribution extends Model {}

  InvestmentContribution.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    investment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'investments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    contribution_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Data do aporte'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Valor total do aporte'
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      comment: 'Quantidade de ativos comprados no aporte'
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      comment: 'Preço unitário do ativo no momento do aporte'
    },
    broker: {
      type: DataTypes.ENUM(
        'xp_investimentos',
        'rico_investimentos',
        'clear_corretora',
        'modal_mais',
        'inter_invest',
        'nubank_invest',
        'itau_corretora',
        'bradesco_corretora',
        'santander_corretora',
        'outros'
      ),
      allowNull: true,
      comment: 'Corretora utilizada no aporte'
    },
    observations: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Observações sobre o aporte'
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
    }
  }, {
    sequelize,
    modelName: 'InvestmentContribution',
    tableName: 'investment_contributions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['investment_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['contribution_date']
      }
    ]
  });

  InvestmentContribution.associate = (models) => {
    // Associação com investimento (N:1)
    InvestmentContribution.belongsTo(models.Investment, {
      foreignKey: 'investment_id',
      as: 'investment'
    });

    // Associação com usuário (N:1)
    InvestmentContribution.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return InvestmentContribution;
}; 