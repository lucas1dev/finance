const { Creditor, Financing } = require('../models');
const { AppError } = require('../utils/errors');
const { Op } = require('sequelize');

const creditorService = {
  async createCreditor(userId, data) {
    // Verifica duplicidade
    const existingCreditor = await Creditor.findOne({
      where: {
        user_id: userId,
        document_number: data.document_number
      }
    });
    if (existingCreditor) {
      throw new AppError('Já existe um credor com este documento', 400);
    }
    // Cria
    const creditor = await Creditor.create({ ...data, user_id: userId });
    return creditor;
  },

  async listCreditors(userId, query) {
    const where = { user_id: userId };
    if (query.name) {
      where.name = { [Op.like]: `%${query.name}%` };
    }
    if (query.document_type) {
      where.document_type = query.document_type;
    }
    if (query.status) {
      where.status = query.status;
    }
    const { count, rows: creditors } = await Creditor.findAndCountAll({
      where,
      include: [
        {
          model: Financing,
          as: 'financings',
          attributes: ['id', 'financing_type', 'total_amount', 'status'],
          where: { user_id: userId },
          required: false
        }
      ],
      order: [['name', 'ASC']],
      limit: query.limit,
      offset: (query.page - 1) * query.limit
    });
    const totalPages = Math.ceil(count / query.limit);
    return {
      creditors,
      pagination: {
        total: count,
        page: query.page,
        limit: query.limit,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPrevPage: query.page > 1
      }
    };
  },

  async getCreditor(userId, id) {
    const creditor = await Creditor.findOne({
      where: { id, user_id: userId },
      include: [
        {
          model: Financing,
          as: 'financings',
          attributes: ['id', 'financing_type', 'total_amount', 'current_balance', 'status', 'start_date'],
          where: { user_id: userId },
          required: false
        }
      ]
    });
    if (!creditor) {
      throw new AppError('Credor não encontrado', 404);
    }
    return creditor;
  },

  async updateCreditor(userId, id, data) {
    const creditor = await Creditor.findOne({ where: { id, user_id: userId } });
    if (!creditor) {
      throw new AppError('Credor não encontrado', 404);
    }
    await creditor.update(data);
    return creditor;
  },

  async deleteCreditor(userId, id) {
    const creditor = await Creditor.findOne({ where: { id, user_id: userId } });
    if (!creditor) {
      throw new AppError('Credor não encontrado', 404);
    }
    await creditor.destroy();
    return true;
  },

  async searchCreditors(userId, term) {
    // Validar tamanho mínimo do termo
    if (!term || term.length < 2) {
      return [];
    }
    
    const creditors = await Creditor.findAll({
      where: {
        user_id: userId,
        [Op.or]: [
          { name: { [Op.like]: `%${term}%` } },
          { document_number: { [Op.like]: `%${term}%` } }
        ]
      },
      order: [['name', 'ASC']]
    });
    return creditors;
  }
};

module.exports = creditorService; 