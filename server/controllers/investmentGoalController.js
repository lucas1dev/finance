const { InvestmentGoal, Category, Investment } = require('../models');
const { createInvestmentGoalSchema, updateInvestmentGoalSchema, updateGoalAmountSchema } = require('../utils/investmentValidators');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { Op } = require('sequelize');

/**
 * Controller para gerenciamento de metas de investimento.
 * Permite criar, listar, atualizar e excluir metas,
 * além de calcular o progresso baseado nos investimentos atuais.
 */
class InvestmentGoalController {
  /**
   * Cria uma nova meta de investimento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados da meta.
   * @param {string} req.body.title - Título da meta.
   * @param {string} req.body.description - Descrição da meta.
   * @param {number} req.body.target_amount - Valor alvo.
   * @param {string} req.body.target_date - Data alvo.
   * @param {number} req.body.current_amount - Valor atual (opcional).
   * @param {string} req.body.color - Cor da meta (opcional).
   * @param {number} req.body.category_id - ID da categoria (opcional).
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Meta criada em formato JSON.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se a categoria não for encontrada.
   * @example
   * // POST /investment-goals
   * // Body: { "title": "Aposentadoria", "target_amount": 500000, "target_date": "2030-12-31" }
   * // Retorno: { "id": 1, "title": "Aposentadoria", "progress": 0, ... }
   */
  async createInvestmentGoal(req, res) {
    try {
      // Valida os dados de entrada
      const validatedData = createInvestmentGoalSchema.parse(req.body);

      // Verifica se a categoria existe (se fornecida)
      if (validatedData.category_id) {
        const category = await Category.findOne({
          where: { id: validatedData.category_id, user_id: req.userId }
        });

        if (!category) {
          throw new NotFoundError('Categoria não encontrada');
        }
      }

      // Cria a meta
      const goal = await InvestmentGoal.create({
        ...validatedData,
        user_id: req.userId,
        current_amount: validatedData.current_amount || 0
      });

      // Busca a meta com as associações
      const goalWithAssociations = await InvestmentGoal.findByPk(goal.id, {
        include: [
          { model: Category, as: 'category' }
        ]
      });

      // Calcula o progresso
      const progress = goalWithAssociations.getProgress();

      res.status(201).json({
        message: 'Meta de investimento criada com sucesso',
        goal: {
          ...goalWithAssociations.toJSON(),
          progress
        }
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new ValidationError('Dados inválidos', error.errors);
      }
      throw error;
    }
  }

  /**
   * Lista todas as metas de investimento do usuário.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.status - Filtrar por status.
   * @param {number} req.query.page - Página para paginação.
   * @param {number} req.query.limit - Limite de itens por página.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista de metas em formato JSON.
   * @example
   * // GET /investment-goals?status=ativa&page=1&limit=10
   * // Retorno: { "goals": [...], "total": 5, "page": 1, "totalPages": 1 }
   */
  async getInvestmentGoals(req, res) {
    const {
      status,
      page = 1,
      limit = 10
    } = req.query;

    // Constrói os filtros
    const where = { user_id: req.userId };
    
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
    const totalGoals = await InvestmentGoal.count({ where: { user_id: req.userId } });
    const activeGoals = await InvestmentGoal.count({ 
      where: { user_id: req.userId, status: 'ativa' } 
    });
    const completedGoals = await InvestmentGoal.count({ 
      where: { user_id: req.userId, status: 'concluida' } 
    });

    res.json({
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
    });
  }

  /**
   * Obtém uma meta de investimento específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da meta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Meta em formato JSON.
   * @throws {NotFoundError} Se a meta não for encontrada.
   * @example
   * // GET /investment-goals/1
   * // Retorno: { "id": 1, "title": "Aposentadoria", "progress": 25, ... }
   */
  async getInvestmentGoal(req, res) {
    const { id } = req.params;

    const goal = await InvestmentGoal.findOne({
      where: { id, user_id: req.userId },
      include: [
        { model: Category, as: 'category' }
      ]
    });

    if (!goal) {
      throw new NotFoundError('Meta de investimento não encontrada');
    }

    // Calcula o progresso
    const progress = goal.getProgress();
    const isOverdue = goal.isOverdue();
    const isCompleted = goal.isCompleted();

    res.json({
      ...goal.toJSON(),
      progress,
      isOverdue,
      isCompleted
    });
  }

  /**
   * Atualiza uma meta de investimento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da meta.
   * @param {Object} req.body - Dados para atualização.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Meta atualizada em formato JSON.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se a meta não for encontrada.
   * @example
   * // PUT /investment-goals/1
   * // Body: { "target_amount": 600000 }
   * // Retorno: { "id": 1, "target_amount": 600000, "progress": 20, ... }
   */
  async updateInvestmentGoal(req, res) {
    try {
      const { id } = req.params;

      // Valida os dados de entrada
      const validatedData = updateInvestmentGoalSchema.parse(req.body);

      // Busca a meta
      const goal = await InvestmentGoal.findOne({
        where: { id, user_id: req.userId }
      });

      if (!goal) {
        throw new NotFoundError('Meta de investimento não encontrada');
      }

      // Verifica se a categoria existe (se fornecida)
      if (validatedData.category_id) {
        const category = await Category.findOne({
          where: { id: validatedData.category_id, user_id: req.userId }
        });

        if (!category) {
          throw new NotFoundError('Categoria não encontrada');
        }
      }

      // Atualiza a meta
      await goal.update(validatedData);

      // Busca a meta atualizada com as associações
      const updatedGoal = await InvestmentGoal.findByPk(id, {
        include: [
          { model: Category, as: 'category' }
        ]
      });

      // Calcula o progresso
      const progress = updatedGoal.getProgress();
      const isOverdue = updatedGoal.isOverdue();
      const isCompleted = updatedGoal.isCompleted();

      res.json({
        message: 'Meta de investimento atualizada com sucesso',
        goal: {
          ...updatedGoal.toJSON(),
          progress,
          isOverdue,
          isCompleted
        }
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new ValidationError('Dados inválidos', error.errors);
      }
      throw error;
    }
  }

  /**
   * Atualiza o valor atual de uma meta baseado nos investimentos.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da meta.
   * @param {Object} req.body - Dados para atualização.
   * @param {number} req.body.current_amount - Valor atual.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Meta atualizada em formato JSON.
   * @throws {ValidationError} Se os dados forem inválidos.
   * @throws {NotFoundError} Se a meta não for encontrada.
   * @example
   * // PATCH /investment-goals/1/amount
   * // Body: { "current_amount": 125000 }
   * // Retorno: { "id": 1, "current_amount": 125000, "progress": 25, ... }
   */
  async updateGoalAmount(req, res) {
    try {
      const { id } = req.params;

      // Valida os dados de entrada
      const validatedData = updateGoalAmountSchema.parse(req.body);

      // Busca a meta
      const goal = await InvestmentGoal.findOne({
        where: { id, user_id: req.userId }
      });

      if (!goal) {
        throw new NotFoundError('Meta de investimento não encontrada');
      }

      // Atualiza o valor atual
      await goal.update({
        current_amount: validatedData.current_amount
      });

      // Busca a meta atualizada com as associações
      const updatedGoal = await InvestmentGoal.findByPk(id, {
        include: [
          { model: Category, as: 'category' }
        ]
      });

      // Calcula o progresso
      const progress = updatedGoal.getProgress();
      const isOverdue = updatedGoal.isOverdue();
      const isCompleted = updatedGoal.isCompleted();

      res.json({
        message: 'Valor atual da meta atualizado com sucesso',
        goal: {
          ...updatedGoal.toJSON(),
          progress,
          isOverdue,
          isCompleted
        }
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new ValidationError('Dados inválidos', error.errors);
      }
      throw error;
    }
  }

  /**
   * Calcula automaticamente o valor atual de uma meta baseado nos investimentos.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da meta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Meta atualizada em formato JSON.
   * @throws {NotFoundError} Se a meta não for encontrada.
   * @example
   * // POST /investment-goals/1/calculate
   * // Retorno: { "id": 1, "current_amount": 125000, "progress": 25, ... }
   */
  async calculateGoalAmount(req, res) {
    const { id } = req.params;

    // Busca a meta
    const goal = await InvestmentGoal.findOne({
      where: { id, user_id: req.userId }
    });

    if (!goal) {
      throw new NotFoundError('Meta de investimento não encontrada');
    }

    // Calcula o valor total dos investimentos ativos
    const totalInvested = await Investment.sum('invested_amount', {
      where: { 
        user_id: req.userId,
        operation_type: 'compra',
        status: 'ativo'
      }
    });

    // Atualiza o valor atual da meta
    await goal.update({
      current_amount: totalInvested || 0
    });

    // Busca a meta atualizada com as associações
    const updatedGoal = await InvestmentGoal.findByPk(id, {
      include: [
        { model: Category, as: 'category' }
      ]
    });

    // Calcula o progresso
    const progress = updatedGoal.getProgress();
    const isOverdue = updatedGoal.isOverdue();
    const isCompleted = updatedGoal.isCompleted();

    res.json({
      message: 'Valor atual da meta calculado automaticamente',
      goal: {
        ...updatedGoal.toJSON(),
        progress,
        isOverdue,
        isCompleted
      }
    });
  }

  /**
   * Exclui uma meta de investimento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.params.id - ID da meta.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Mensagem de confirmação.
   * @throws {NotFoundError} Se a meta não for encontrada.
   * @example
   * // DELETE /investment-goals/1
   * // Retorno: { "message": "Meta de investimento excluída com sucesso" }
   */
  async deleteInvestmentGoal(req, res) {
    const { id } = req.params;

    const goal = await InvestmentGoal.findOne({
      where: { id, user_id: req.userId }
    });

    if (!goal) {
      throw new NotFoundError('Meta de investimento não encontrada');
    }

    // Exclui a meta
    await goal.destroy();

    res.json({
      message: 'Meta de investimento excluída com sucesso'
    });
  }

  /**
   * Obtém estatísticas das metas de investimento.
   * @param {Object} req - Objeto de requisição Express.
   * @param {number} req.userId - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas em formato JSON.
   * @example
   * // GET /investment-goals/statistics
   * // Retorno: { "totalGoals": 5, "activeGoals": 3, "averageProgress": 45, ... }
   */
  async getInvestmentGoalStatistics(req, res) {
    // Estatísticas gerais
    const totalGoals = await InvestmentGoal.count({ where: { user_id: req.userId } });
    const activeGoals = await InvestmentGoal.count({ 
      where: { user_id: req.userId, status: 'ativa' } 
    });
    const completedGoals = await InvestmentGoal.count({ 
      where: { user_id: req.userId, status: 'concluida' } 
    });
    const overdueGoals = await InvestmentGoal.count({ 
      where: { 
        user_id: req.userId, 
        status: 'ativa',
        target_date: { [Op.lt]: new Date() }
      } 
    });

    // Busca todas as metas para calcular progresso médio
    const allGoals = await InvestmentGoal.findAll({
      where: { user_id: req.userId }
    });

    let totalProgress = 0;
    let goalsWithProgress = 0;

    allGoals.forEach(goal => {
      const progress = goal.getProgress();
      if (!isNaN(progress)) {
        totalProgress += progress;
        goalsWithProgress++;
      }
    });

    const averageProgress = goalsWithProgress > 0 ? totalProgress / goalsWithProgress : 0;

    // Metas próximas do vencimento (próximos 30 dias)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingGoals = await InvestmentGoal.findAll({
      where: {
        user_id: req.userId,
        status: 'ativa',
        target_date: {
          [Op.between]: [new Date(), thirtyDaysFromNow]
        }
      },
      include: [
        { model: Category, as: 'category' }
      ],
      order: [['target_date', 'ASC']]
    });

    // Calcula progresso para metas próximas
    const upcomingGoalsWithProgress = upcomingGoals.map(goal => {
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

    res.json({
      general: {
        totalGoals,
        activeGoals,
        completedGoals,
        overdueGoals,
        completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
        averageProgress
      },
      upcomingGoals: upcomingGoalsWithProgress
    });
  }
}

module.exports = new InvestmentGoalController(); 