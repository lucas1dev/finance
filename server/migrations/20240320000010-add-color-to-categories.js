'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('categories', 'color', {
      type: Sequelize.STRING(7), // Código de cor hex (#FFFFFF)
      allowNull: true,
      defaultValue: '#4CAF50'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('categories', 'color');
  }
}; 