const { Customer, Receivable, sequelize } = require('../models');
const { validateCPF, validateCNPJ } = require('../utils/documentValidator');
const { createCustomerSchema, updateCustomerSchema } = require('../utils/validators');
const { Op } = require('sequelize');

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
   * // Retorno: [{ id: 1, name: 'João', ... }]
   */
  async index(req, res) {
    try {
      const { type } = req.query;
      const where = { user_id: req.user.id };

      const customers = await Customer.findAll({
        where,
        order: [['name', 'ASC']]
      });

      res.json(customers);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      res.status(500).json({ error: 'Erro ao buscar clientes' });
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
   * // Retorno: { id: 1, name: 'João', ... }
   */
  async show(req, res) {
    try {
      const customer = await Customer.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: Receivable,
            as: 'receivables',
            attributes: ['id', 'amount', 'due_date', 'status']
          }
        ]
      });

      if (!customer) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      if (customer.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      res.json(customer);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      res.status(500).json({ error: 'Erro ao buscar cliente' });
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
   * // Retorno: { "id": 1, "message": "Cliente criado com sucesso" }
   */
  async create(req, res) {
    try {
      // Validar dados de entrada
      const validatedData = createCustomerSchema.parse(req.body);
      const { name, documentType, document, email, phone } = validatedData;

      // Validação do documento
      const isValidDocument = documentType === 'CPF' 
        ? validateCPF(document)
        : validateCNPJ(document);

      if (!isValidDocument) {
        return res.status(400).json({ error: 'Documento inválido' });
      }

      // Verificar se já existe cliente com o mesmo documento
      const existingCustomer = await Customer.findOne({
        where: { 
          user_id: req.user.id,
          document: document,
          document_type: documentType
        }
      });

      if (existingCustomer) {
        return res.status(400).json({ error: 'Já existe um cliente com este documento' });
      }

      // Criar cliente
      const customer = await Customer.create({
        user_id: req.user.id,
        name,
        document_type: documentType,
        document,
        email: email || null,
        phone: phone || null
      });

      res.status(201).json({
        id: customer.id,
        message: 'Cliente criado com sucesso'
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Nome, tipo e número do documento são obrigatórios' });
      }
      console.error('Erro ao criar cliente:', error);
      res.status(500).json({ error: 'Erro ao criar cliente' });
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
   * // Retorno: { "message": "Cliente atualizado com sucesso" }
   */
  async update(req, res) {
    try {
      console.log('📝 Dados recebidos para atualização:', req.body);
      
      // Validar dados de entrada
      const validatedData = updateCustomerSchema.parse(req.body);
      const { name, documentType, document, email, phone } = validatedData;

      console.log('✅ Dados validados:', validatedData);

      // Buscar cliente
      const customer = await Customer.findOne({
        where: { id: req.params.id }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      if (customer.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Validação do documento se fornecido
      if (document && documentType) {
        const isValidDocument = documentType === 'CPF' 
          ? validateCPF(document)
          : validateCNPJ(document);

        if (!isValidDocument) {
          return res.status(400).json({ error: 'Documento inválido' });
        }

        // Verificar se o novo documento já existe em outro cliente
        const existingCustomer = await Customer.findOne({
          where: { 
            user_id: req.user.id,
            document: document,
            document_type: documentType,
            id: { [Op.ne]: customer.id }
          }
        });

        if (existingCustomer) {
          return res.status(400).json({ error: 'Já existe outro cliente com este documento' });
        }
      }

      // Preparar dados para atualização
      const updateData = {};
      
      if (name !== undefined) updateData.name = name;
      if (documentType !== undefined) updateData.document_type = documentType;
      if (document !== undefined) updateData.document = document;
      if (email !== undefined) updateData.email = email || null;
      if (phone !== undefined) updateData.phone = phone || null;

      console.log('🔄 Dados para atualização:', updateData);

      // Atualizar cliente
      await customer.update(updateData);

      console.log('✅ Cliente atualizado com sucesso');

      res.json({ 
        message: 'Cliente atualizado com sucesso',
        customer: {
          id: customer.id,
          name: customer.name,
          documentType: customer.document_type,
          document: customer.document,
          email: customer.email,
          phone: customer.phone
        }
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  }

  async delete(req, res) {
    try {
      const customer = await Customer.findOne({
        where: { id: req.params.id }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      if (customer.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Verificar se existem contas a receber associadas
      const hasReceivables = await Receivable.findOne({
        where: { customer_id: customer.id }
      });

      if (hasReceivables) {
        return res.status(400).json({ error: 'Não é possível excluir um cliente com contas a receber' });
      }

      await customer.destroy();
      res.json({ message: 'Cliente excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      res.status(500).json({ error: 'Erro ao excluir cliente' });
    }
  }

  async getCustomerReceivables(req, res) {
    try {
      const customer = await Customer.findOne({
        where: { id: req.params.id }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      if (customer.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const receivables = await Receivable.findAll({
        where: { customer_id: customer.id },
        order: [['due_date', 'ASC']]
      });

      res.json(receivables);
    } catch (error) {
      console.error('Erro ao buscar contas a receber do cliente:', error);
      res.status(500).json({ error: 'Erro ao buscar contas a receber do cliente' });
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