const { Category, Transaction } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../utils/errors');

/**
 * Service responsável pela lógica de negócio das categorias
 * @author Lucas Santos
 */
const categoryService = {
  /**
   * Lista todas as categorias do usuário, incluindo categorias padrão
   */
  async getCategories(userId) {
    try {
      const categories = await Category.findAll({
        where: {
          [Op.or]: [
            { user_id: userId },
            { is_default: true }
          ]
        },
        order: [['is_default', 'DESC'], ['name', 'ASC']],
        attributes: ['id', 'name', 'type', 'color', 'is_default', 'created_at', 'updated_at']
      });
      
      return categories;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw new AppError('Erro ao buscar categorias', 500);
    }
  },

  /**
   * Cria uma nova categoria para o usuário
   */
  async createCategory(userId, categoryData) {
    try {
      const { name, type, color } = categoryData;
      
      // Verifica se já existe uma categoria com o mesmo nome para este usuário
      const existingCategory = await Category.findOne({
        where: {
          name,
          user_id: userId,
          type
        }
      });

      if (existingCategory) {
        throw new AppError('Já existe uma categoria com este nome e tipo', 400);
      }
      
      const category = await Category.create({
        user_id: userId,
        name,
        type,
        color: color || (type === 'income' ? '#4CAF50' : '#F44336'),
        is_default: false
      });

      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao criar categoria:', error);
      throw new AppError('Erro ao criar categoria', 500);
    }
  },

  /**
   * Atualiza uma categoria existente do usuário
   */
  async updateCategory(userId, categoryId, updateData) {
    try {
      const { name, type, color } = updateData;
      
      const category = await Category.findOne({
        where: {
          id: categoryId,
          user_id: userId
        }
      });

      if (!category) {
        throw new AppError('Categoria não encontrada', 404);
      }

      // Verificar se é uma categoria padrão
      if (category.is_default) {
        throw new AppError('Não é possível editar categorias padrão do sistema', 403);
      }

      // Verifica se já existe outra categoria com o mesmo nome e tipo
      if (name || type) {
        const existingCategory = await Category.findOne({
          where: {
            name: name || category.name,
            type: type || category.type,
            user_id: userId,
            id: { [Op.ne]: categoryId }
          }
        });

        if (existingCategory) {
          throw new AppError('Já existe uma categoria com este nome e tipo', 400);
        }
      }

      await category.update({
        name,
        type,
        color
      });

      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao atualizar categoria:', error);
      throw new AppError('Erro ao atualizar categoria', 500);
    }
  },

  /**
   * Exclui uma categoria do usuário
   */
  async deleteCategory(userId, categoryId) {
    try {
      const category = await Category.findOne({
        where: {
          id: categoryId,
          user_id: userId
        }
      });
      
      if (!category) {
        throw new AppError('Categoria não encontrada', 404);
      }

      // Verificar se é uma categoria padrão
      if (category.is_default) {
        throw new AppError('Não é possível excluir categorias padrão do sistema', 403);
      }

      await category.destroy();
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao excluir categoria:', error);
      throw new AppError('Erro ao excluir categoria', 500);
    }
  },

  /**
   * Obtém estatísticas detalhadas das categorias
   */
  async getStats(userId, period = 'month') {
    try {
      const currentDate = new Date();
      let startDate;
      
      // Definir período baseado no parâmetro
      switch (period) {
        case 'week':
          startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(currentDate.getMonth() / 3);
          startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(currentDate.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      }

      // Buscar todas as categorias do usuário
      const categories = await Category.findAll({
        where: { user_id: userId },
        attributes: ['id', 'name', 'type', 'color', 'is_default', 'created_at']
      });

      // Buscar transações do período
      const transactions = await Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.gte]: startDate
          }
        },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'type', 'color']
        }]
      });

      // Estatísticas por categoria
      const categoryStats = categories.map(category => {
        const categoryTransactions = transactions.filter(t => t.category && t.category.id === category.id);
        const incomeTransactions = categoryTransactions.filter(t => t.type === 'income');
        const expenseTransactions = categoryTransactions.filter(t => t.type === 'expense');

        const totalIncome = incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const totalExpenses = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const totalTransactions = categoryTransactions.length;

        return {
          id: category.id,
          name: category.name,
          type: category.type,
          color: category.color,
          isDefault: category.is_default,
          stats: {
            totalTransactions,
            incomeTransactions: incomeTransactions.length,
            expenseTransactions: expenseTransactions.length,
            totalIncome: Math.round(totalIncome * 100) / 100,
            totalExpenses: Math.round(totalExpenses * 100) / 100,
            averageTransaction: totalTransactions > 0 ? Math.round(((totalIncome + totalExpenses) / totalTransactions) * 100) / 100 : 0
          }
        };
      });

      // Top categorias por uso
      const topUsedCategories = categoryStats
        .filter(cat => cat.stats.totalTransactions > 0)
        .sort((a, b) => b.stats.totalTransactions - a.stats.totalTransactions)
        .slice(0, 10);

      // Top categorias por valor
      const topValueCategories = categoryStats
        .filter(cat => (cat.stats.totalIncome + cat.stats.totalExpenses) > 0)
        .sort((a, b) => (b.stats.totalIncome + b.stats.totalExpenses) - (a.stats.totalIncome + a.stats.totalExpenses))
        .slice(0, 10);

      // Categorias não utilizadas
      const unusedCategories = categoryStats.filter(cat => cat.stats.totalTransactions === 0);

      // Distribuição por tipo
      const typeDistribution = categoryStats.reduce((acc, cat) => {
        const type = cat.type || 'outro';
        if (!acc[type]) {
          acc[type] = {
            type,
            count: 0,
            totalTransactions: 0,
            totalValue: 0
          };
        }
        acc[type].count++;
        acc[type].totalTransactions += cat.stats.totalTransactions;
        acc[type].totalValue += cat.stats.totalIncome + cat.stats.totalExpenses;
        return acc;
      }, {});

      // Calcular totais e médias por tipo
      Object.values(typeDistribution).forEach(typeStats => {
        typeStats.averageTransactions = typeStats.count > 0 ? typeStats.totalTransactions / typeStats.count : 0;
        typeStats.averageValue = typeStats.count > 0 ? typeStats.totalValue / typeStats.count : 0;
        typeStats.totalValue = Math.round(typeStats.totalValue * 100) / 100;
        typeStats.averageValue = Math.round(typeStats.averageValue * 100) / 100;
      });

      return {
        period,
        summary: {
          totalCategories: categories.length,
          usedCategories: categoryStats.filter(cat => cat.stats.totalTransactions > 0).length,
          unusedCategories: unusedCategories.length,
          defaultCategories: categories.filter(cat => cat.is_default).length,
          customCategories: categories.filter(cat => !cat.is_default).length
        },
        performance: {
          topUsed: topUsedCategories,
          topValue: topValueCategories,
          unused: unusedCategories
        },
        distribution: typeDistribution,
        categories: categoryStats
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas das categorias:', error);
      throw new AppError('Erro ao obter estatísticas das categorias', 500);
    }
  },

  /**
   * Obtém dados para gráficos de categorias
   */
  async getCharts(userId, type = 'usage', period = 'month') {
    try {
      const currentDate = new Date();
      let startDate;
      
      // Definir período baseado no parâmetro
      switch (period) {
        case 'week':
          startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(currentDate.getMonth() / 3);
          startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(currentDate.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      }

      // Buscar categorias e transações
      const categories = await Category.findAll({
        where: { user_id: userId },
        attributes: ['id', 'name', 'type', 'color']
      });

      const transactions = await Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.gte]: startDate
          }
        },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'type', 'color']
        }]
      });

      let data;
      switch (type) {
        case 'usage':
          data = this.getUsageChartData(categories, transactions);
          break;
        case 'value':
          data = this.getValueChartData(categories, transactions);
          break;
        case 'type':
          data = this.getTypeChartData(categories, transactions);
          break;
        default:
          data = this.getUsageChartData(categories, transactions);
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter dados para gráficos:', error);
      throw new AppError('Erro ao obter dados para gráficos', 500);
    }
  },

  /**
   * Obtém dados de uso para gráficos
   */
  getUsageChartData(categories, transactions) {
    const usageData = categories.map(category => {
      const categoryTransactions = transactions.filter(t => t.category && t.category.id === category.id);
      return {
        id: category.id,
        name: category.name,
        type: category.type,
        color: category.color,
        usage: categoryTransactions.length,
        percentage: transactions.length > 0 ? Math.round((categoryTransactions.length / transactions.length) * 100 * 100) / 100 : 0
      };
    }).sort((a, b) => b.usage - a.usage);

    return {
      usageChart: usageData,
      totalTransactions: transactions.length
    };
  },

  /**
   * Obtém dados de valor para gráficos
   */
  getValueChartData(categories, transactions) {
    const valueData = categories.map(category => {
      const categoryTransactions = transactions.filter(t => t.category && t.category.id === category.id);
      const totalValue = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const totalTransactions = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      return {
        id: category.id,
        name: category.name,
        type: category.type,
        color: category.color,
        value: Math.round(totalValue * 100) / 100,
        percentage: totalTransactions > 0 ? Math.round((totalValue / totalTransactions) * 100 * 100) / 100 : 0,
        transactions: categoryTransactions.length
      };
    }).sort((a, b) => b.value - a.value);

    return {
      valueChart: valueData,
      totalValue: Math.round(transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) * 100) / 100
    };
  },

  /**
   * Obtém dados de tipo para gráficos
   */
  getTypeChartData(categories, transactions) {
    const typeData = categories.reduce((acc, category) => {
      const type = category.type || 'outro';
      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          totalValue: 0,
          totalTransactions: 0
        };
      }
      
      const categoryTransactions = transactions.filter(t => t.category && t.category.id === category.id);
      const categoryValue = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      acc[type].count++;
      acc[type].totalValue += categoryValue;
      acc[type].totalTransactions += categoryTransactions.length;
      
      return acc;
    }, {});

    const totalValue = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const typeChart = Object.values(typeData).map(typeStats => ({
      ...typeStats,
      totalValue: Math.round(typeStats.totalValue * 100) / 100,
      percentage: totalValue > 0 ? Math.round((typeStats.totalValue / totalValue) * 100 * 100) / 100 : 0
    })).sort((a, b) => b.totalValue - a.totalValue);

    return {
      typeChart,
      totalValue: Math.round(totalValue * 100) / 100
    };
  }
};

module.exports = categoryService; 