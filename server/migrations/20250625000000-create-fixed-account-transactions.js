'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('fixed_account_transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      fixed_account_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'fixed_accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0.01
        }
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'overdue', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      payment_method: {
        type: Sequelize.ENUM('card', 'boleto', 'automatic_debit', 'pix', 'transfer'),
        allowNull: true
      },
      observations: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Índices para performance
    await queryInterface.addIndex('fixed_account_transactions', ['user_id']);
    await queryInterface.addIndex('fixed_account_transactions', ['fixed_account_id']);
    await queryInterface.addIndex('fixed_account_transactions', ['status']);
    await queryInterface.addIndex('fixed_account_transactions', ['due_date']);
    await queryInterface.addIndex('fixed_account_transactions', ['transaction_id']);
    
    // Índice único para evitar duplicação de lançamentos
    await queryInterface.addIndex('fixed_account_transactions', 
      ['fixed_account_id', 'due_date'], 
      { 
        unique: true,
        name: 'unique_fixed_account_due_date'
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('fixed_account_transactions');
  }
}; 