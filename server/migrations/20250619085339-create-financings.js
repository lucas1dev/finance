'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('financings', {
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
      creditor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'creditors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      financing_type: {
        type: Sequelize.ENUM('hipoteca', 'emprestimo_pessoal', 'financiamento_veiculo', 'outros'),
        allowNull: false
      },
      total_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      interest_rate: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false
      },
      term_months: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      contract_number: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      payment_method: {
        type: Sequelize.ENUM('boleto', 'debito_automatico', 'cartao'),
        allowNull: true
      },
      amortization_method: {
        type: Sequelize.ENUM('SAC', 'Price'),
        allowNull: false,
        defaultValue: 'SAC'
      },
      monthly_payment: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      current_balance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      paid_installments: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      total_paid: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      total_interest_paid: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      status: {
        type: Sequelize.ENUM('ativo', 'quitado', 'inadimplente', 'cancelado'),
        allowNull: false,
        defaultValue: 'ativo'
      },
      observations: {
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

    // Adiciona índices
    await queryInterface.addIndex('financings', ['user_id']);
    await queryInterface.addIndex('financings', ['creditor_id']);
    await queryInterface.addIndex('financings', ['financing_type']);
    await queryInterface.addIndex('financings', ['status']);
    await queryInterface.addIndex('financings', ['start_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('financings');
  }
};
