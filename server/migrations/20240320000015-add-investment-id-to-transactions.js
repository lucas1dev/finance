'use strict';

/**
 * Migration para adicionar campo investment_id na tabela transactions.
 * Permite associar transações a investimentos específicos.
 */
module.exports = {
  /**
   * Executa a migration (adiciona o campo).
   * @param {Object} queryInterface - Interface para executar queries.
   * @param {Object} Sequelize - Instância do Sequelize.
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('transactions', 'investment_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'investments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Adiciona índice para otimização
    await queryInterface.addIndex('transactions', ['investment_id']);
  },

  /**
   * Reverte a migration (remove o campo).
   * @param {Object} queryInterface - Interface para executar queries.
   * @param {Object} Sequelize - Instância do Sequelize.
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('transactions', 'investment_id');
  }
}; 