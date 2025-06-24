/**
 * Modelo para configurações de usuário
 * @module models/UserSetting
 */

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserSetting extends Model {
    /**
     * Obtém o valor de uma configuração específica
     * @param {string} key - Chave da configuração
     * @returns {any} Valor da configuração
     */
    getValue(key) {
      try {
        const settings = JSON.parse(this.settings || '{}');
        return settings[key];
      } catch (error) {
        return null;
      }
    }

    /**
     * Define o valor de uma configuração específica
     * @param {string} key - Chave da configuração
     * @param {any} value - Valor da configuração
     */
    setValue(key, value) {
      try {
        const settings = JSON.parse(this.settings || '{}');
        settings[key] = value;
        this.settings = JSON.stringify(settings);
      } catch (error) {
        console.error('Erro ao definir configuração:', error);
      }
    }
  }

  UserSetting.init(
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
      category: {
        type: DataTypes.ENUM(
          'notifications',
          'appearance',
          'privacy',
          'security',
          'preferences',
          'dashboard',
          'reports'
        ),
        allowNull: false,
        comment: 'Categoria da configuração'
      },
      settings: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{}',
        comment: 'JSON string com as configurações da categoria'
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: 'Versão das configurações para controle de mudanças'
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
      modelName: 'UserSetting',
      tableName: 'user_settings',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['user_id', 'category'],
          unique: true
        }
      ]
    }
  );

  UserSetting.associate = (models) => {
    UserSetting.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return UserSetting;
}; 