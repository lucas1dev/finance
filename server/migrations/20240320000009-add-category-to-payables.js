'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('payables', 'category_id', {
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
    await queryInterface.removeColumn('payables', 'category_id');
  }
}; 