const { Customer, Payable, CustomerType, sequelize } = require('../models');
const { validateCPF, validateCNPJ } = require('../utils/documentValidator');
const { Op } = require('sequelize');

class SupplierController {
  async index(req, res) {
    try {
      const customers = await Customer.findAll({
        where: { user_id: req.user.id },
        include: [
          {
            model: CustomerType,
            as: 'types',
            where: { type: 'supplier' },
            attributes: ['type']
          }
        ],
        order: [['name', 'ASC']]
      });
      res.json(customers);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      res.status(500).json({ error: 'Erro ao buscar fornecedores' });
    }
  }

  async show(req, res) {
    try {
      const supplier = await Customer.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: CustomerType,
            as: 'types',
            where: { type: 'supplier' },
            attributes: ['type']
          },
          {
            model: Payable,
            as: 'payables',
            attributes: ['id', 'amount', 'due_date', 'status']
          }
        ]
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      if (supplier.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      res.json(supplier);
    } catch (error) {
      console.error('Erro ao buscar fornecedor:', error);
      res.status(500).json({ error: 'Erro ao buscar fornecedor' });
    }
  }

  async create(req, res) {
    try {
      const { name, documentType, documentNumber, email, phone, address } = req.body;

      // Validação dos campos obrigatórios
      if (!name || !documentType || !documentNumber) {
        return res.status(400).json({ error: 'Nome, tipo e número do documento são obrigatórios' });
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
        }
      });

      if (existingCustomer) {
        // Se o cliente já existe, apenas adiciona o tipo 'supplier'
        const existingType = await CustomerType.findOne({
          where: {
            customer_id: existingCustomer.id,
            type: 'supplier'
          }
        });

        if (!existingType) {
          await CustomerType.create({
            customer_id: existingCustomer.id,
            type: 'supplier'
          });
        }

        return res.status(201).json({ 
          id: existingCustomer.id, 
          message: 'Fornecedor adicionado com sucesso' 
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

        // Criar o tipo 'supplier'
        await CustomerType.create({
          customer_id: customer.id,
          type: 'supplier'
        }, { transaction: t });

        return customer;
      });

      res.status(201).json({ id: result.id, message: 'Fornecedor criado com sucesso' });
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      res.status(500).json({ error: 'Erro ao criar fornecedor' });
    }
  }

  async update(req, res) {
    try {
      const { name, documentType, documentNumber, email, phone, address } = req.body;

      // Validação dos campos obrigatórios
      if (!name || !documentType || !documentNumber) {
        return res.status(400).json({ error: 'Nome, tipo e número do documento são obrigatórios' });
      }

      // Validação do documento
      const isValidDocument = documentType === 'CPF' 
        ? validateCPF(documentNumber)
        : validateCNPJ(documentNumber);

      if (!isValidDocument) {
        return res.status(400).json({ error: 'Documento inválido' });
      }

      const supplier = await Customer.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: CustomerType,
            as: 'types',
            where: { type: 'supplier' }
          }
        ]
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      if (supplier.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Verificar se o documento já existe em outro cliente
      if (documentNumber !== supplier.document_number || documentType !== supplier.document_type) {
        const existingCustomer = await Customer.findOne({
          where: {
            document_type: documentType,
            document_number: documentNumber,
            user_id: req.user.id,
            id: { [Op.ne]: supplier.id }
          }
        });

        if (existingCustomer) {
          return res.status(400).json({ error: 'Já existe um cliente/fornecedor com este documento' });
        }
      }

      await supplier.update({
        name,
        document_type: documentType,
        document_number: documentNumber,
        email: email || null,
        phone: phone || null,
        address: address || null
      });

      res.json({ message: 'Fornecedor atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
    }
  }

  /**
   * Remove um fornecedor do sistema.
   * @param {Object} req - Objeto de requisição Express.
   * @param {string} req.params.id - ID do fornecedor a ser removido.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Mensagem de sucesso ou erro.
   * @throws {Error} Se o fornecedor não existir, não pertencer ao usuário ou possuir contas a pagar associadas.
   * @example
   * // DELETE /api/suppliers/1
   * // Headers: { Authorization: "Bearer <token>" }
   * // Retorno: { message: "Fornecedor removido com sucesso" }
   */
  async delete(req, res) {
    try {
      const supplier = await Customer.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: CustomerType,
            as: 'types',
            where: { type: 'supplier' }
          }
        ]
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      if (supplier.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Verificar se existem contas a pagar associadas
      const hasPayables = await Payable.findOne({
        where: { customer_id: supplier.id }
      });

      if (hasPayables) {
        return res.status(400).json({ error: 'Não é possível excluir um fornecedor com contas a pagar associadas' });
      }

      // Remover apenas o tipo 'supplier'
      await CustomerType.destroy({
        where: {
          customer_id: supplier.id,
          type: 'supplier'
        }
      });

      // Se não houver mais tipos, remover o cliente
      const remainingTypes = await CustomerType.count({
        where: { customer_id: supplier.id }
      });

      if (remainingTypes === 0) {
        await supplier.destroy();
      }

      return res.status(200).json({ message: 'Fornecedor removido com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      res.status(500).json({ error: 'Erro ao excluir fornecedor' });
    }
  }
}

module.exports = new SupplierController(); 