'use strict';

/**
 * Migration para criar a tabela de aportes de investimentos.
 * Permite registrar múltiplos aportes para um mesmo investimento.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('investment_contributions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      investment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'investments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      contribution_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Data do aporte'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Valor total do aporte'
      },
      quantity: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        comment: 'Quantidade de ativos comprados no aporte'
      },
      unit_price: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        comment: 'Preço unitário do ativo no momento do aporte'
      },
      broker: {
        type: Sequelize.ENUM(
          'xp_investimentos',
          'rico_investimentos',
          'clear_corretora',
          'modal_mais',
          'inter_invest',
          'nubank_invest',
          'itau_corretora',
          'bradesco_corretora',
          'santander_corretora',
          'outros'
        ),
        allowNull: true,
        comment: 'Corretora utilizada no aporte'
      },
      observations: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Observações sobre o aporte'
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

    // Adicionar índices para otimização
    await queryInterface.addIndex('investment_contributions', ['investment_id']);
    await queryInterface.addIndex('investment_contributions', ['user_id']);
    await queryInterface.addIndex('investment_contributions', ['contribution_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('investment_contributions');
  }
}; 