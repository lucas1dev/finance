const UserService = require('../services/userService');
const { logger } = require('../utils/logger');

/**
 * Controlador responsável por gerenciar usuários (endpoints administrativos).
 * Delega toda a lógica de negócio para o UserService.
 */
class UserController {
  /**
   * Obtém a lista de usuários (apenas para administradores).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.page - Página atual (opcional).
   * @param {string} req.query.limit - Limite por página (opcional).
   * @param {string} req.query.status - Status do usuário (active/inactive) (opcional).
   * @param {string} req.query.role - Role do usuário (admin/user) (opcional).
   * @param {string} req.query.search - Busca por nome ou email (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Lista paginada de usuários em formato JSON.
   */
  async getUsers(req, res) {
    try {
      const result = await UserService.getUsers(req.query);

      logger.info('Lista de usuários obtida com sucesso', {
        admin_id: req.userId,
        total_users: result.pagination.total
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao buscar usuários', {
        error: error.message,
        admin_id: req.userId,
        query: req.query
      });

      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar usuários'
      });
    }
  }

  /**
   * Obtém estatísticas de usuários (apenas para administradores).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.query - Parâmetros de consulta.
   * @param {string} req.query.period - Período para estatísticas (week/month/quarter/year) (opcional).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas de usuários em formato JSON.
   */
  async getUsersStats(req, res) {
    try {
      const result = await UserService.getUsersStats(req.query);

      logger.info('Estatísticas de usuários obtidas com sucesso', {
        admin_id: req.userId,
        period: req.query.period || 'month'
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas de usuários', {
        error: error.message,
        admin_id: req.userId,
        query: req.query
      });

      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatísticas de usuários'
      });
    }
  }

  /**
   * Obtém detalhes de um usuário específico (apenas para administradores).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Detalhes do usuário em formato JSON.
   */
  async getUser(req, res) {
    try {
      const result = await UserService.getUserById(req.params.id);

      logger.info('Detalhes do usuário obtidos com sucesso', {
        admin_id: req.userId,
        user_id: req.params.id
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao buscar detalhes do usuário', {
        error: error.message,
        admin_id: req.userId,
        user_id: req.params.id
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar detalhes do usuário'
      });
    }
  }

  /**
   * Atualiza o status de um usuário (apenas para administradores).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID do usuário.
   * @param {Object} req.body - Dados da requisição.
   * @param {boolean} req.body.active - Novo status do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Usuário atualizado em formato JSON.
   */
  async updateUserStatus(req, res) {
    try {
      const { active } = req.body;

      if (typeof active !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Campo "active" deve ser um valor booleano'
        });
      }

      const result = await UserService.updateUserStatus(req.params.id, active);

      logger.info('Status do usuário atualizado com sucesso', {
        admin_id: req.userId,
        user_id: req.params.id,
        new_status: active
      });

      return res.json({
        success: true,
        data: result,
        message: `Usuário ${active ? 'ativado' : 'desativado'} com sucesso`
      });
    } catch (error) {
      logger.error('Erro ao atualizar status do usuário', {
        error: error.message,
        admin_id: req.userId,
        user_id: req.params.id,
        body: req.body
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar status do usuário'
      });
    }
  }

  /**
   * Atualiza o role de um usuário (apenas para administradores).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID do usuário.
   * @param {Object} req.body - Dados da requisição.
   * @param {string} req.body.role - Novo role do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Usuário atualizado em formato JSON.
   */
  async updateUserRole(req, res) {
    try {
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({
          success: false,
          error: 'Campo "role" é obrigatório'
        });
      }

      const result = await UserService.updateUserRole(req.params.id, role);

      logger.info('Role do usuário atualizado com sucesso', {
        admin_id: req.userId,
        user_id: req.params.id,
        new_role: role
      });

      return res.json({
        success: true,
        data: result,
        message: `Role do usuário atualizado para "${role}" com sucesso`
      });
    } catch (error) {
      logger.error('Erro ao atualizar role do usuário', {
        error: error.message,
        admin_id: req.userId,
        user_id: req.params.id,
        body: req.body
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar role do usuário'
      });
    }
  }

  /**
   * Exclui um usuário (apenas para administradores).
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Confirmação da exclusão em formato JSON.
   */
  async deleteUser(req, res) {
    try {
      await UserService.deleteUser(req.params.id);

      logger.info('Usuário excluído com sucesso', {
        admin_id: req.userId,
        user_id: req.params.id
      });

      return res.json({
        success: true,
        message: 'Usuário excluído com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao excluir usuário', {
        error: error.message,
        admin_id: req.userId,
        user_id: req.params.id
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao excluir usuário'
      });
    }
  }

  /**
   * Obtém estatísticas detalhadas de um usuário específico.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {string} req.params.id - ID do usuário.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Estatísticas detalhadas do usuário em formato JSON.
   */
  async getUserStats(req, res) {
    try {
      const result = await UserService.getUserStats(req.params.id);

      logger.info('Estatísticas detalhadas do usuário obtidas com sucesso', {
        admin_id: req.userId,
        user_id: req.params.id
      });

      return res.json(result);
    } catch (error) {
      logger.error('Erro ao buscar estatísticas detalhadas do usuário', {
        error: error.message,
        admin_id: req.userId,
        user_id: req.params.id
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatísticas detalhadas do usuário'
      });
    }
  }
}

module.exports = new UserController(); 