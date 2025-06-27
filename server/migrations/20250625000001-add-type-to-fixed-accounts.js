'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('fixed_accounts', 'type', {
      type: Sequelize.ENUM('expense', 'income'),
      allowNull: false,
      defaultValue: 'expense',
      after: 'description'
    });

    // Adicionar comentário explicativo
    await queryInterface.sequelize.query(`
      ALTER TABLE fixed_accounts 
      MODIFY COLUMN type ENUM('expense', 'income') NOT NULL DEFAULT 'expense' 
      COMMENT 'Tipo da conta fixa: expense (despesa) ou income (receita)'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('fixed_accounts', 'type');
  }
}; 