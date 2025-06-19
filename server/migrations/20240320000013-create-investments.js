'use strict';

/**
 * Migration para criar a tabela de investimentos.
 * Permite registrar compras, vendas e acompanhar o desempenho dos investimentos.
 */
module.exports = {
  /**
   * Executa a migration (cria a tabela).
   * @param {Object} queryInterface - Interface para executar queries.
   * @param {Object} Sequelize - Instância do Sequelize.
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('investments', {
      /**
       * Identificador único do investimento.
       */
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      /**
       * Tipo de investimento (ações, fundos, títulos, criptomoedas, outros).
       */
      investment_type: {
        type: Sequelize.ENUM('acoes', 'fundos', 'titulos', 'criptomoedas', 'outros'),
        allowNull: false
      },

      /**
       * Nome do ativo investido.
       */
      asset_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },

      /**
       * Ticker ou código do ativo (opcional).
       */
      ticker: {
        type: Sequelize.STRING(20),
        allowNull: true
      },

      /**
       * Valor investido na operação.
       */
      invested_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },

      /**
       * Quantidade de ativos comprados/vendidos.
       */
      quantity: {
        type: Sequelize.DECIMAL(15, 6),
        allowNull: false
      },

      /**
       * Preço unitário do ativo.
       */
      unit_price: {
        type: Sequelize.DECIMAL(15, 6),
        allowNull: false
      },

      /**
       * Data da operação (compra/venda).
       */
      operation_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },

      /**
       * Tipo de operação (compra ou venda).
       */
      operation_type: {
        type: Sequelize.ENUM('compra', 'venda'),
        allowNull: false
      },

      /**
       * Corretora utilizada na operação.
       */
      broker: {
        type: Sequelize.ENUM(
          'xp_investimentos',
          'rico',
          'clear',
          'modalmais',
          'inter',
          'nubank',
          'itau',
          'bradesco',
          'santander',
          'caixa',
          'outros'
        ),
        allowNull: true
      },

      /**
       * Observações sobre o investimento.
       */
      observations: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      /**
       * Status do investimento (ativo, vendido, cancelado).
       */
      status: {
        type: Sequelize.ENUM('ativo', 'vendido', 'cancelado'),
        defaultValue: 'ativo'
      },

      /**
       * ID do usuário proprietário do investimento.
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
       * ID da conta utilizada para a operação.
       */
      account_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      /**
       * ID da categoria do investimento.
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
    await queryInterface.addIndex('investments', ['user_id']);
    await queryInterface.addIndex('investments', ['account_id']);
    await queryInterface.addIndex('investments', ['investment_type']);
    await queryInterface.addIndex('investments', ['operation_type']);
    await queryInterface.addIndex('investments', ['operation_date']);
    await queryInterface.addIndex('investments', ['status']);
    await queryInterface.addIndex('investments', ['ticker']);
  },

  /**
   * Reverte a migration (remove a tabela).
   * @param {Object} queryInterface - Interface para executar queries.
   * @param {Object} Sequelize - Instância do Sequelize.
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('investments');
  }
}; 