const { ValidationError, NotFoundError, AppError } = require('../utils/errors');
const categoryService = require('../services/categoryService');
const { createCategorySchema, updateCategorySchema } = require('../utils/validators');

/**
 * Controller responsável por gerenciar categorias de transações.
 * Delega toda a lógica ao service e padroniza respostas.
 */
class CategoryController {
  constructor(categoryService) {
    this.categoryService = categoryService;
  }

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
  async getCategories(req, res) {
    try {
      const categories = await this.categoryService.getCategories(req.user.id);
      res.json({ success: true, data: categories });
    } catch (error) {
      this.handleError(error, res);
    }
  }

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
  async createCategory(req, res) {
    try {
      const category = await this.categoryService.createCategory(req.user.id, req.body);
      res.status(201).json({ 
        success: true, 
        data: { categoryId: category.id } 
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

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
  async updateCategory(req, res) {
    try {
      await this.categoryService.updateCategory(req.user.id, req.params.id, req.body);
      res.json({ 
        success: true, 
        data: { message: 'Categoria atualizada com sucesso' } 
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

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
  async deleteCategory(req, res) {
    try {
      await this.categoryService.deleteCategory(req.user.id, req.params.id);
      res.json({ 
        success: true, 
        data: { message: 'Categoria excluída com sucesso' } 
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

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
      const stats = await this.categoryService.getStats(req.user.id, req.query.period);
      res.json({ success: true, data: stats });
    } catch (error) {
      this.handleError(error, res);
    }
  }

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
      const data = await this.categoryService.getCharts(req.user.id, req.query.type, req.query.period);
      res.json({ success: true, data });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Busca uma categoria específica pelo ID, garantindo que só o dono ou categorias padrão possam acessar.
   */
  async getCategoryById(req, res) {
    try {
      const category = await this.categoryService.getCategoryById(req.user.id, req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, error: 'Categoria não encontrada' });
      }
      res.json({ success: true, data: category });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Método helper para tratamento consistente de erros.
   */
  handleError(error, res) {
    // Verificar se é erro de validação Zod
    if (error.name === 'ZodError' || error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Dados inválidos'
      });
    }

    // Tratar AppError com statusCode específico
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

module.exports = CategoryController; 