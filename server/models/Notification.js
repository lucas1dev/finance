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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    related_type: {
      type: DataTypes.ENUM('financing', 'financing_payment', 'creditor', 'general'),
      allowNull: true,
      comment: 'Tipo de entidade relacionada à notificação',
    },
    related_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID da entidade relacionada',
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data de vencimento relacionada à notificação',
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica se a notificação foi lida',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Indica se a notificação está ativa',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
      comment: 'Prioridade da notificação',
    },
    scheduled_for: {
      type: DataTypes.DATE,
      allowNull: true,
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
      foreignKey: 'user_id',
      as: 'user',
    });
    
    Notification.belongsTo(models.Financing, {
      foreignKey: 'related_id',
      as: 'financing',
      constraints: false,
      scope: {
        related_type: 'financing',
      },
    });
    
    Notification.belongsTo(models.FinancingPayment, {
      foreignKey: 'related_id',
      as: 'financingPayment',
      constraints: false,
      scope: {
        related_type: 'financing_payment',
      },
    });
    
    Notification.belongsTo(models.Creditor, {
      foreignKey: 'related_id',
      as: 'creditor',
      constraints: false,
      scope: {
        related_type: 'creditor',
      },
    });
  };

  return Notification;
}; 