'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adicionar campos na tabela investments
    await queryInterface.addColumn('investments', 'source_account_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Conta bancária de origem (de onde sai o dinheiro)'
    });

    await queryInterface.addColumn('investments', 'destination_account_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Conta bancária de destino (onde fica o investimento)'
    });

    // Adicionar campos na tabela investment_contributions
    await queryInterface.addColumn('investment_contributions', 'source_account_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Conta bancária de origem do aporte'
    });

    await queryInterface.addColumn('investment_contributions', 'destination_account_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Conta bancária de destino do aporte'
    });

    // Adicionar índices para otimização
    await queryInterface.addIndex('investments', ['source_account_id']);
    await queryInterface.addIndex('investments', ['destination_account_id']);
    await queryInterface.addIndex('investment_contributions', ['source_account_id']);
    await queryInterface.addIndex('investment_contributions', ['destination_account_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remover índices
    await queryInterface.removeIndex('investments', ['source_account_id']);
    await queryInterface.removeIndex('investments', ['destination_account_id']);
    await queryInterface.removeIndex('investment_contributions', ['source_account_id']);
    await queryInterface.removeIndex('investment_contributions', ['destination_account_id']);

    // Remover colunas
    await queryInterface.removeColumn('investments', 'source_account_id');
    await queryInterface.removeColumn('investments', 'destination_account_id');
    await queryInterface.removeColumn('investment_contributions', 'source_account_id');
    await queryInterface.removeColumn('investment_contributions', 'destination_account_id');
  }
}; 