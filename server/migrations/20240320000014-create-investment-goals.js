'use strict';

/**
 * Migration para criar a tabela de metas de investimento.
 * Permite definir objetivos financeiros e acompanhar o progresso.
 */
module.exports = {
  /**
   * Executa a migration (cria a tabela).
   * @param {Object} queryInterface - Interface para executar queries.
   * @param {Object} Sequelize - Instância do Sequelize.
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('investment_goals', {
      /**
       * Identificador único da meta.
       */
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      /**
       * Nome ou título da meta.
       */
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },

      /**
       * Descrição detalhada da meta.
       */
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },

      /**
       * Valor alvo a ser alcançado.
       */
      target_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },

      /**
       * Data limite para alcançar a meta.
       */
      target_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },

      /**
       * Valor atual acumulado na meta.
       */
      current_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00
      },

      /**
       * Status da meta (ativa, concluída, cancelada).
       */
      status: {
        type: Sequelize.ENUM('ativa', 'concluida', 'cancelada'),
        defaultValue: 'ativa'
      },

      /**
       * Cor da meta para identificação visual.
       */
      color: {
        type: Sequelize.STRING(7),
        defaultValue: '#3B82F6'
      },

      /**
       * ID do usuário proprietário da meta.
       */
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      /**
       * ID da categoria associada à meta.
       */
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      /**
       * Data de criação do registro.
       */
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      /**
       * Data da última atualização do registro.
       */
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Criação de índices para otimização de consultas
    await queryInterface.addIndex('investment_goals', ['user_id']);
    await queryInterface.addIndex('investment_goals', ['status']);
    await queryInterface.addIndex('investment_goals', ['target_date']);
    await queryInterface.addIndex('investment_goals', ['category_id']);
  },

  /**
   * Reverte a migration (remove a tabela).
   * @param {Object} queryInterface - Interface para executar queries.
   * @param {Object} Sequelize - Instância do Sequelize.
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('investment_goals');
  }
}; 