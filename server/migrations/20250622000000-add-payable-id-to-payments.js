'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('payments', 'payable_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'payables',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Adicionar índice para a nova coluna
    await queryInterface.addIndex('payments', ['payable_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('payments', ['payable_id']);
    await queryInterface.removeColumn('payments', 'payable_id');
  }
}; 