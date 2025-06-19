const { Customer, Receivable, CustomerType, sequelize } = require('../models');
const { validateCPF, validateCNPJ } = require('../utils/documentValidator');
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
      const include = [
        {
          model: CustomerType,
          as: 'types',
          attributes: ['type']
        }
      ];

      // Se um tipo específico foi solicitado, filtrar por ele
      if (type) {
        include[0].where = { type };
      }

      const customers = await Customer.findAll({
        where,
        include,
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
            model: CustomerType,
            as: 'types',
            attributes: ['type']
          },
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
   * @param {string} req.body.documentNumber - Número do documento.
   * @param {string} [req.body.email] - Email do cliente.
   * @param {string} [req.body.phone] - Telefone do cliente.
   * @param {string} [req.body.address] - Endereço do cliente.
   * @param {string[]} req.body.types - Tipos do cliente (ex: ['customer']).
   * @param {Object} req.user - Usuário autenticado (via JWT).
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Objeto com id do cliente criado e mensagem de sucesso.
   * @throws {Error} Se os dados forem inválidos ou já existir cliente com o mesmo documento.
   * @example
   * // POST /api/customers
   * // Body: { "name": "João", "documentType": "CPF", "documentNumber": "12345678909", "types": ["customer"] }
   * // Retorno: { "id": 1, "message": "Cliente criado com sucesso" }
   */
  async create(req, res) {
    try {
      const { name, documentType, documentNumber, email, phone, address, types } = req.body;

      // Validação dos campos obrigatórios
      if (!name || !documentType || !documentNumber || !types || !Array.isArray(types) || types.length === 0) {
        return res.status(400).json({ error: 'Nome, tipo e número do documento e pelo menos um tipo (cliente/fornecedor) são obrigatórios' });
      }

      // Validação dos tipos
      const validTypes = ['customer', 'supplier'];
      const invalidTypes = types.filter(type => !validTypes.includes(type));
      if (invalidTypes.length > 0) {
        return res.status(400).json({ error: 'Tipos inválidos. Use apenas "customer" e/ou "supplier"' });
      }

      // Validação do documento
      const isValidDocument = documentType === 'CPF' 
        ? validateCPF(documentNumber)
        : validateCNPJ(documentNumber);

      if (!isValidDocument) {
        return res.status(400).json({ error: 'Documento inválido' });
      }

      // Verificar se o documento já existe
      const existingCustomer = await Customer.findOne({
        where: {
          document_type: documentType,
          document_number: documentNumber,
          user_id: req.user.id
        },
        include: [
          {
            model: CustomerType,
            as: 'types',
            attributes: ['type']
          }
        ]
      });

      if (existingCustomer) {
        // Adicionar os novos tipos que ainda não existem
        const existingTypes = existingCustomer.types.map(t => t.type);
        const newTypes = types.filter(type => !existingTypes.includes(type));

        if (newTypes.length > 0) {
          await CustomerType.bulkCreate(
            newTypes.map(type => ({
              customer_id: existingCustomer.id,
              type
            }))
          );
        }

        return res.status(201).json({ 
          id: existingCustomer.id, 
          message: 'Tipos adicionados com sucesso' 
        });
      }

      // Criar o cliente e seus tipos em uma transação
      const result = await sequelize.transaction(async (t) => {
        const customer = await Customer.create({
          user_id: req.user.id,
          name,
          document_type: documentType,
          document_number: documentNumber,
          email: email || null,
          phone: phone || null,
          address: address || null
        }, { transaction: t });

        // Criar os tipos selecionados
        await CustomerType.bulkCreate(
          types.map(type => ({
            customer_id: customer.id,
            type
          })),
          { transaction: t }
        );

        return customer;
      });

      res.status(201).json({ id: result.id, message: 'Cliente criado com sucesso' });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  }

  async update(req, res) {
    try {
      const { name, documentType, documentNumber, email, phone, address, types } = req.body;

      // Validação dos campos obrigatórios
      if (!name || !documentType || !documentNumber || !types || !Array.isArray(types) || types.length === 0) {
        return res.status(400).json({ error: 'Nome, tipo e número do documento e pelo menos um tipo (cliente/fornecedor) são obrigatórios' });
      }

      // Validação dos tipos
      const validTypes = ['customer', 'supplier'];
      const invalidTypes = types.filter(type => !validTypes.includes(type));
      if (invalidTypes.length > 0) {
        return res.status(400).json({ error: 'Tipos inválidos. Use apenas "customer" e/ou "supplier"' });
      }

      // Validação do documento
      const isValidDocument = documentType === 'CPF' 
        ? validateCPF(documentNumber)
        : validateCNPJ(documentNumber);

      if (!isValidDocument) {
        return res.status(400).json({ error: 'Documento inválido' });
      }

      const customer = await Customer.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: CustomerType,
            as: 'types',
            attributes: ['type']
          }
        ]
      });

      if (!customer) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      if (customer.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Verificar se o documento já existe em outro cliente
      if (documentNumber !== customer.document_number || documentType !== customer.document_type) {
        const existingCustomer = await Customer.findOne({
          where: {
            document_type: documentType,
            document_number: documentNumber,
            user_id: req.user.id,
            id: { [Op.ne]: customer.id }
          }
        });

        if (existingCustomer) {
          return res.status(400).json({ error: 'Já existe um cliente com este documento' });
        }
      }

      // Atualizar os dados básicos
      await customer.update({
        name,
        document_type: documentType,
        document_number: documentNumber,
        email: email || null,
        phone: phone || null,
        address: address || null
      });

      // Atualizar os tipos
      const existingTypes = customer.types.map(t => t.type);
      const typesToAdd = types.filter(type => !existingTypes.includes(type));
      const typesToRemove = existingTypes.filter(type => !types.includes(type));

      if (typesToAdd.length > 0) {
        await CustomerType.bulkCreate(
          typesToAdd.map(type => ({
            customer_id: customer.id,
            type
          }))
        );
      }

      if (typesToRemove.length > 0) {
        await CustomerType.destroy({
          where: {
            customer_id: customer.id,
            type: typesToRemove
          }
        });
      }

      res.json({ message: 'Cliente atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  }

  async delete(req, res) {
    try {
      const customer = await Customer.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: CustomerType,
            as: 'types'
          }
        ]
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

      // Remover os tipos associados
      await CustomerType.destroy({
        where: { customer_id: customer.id }
      });

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
        where: { id: req.params.id },
        include: [
          {
            model: CustomerType,
            as: 'types',
            where: { type: 'customer' }
          }
        ]
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