/**
 * Controller para gerenciamento de Credores (Creditors)
 * Implementa operações CRUD e validações para credores de financiamentos
 */
const { ValidationError, NotFoundError, AppError } = require('../utils/errors');

/**
 * Controller responsável por gerenciar credores de financiamentos.
 * Delega toda a lógica ao service e padroniza respostas.
 */
class CreditorController {
  constructor(creditorService) {
    this.creditorService = creditorService;
  }

  /**
   * Cria um novo credor
   */
  async createCreditor(req, res) {
    try {
      const creditor = await this.creditorService.createCreditor(req.user.id, req.body);
      res.status(201).json({ 
        success: true, 
        data: { creditor } 
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Lista todos os credores do usuário com filtros e paginação
   */
  async listCreditors(req, res) {
    try {
      const result = await this.creditorService.listCreditors(req.user.id, req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Obtém um credor específico por ID
   */
  async getCreditor(req, res) {
    try {
      const creditor = await this.creditorService.getCreditor(req.user.id, req.params.id);
      res.json({ success: true, data: { creditor } });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Atualiza um credor existente
   */
  async updateCreditor(req, res) {
    try {
      const creditor = await this.creditorService.updateCreditor(req.user.id, req.params.id, req.body);
      res.json({ success: true, data: { creditor } });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Exclui um credor
   */
  async deleteCreditor(req, res) {
    try {
      await this.creditorService.deleteCreditor(req.user.id, req.params.id);
      res.json({ 
        success: true, 
        data: { message: 'Credor excluído com sucesso' } 
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Busca credores por termo
   */
  async searchCreditors(req, res) {
    try {
      const { term } = req.query;
      if (!term) {
        return res.json({ success: true, data: { creditors: [] } });
      }
      const creditors = await this.creditorService.searchCreditors(req.user.id, term);
      res.json({ success: true, data: { creditors } });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Método helper para tratamento consistente de erros.
   */
  handleError(error, res) {
    // Tratar ValidationError e ZodError
    if (error.name === 'ZodError' || error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message || 'Dados inválidos'
      });
    }

    // Tratar AppError com statusCode específico
    if (error.name === 'AppError') {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }

    // Tratar NotFoundError
    if (error.name === 'NotFoundError') {
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

module.exports = CreditorController; 