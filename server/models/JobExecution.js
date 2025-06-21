/**
 * Modelo para armazenar histórico de execução dos jobs de notificação.
 * Permite rastrear quando cada job foi executado, seu status e resultados.
 * 
 * @module models/JobExecution
 */

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class JobExecution extends Model {}

  JobExecution.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    jobName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Nome do job executado (payment_check, general_reminders, cleanup)',
    },
    status: {
      type: DataTypes.ENUM('success', 'error', 'running'),
      allowNull: false,
      defaultValue: 'running',
      comment: 'Status da execução do job',
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Data/hora de início da execução',
    },
    finishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data/hora de término da execução',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duração da execução em milissegundos',
    },
    notificationsCreated: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Número de notificações criadas pelo job',
    },
    notificationsUpdated: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Número de notificações atualizadas pelo job',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mensagem de erro em caso de falha',
    },
    errorStack: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Stack trace do erro em caso de falha',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Dados adicionais sobre a execução (ex: usuários processados)',
    },
  }, {
    sequelize,
    modelName: 'JobExecution',
    tableName: 'job_executions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['job_name'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['started_at'],
      },
      {
        fields: ['job_name', 'started_at'],
      },
    ],
  });

  return JobExecution;
}; 