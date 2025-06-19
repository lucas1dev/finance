const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Supplier extends Model {}

  Supplier.init(
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
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      document_type: {
        type: DataTypes.ENUM('CPF', 'CNPJ'),
        allowNull: false
      },
      document_number: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Supplier',
      tableName: 'suppliers',
      timestamps: true,
      underscored: true
    }
  );

  Supplier.associate = (models) => {
    Supplier.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Supplier.hasMany(models.Payable, {
      foreignKey: 'supplier_id',
      as: 'payables'
    });
  };

  return Supplier;
}; 