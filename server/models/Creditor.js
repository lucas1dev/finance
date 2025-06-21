/**
 * Modelo Creditor (Credor)
 * Representa os credores de financiamentos no sistema
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Creditor = sequelize.define('Creditor', {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    document_type: {
      type: DataTypes.ENUM('CPF', 'CNPJ'),
      allowNull: false,
      validate: {
        isIn: [['CPF', 'CNPJ']]
      }
    },
    document_number: {
      type: DataTypes.STRING(18),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    status: {
      type: DataTypes.ENUM('ativo', 'inativo'),
      defaultValue: 'ativo',
      validate: {
        isIn: [['ativo', 'inativo']]
      }
    },
    observations: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'creditors',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'document_number']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['name']
      }
    ]
  });

  /**
   * Define os relacionamentos do modelo Creditor
   * @param {Object} models - Todos os modelos do Sequelize
   */
  Creditor.associate = (models) => {
    // Um credor pertence a um usuário
    Creditor.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Um credor pode ter muitos financiamentos
    Creditor.hasMany(models.Financing, {
      foreignKey: 'creditor_id',
      as: 'financings'
    });
  };

  return Creditor;
}; 