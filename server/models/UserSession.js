/**
 * Modelo para gerenciamento de sessões de usuário
 * @module models/UserSession
 */

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserSession extends Model {
    /**
     * Verifica se a sessão está ativa
     * @returns {boolean} True se a sessão estiver ativa
     */
    isActive() {
      return this.active && (!this.expires_at || new Date() < this.expires_at);
    }

    /**
     * Verifica se a sessão expirou
     * @returns {boolean} True se a sessão expirou
     */
    isExpired() {
      return this.expires_at && new Date() > this.expires_at;
    }
  }

  UserSession.init(
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      token: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true
      },
      refresh_token: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      device_type: {
        type: DataTypes.ENUM('desktop', 'mobile', 'tablet', 'unknown'),
        defaultValue: 'unknown'
      },
      device_name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Nome do dispositivo (ex: iPhone 14, MacBook Pro)'
      },
      browser: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Nome do navegador (ex: Chrome, Safari, Firefox)'
      },
      os: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Sistema operacional (ex: Windows 10, macOS, iOS)'
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'Endereço IP do usuário (suporta IPv6)'
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Localização aproximada (ex: São Paulo, Brasil)'
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      current: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Indica se é a sessão atual do usuário'
      },
      last_activity: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Data de expiração da sessão'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'UserSession',
      tableName: 'user_sessions',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['token'],
          unique: true
        },
        {
          fields: ['refresh_token']
        },
        {
          fields: ['active']
        },
        {
          fields: ['expires_at']
        }
      ]
    }
  );

  UserSession.associate = (models) => {
    UserSession.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return UserSession;
}; 