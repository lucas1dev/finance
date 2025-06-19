const { DataTypes } = require('sequelize');

/**
 * Modelo de Investimento para gestão de ativos financeiros.
 * Permite registrar compras, vendas e acompanhar o desempenho dos investimentos.
 * @class Investment
 * @extends Model
 */
module.exports = (sequelize) => {
  const Investment = sequelize.define('Investment', {
    /**
     * Identificador único do investimento.
     * @type {number}
     */
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    /**
     * Tipo de investimento (ações, fundos, títulos, criptomoedas, outros).
     * @type {string}
     * @required
     */
    investment_type: {
      type: DataTypes.ENUM('acoes', 'fundos', 'titulos', 'criptomoedas', 'outros'),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [['acoes', 'fundos', 'titulos', 'criptomoedas', 'outros']]
      }
    },

    /**
     * Nome do ativo investido.
     * @type {string}
     * @required
     */
    asset_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },

    /**
     * Ticker ou código do ativo (opcional).
     * @type {string}
     */
    ticker: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: [0, 20]
      }
    },

    /**
     * Valor investido na operação.
     * @type {decimal}
     * @required
     */
    invested_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.01
      }
    },

    /**
     * Quantidade de ativos comprados/vendidos.
     * @type {decimal}
     * @required
     */
    quantity: {
      type: DataTypes.DECIMAL(15, 6),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.000001
      }
    },

    /**
     * Preço unitário do ativo.
     * @type {decimal}
     */
    unit_price: {
      type: DataTypes.DECIMAL(15, 6),
      allowNull: true,
      validate: {
        isDecimal: true,
        min: 0.000001
      }
    },

    /**
     * Data da operação (compra/venda).
     * @type {date}
     * @required
     */
    operation_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true
      }
    },

    /**
     * Tipo de operação (compra ou venda).
     * @type {string}
     * @required
     */
    operation_type: {
      type: DataTypes.ENUM('compra', 'venda'),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [['compra', 'venda']]
      }
    },

    /**
     * Corretora utilizada na operação.
     * @type {string}
     */
    broker: {
      type: DataTypes.ENUM(
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
      allowNull: true,
      validate: {
        isIn: [[
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
        ]]
      }
    },

    /**
     * Observações sobre o investimento.
     * @type {text}
     */
    observations: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    /**
     * Status do investimento (ativo, vendido, cancelado).
     * @type {string}
     */
    status: {
      type: DataTypes.ENUM('ativo', 'vendido', 'cancelado'),
      defaultValue: 'ativo',
      validate: {
        isIn: [['ativo', 'vendido', 'cancelado']]
      }
    },

    /**
     * ID do usuário proprietário do investimento.
     * @type {number}
     * @required
     */
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },

    /**
     * ID da conta utilizada para a operação.
     * @type {number}
     * @required
     */
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },

    /**
     * ID da categoria do investimento.
     * @type {number}
     */
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {
    /**
     * Configurações do modelo.
     */
    tableName: 'investments',
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
        fields: ['account_id']
      },
      {
        fields: ['investment_type']
      },
      {
        fields: ['operation_type']
      },
      {
        fields: ['operation_date']
      },
      {
        fields: ['status']
      },
      {
        fields: ['ticker']
      }
    ],

    /**
     * Hooks do modelo.
     */
    hooks: {
      /**
       * Hook executado antes de salvar o investimento.
       * Calcula o preço unitário baseado no valor investido e quantidade.
       */
      beforeSave: (investment) => {
        if (investment.invested_amount && investment.quantity) {
          investment.unit_price = investment.invested_amount / investment.quantity;
        }
      }
    }
  });

  /**
   * Associações do modelo Investment.
   * @param {Object} models - Todos os modelos do Sequelize.
   */
  Investment.associate = (models) => {
    // Associação com usuário (N:1)
    Investment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Associação com conta (N:1)
    Investment.belongsTo(models.Account, {
      foreignKey: 'account_id',
      as: 'account'
    });

    // Associação com categoria (N:1)
    Investment.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });

    // Associação com aportes (1:N)
    Investment.hasMany(models.InvestmentContribution, {
      foreignKey: 'investment_id',
      as: 'contributions'
    });
  };

  /**
   * Método de instância para calcular o total investido baseado nos aportes.
   * @returns {Promise<number>} Total investido através de aportes.
   */
  Investment.prototype.getTotalInvestedFromContributions = async function() {
    const { InvestmentContribution } = require('../models');
    const total = await InvestmentContribution.sum('amount', {
      where: { investment_id: this.id }
    });
    return total || 0;
  };

  /**
   * Método de instância para calcular a quantidade total baseada nos aportes.
   * @returns {Promise<number>} Quantidade total através de aportes.
   */
  Investment.prototype.getTotalQuantityFromContributions = async function() {
    const { InvestmentContribution } = require('../models');
    const total = await InvestmentContribution.sum('quantity', {
      where: { investment_id: this.id }
    });
    return total || 0;
  };

  /**
   * Método de instância para calcular o preço médio baseado nos aportes.
   * @returns {Promise<number>} Preço médio ponderado dos aportes.
   */
  Investment.prototype.getAveragePriceFromContributions = async function() {
    const { InvestmentContribution } = require('../models');
    const totalAmount = await InvestmentContribution.sum('amount', {
      where: { investment_id: this.id }
    });
    const totalQuantity = await InvestmentContribution.sum('quantity', {
      where: { investment_id: this.id }
    });
    
    if (totalQuantity > 0) {
      return totalAmount / totalQuantity;
    }
    return 0;
  };

  /**
   * Método de instância para obter o número total de aportes.
   * @returns {Promise<number>} Número total de aportes.
   */
  Investment.prototype.getContributionCount = async function() {
    const { InvestmentContribution } = require('../models');
    const count = await InvestmentContribution.count({
      where: { investment_id: this.id }
    });
    return count;
  };

  /**
   * Método de instância para obter todos os aportes ordenados por data.
   * @returns {Promise<Array>} Lista de aportes ordenados por data.
   */
  Investment.prototype.getContributions = async function() {
    const { InvestmentContribution } = require('../models');
    const contributions = await InvestmentContribution.findAll({
      where: { investment_id: this.id },
      order: [['contribution_date', 'ASC']]
    });
    return contributions;
  };

  /**
   * Método estático para calcular a posição atual de um ativo para um usuário.
   * @param {number} userId - ID do usuário.
   * @param {string} assetName - Nome do ativo.
   * @param {string} ticker - Ticker do ativo (opcional).
   * @returns {Promise<Object>} Posição do ativo com quantidade e valor total.
   */
  Investment.getPosition = async function(userId, assetName, ticker = null) {
    const where = {
      user_id: userId,
      asset_name: assetName,
      status: 'ativo'
    };

    if (ticker) {
      where.ticker = ticker;
    }

    const investments = await Investment.findAll({ where });

    let totalQuantity = 0;
    let totalInvested = 0;
    let averagePrice = 0;

    for (const investment of investments) {
      if (investment.operation_type === 'compra') {
        totalQuantity += parseFloat(investment.quantity);
        totalInvested += parseFloat(investment.invested_amount);
      } else if (investment.operation_type === 'venda') {
        totalQuantity -= parseFloat(investment.quantity);
        totalInvested -= parseFloat(investment.invested_amount);
      }
    }

    if (totalQuantity > 0) {
      averagePrice = totalInvested / totalQuantity;
    }

    return {
      assetName,
      ticker,
      totalQuantity,
      totalInvested,
      averagePrice,
      hasPosition: totalQuantity > 0
    };
  };

  /**
   * Método estático para listar todas as posições ativas de um usuário.
   * @param {number} userId - ID do usuário.
   * @returns {Promise<Array>} Lista de posições ativas.
   */
  Investment.getActivePositions = async function(userId) {
    // Busca todos os investimentos ativos do usuário
    const investments = await Investment.findAll({
      where: {
        user_id: userId,
        status: 'ativo'
      }
    });

    // Agrupa por asset_name e ticker
    const assetGroups = {};
    
    for (const investment of investments) {
      const key = `${investment.asset_name}_${investment.ticker || 'no_ticker'}`;
      
      if (!assetGroups[key]) {
        assetGroups[key] = {
          asset_name: investment.asset_name,
          ticker: investment.ticker,
          investment_type: investment.investment_type,
          broker: investment.broker,
          investments: []
        };
      }
      
      assetGroups[key].investments.push(investment);
    }

    // Calcula posições para cada grupo
    const positions = [];

    for (const key in assetGroups) {
      const group = assetGroups[key];
      const position = await Investment.getPosition(
        userId, 
        group.asset_name, 
        group.ticker
      );

      if (position.hasPosition) {
        positions.push({
          ...position,
          investment_type: group.investment_type,
          broker: group.broker
        });
      }
    }

    return positions;
  };

  /**
   * Método estático para verificar se há quantidade suficiente para venda.
   * @param {number} userId - ID do usuário.
   * @param {string} assetName - Nome do ativo.
   * @param {number} quantityToSell - Quantidade a ser vendida.
   * @param {string} ticker - Ticker do ativo (opcional).
   * @returns {Promise<boolean>} True se há quantidade suficiente.
   */
  Investment.hasEnoughQuantity = async function(userId, assetName, quantityToSell, ticker = null) {
    const position = await Investment.getPosition(userId, assetName, ticker);
    return position.totalQuantity >= quantityToSell;
  };

  return Investment;
}; 