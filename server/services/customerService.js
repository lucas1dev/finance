const { Customer, Receivable } = require('../models');
const { validateCPF, validateCNPJ } = require('../utils/documentValidator');
const { AppError } = require('../utils/errors');
const { Op } = require('sequelize');

const customerService = {
  async listCustomers(userId, type = null) {
    const where = { user_id: userId };
    
    // Se o modelo Customer não tiver campo type, remover o filtro
    // Por enquanto, vamos retornar todos os clientes do usuário
    const customers = await Customer.findAll({
      where,
      order: [['name', 'ASC']]
    });
    return customers;
  },

  async getCustomer(userId, id) {
    const customer = await Customer.findOne({
      where: { id },
      include: [
        {
          model: Receivable,
          as: 'receivables',
          attributes: ['id', 'amount', 'due_date', 'status']
        }
      ]
    });

    if (!customer) {
      throw new AppError('Cliente não encontrado', 404);
    }

    if (customer.user_id !== userId) {
      throw new AppError('Acesso negado', 403);
    }

    return customer;
  },

  async createCustomer(userId, data) {
    const { name, documentType, document, email, phone } = data;

    // Validação do documento
    const isValidDocument = documentType === 'CPF' 
      ? validateCPF(document)
      : validateCNPJ(document);

    if (!isValidDocument) {
      throw new AppError('Documento inválido', 400);
    }

    // Verificar se já existe cliente com o mesmo documento
    const existingCustomer = await Customer.findOne({
      where: { 
        user_id: userId,
        document: document,
        document_type: documentType
      }
    });

    if (existingCustomer) {
      throw new AppError('Já existe um cliente com este documento', 400);
    }

    // Criar cliente
    const customer = await Customer.create({
      user_id: userId,
      name,
      document_type: documentType,
      document,
      email: email || null,
      phone: phone || null
    });

    return customer;
  },

  async updateCustomer(userId, id, data) {
    const { name, documentType, document, email, phone } = data;

    // Buscar cliente
    const customer = await Customer.findOne({
      where: { id }
    });

    if (!customer) {
      throw new AppError('Cliente não encontrado', 404);
    }

    if (customer.user_id !== userId) {
      throw new AppError('Acesso negado', 403);
    }

    // Validação do documento se fornecido
    if (document && documentType) {
      const isValidDocument = documentType === 'CPF' 
        ? validateCPF(document)
        : validateCNPJ(document);

      if (!isValidDocument) {
        throw new AppError('Documento inválido', 400);
      }

      // Verificar se o novo documento já existe em outro cliente
      const existingCustomer = await Customer.findOne({
        where: { 
          user_id: userId,
          document: document,
          document_type: documentType,
          id: { [Op.ne]: customer.id }
        }
      });

      if (existingCustomer) {
        throw new AppError('Já existe outro cliente com este documento', 400);
      }
    }

    // Preparar dados para atualização
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (documentType !== undefined) updateData.document_type = documentType;
    if (document !== undefined) updateData.document = document;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;

    // Atualizar cliente
    await customer.update(updateData);
    return customer;
  },

  async deleteCustomer(userId, id) {
    const customer = await Customer.findOne({
      where: { id }
    });

    if (!customer) {
      throw new AppError('Cliente não encontrado', 404);
    }

    if (customer.user_id !== userId) {
      throw new AppError('Acesso negado', 403);
    }

    // Verificar se existem contas a receber associadas
    const hasReceivables = await Receivable.findOne({
      where: { customer_id: customer.id }
    });

    if (hasReceivables) {
      throw new AppError('Não é possível excluir um cliente com contas a receber', 400);
    }

    await customer.destroy();
    return true;
  },

  async getCustomerReceivables(userId, id) {
    const customer = await Customer.findOne({
      where: { id }
    });

    if (!customer) {
      throw new AppError('Cliente não encontrado', 404);
    }

    if (customer.user_id !== userId) {
      throw new AppError('Acesso negado', 403);
    }

    const receivables = await Receivable.findAll({
      where: { customer_id: customer.id },
      order: [['due_date', 'ASC']]
    });

    return receivables;
  }
};

module.exports = customerService; 