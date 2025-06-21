/**
 * Modelo de Notificação para sistema de lembretes e vencimentos.
 * Gerencia notificações de pagamentos de financiamentos, vencimentos e lembretes personalizados.
 * 
 * @module models/Notification
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('payment_due', 'payment_overdue', 'reminder', 'system'),
      allowNull: false,
      comment: 'Tipo da notificação: vencimento, atraso, lembrete ou sistema',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Título da notificação',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Mensagem detalhada da notificação',
    },
    relatedType: {
      type: DataTypes.ENUM('financing', 'financing_payment', 'creditor', 'general'),
      allowNull: true,
      field: 'related_type',
      comment: 'Tipo de entidade relacionada à notificação',
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'related_id',
      comment: 'ID da entidade relacionada',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date',
      comment: 'Data de vencimento relacionada à notificação',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
      comment: 'Indica se a notificação foi lida',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
      comment: 'Indica se a notificação está ativa',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
      comment: 'Prioridade da notificação',
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_for',
      comment: 'Data/hora programada para exibição da notificação',
    },
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true, // Usa snake_case para timestamps
    indexes: [
      {
        fields: ['user_id', 'is_read'],
      },
      {
        fields: ['type', 'due_date'],
      },
      {
        fields: ['scheduled_for'],
      },
    ],
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    
    Notification.belongsTo(models.Financing, {
      foreignKey: 'relatedId',
      as: 'financing',
      constraints: false,
      scope: {
        relatedType: 'financing',
      },
    });
    
    Notification.belongsTo(models.FinancingPayment, {
      foreignKey: 'relatedId',
      as: 'financingPayment',
      constraints: false,
      scope: {
        relatedType: 'financing_payment',
      },
    });
    
    Notification.belongsTo(models.Creditor, {
      foreignKey: 'relatedId',
      as: 'creditor',
      constraints: false,
      scope: {
        relatedType: 'creditor',
      },
    });
  };

  return Notification;
}; 