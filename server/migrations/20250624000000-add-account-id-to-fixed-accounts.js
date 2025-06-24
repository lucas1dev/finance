'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('fixed_accounts', 'account_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    console.log('✅ Campo account_id adicionado à tabela fixed_accounts');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('fixed_accounts', 'account_id');
    console.log('✅ Campo account_id removido da tabela fixed_accounts');
  }
}; 