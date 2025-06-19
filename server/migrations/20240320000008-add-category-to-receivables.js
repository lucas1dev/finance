'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('receivables', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('receivables', 'category_id');
  }
}; 