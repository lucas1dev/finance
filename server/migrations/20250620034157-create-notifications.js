'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      type: {
        type: Sequelize.ENUM('payment_due', 'payment_overdue', 'reminder', 'system'),
        allowNull: false,
        comment: 'Tipo da notificação: vencimento, atraso, lembrete ou sistema'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Título da notificação'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Mensagem detalhada da notificação'
      },
      related_type: {
        type: Sequelize.ENUM('financing', 'financing_payment', 'creditor', 'general'),
        allowNull: true,
        comment: 'Tipo de entidade relacionada à notificação'
      },
      related_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID da entidade relacionada'
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Data de vencimento relacionada à notificação'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Indica se a notificação foi lida'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Indica se a notificação está ativa'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
        comment: 'Prioridade da notificação'
      },
      scheduled_for: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Data/hora programada para exibição da notificação'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Criar índices para melhor performance
    await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
    await queryInterface.addIndex('notifications', ['type', 'due_date']);
    await queryInterface.addIndex('notifications', ['scheduled_for']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
};
