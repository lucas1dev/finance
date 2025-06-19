'use strict';

/**
 * Migration para criar a tabela de fornecedores.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('suppliers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      document: {
        type: Sequelize.STRING,
        allowNull: true
      },
      document_type: {
        type: Sequelize.ENUM('CPF', 'CNPJ'),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Adiciona índices para melhor performance
    await queryInterface.addIndex('suppliers', ['user_id']);
    await queryInterface.addIndex('suppliers', ['document_type', 'document']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('suppliers');
  }
}; 