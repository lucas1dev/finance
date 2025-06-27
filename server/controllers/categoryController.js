const categoryService = require('../services/categoryService');
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
  async getCategories(req, res, next) {
    try {
      const categories = await categoryService.getCategories(req.user.id);
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
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
  async createCategory(req, res, next) {
    try {
      const validatedData = createCategorySchema.parse(req.body);
      const category = await categoryService.createCategory(req.user.id, validatedData);
      res.status(201).json({ success: true, data: { categoryId: category.id } });
    } catch (err) {
      next(err);
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
  async updateCategory(req, res, next) {
    try {
      const validatedData = updateCategorySchema.parse(req.body);
      await categoryService.updateCategory(req.user.id, req.params.id, validatedData);
      res.json({ success: true, data: { message: 'Categoria atualizada com sucesso' } });
    } catch (err) {
      next(err);
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
  async deleteCategory(req, res, next) {
    try {
      await categoryService.deleteCategory(req.user.id, req.params.id);
      res.json({ success: true, data: { message: 'Categoria excluída com sucesso' } });
    } catch (err) {
      next(err);
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
  async getStats(req, res, next) {
    try {
      const stats = await categoryService.getStats(req.user.id, req.query.period);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
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
  async getCharts(req, res, next) {
    try {
      const data = await categoryService.getCharts(req.user.id, req.query.type, req.query.period);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = categoryController; 