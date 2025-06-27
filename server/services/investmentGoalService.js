const { InvestmentGoal, Category, Investment } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../utils/errors');

/**
 * Service responsável pela lógica de negócio das metas de investimento
 * @author Lucas Santos
 */
class InvestmentGoalService {
  /**
   * Cria uma nova meta de investimento
   */
  async createInvestmentGoal(userId, data) {
    // Verifica se a categoria existe (se fornecida)
    if (data.category_id) {
      const category = await Category.findOne({
        where: { id: data.category_id, user_id: userId }
      });

      if (!category) {
        throw new AppError('Categoria não encontrada', 404);
      }
    }

    // Cria a meta
    const goal = await InvestmentGoal.create({
      ...data,
      user_id: userId,
      current_amount: data.current_amount || 0
    });

    // Busca a meta com as associações
    const goalWithAssociations = await InvestmentGoal.findByPk(goal.id, {
      include: [
        { model: Category, as: 'category' }
      ]
    });

    if (!goalWithAssociations) {
      throw new AppError('Meta de investimento não encontrada após criação', 404);
    }

    // Calcula o progresso
    const progress = goalWithAssociations.getProgress();

    return {
      ...goalWithAssociations.toJSON(),
      progress
    };
  }

  /**
   * Lista todas as metas de investimento do usuário com filtros e paginação
   */
  async getInvestmentGoals(userId, filters = {}) {
    const {
      status,
      page = 1,
      limit = 10
    } = filters;

    // Constrói os filtros
    const where = { user_id: userId };
    
    if (status) where.status = status;

    // Configura a paginação
    const offset = (page - 1) * limit;

    // Busca as metas
    const { count, rows: goals } = await InvestmentGoal.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category' }
      ],
      order: [['target_date', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calcula o progresso para cada meta
    const goalsWithProgress = goals.map(goal => {
      const progress = goal.getProgress();
      const isOverdue = goal.isOverdue();
      const isCompleted = goal.isCompleted();

      return {
        ...goal.toJSON(),
        progress,
        isOverdue,
        isCompleted
      };
    });

    // Calcula estatísticas
    const totalGoals = await InvestmentGoal.count({ where: { user_id: userId } });
    const activeGoals = await InvestmentGoal.count({ 
      where: { user_id: userId, status: 'ativa' } 
    });
    const completedGoals = await InvestmentGoal.count({ 
      where: { user_id: userId, status: 'concluida' } 
    });

    return {
      goals: goalsWithProgress,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      statistics: {
        totalGoals,
        activeGoals,
        completedGoals,
        completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0
      }
    };
  }

  /**
   * Obtém uma meta de investimento específica
   */
  async getInvestmentGoal(userId, goalId) {
    const goal = await InvestmentGoal.findOne({
      where: { id: goalId, user_id: userId },
      include: [
        { model: Category, as: 'category' }
      ]
    });

    if (!goal) {
      throw new AppError('Meta de investimento não encontrada', 404);
    }

    // Calcula o progresso
    const progress = goal.getProgress();
    const isOverdue = goal.isOverdue();
    const isCompleted = goal.isCompleted();

    return {
      ...goal.toJSON(),
      progress,
      isOverdue,
      isCompleted
    };
  }

  /**
   * Atualiza uma meta de investimento
   */
  async updateInvestmentGoal(userId, goalId, data) {
    // Busca a meta
    const goal = await InvestmentGoal.findOne({
      where: { id: goalId, user_id: userId }
    });

    if (!goal) {
      throw new AppError('Meta de investimento não encontrada', 404);
    }

    // Verifica se a categoria existe (se fornecida)
    if (data.category_id) {
      const category = await Category.findOne({
        where: { id: data.category_id, user_id: userId }
      });

      if (!category) {
        throw new AppError('Categoria não encontrada', 404);
      }
    }

    // Atualiza a meta
    await goal.update(data);

    // Busca a meta atualizada com as associações
    const updatedGoal = await InvestmentGoal.findByPk(goalId, {
      include: [
        { model: Category, as: 'category' }
      ]
    });

    if (!updatedGoal) {
      throw new AppError('Meta de investimento não encontrada após atualização', 404);
    }

    // Calcula o progresso
    const progress = updatedGoal.getProgress();
    const isOverdue = updatedGoal.isOverdue();
    const isCompleted = updatedGoal.isCompleted();

    return {
      ...updatedGoal.toJSON(),
      progress,
      isOverdue,
      isCompleted
    };
  }

  /**
   * Atualiza o valor atual de uma meta de investimento
   */
  async updateGoalAmount(userId, goalId, data) {
    // Busca a meta
    const goal = await InvestmentGoal.findOne({
      where: { id: goalId, user_id: userId }
    });

    if (!goal) {
      throw new AppError('Meta de investimento não encontrada', 404);
    }

    // Atualiza o valor atual
    await goal.update({
      current_amount: data.current_amount
    });

    // Busca a meta atualizada com as associações
    const updatedGoal = await InvestmentGoal.findByPk(goalId, {
      include: [
        { model: Category, as: 'category' }
      ]
    });

    if (!updatedGoal) {
      throw new AppError('Meta de investimento não encontrada após atualização', 404);
    }

    // Calcula o progresso
    const progress = updatedGoal.getProgress();
    const isOverdue = updatedGoal.isOverdue();
    const isCompleted = updatedGoal.isCompleted();

    return {
      ...updatedGoal.toJSON(),
      progress,
      isOverdue,
      isCompleted
    };
  }

  /**
   * Calcula o valor atual de uma meta baseado nos investimentos
   */
  async calculateGoalAmount(userId, goalId) {
    // Busca a meta
    const goal = await InvestmentGoal.findOne({
      where: { id: goalId, user_id: userId }
    });

    if (!goal) {
      throw new AppError('Meta de investimento não encontrada', 404);
    }

    // Busca investimentos relacionados à meta
    const investments = await Investment.findAll({
      where: {
        user_id: userId,
        status: 'ativo',
        [Op.or]: [
          { category_id: goal.category_id },
          { asset_name: { [Op.like]: `%${goal.title}%` } }
        ]
      }
    });

    // Calcula o valor total dos investimentos
    const totalAmount = investments.reduce((sum, investment) => {
      return sum + parseFloat(investment.invested_amount || 0);
    }, 0);

    // Atualiza o valor atual da meta
    await goal.update({
      current_amount: totalAmount
    });

    // Busca a meta atualizada com as associações
    const updatedGoal = await InvestmentGoal.findByPk(goalId, {
      include: [
        { model: Category, as: 'category' }
      ]
    });

    if (!updatedGoal) {
      throw new AppError('Meta de investimento não encontrada após atualização', 404);
    }

    // Calcula o progresso
    const progress = updatedGoal.getProgress();
    const isOverdue = updatedGoal.isOverdue();
    const isCompleted = updatedGoal.isCompleted();

    return {
      ...updatedGoal.toJSON(),
      progress,
      isOverdue,
      isCompleted,
      calculatedAmount: totalAmount,
      investmentsCount: investments.length
    };
  }

  /**
   * Exclui uma meta de investimento
   */
  async deleteInvestmentGoal(userId, goalId) {
    // Busca a meta
    const goal = await InvestmentGoal.findOne({
      where: { id: goalId, user_id: userId }
    });

    if (!goal) {
      throw new AppError('Meta de investimento não encontrada', 404);
    }

    // Exclui a meta
    await goal.destroy();

    return { message: 'Meta de investimento excluída com sucesso' };
  }

  /**
   * Obtém estatísticas das metas de investimento
   */
  async getInvestmentGoalStatistics(userId) {
    // Busca todas as metas do usuário
    const goals = await InvestmentGoal.findAll({
      where: { user_id: userId },
      include: [
        { model: Category, as: 'category' }
      ]
    });

    // Calcula estatísticas
    const totalGoals = goals.length;
    const activeGoals = goals.filter(goal => goal.status === 'ativa').length;
    const completedGoals = goals.filter(goal => goal.status === 'concluida').length;
    const overdueGoals = goals.filter(goal => goal.isOverdue()).length;

    // Calcula valores totais
    const totalTargetAmount = goals.reduce((sum, goal) => sum + parseFloat(goal.target_amount || 0), 0);
    const totalCurrentAmount = goals.reduce((sum, goal) => sum + parseFloat(goal.current_amount || 0), 0);
    const totalProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    // Calcula progresso por categoria
    const progressByCategory = {};
    goals.forEach(goal => {
      if (goal.category) {
        const categoryName = goal.category.name;
        if (!progressByCategory[categoryName]) {
          progressByCategory[categoryName] = {
            totalGoals: 0,
            totalTargetAmount: 0,
            totalCurrentAmount: 0,
            averageProgress: 0
          };
        }
        
        progressByCategory[categoryName].totalGoals++;
        progressByCategory[categoryName].totalTargetAmount += parseFloat(goal.target_amount || 0);
        progressByCategory[categoryName].totalCurrentAmount += parseFloat(goal.current_amount || 0);
      }
    });

    // Calcula média de progresso por categoria
    Object.keys(progressByCategory).forEach(categoryName => {
      const category = progressByCategory[categoryName];
      category.averageProgress = category.totalTargetAmount > 0 
        ? (category.totalCurrentAmount / category.totalTargetAmount) * 100 
        : 0;
    });

    return {
      summary: {
        totalGoals,
        activeGoals,
        completedGoals,
        overdueGoals,
        completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0
      },
      amounts: {
        totalTargetAmount,
        totalCurrentAmount,
        totalProgress,
        remainingAmount: totalTargetAmount - totalCurrentAmount
      },
      progressByCategory
    };
  }
}

module.exports = InvestmentGoalService; 