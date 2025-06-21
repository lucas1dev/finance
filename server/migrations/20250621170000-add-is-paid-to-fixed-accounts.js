"use strict";

/**
 * Migration para adicionar o campo is_paid à tabela fixed_accounts.
 * @param {import('sequelize').QueryInterface} queryInterface
 * @param {import('sequelize').Sequelize} Sequelize
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('fixed_accounts', 'is_paid', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('fixed_accounts', 'is_paid');
  }
}; 