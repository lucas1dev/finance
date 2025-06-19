const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Account extends Model {}

  Account.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      bank_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      account_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Account',
      tableName: 'accounts',
      timestamps: true,
      underscored: true,
    }
  );

  Account.associate = (models) => {
    Account.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Account.hasMany(models.Transaction, {
      foreignKey: 'account_id',
      as: 'transactions'
    });
  };

  return Account;
}; 