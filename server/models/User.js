const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    static async hashPassword(password) {
      return bcrypt.hash(password, 10);
    }

    async validatePassword(password) {
      return bcrypt.compare(password, this.password);
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      two_factor_secret: {
        type: DataTypes.STRING,
        allowNull: true
      },
      two_factor_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      role: {
        type: DataTypes.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user'
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: async (user) => {
          user.password = await User.hashPassword(user.password);
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await User.hashPassword(user.password);
          }
        }
      }
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Account, {
      foreignKey: 'user_id',
      as: 'accounts'
    });
    User.hasMany(models.Transaction, {
      foreignKey: 'user_id',
      as: 'transactions'
    });
    User.hasMany(models.Customer, {
      foreignKey: 'user_id',
      as: 'customers'
    });
    User.hasMany(models.Receivable, {
      foreignKey: 'user_id',
      as: 'receivables'
    });
  };

  return User;
}; 