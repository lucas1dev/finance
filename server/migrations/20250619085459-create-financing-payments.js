'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('financing_payments', {
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
      financing_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'financings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      account_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
      installment_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      payment_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      principal_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      interest_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      payment_method: {
        type: Sequelize.ENUM('boleto', 'debito_automatico', 'cartao', 'pix', 'transferencia'),
        allowNull: false
      },
      payment_type: {
        type: Sequelize.ENUM('parcela', 'parcial', 'antecipado'),
        allowNull: false,
        defaultValue: 'parcela'
      },
      balance_before: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      balance_after: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pago', 'pendente', 'atrasado', 'cancelado'),
        allowNull: false,
        defaultValue: 'pago'
      },
      observations: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Adiciona índices
    await queryInterface.addIndex('financing_payments', ['user_id']);
    await queryInterface.addIndex('financing_payments', ['financing_id']);
    await queryInterface.addIndex('financing_payments', ['account_id']);
    await queryInterface.addIndex('financing_payments', ['transaction_id']);
    await queryInterface.addIndex('financing_payments', ['payment_date']);
    await queryInterface.addIndex('financing_payments', ['status']);
    await queryInterface.addIndex('financing_payments', ['financing_id', 'installment_number'], {
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('financing_payments');
  }
};
