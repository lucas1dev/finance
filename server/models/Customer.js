const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Customer extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      this.hasMany(models.CustomerType, {
        foreignKey: 'customer_id',
        as: 'types'
      });

      this.hasMany(models.Receivable, {
        foreignKey: 'customer_id',
        as: 'receivables'
      });

      this.hasMany(models.Payable, {
        foreignKey: 'customer_id',
        as: 'payables'
      });
    }
  }

  Customer.init({
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
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers',
    timestamps: true,
    underscored: true
  });

  return Customer;
}; 