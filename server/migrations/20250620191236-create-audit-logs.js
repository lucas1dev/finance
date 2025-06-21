'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userEmail: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Email do usuário para facilitar consultas'
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Tipo de ação realizada (ex: job_execution, config_change, data_deletion)'
      },
      resource: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Recurso afetado (ex: notifications, jobs, users)'
      },
      resourceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID do recurso específico afetado (se aplicável)'
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detalhes adicionais da ação em formato JSON'
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'Endereço IP do usuário'
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User-Agent do navegador/aplicação'
      },
      status: {
        type: Sequelize.ENUM('success', 'failure', 'partial'),
        allowNull: false,
        defaultValue: 'success',
        comment: 'Status da ação (success, failure, partial)'
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mensagem de erro em caso de falha'
      },
      executionTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Tempo de execução em milissegundos'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Data e hora da ação'
      }
    });

    // Criar índices para otimizar consultas
    await queryInterface.addIndex('audit_logs', ['userId'], {
      name: 'idx_audit_logs_user_id'
    });

    await queryInterface.addIndex('audit_logs', ['action'], {
      name: 'idx_audit_logs_action'
    });

    await queryInterface.addIndex('audit_logs', ['resource'], {
      name: 'idx_audit_logs_resource'
    });

    await queryInterface.addIndex('audit_logs', ['createdAt'], {
      name: 'idx_audit_logs_created_at'
    });

    await queryInterface.addIndex('audit_logs', ['userId', 'createdAt'], {
      name: 'idx_audit_logs_user_created'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
  }
};
