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
      backup_codes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON string com códigos de backup para 2FA'
      },
      role: {
        type: DataTypes.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user'
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true
      },
      last_login_ip: {
        type: DataTypes.STRING,
        allowNull: true
      },
      notification_settings: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON string com configurações de notificação do usuário'
      },
      preferences: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON string com preferências gerais do usuário'
      },
      timezone: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'America/Sao_Paulo'
      },
      language: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'pt-BR'
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      avatar_url: {
        type: DataTypes.STRING,
        allowNull: true
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      email_verified_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      password_changed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      failed_login_attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      locked_until: {
        type: DataTypes.DATE,
        allowNull: true
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
            user.password_changed_at = new Date();
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
    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
      as: 'notifications'
    });
    User.hasMany(models.Investment, {
      foreignKey: 'user_id',
      as: 'investments'
    });
    User.hasMany(models.InvestmentGoal, {
      foreignKey: 'user_id',
      as: 'investment_goals'
    });
    User.hasMany(models.Financing, {
      foreignKey: 'user_id',
      as: 'financings'
    });
    User.hasMany(models.FixedAccount, {
      foreignKey: 'user_id',
      as: 'fixed_accounts'
    });
  };

  return User;
}; 