/**
 * Controller para gerenciamento de Credores (Creditors)
 * Implementa operações CRUD e validações para credores de financiamentos
 */
const creditorService = require('../services/creditorService');
const { createCreditorSchema, updateCreditorSchema, listCreditorsSchema } = require('../utils/creditorValidators');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Cria um novo credor
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.body - Dados do credor
 * @param {string} req.body.name - Nome do credor
 * @param {string} req.body.document_type - Tipo de documento (CPF/CNPJ)
 * @param {string} req.body.document_number - Número do documento
 * @param {string} req.body.address - Endereço do credor
 * @param {string} req.body.phone - Telefone (opcional)
 * @param {string} req.body.email - Email (opcional)
 * @param {string} req.body.observations - Observações (opcional)
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Credor criado
 * @throws {ValidationError} Se os dados forem inválidos
 * @throws {Error} Se houver erro no banco de dados
 * @example
 * // POST /creditors
 * // Body: { "name": "Banco XYZ", "document_type": "CNPJ", "document_number": "12.345.678/0001-90", "address": "Rua ABC, 123" }
 * // Retorno: { "success": true, "data": { "creditor": {...} } }
 */
async function createCreditor(req, res, next) {
  try {
    const validatedData = createCreditorSchema.parse(req.body);
    const creditor = await creditorService.createCreditor(req.userId, validatedData);
    res.status(201).json({ success: true, data: { creditor } });
  } catch (err) {
    next(err);
  }
}

/**
 * Lista todos os credores do usuário com filtros e paginação
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.query - Parâmetros de consulta
 * @param {string} req.query.name - Filtro por nome
 * @param {string} req.query.document_type - Filtro por tipo de documento
 * @param {string} req.query.status - Filtro por status
 * @param {number} req.query.page - Página atual
 * @param {number} req.query.limit - Limite por página
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Lista de credores paginada
 * @example
 * // GET /creditors?page=1&limit=10&name=Banco
 * // Retorno: { "success": true, "data": { "creditors": [...], "pagination": {...} } }
 */
async function listCreditors(req, res, next) {
  try {
    const validatedQuery = listCreditorsSchema.parse(req.query);
    const result = await creditorService.listCreditors(req.userId, validatedQuery);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtém um credor específico por ID
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do credor
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Dados do credor
 * @throws {NotFoundError} Se o credor não for encontrado
 * @example
 * // GET /creditors/1
 * // Retorno: { "success": true, "data": { "creditor": {...} } }
 */
async function getCreditor(req, res, next) {
  try {
    const creditor = await creditorService.getCreditor(req.userId, req.params.id);
    res.json({ success: true, data: { creditor } });
  } catch (err) {
    next(err);
  }
}

/**
 * Atualiza um credor existente
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do credor
 * @param {Object} req.body - Dados para atualização
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Credor atualizado
 * @throws {NotFoundError} Se o credor não for encontrado
 * @throws {ValidationError} Se os dados forem inválidos
 * @example
 * // PUT /creditors/1
 * // Body: { "name": "Novo Nome", "phone": "(11) 99999-9999" }
 * // Retorno: { "success": true, "data": { "creditor": {...} } }
 */
async function updateCreditor(req, res, next) {
  try {
    const validatedData = updateCreditorSchema.parse(req.body);
    const creditor = await creditorService.updateCreditor(req.userId, req.params.id, validatedData);
    res.json({ success: true, data: { creditor } });
  } catch (err) {
    next(err);
  }
}

/**
 * Exclui um credor
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do credor
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Confirmação de exclusão
 * @throws {NotFoundError} Se o credor não for encontrado
 * @example
 * // DELETE /creditors/1
 * // Retorno: { "success": true, "data": { "message": "Credor excluído com sucesso" } }
 */
async function deleteCreditor(req, res, next) {
  try {
    await creditorService.deleteCreditor(req.userId, req.params.id);
    res.json({ success: true, data: { message: 'Credor excluído com sucesso' } });
  } catch (err) {
    next(err);
  }
}

/**
 * Busca credores por termo
 * @param {Object} req - Objeto de requisição Express
 * @param {string} req.query.term - Termo de busca
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Lista de credores encontrados
 * @example
 * // GET /creditors/search?term=Banco
 * // Retorno: { "success": true, "data": { "creditors": [...] } }
 */
async function searchCreditors(req, res, next) {
  try {
    const { term } = req.query;
    if (!term) {
      return res.json({ success: true, data: { creditors: [] } });
    }
    const creditors = await creditorService.searchCreditors(req.userId, term);
    res.json({ success: true, data: { creditors } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCreditor,
  listCreditors,
  getCreditor,
  updateCreditor,
  deleteCreditor,
  searchCreditors
}; 