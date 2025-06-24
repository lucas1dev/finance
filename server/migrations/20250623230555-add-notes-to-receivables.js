'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Adiciona a coluna notes à tabela receivables.
     */
    await queryInterface.addColumn('receivables', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Observações adicionais sobre o recebível'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Remove a coluna notes da tabela receivables.
     */
    await queryInterface.removeColumn('receivables', 'notes');
  }
};
