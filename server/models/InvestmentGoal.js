const { DataTypes } = require('sequelize');

/**
 * Modelo de Meta de Investimento para definir objetivos financeiros.
 * Permite acompanhar o progresso em direção a um valor alvo específico.
 * @class InvestmentGoal
 * @extends Model
 */
module.exports = (sequelize) => {
  const InvestmentGoal = sequelize.define('InvestmentGoal', {
    /**
     * Identificador único da meta.
     * @type {number}
     */
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    /**
     * Nome ou título da meta.
     * @type {string}
     * @required
     */
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },

    /**
     * Descrição detalhada da meta.
     * @type {text}
     * @required
     */
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },

    /**
     * Valor alvo a ser alcançado.
     * @type {decimal}
     * @required
     */
    target_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.01
      }
    },

    /**
     * Data limite para alcançar a meta.
     * @type {date}
     * @required
     */
    target_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true,
        isFutureDate(value) {
          if (new Date(value) <= new Date()) {
            throw new Error('A data alvo deve ser futura');
          }
        }
      }
    },

    /**
     * Valor atual acumulado na meta.
     * @type {decimal}
     */
    current_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        isDecimal: true,
        min: 0
      }
    },

    /**
     * Status da meta (ativa, concluída, cancelada).
     * @type {string}
     */
    status: {
      type: DataTypes.ENUM('ativa', 'concluida', 'cancelada'),
      defaultValue: 'ativa',
      validate: {
        isIn: [['ativa', 'concluida', 'cancelada']]
      }
    },

    /**
     * Cor da meta para identificação visual.
     * @type {string}
     */
    color: {
      type: DataTypes.STRING(7),
      defaultValue: '#3B82F6',
      validate: {
        is: /^#[0-9A-F]{6}$/i
      }
    },

    /**
     * ID do usuário proprietário da meta.
     * @type {number}
     * @required
     */
    user_id: {
      type: DataTypes.INTEGER,
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
     * @type {number}
     */
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {
    /**
     * Configurações do modelo.
     */
    tableName: 'investment_goals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    /**
     * Índices para otimização de consultas.
     */
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['target_date']
      },
      {
        fields: ['category_id']
      }
    ],

    /**
     * Hooks do modelo.
     */
    hooks: {
      /**
       * Hook executado antes de salvar a meta.
       * Atualiza o status baseado no progresso.
       */
      beforeSave: (goal) => {
        if (goal.current_amount >= goal.target_amount && goal.status === 'ativa') {
          goal.status = 'concluida';
        }
      }
    }
  });

  /**
   * Associações do modelo InvestmentGoal.
   * @param {Object} models - Todos os modelos do Sequelize.
   */
  InvestmentGoal.associate = (models) => {
    // Associação com usuário (N:1)
    InvestmentGoal.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Associação com categoria (N:1)
    InvestmentGoal.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });
  };

  /**
   * Método para calcular o progresso da meta em porcentagem.
   * @returns {number} Progresso em porcentagem (0-100).
   */
  InvestmentGoal.prototype.getProgress = function() {
    if (this.target_amount <= 0) return 0;
    const progress = (this.current_amount / this.target_amount) * 100;
    return Math.min(progress, 100);
  };

  /**
   * Método para verificar se a meta está atrasada.
   * @returns {boolean} True se a meta está atrasada.
   */
  InvestmentGoal.prototype.isOverdue = function() {
    return new Date(this.target_date) < new Date() && this.status === 'ativa';
  };

  /**
   * Método para verificar se a meta foi concluída.
   * @returns {boolean} True se a meta foi concluída.
   */
  InvestmentGoal.prototype.isCompleted = function() {
    return this.current_amount >= this.target_amount;
  };

  return InvestmentGoal;
}; 