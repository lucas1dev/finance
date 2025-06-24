const { Category } = require('../models');
const { Op } = require('sequelize');
const { createCategorySchema, updateCategorySchema } = require('../utils/validators');

/**
 * Controlador responsável por gerenciar categorias de transações.
 * Permite criar, listar, atualizar e excluir categorias para organizar transações financeiras.
 * Inclui suporte a categorias padrão do sistema que não podem ser editadas ou excluídas.
 */
const categoryController = {
  /**
   * Lista todas as categorias do usuário autenticado, incluindo categorias padrão do sistema.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via middleware de autenticação).
   * @param {number} req.user.id - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Array>} Lista de categorias ordenadas alfabeticamente, incluindo categorias padrão.
   * @throws {Error} Se houver erro ao consultar o banco de dados.
   * @example
   * // GET /categories
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: [{ "id": 1, "name": "Alimentação", "type": "expense", "is_default": false }, ...]
   */
  getCategories: async (req, res) => {
    try {
      const categories = await Category.findAll({
        where: {
          [Op.or]: [
            { user_id: req.user.id },
            { is_default: true }
          ]
        },
        order: [['is_default', 'DESC'], ['name', 'ASC']], // Categorias padrão primeiro
        attributes: ['id', 'name', 'type', 'color', 'is_default', 'created_at', 'updated_at']
      });
      res.json(categories);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
  },

  /**
   * Cria uma nova categoria para o usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da categoria.
   * @param {string} req.body.name - Nome da categoria.
   * @param {string} req.body.type - Tipo da categoria ('income' ou 'expense').
   * @param {string} [req.body.color] - Cor da categoria (opcional).
   * @param {Object} req.user - Usuário autenticado.
   * @param {number} req.user.id - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso e ID da categoria criada.
   * @throws {Error} Se já existir categoria com mesmo nome e tipo ou houver erro no banco.
   * @example
   * // POST /categories
   * // Body: { "name": "Alimentação", "type": "expense", "color": "#FF5722" }
   * // Retorno: { "message": "Categoria criada com sucesso", "categoryId": 1 }
   */
  createCategory: async (req, res) => {
    try {
      // Validar dados de entrada
      const validatedData = createCategorySchema.parse(req.body);
      const { name, type, color } = validatedData;
      
      // Verifica se já existe uma categoria com o mesmo nome para este usuário
      const existingCategory = await Category.findOne({
        where: {
          name,
          user_id: req.user.id,
          type
        }
      });

      if (existingCategory) {
        return res.status(400).json({ error: 'Já existe uma categoria com este nome e tipo' });
      }
      
      const category = await Category.create({
        user_id: req.user.id,
        name,
        type,
        color: color || (type === 'income' ? '#4CAF50' : '#F44336'),
        is_default: false // Categorias criadas pelo usuário nunca são padrão
      });

      res.status(201).json({
        message: 'Categoria criada com sucesso',
        categoryId: category.id
      });
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      res.status(500).json({ error: 'Erro ao criar categoria' });
    }
  },

  /**
   * Atualiza uma categoria existente do usuário autenticado.
   * Não permite editar categorias padrão do sistema.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.id - ID da categoria a ser atualizada.
   * @param {Object} req.body - Novos dados da categoria.
   * @param {string} req.body.name - Novo nome da categoria.
   * @param {string} req.body.type - Novo tipo da categoria ('income' ou 'expense').
   * @param {string} [req.body.color] - Nova cor da categoria (opcional).
   * @param {Object} req.user - Usuário autenticado.
   * @param {number} req.user.id - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se a categoria não for encontrada, for padrão, já existir categoria com mesmo nome/tipo ou houver erro no banco.
   * @example
   * // PUT /categories/1
   * // Body: { "name": "Alimentação e Bebidas", "type": "expense", "color": "#FF5722" }
   * // Retorno: { "message": "Categoria atualizada com sucesso" }
   */
  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validar dados de entrada
      const validatedData = updateCategorySchema.parse(req.body);
      const { name, type, color } = validatedData;
      
      const category = await Category.findOne({
        where: {
          id,
          user_id: req.user.id
        }
      });

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      // Verificar se é uma categoria padrão
      if (category.is_default) {
        return res.status(403).json({ error: 'Não é possível editar categorias padrão do sistema' });
      }

      // Verifica se já existe outra categoria com o mesmo nome e tipo
      if (name || type) {
        const existingCategory = await Category.findOne({
          where: {
            name: name || category.name,
            type: type || category.type,
            user_id: req.user.id,
            id: { [Op.ne]: id } // Exclui a própria categoria da verificação
          }
        });

        if (existingCategory) {
          return res.status(400).json({ error: 'Já existe uma categoria com este nome e tipo' });
        }
      }

      await category.update({
        name,
        type,
        color
      });

      res.json({ message: 'Categoria atualizada com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
  },

  /**
   * Exclui uma categoria do usuário autenticado.
   * Não permite excluir categorias padrão do sistema.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.id - ID da categoria a ser excluída.
   * @param {Object} req.user - Usuário autenticado.
   * @param {number} req.user.id - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se a categoria não for encontrada, for padrão ou houver erro no banco.
   * @example
   * // DELETE /categories/1
   * // Retorno: { "message": "Categoria excluída com sucesso" }
   */
  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const category = await Category.findOne({
        where: {
          id,
          user_id
        }
      });
      
      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      // Verificar se é uma categoria padrão
      if (category.is_default) {
        return res.status(403).json({ error: 'Não é possível excluir categorias padrão do sistema' });
      }

      await category.destroy();
      res.json({ message: 'Categoria excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      res.status(500).json({ error: 'Erro ao excluir categoria' });
    }
  },

  /**
   * Obtém estatísticas detalhadas das categorias.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas detalhadas em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/categories/stats
   * // Retorno: { categoryStats: [...], usageStats: [...], performanceStats: [...] }
   */
  async getStats(req, res) {
    try {
      const userId = req.userId;
      const { period = 'month' } = req.query;
      
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

      const stats = {
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

      return successResponse(res, stats, 'Estatísticas das categorias obtidas com sucesso');
    } catch (error) {
      console.error('Erro ao obter estatísticas das categorias:', error);
      return res.status(500).json({
        error: 'Erro ao obter estatísticas das categorias'
      });
    }
  },

  /**
   * Obtém dados para gráficos de categorias.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Dados para gráficos em formato JSON.
   * @throws {Error} Se houver erro ao buscar dados.
   * @example
   * // GET /api/categories/charts
   * // Retorno: { usageChart: [...], valueChart: [...], typeChart: [...] }
   */
  async getCharts(req, res) {
    try {
      const userId = req.userId;
      const { type = 'usage', period = 'month' } = req.query;
      
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

      return successResponse(res, data, 'Dados para gráficos obtidos com sucesso');
    } catch (error) {
      console.error('Erro ao obter dados para gráficos:', error);
      return res.status(500).json({
        error: 'Erro ao obter dados para gráficos'
      });
    }
  },

  /**
   * Obtém dados de uso para gráficos.
   * @param {Array} categories - Lista de categorias.
   * @param {Array} transactions - Lista de transações.
   * @returns {Object} Dados de uso.
   */
  getUsageChartData(categories, transactions) {
    const usageData = categories.map(category => {
      const categoryTransactions = transactions.filter(t => t.category && t.category.id === category.id);
      const incomeCount = categoryTransactions.filter(t => t.type === 'income').length;
      const expenseCount = categoryTransactions.filter(t => t.type === 'expense').length;

      return {
        id: category.id,
        name: category.name,
        type: category.type,
        color: category.color,
        totalUsage: categoryTransactions.length,
        incomeUsage: incomeCount,
        expenseUsage: expenseCount,
        percentage: transactions.length > 0 ? Math.round((categoryTransactions.length / transactions.length) * 100 * 100) / 100 : 0
      };
    }).filter(cat => cat.totalUsage > 0)
      .sort((a, b) => b.totalUsage - a.totalUsage);

    return {
      usageChart: usageData,
      totalTransactions: transactions.length
    };
  },

  /**
   * Obtém dados de valor para gráficos.
   * @param {Array} categories - Lista de categorias.
   * @param {Array} transactions - Lista de transações.
   * @returns {Object} Dados de valor.
   */
  getValueChartData(categories, transactions) {
    const valueData = categories.map(category => {
      const categoryTransactions = transactions.filter(t => t.category && t.category.id === category.id);
      const income = categoryTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const expenses = categoryTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      return {
        id: category.id,
        name: category.name,
        type: category.type,
        color: category.color,
        totalValue: Math.round((income + expenses) * 100) / 100,
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        netValue: Math.round((income - expenses) * 100) / 100
      };
    }).filter(cat => cat.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue);

    const totalValue = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    return {
      valueChart: valueData,
      totalValue: Math.round(totalValue * 100) / 100
    };
  },

  /**
   * Obtém dados de tipo para gráficos.
   * @param {Array} categories - Lista de categorias.
   * @param {Array} transactions - Lista de transações.
   * @returns {Object} Dados de tipo.
   */
  getTypeChartData(categories, transactions) {
    const typeData = categories.reduce((acc, category) => {
      const type = category.type || 'outro';
      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          totalTransactions: 0,
          totalValue: 0
        };
      }
      acc[type].count++;
      
      const categoryTransactions = transactions.filter(t => t.category && t.category.id === category.id);
      acc[type].totalTransactions += categoryTransactions.length;
      acc[type].totalValue += categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      return acc;
    }, {});

    const typeChart = Object.values(typeData).map(typeStats => ({
      ...typeStats,
      totalValue: Math.round(typeStats.totalValue * 100) / 100,
      averageValue: typeStats.count > 0 ? Math.round((typeStats.totalValue / typeStats.count) * 100) / 100 : 0,
      averageTransactions: typeStats.count > 0 ? Math.round((typeStats.totalTransactions / typeStats.count) * 100) / 100 : 0
    })).sort((a, b) => b.totalValue - a.totalValue);

    return {
      typeChart,
      totalCategories: categories.length,
      totalTransactions: transactions.length
    };
  }
};

module.exports = categoryController; 