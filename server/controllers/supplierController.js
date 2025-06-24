/**
 * Controller para gerenciamento de Fornecedores (Suppliers)
 * Implementa operações CRUD e validações para fornecedores
 */
const { Supplier, Payable } = require('../models');
const { validateCPF, validateCNPJ } = require('../utils/documentValidator');
const { createSupplierSchema, updateSupplierSchema } = require('../utils/validators');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Lista todos os fornecedores do usuário
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.userId - ID do usuário autenticado
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<Array>} Lista de fornecedores
 * @example
 * // GET /api/suppliers
 * // Retorno: [{ id: 1, name: "Fornecedor XYZ", document_number: "12.345.678/0001-90" }]
 */
async function index(req, res, next) {
  try {
    const suppliers = await Supplier.findAll({
      where: { user_id: req.userId },
      order: [['name', 'ASC']]
    });
    res.json(suppliers);
  } catch (error) {
    return next(error);
  }
}

/**
 * Obtém um fornecedor específico por ID
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do fornecedor
 * @param {Object} req.userId - ID do usuário autenticado
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Dados do fornecedor
 * @throws {NotFoundError} Se o fornecedor não for encontrado
 * @example
 * // GET /api/suppliers/1
 * // Retorno: { id: 1, name: "Fornecedor XYZ", document_number: "12.345.678/0001-90" }
 */
async function show(req, res, next) {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findOne({
      where: {
        id,
        user_id: req.userId
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
      return next(new NotFoundError('Fornecedor não encontrado'));
    }

    res.json(supplier);
  } catch (error) {
    return next(error);
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
 * @param {Object} req.userId - ID do usuário autenticado
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Fornecedor criado
 * @throws {ValidationError} Se os dados forem inválidos
 * @example
 * // POST /api/suppliers
 * // Body: { "name": "Fornecedor XYZ", "document_type": "CNPJ", "document_number": "12.345.678/0001-90" }
 * // Retorno: { id: 1, name: "Fornecedor XYZ", document_number: "12.345.678/0001-90" }
 */
async function create(req, res, next) {
  try {
    // Validar dados de entrada
    const validatedData = createSupplierSchema.parse(req.body);
    const { name, document_type, document_number, email, phone, address } = validatedData;

    // Validação do documento
    const isValidDocument = document_type === 'CPF' 
      ? validateCPF(document_number)
      : validateCNPJ(document_number);

    if (!isValidDocument) {
      return next(new ValidationError('Documento inválido'));
    }

    // Verificar se o documento já existe
    const existingSupplier = await Supplier.findOne({
      where: {
        document_type,
        document_number,
        user_id: req.userId
      }
    });

    if (existingSupplier) {
      return next(new ValidationError('Já existe um fornecedor com este documento'));
    }

    // Criar o fornecedor
    const supplier = await Supplier.create({
      user_id: req.userId,
      name,
      document_type,
      document_number,
      email: email || null,
      phone: phone || null,
      address: address || null
    });

    res.status(201).json({
      id: supplier.id,
      message: 'Fornecedor criado com sucesso'
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return next(new ValidationError('Nome, tipo e número do documento são obrigatórios'));
    }
    return next(error);
  }
}

/**
 * Atualiza um fornecedor existente
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do fornecedor
 * @param {Object} req.body - Dados para atualização
 * @param {Object} req.userId - ID do usuário autenticado
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Fornecedor atualizado
 * @throws {NotFoundError} Se o fornecedor não for encontrado
 * @throws {ValidationError} Se os dados forem inválidos
 * @example
 * // PUT /api/suppliers/1
 * // Body: { "name": "Novo Nome", "phone": "(11) 99999-9999" }
 * // Retorno: { message: "Fornecedor atualizado com sucesso" }
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validar dados de entrada
    const validatedData = updateSupplierSchema.parse(req.body);
    const { name, document_type, document_number, email, phone, address } = validatedData;

    // Validação do documento
    const isValidDocument = document_type === 'CPF' 
      ? validateCPF(document_number)
      : validateCNPJ(document_number);

    if (!isValidDocument) {
      return next(new ValidationError('Documento inválido'));
    }

    // Buscar o fornecedor
    const supplier = await Supplier.findOne({
      where: {
        id,
        user_id: req.userId
      }
    });

    if (!supplier) {
      return next(new NotFoundError('Fornecedor não encontrado'));
    }

    // Verificar se o documento já existe em outro fornecedor
    if (document_number !== supplier.document_number || document_type !== supplier.document_type) {
      const existingSupplier = await Supplier.findOne({
        where: {
          document_type,
          document_number,
          user_id: req.userId,
          id: { [require('sequelize').Op.ne]: supplier.id }
        }
      });

      if (existingSupplier) {
        return next(new ValidationError('Já existe outro fornecedor com este documento'));
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

    res.json({
      message: 'Fornecedor atualizado com sucesso'
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return next(new ValidationError('Nome, tipo e número do documento são obrigatórios'));
    }
    return next(error);
  }
}

/**
 * Remove um fornecedor
 * @param {Object} req - Objeto de requisição Express
 * @param {number} req.params.id - ID do fornecedor
 * @param {Object} req.userId - ID do usuário autenticado
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do Express
 * @returns {Promise<Object>} Confirmação de remoção
 * @throws {NotFoundError} Se o fornecedor não for encontrado
 * @throws {ValidationError} Se o fornecedor tiver contas a pagar associadas
 * @example
 * // DELETE /api/suppliers/1
 * // Retorno: { message: "Fornecedor removido com sucesso" }
 */
async function deleteSupplier(req, res, next) {
  try {
    const { id } = req.params;

    // Buscar o fornecedor com suas contas a pagar
    const supplier = await Supplier.findOne({
      where: {
        id,
        user_id: req.userId
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
      return next(new NotFoundError('Fornecedor não encontrado'));
    }

    // Verificar se há contas a pagar associadas
    if (supplier.payables && supplier.payables.length > 0) {
      return next(new ValidationError('Não é possível excluir um fornecedor com contas a pagar associadas'));
    }

    // Remover o fornecedor
    await supplier.destroy();

    res.json({
      message: 'Fornecedor removido com sucesso'
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  index,
  show,
  create,
  update,
  delete: deleteSupplier
}; 