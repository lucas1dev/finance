/**
 * Controller para gerenciamento de Fornecedores (Suppliers)
 * Implementa operações CRUD e validações para fornecedores
 */
const supplierService = require('../services/supplierService');
const { createSupplierSchema, updateSupplierSchema } = require('../utils/validators');

/**
 * Lista todos os fornecedores do usuário
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.user - Usuário autenticado (via JWT)
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Array>} Lista de fornecedores
 * @example
 * // GET /api/suppliers
 * // Retorno: { "success": true, "data": [{ id: 1, name: "Fornecedor XYZ", document_number: "12.345.678/0001-90" }] }
 */
async function index(req, res, next) {
  try {
    const suppliers = await supplierService.listSuppliers(req.user.id);
    res.json({ success: true, data: suppliers });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtém um fornecedor específico por ID
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do fornecedor
 * @param {Object} req.user - Usuário autenticado (via JWT)
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Dados do fornecedor
 * @throws {NotFoundError} Se o fornecedor não for encontrado
 * @example
 * // GET /api/suppliers/1
 * // Retorno: { "success": true, "data": { supplier: { id: 1, name: "Fornecedor XYZ", document_number: "12.345.678/0001-90" } } }
 */
async function show(req, res, next) {
  try {
    const supplier = await supplierService.getSupplier(req.user.id, req.params.id);
    res.json({ success: true, data: { supplier } });
  } catch (error) {
    next(error);
  }
}

/**
 * Cria um novo fornecedor
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.body - Dados do fornecedor
 * @param {string} req.body.name - Nome do fornecedor
 * @param {string} req.body.document_type - Tipo de documento (CPF/CNPJ)
 * @param {string} req.body.document_number - Número do documento
 * @param {string} req.body.email - Email (opcional)
 * @param {string} req.body.phone - Telefone (opcional)
 * @param {string} req.body.address - Endereço (opcional)
 * @param {Object} req.user - Usuário autenticado (via JWT)
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Fornecedor criado
 * @throws {ValidationError} Se os dados forem inválidos
 * @example
 * // POST /api/suppliers
 * // Body: { "name": "Fornecedor XYZ", "document_type": "CNPJ", "document_number": "12.345.678/0001-90" }
 * // Retorno: { "success": true, "data": { supplier: { id: 1, name: "Fornecedor XYZ", document_number: "12.345.678/0001-90" } } }
 */
async function create(req, res, next) {
  try {
    const validatedData = createSupplierSchema.parse(req.body);
    const supplier = await supplierService.createSupplier(req.user.id, validatedData);
    res.status(201).json({ success: true, data: { supplier } });
  } catch (error) {
    next(error);
  }
}

/**
 * Atualiza um fornecedor existente
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do fornecedor
 * @param {Object} req.body - Dados para atualização
 * @param {Object} req.user - Usuário autenticado (via JWT)
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Fornecedor atualizado
 * @throws {NotFoundError} Se o fornecedor não for encontrado
 * @throws {ValidationError} Se os dados forem inválidos
 * @example
 * // PUT /api/suppliers/1
 * // Body: { "name": "Novo Nome", "phone": "(11) 99999-9999" }
 * // Retorno: { "success": true, "data": { supplier: {...} } }
 */
async function update(req, res, next) {
  try {
    const validatedData = updateSupplierSchema.parse(req.body);
    const supplier = await supplierService.updateSupplier(req.user.id, req.params.id, validatedData);
    res.json({ success: true, data: { supplier } });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove um fornecedor
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do fornecedor
 * @param {Object} req.user - Usuário autenticado (via JWT)
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Confirmação de remoção
 * @throws {NotFoundError} Se o fornecedor não for encontrado
 * @throws {ValidationError} Se o fornecedor tiver contas a pagar associadas
 * @example
 * // DELETE /api/suppliers/1
 * // Retorno: { "success": true, "data": { "message": "Fornecedor removido com sucesso" } }
 */
async function deleteSupplier(req, res, next) {
  try {
    await supplierService.deleteSupplier(req.user.id, req.params.id);
    res.json({ success: true, data: { message: 'Fornecedor removido com sucesso' } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  index,
  show,
  create,
  update,
  delete: deleteSupplier
}; 