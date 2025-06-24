'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('categories', 'is_default', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'color'
    });

    // Adicionar índice para melhorar performance
    await queryInterface.addIndex('categories', ['user_id', 'is_default']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('categories', ['user_id', 'is_default']);
    await queryInterface.removeColumn('categories', 'is_default');
  }
}; 