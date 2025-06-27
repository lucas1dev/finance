'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adicionar campo na tabela transactions
    await queryInterface.addColumn('transactions', 'investment_contribution_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'investment_contributions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Referência ao aporte de investimento que gerou esta transação'
    });

    // Adicionar índice para otimização
    await queryInterface.addIndex('transactions', ['investment_contribution_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remover índice
    await queryInterface.removeIndex('transactions', ['investment_contribution_id']);

    // Remover coluna
    await queryInterface.removeColumn('transactions', 'investment_contribution_id');
  }
}; 