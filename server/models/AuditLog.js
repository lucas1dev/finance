/**
 * Modelo para logs de auditoria de ações administrativas.
 * Registra todas as ações sensíveis realizadas por administradores.
 * 
 * @module models/AuditLog
 */

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID do usuário que executou a ação',
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Email do usuário para facilitar consultas',
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Tipo de ação realizada (ex: job_execution, config_change, data_deletion)',
    },
    resource: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Recurso afetado (ex: notifications, jobs, users)',
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID do recurso específico afetado (se aplicável)',
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detalhes adicionais da ação em formato JSON',
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'Endereço IP do usuário',
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User-Agent do navegador/aplicação',
    },
    status: {
      type: DataTypes.ENUM('success', 'failure', 'partial'),
      allowNull: false,
      defaultValue: 'success',
      comment: 'Status da ação (success, failure, partial)',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mensagem de erro em caso de falha',
    },
    executionTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Tempo de execução em milissegundos',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Data e hora da ação',
    },
  }, {
    tableName: 'audit_logs',
    timestamps: false, // Usamos apenas createdAt
    underscored: true, // Usar snake_case para colunas
    indexes: [
      {
        fields: ['user_id'],
        name: 'idx_audit_logs_user_id'
      },
      {
        fields: ['action'],
        name: 'idx_audit_logs_action'
      },
      {
        fields: ['resource'],
        name: 'idx_audit_logs_resource'
      },
      {
        fields: ['created_at'],
        name: 'idx_audit_logs_created_at'
      },
      {
        fields: ['user_id', 'created_at'],
        name: 'idx_audit_logs_user_created'
      }
    ],
    comment: 'Logs de auditoria para ações administrativas'
  });

  /**
   * Associações do modelo AuditLog
   */
  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return AuditLog;
}; 