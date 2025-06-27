const customerService = require('../services/customerService');
const { createCustomerSchema, updateCustomerSchema } = require('../utils/validators');

class CustomerController {
  /**
   * Lista todos os clientes do usuário autenticado, com opção de filtro por tipo.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {string} [req.query.type] - Tipo de cliente para filtrar ('customer' ou 'supplier').
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de clientes em formato JSON.
   * @throws {Error} Se houver erro ao buscar clientes.
   * @example
   * // GET /api/customers?type=customer
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "success": true, "data": [{ id: 1, name: 'João', ... }] }
   */
  async index(req, res, next) {
    try {
      const { type } = req.query;
      const customers = await customerService.listCustomers(req.user.id, type);
      res.json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retorna os detalhes de um cliente específico do usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do cliente.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Cliente encontrado em formato JSON.
   * @throws {Error} Se o cliente não for encontrado ou não pertencer ao usuário.
   * @example
   * // GET /api/customers/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "success": true, "data": { customer: {...} } }
   */
  async show(req, res, next) {
    try {
      const customer = await customerService.getCustomer(req.user.id, req.params.id);
      res.json({ success: true, data: { customer } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria um novo cliente para o usuário autenticado.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados do cliente.
   * @param {string} req.body.name - Nome do cliente.
   * @param {string} req.body.documentType - Tipo do documento ('CPF' ou 'CNPJ').
   * @param {string} req.body.document - Número do documento.
   * @param {string} [req.body.email] - Email do cliente.
   * @param {string} [req.body.phone] - Telefone do cliente.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Objeto com id do cliente criado e mensagem de sucesso.
   * @throws {Error} Se os dados forem inválidos ou já existir cliente com o mesmo documento.
   * @example
   * // POST /customers
   * // Body: { "name": "João Silva", "documentType": "CPF", "document": "12345678900", "email": "joao@example.com" }
   * // Retorno: { "success": true, "data": { customer: {...} } }
   */
  async create(req, res, next) {
    try {
      const validatedData = createCustomerSchema.parse(req.body);
      const customer = await customerService.createCustomer(req.user.id, validatedData);
      res.status(201).json({ success: true, data: { customer } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza um cliente existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do cliente.
   * @param {Object} req.body - Dados para atualização.
   * @param {string} [req.body.name] - Nome do cliente.
   * @param {string} [req.body.documentType] - Tipo do documento ('CPF' ou 'CNPJ').
   * @param {string} [req.body.document] - Número do documento.
   * @param {string} [req.body.email] - Email do cliente.
   * @param {string} [req.body.phone] - Telefone do cliente.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Mensagem de sucesso.
   * @throws {Error} Se o cliente não for encontrado ou os dados forem inválidos.
   * @example
   * // PUT /customers/1
   * // Body: { "name": "João Silva Atualizado", "email": "joao.novo@example.com" }
   * // Retorno: { "success": true, "data": { customer: {...} } }
   */
  async update(req, res, next) {
    try {
      const validatedData = updateCustomerSchema.parse(req.body);
      const customer = await customerService.updateCustomer(req.user.id, req.params.id, validatedData);
      res.json({ success: true, data: { customer } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exclui um cliente existente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do cliente.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Mensagem de sucesso.
   * @throws {Error} Se o cliente não for encontrado ou tiver contas a receber.
   * @example
   * // DELETE /customers/1
   * // Retorno: { "success": true, "data": { "message": "Cliente excluído com sucesso" } }
   */
  async delete(req, res, next) {
    try {
      await customerService.deleteCustomer(req.user.id, req.params.id);
      res.json({ success: true, data: { message: 'Cliente excluído com sucesso' } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém as contas a receber de um cliente específico.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do cliente.
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object[]>} Lista de contas a receber em formato JSON.
   * @throws {Error} Se o cliente não for encontrado ou não pertencer ao usuário.
   * @example
   * // GET /api/customers/1/receivables
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { "success": true, "data": { receivables: [...] } }
   */
  async getCustomerReceivables(req, res, next) {
    try {
      const receivables = await customerService.getCustomerReceivables(req.user.id, req.params.id);
      res.json({ success: true, data: { receivables } });
    } catch (error) {
      next(error);
    }
  }
}

const customerController = new CustomerController();

module.exports = {
  index: customerController.index.bind(customerController),
  show: customerController.show.bind(customerController),
  create: customerController.create.bind(customerController),
  update: customerController.update.bind(customerController),
  delete: customerController.delete.bind(customerController),
  getCustomerReceivables: customerController.getCustomerReceivables.bind(customerController)
}; 