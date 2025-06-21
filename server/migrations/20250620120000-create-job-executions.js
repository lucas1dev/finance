/**
 * Migration para criar a tabela de execução de jobs de notificação.
 * Armazena histórico de execução dos jobs para monitoramento e debugging.
 * 
 * @module migrations/create-job-executions
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('job_executions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      jobName: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Nome do job executado (payment_check, general_reminders, cleanup)'
      },
      status: {
        type: Sequelize.ENUM('success', 'error', 'running'),
        allowNull: false,
        defaultValue: 'running',
        comment: 'Status da execução do job'
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Data/hora de início da execução'
      },
      finishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Data/hora de término da execução'
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duração da execução em milissegundos'
      },
      notificationsCreated: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Número de notificações criadas pelo job'
      },
      notificationsUpdated: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Número de notificações atualizadas pelo job'
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mensagem de erro em caso de falha'
      },
      errorStack: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Stack trace do erro em caso de falha'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Dados adicionais sobre a execução (ex: usuários processados)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Criar índices para melhor performance
    await queryInterface.addIndex('job_executions', ['jobName']);
    await queryInterface.addIndex('job_executions', ['status']);
    await queryInterface.addIndex('job_executions', ['startedAt']);
    await queryInterface.addIndex('job_executions', ['jobName', 'startedAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('job_executions');
  }
}; 