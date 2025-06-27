const { Supplier, Payable } = require('../models');
const { validateCPF, validateCNPJ } = require('../utils/documentValidator');
const { AppError } = require('../utils/errors');
const { Op } = require('sequelize');

const supplierService = {
  async listSuppliers(userId) {
    const suppliers = await Supplier.findAll({
      where: { user_id: userId },
      order: [['name', 'ASC']]
    });
    return suppliers;
  },

  async getSupplier(userId, id) {
    const supplier = await Supplier.findOne({
      where: {
        id,
        user_id: userId
      },
      include: [
        {
          model: Payable,
          as: 'payables',
          attributes: ['id', 'amount', 'due_date', 'status']
        }
      ]
    });

    if (!supplier) {
      throw new AppError('Fornecedor não encontrado', 404);
    }

    return supplier;
  },

  async createSupplier(userId, data) {
    const { name, document_type, document_number, email, phone, address } = data;

    // Validação do documento
    const isValidDocument = document_type === 'CPF' 
      ? validateCPF(document_number)
      : validateCNPJ(document_number);

    if (!isValidDocument) {
      throw new AppError('Documento inválido', 400);
    }

    // Verificar se o documento já existe
    const existingSupplier = await Supplier.findOne({
      where: {
        document_type,
        document_number,
        user_id: userId
      }
    });

    if (existingSupplier) {
      throw new AppError('Já existe um fornecedor com este documento', 400);
    }

    // Criar o fornecedor
    const supplier = await Supplier.create({
      user_id: userId,
      name,
      document_type,
      document_number,
      email: email || null,
      phone: phone || null,
      address: address || null
    });

    return supplier;
  },

  async updateSupplier(userId, id, data) {
    const { name, document_type, document_number, email, phone, address } = data;

    // Validação do documento
    const isValidDocument = document_type === 'CPF' 
      ? validateCPF(document_number)
      : validateCNPJ(document_number);

    if (!isValidDocument) {
      throw new AppError('Documento inválido', 400);
    }

    // Buscar o fornecedor
    const supplier = await Supplier.findOne({
      where: {
        id,
        user_id: userId
      }
    });

    if (!supplier) {
      throw new AppError('Fornecedor não encontrado', 404);
    }

    // Verificar se o documento já existe em outro fornecedor
    if (document_number !== supplier.document_number || document_type !== supplier.document_type) {
      const existingSupplier = await Supplier.findOne({
        where: {
          document_type,
          document_number,
          user_id: userId,
          id: { [Op.ne]: supplier.id }
        }
      });

      if (existingSupplier) {
        throw new AppError('Já existe outro fornecedor com este documento', 400);
      }
    }

    // Atualizar o fornecedor
    await supplier.update({
      name,
      document_type,
      document_number,
      email: email || null,
      phone: phone || null,
      address: address || null
    });

    return supplier;
  },

  async deleteSupplier(userId, id) {
    // Buscar o fornecedor com suas contas a pagar
    const supplier = await Supplier.findOne({
      where: {
        id,
        user_id: userId
      },
      include: [
        {
          model: Payable,
          as: 'payables',
          required: false
        }
      ]
    });

    if (!supplier) {
      throw new AppError('Fornecedor não encontrado', 404);
    }

    // Verificar se há contas a pagar associadas
    if (supplier.payables && supplier.payables.length > 0) {
      throw new AppError('Não é possível excluir um fornecedor com contas a pagar associadas', 400);
    }

    // Remover o fornecedor
    await supplier.destroy();
    return true;
  }
};

module.exports = supplierService; 