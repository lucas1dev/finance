const { Category } = require('../models');
const { Op } = require('sequelize');

/**
 * Controlador responsável por gerenciar categorias de transações.
 * Permite criar, listar, atualizar e excluir categorias para organizar transações financeiras.
 */
const categoryController = {
  /**
   * Lista todas as categorias do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via middleware de autenticação).
   * @param {number} req.user.id - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Array>} Lista de categorias ordenadas alfabeticamente.
   * @throws {Error} Se houver erro ao consultar o banco de dados.
   * @example
   * // GET /categories
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: [{ "id": 1, "name": "Alimentação", "type": "expense" }, ...]
   */
  getCategories: async (req, res) => {
    try {
      const categories = await Category.findAll({
        where: { user_id: req.user.id },
        order: [['name', 'ASC']],
        attributes: ['id', 'name', 'type', 'created_at', 'updated_at']
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
   * @param {Object} req.user - Usuário autenticado.
   * @param {number} req.user.id - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso e ID da categoria criada.
   * @throws {Error} Se já existir categoria com mesmo nome e tipo ou houver erro no banco.
   * @example
   * // POST /categories
   * // Body: { "name": "Alimentação", "type": "expense" }
   * // Retorno: { "message": "Categoria criada com sucesso", "categoryId": 1 }
   */
  createCategory: async (req, res) => {
    try {
      const { name, type } = req.body;
      const user_id = req.user.id;

      // Verifica se já existe uma categoria com o mesmo nome para este usuário
      const existingCategory = await Category.findOne({
        where: {
          name,
          user_id,
          type
        }
      });

      if (existingCategory) {
        return res.status(400).json({ error: 'Já existe uma categoria com este nome e tipo' });
      }

      const category = await Category.create({
        name,
        type,
        user_id
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
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.id - ID da categoria a ser atualizada.
   * @param {Object} req.body - Novos dados da categoria.
   * @param {string} req.body.name - Novo nome da categoria.
   * @param {string} req.body.type - Novo tipo da categoria ('income' ou 'expense').
   * @param {Object} req.user - Usuário autenticado.
   * @param {number} req.user.id - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se a categoria não for encontrada, já existir categoria com mesmo nome/tipo ou houver erro no banco.
   * @example
   * // PUT /categories/1
   * // Body: { "name": "Alimentação e Bebidas", "type": "expense" }
   * // Retorno: { "message": "Categoria atualizada com sucesso" }
   */
  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, type } = req.body;
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

      // Verifica se já existe outra categoria com o mesmo nome e tipo
      const existingCategory = await Category.findOne({
        where: {
          name,
          type,
          user_id,
          id: { [Op.ne]: id } // Exclui a própria categoria da verificação
        }
      });

      if (existingCategory) {
        return res.status(400).json({ error: 'Já existe uma categoria com este nome e tipo' });
      }

      await category.update({ name, type });
      res.json({ message: 'Categoria atualizada com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
  },

  /**
   * Exclui uma categoria do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.id - ID da categoria a ser excluída.
   * @param {Object} req.user - Usuário autenticado.
   * @param {number} req.user.id - ID do usuário autenticado.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com mensagem de sucesso.
   * @throws {Error} Se a categoria não for encontrada ou houver erro no banco.
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

      await category.destroy();
      res.json({ message: 'Categoria excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      res.status(500).json({ error: 'Erro ao excluir categoria' });
    }
  }
};

module.exports = categoryController; 