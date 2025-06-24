/**
 * Migration para adicionar funcionalidades avançadas ao modelo User
 * e criar tabelas para sessões e configurações de usuário
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Adicionar novos campos à tabela users
      await queryInterface.addColumn('users', 'active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }, { transaction });

      await queryInterface.addColumn('users', 'last_login', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('users', 'last_login_ip', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('users', 'notification_settings', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON string com configurações de notificação do usuário'
      }, { transaction });

      await queryInterface.addColumn('users', 'preferences', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON string com preferências gerais do usuário'
      }, { transaction });

      await queryInterface.addColumn('users', 'timezone', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'America/Sao_Paulo'
      }, { transaction });

      await queryInterface.addColumn('users', 'language', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'pt-BR'
      }, { transaction });

      await queryInterface.addColumn('users', 'phone', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('users', 'avatar_url', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('users', 'email_verified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }, { transaction });

      await queryInterface.addColumn('users', 'email_verified_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('users', 'password_changed_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('users', 'failed_login_attempts', {
        type: Sequelize.INTEGER,
        defaultValue: 0
      }, { transaction });

      await queryInterface.addColumn('users', 'locked_until', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      // 2. Criar tabela user_sessions
      await queryInterface.createTable('user_sessions', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        token: {
          type: Sequelize.STRING(500),
          allowNull: false,
          unique: true
        },
        refresh_token: {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        device_type: {
          type: Sequelize.ENUM('desktop', 'mobile', 'tablet', 'unknown'),
          defaultValue: 'unknown'
        },
        device_name: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Nome do dispositivo (ex: iPhone 14, MacBook Pro)'
        },
        browser: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Nome do navegador (ex: Chrome, Safari, Firefox)'
        },
        os: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Sistema operacional (ex: Windows 10, macOS, iOS)'
        },
        user_agent: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: true,
          comment: 'Endereço IP do usuário (suporta IPv6)'
        },
        location: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Localização aproximada (ex: São Paulo, Brasil)'
        },
        latitude: {
          type: Sequelize.DECIMAL(10, 8),
          allowNull: true
        },
        longitude: {
          type: Sequelize.DECIMAL(11, 8),
          allowNull: true
        },
        active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        current: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Indica se é a sessão atual do usuário'
        },
        last_activity: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Data de expiração da sessão'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // 3. Criar tabela user_settings
      await queryInterface.createTable('user_settings', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        category: {
          type: Sequelize.ENUM(
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
          type: Sequelize.TEXT,
          allowNull: false,
          defaultValue: '{}',
          comment: 'JSON string com as configurações da categoria'
        },
        version: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          comment: 'Versão das configurações para controle de mudanças'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // 4. Criar índices para user_sessions
      await queryInterface.addIndex('user_sessions', ['user_id'], { transaction });
      await queryInterface.addIndex('user_sessions', ['token'], { 
        unique: true,
        transaction 
      });
      await queryInterface.addIndex('user_sessions', ['refresh_token'], { transaction });
      await queryInterface.addIndex('user_sessions', ['active'], { transaction });
      await queryInterface.addIndex('user_sessions', ['expires_at'], { transaction });

      // 5. Criar índices para user_settings
      await queryInterface.addIndex('user_settings', ['user_id'], { transaction });
      await queryInterface.addIndex('user_settings', ['user_id', 'category'], { 
        unique: true,
        transaction 
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Remover tabelas criadas
      await queryInterface.dropTable('user_settings', { transaction });
      await queryInterface.dropTable('user_sessions', { transaction });

      // 2. Remover colunas adicionadas à tabela users
      const columnsToRemove = [
        'active',
        'last_login',
        'last_login_ip',
        'notification_settings',
        'preferences',
        'timezone',
        'language',
        'phone',
        'avatar_url',
        'email_verified',
        'email_verified_at',
        'password_changed_at',
        'failed_login_attempts',
        'locked_until'
      ];

      for (const column of columnsToRemove) {
        await queryInterface.removeColumn('users', column, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}; 