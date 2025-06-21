'use strict';

/**
 * Migration para criar a tabela de contas fixas.
 * Inclui todos os campos obrigatórios e opcionais conforme especificação.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('fixed_accounts', {
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
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      periodicity: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
        allowNull: false,
        defaultValue: 'monthly'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'suppliers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      payment_method: {
        type: Sequelize.ENUM('card', 'boleto', 'automatic_debit'),
        allowNull: true
      },
      observations: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      is_paid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      reminder_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3
      },
      next_due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Adiciona índices para melhor performance
    await queryInterface.addIndex('fixed_accounts', ['user_id']);
    await queryInterface.addIndex('fixed_accounts', ['category_id']);
    await queryInterface.addIndex('fixed_accounts', ['supplier_id']);
    await queryInterface.addIndex('fixed_accounts', ['is_active']);
    await queryInterface.addIndex('fixed_accounts', ['next_due_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('fixed_accounts');
  }
}; 