'use strict';

/**
 * Migration para adicionar campos relacionados a contas fixas na tabela transactions.
 * Inclui supplier_id, fixed_account_id, payment_method e payment_date.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('transactions', 'supplier_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'suppliers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('transactions', 'fixed_account_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'fixed_accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('transactions', 'payment_method', {
      type: Sequelize.ENUM('card', 'boleto', 'automatic_debit', 'pix', 'transfer'),
      allowNull: true
    });

    await queryInterface.addColumn('transactions', 'payment_date', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    // Adiciona índices para melhor performance
    await queryInterface.addIndex('transactions', ['supplier_id']);
    await queryInterface.addIndex('transactions', ['fixed_account_id']);
    await queryInterface.addIndex('transactions', ['payment_method']);
    await queryInterface.addIndex('transactions', ['payment_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('transactions', ['payment_date']);
    await queryInterface.removeIndex('transactions', ['payment_method']);
    await queryInterface.removeIndex('transactions', ['fixed_account_id']);
    await queryInterface.removeIndex('transactions', ['supplier_id']);
    
    await queryInterface.removeColumn('transactions', 'payment_date');
    await queryInterface.removeColumn('transactions', 'payment_method');
    await queryInterface.removeColumn('transactions', 'fixed_account_id');
    await queryInterface.removeColumn('transactions', 'supplier_id');
  }
}; 