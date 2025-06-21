/**
 * Controller para gerenciamento de Credores (Creditors)
 * Implementa operações CRUD e validações para credores de financiamentos
 */
const { Creditor, Financing } = require('../models');
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
 * // Retorno: { "id": 1, "name": "Banco XYZ", "document_type": "CNPJ", ... }
 */
async function createCreditor(req, res, next) {
  // Valida os dados de entrada
  const validationResult = createCreditorSchema.safeParse(req.body);
  
  if (!validationResult.success) {
    return next(new ValidationError('Dados inválidos', validationResult.error.errors));
  }

  try {
    const validatedData = validationResult.data;

    // Verifica se já existe um credor com o mesmo documento para o usuário
    const existingCreditor = await Creditor.findOne({
      where: {
        user_id: req.userId,
        document_number: validatedData.document_number
      }
    });

    if (existingCreditor) {
      return next(new ValidationError('Já existe um credor com este documento'));
    }

    // Cria o credor
    const creditor = await Creditor.create({
      ...validatedData,
      user_id: req.userId
    });

    res.status(201).json({
      message: 'Credor criado com sucesso',
      creditor
    });
  } catch (error) {
    return next(error);
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
 * // Retorno: { "creditors": [...], "pagination": {...} }
 */
async function listCreditors(req, res, next) {
  // Valida os parâmetros de consulta
  const validationResult = listCreditorsSchema.safeParse(req.query);
  
  if (!validationResult.success) {
    return next(new ValidationError('Parâmetros de consulta inválidos', validationResult.error.errors));
  }

  try {
    const validatedQuery = validationResult.data;

    // Constrói as condições de busca
    const where = { user_id: req.userId };
    if (validatedQuery.name) {
      where.name = { [require('sequelize').Op.like]: `%${validatedQuery.name}%` };
    }
    if (validatedQuery.document_type) {
      where.document_type = validatedQuery.document_type;
    }
    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    // Executa a consulta com paginação
    const { count, rows: creditors } = await Creditor.findAndCountAll({
      where,
      include: [
        {
          model: Financing,
          as: 'financings',
          attributes: ['id', 'financing_type', 'total_amount', 'status'],
          where: { user_id: req.userId },
          required: false
        }
      ],
      order: [['name', 'ASC']],
      limit: validatedQuery.limit,
      offset: (validatedQuery.page - 1) * validatedQuery.limit
    });

    // Calcula estatísticas
    const totalPages = Math.ceil(count / validatedQuery.limit);
    const hasNextPage = validatedQuery.page < totalPages;
    const hasPrevPage = validatedQuery.page > 1;

    res.json({
      creditors,
      pagination: {
        total: count,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    return next(error);
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
 * // Retorno: { "id": 1, "name": "Banco XYZ", ... }
 */
async function getCreditor(req, res, next) {
  try {
    const { id } = req.params;

    const creditor = await Creditor.findOne({
      where: {
        id,
        user_id: req.userId
      },
      include: [
        {
          model: Financing,
          as: 'financings',
          attributes: ['id', 'financing_type', 'total_amount', 'current_balance', 'status', 'start_date'],
          where: { user_id: req.userId },
          required: false
        }
      ]
    });

    if (!creditor) {
      return next(new NotFoundError('Credor não encontrado'));
    }

    res.json({ creditor });
  } catch (error) {
    return next(error);
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
 * // Retorno: { "message": "Credor atualizado com sucesso", "creditor": {...} }
 */
async function updateCreditor(req, res, next) {
  try {
    const { id } = req.params;

    // Busca o credor
    const creditor = await Creditor.findOne({
      where: {
        id,
        user_id: req.userId
      }
    });

    if (!creditor) {
      return next(new NotFoundError('Credor não encontrado'));
    }

    // Valida os dados de atualização
    const validatedData = updateCreditorSchema.parse(req.body);

    // Se o documento foi alterado, verifica se já existe outro credor com o mesmo documento
    if (validatedData.document_number && validatedData.document_number !== creditor.document_number) {
      const existingCreditor = await Creditor.findOne({
        where: {
          user_id: req.userId,
          document_number: validatedData.document_number,
          id: { [require('sequelize').Op.ne]: id }
        }
      });

      if (existingCreditor) {
        return next(new ValidationError('Já existe outro credor com este documento'));
      }
    }

    // Atualiza o credor
    await creditor.update(validatedData);

    res.json({
      message: 'Credor atualizado com sucesso',
      creditor
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return next(new ValidationError('Dados inválidos', error.errors));
    }
    return next(error);
  }
}

/**
 * Remove um credor
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do credor
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Confirmação de remoção
 * @throws {NotFoundError} Se o credor não for encontrado
 * @throws {Error} Se o credor tiver financiamentos ativos
 * @example
 * // DELETE /creditors/1
 * // Retorno: { "message": "Credor removido com sucesso" }
 */
async function deleteCreditor(req, res, next) {
  try {
    const { id } = req.params;

    // Busca o credor com seus financiamentos
    const creditor = await Creditor.findOne({
      where: {
        id,
        user_id: req.userId
      },
      include: [
        {
          model: Financing,
          as: 'financings',
          where: { status: 'ativo' },
          required: false
        }
      ]
    });

    if (!creditor) {
      return next(new NotFoundError('Credor não encontrado'));
    }

    // Verifica se há financiamentos ativos
    if (creditor.financings && creditor.financings.length > 0) {
      return next(new Error('Não é possível remover um credor com financiamentos ativos'));
    }

    // Remove o credor
    await creditor.destroy();

    res.json({
      message: 'Credor removido com sucesso'
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Busca credores por nome ou documento (para autocomplete)
 * @param {Object} req - Objeto de requisição Express
 * @param {string} req.query.q - Termo de busca
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Object>} Lista de credores encontrados
 * @example
 * // GET /creditors/search?q=Banco
 * // Retorno: [{ "id": 1, "name": "Banco XYZ", "document_number": "12.345.678/0001-90" }]
 */
async function searchCreditors(req, res) {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json({ creditors: [] });
  }

  const creditors = await Creditor.findAll({
    where: {
      user_id: req.userId,
      [require('sequelize').Op.or]: [
        { name: { [require('sequelize').Op.like]: `%${q}%` } },
        { document_number: { [require('sequelize').Op.like]: `%${q}%` } }
      ]
    },
    attributes: ['id', 'name', 'document_type', 'document_number'],
    order: [['name', 'ASC']],
    limit: 10
  });

  res.json({ creditors });
}

module.exports = {
  createCreditor,
  listCreditors,
  getCreditor,
  updateCreditor,
  deleteCreditor,
  searchCreditors
}; 