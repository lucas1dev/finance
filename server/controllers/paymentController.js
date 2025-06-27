const { Payment, Receivable, Payable, Account } = require('../models');
const { createPaymentSchema } = require('../utils/validators');
const TransactionService = require('../services/transactionService');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Controlador responsável por gerenciar pagamentos de contas a receber e contas a pagar.
 * Permite criar, listar e excluir pagamentos associados a recebíveis ou pagáveis.
 * Integra automaticamente com transações para manter consistência financeira.
 */
class PaymentController {
  /**
   * Cria um novo pagamento para uma conta a receber ou conta a pagar.
   * Automaticamente cria uma transação correspondente.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados do pagamento.
   * @param {number} [req.body.receivable_id] - ID da conta a receber (obrigatório se payable_id não for fornecido).
   * @param {number} [req.body.payable_id] - ID da conta a pagar (obrigatório se receivable_id não for fornecido).
   * @param {number} req.body.amount - Valor do pagamento.
   * @param {string} req.body.payment_date - Data do pagamento (formato YYYY-MM-DD).
   * @param {string} req.body.payment_method - Método de pagamento (ex: 'pix', 'transfer', 'cash').
   * @param {string} [req.body.description] - Descrição opcional do pagamento.
   * @param {number} req.body.account_id - ID da conta bancária para debitar/creditar.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com o pagamento criado e transação.
   * @throws {Error} Se os dados forem incompletos ou a conta não for encontrada.
   * @example
   * // POST /receivables/1/payments
   * // Body: { "amount": 500.00, "payment_date": "2024-01-15", "payment_method": "pix", "account_id": 1 }
   * // Retorno: { "payment": {...}, "transaction": {...} }
   */
  async create(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      // Validar dados de entrada
      const validatedData = createPaymentSchema.parse(req.body);
      const { receivable_id, payable_id, amount, payment_date, payment_method, description, account_id } = validatedData;
      
      // Extrair IDs dos parâmetros da URL se não estiverem no body
      const urlReceivableId = req.params.receivable_id;
      const urlPayableId = req.params.payable_id;
      
      const finalReceivableId = receivable_id || urlReceivableId;
      const finalPayableId = payable_id || urlPayableId;

      if (!finalReceivableId && !finalPayableId) {
        return res.status(400).json({
          error: 'Dados incompletos. Forneça receivable_id ou payable_id',
        });
      }

      if (!account_id) {
        return res.status(400).json({
          error: 'account_id é obrigatório para criar pagamento com transação',
        });
      }

      // Verificar se a conta bancária existe
      const account = await Account.findByPk(account_id, { transaction });
      if (!account) {
        return res.status(404).json({ error: 'Conta bancária não encontrada' });
      }

      let parent;
      let parentType;
      if (finalReceivableId) {
        parent = await Receivable.findByPk(finalReceivableId, { transaction });
        parentType = 'receivable';
      } else if (finalPayableId) {
        parent = await Payable.findByPk(finalPayableId, { transaction });
        parentType = 'payable';
      }

      if (!parent) {
        return res.status(404).json({ error: `${parentType === 'receivable' ? 'Conta a receber' : 'Conta a pagar'} não encontrada` });
      }

      // Verificar se há saldo suficiente na conta (para pagamentos)
      if (finalPayableId) {
        if (account.balance < amount) {
          return res.status(400).json({
            error: 'Saldo insuficiente na conta bancária',
            current_balance: account.balance,
            required_amount: amount
          });
        }
      }

      // Cria o registro de pagamento
      const payment = await Payment.create({
        receivable_id: finalReceivableId || null,
        payable_id: finalPayableId || null,
        amount,
        payment_date,
        payment_method,
        description,
        account_id
      }, { transaction });

      // Criar transação automaticamente
      let createdTransaction;
      if (finalReceivableId) {
        // Transação de receita (recebimento)
        createdTransaction = await TransactionService.createFromReceivablePayment(
          { ...payment.toJSON(), account_id },
          parent.toJSON(),
          { transaction }
        );
      } else if (finalPayableId) {
        // Transação de despesa (pagamento)
        createdTransaction = await TransactionService.createFromPayablePayment(
          { ...payment.toJSON(), account_id },
          parent.toJSON(),
          { transaction }
        );
      }

      // Atualizar saldo da conta
      if (createdTransaction) {
        await TransactionService.updateAccountBalance(
          account_id,
          amount,
          finalReceivableId ? 'income' : 'expense',
          { transaction }
        );
      }

      // Atualizar status da conta pai
      if (finalReceivableId) {
        await this.updateReceivableStatus(finalReceivableId, amount, { transaction });
      } else if (finalPayableId) {
        await this.updatePayableStatus(finalPayableId, amount, { transaction });
      }

      await transaction.commit();

      logger.info(`Pagamento criado com sucesso`, {
        payment_id: payment.id,
        transaction_id: createdTransaction?.id,
        type: parentType,
        amount,
        account_id
      });

      return res.status(201).json({
        payment,
        transaction: createdTransaction,
        message: `Pagamento registrado com sucesso. ${finalReceivableId ? 'Receita' : 'Despesa'} registrada na conta.`
      });

    } catch (error) {
      await transaction.rollback();
      
      logger.error('Erro ao criar pagamento', {
        error: error.message,
        body: req.body,
        params: req.params
      });

      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Atualiza o status de uma conta a receber baseado no pagamento
   * @param {number} receivableId - ID da conta a receber
   * @param {number} paymentAmount - Valor do pagamento
   * @param {Object} options - Opções do Sequelize
   */
  async updateReceivableStatus(receivableId, paymentAmount, options = {}) {
    const receivable = await Receivable.findByPk(receivableId, options);
    if (!receivable) return;

    const remainingAmount = await receivable.getRemainingAmount();
    const newRemainingAmount = remainingAmount - paymentAmount;

    let status = 'pending';
    if (newRemainingAmount <= 0) {
      status = 'paid';
    } else if (newRemainingAmount < receivable.amount) {
      status = 'partially_paid';
    }

    await receivable.update({
      remaining_amount: Math.max(0, newRemainingAmount),
      status
    }, options);
  }

  /**
   * Atualiza o status de uma conta a pagar baseado no pagamento
   * @param {number} payableId - ID da conta a pagar
   * @param {number} paymentAmount - Valor do pagamento
   * @param {Object} options - Opções do Sequelize
   */
  async updatePayableStatus(payableId, paymentAmount, options = {}) {
    const payable = await Payable.findByPk(payableId, options);
    if (!payable) return;

    const remainingAmount = await payable.getRemainingAmount();
    const newRemainingAmount = remainingAmount - paymentAmount;

    let status = 'pending';
    if (newRemainingAmount <= 0) {
      status = 'paid';
      await payable.update({
        payment_date: new Date(),
        status
      }, options);
    }
  }

  /**
   * Lista todos os pagamentos de uma conta a receber específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.receivable_id - ID da conta a receber.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Array>} Lista de pagamentos ordenados por data (mais recente primeiro).
   * @throws {Error} Se houver erro ao consultar o banco de dados.
   * @example
   * // GET /receivables/1/payments
   * // Retorno: [{ "id": 1, "amount": 500.00, "payment_date": "2024-01-15" }, ...]
   */
  async listByReceivable(req, res) {
    try {
      const { receivable_id } = req.params;

      const payments = await Payment.findAll({
        where: { receivable_id },
        order: [['payment_date', 'DESC']],
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'name', 'balance']
          }
        ]
      });

      return res.json(payments);
    } catch (error) {
      logger.error('Erro ao listar pagamentos de conta a receber', {
        error: error.message,
        receivable_id: req.params.receivable_id
      });
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Lista todos os pagamentos de uma conta a pagar específica.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.payable_id - ID da conta a pagar.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Array>} Lista de pagamentos ordenados por data (mais recente primeiro).
   * @throws {Error} Se houver erro ao consultar o banco de dados.
   * @example
   * // GET /payables/1/payments
   * // Retorno: [{ "id": 1, "amount": 300.00, "payment_date": "2024-01-15" }, ...]
   */
  async listByPayable(req, res) {
    try {
      const { payable_id } = req.params;

      const payments = await Payment.findAll({
        where: { payable_id },
        order: [['payment_date', 'DESC']],
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'name', 'balance']
          }
        ]
      });

      return res.json(payments);
    } catch (error) {
      logger.error('Erro ao listar pagamentos de conta a pagar', {
        error: error.message,
        payable_id: req.params.payable_id
      });
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Exclui um pagamento específico e reverte a transação associada.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.params - Parâmetros da URL.
   * @param {number} req.params.id - ID do pagamento a ser excluído.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<void>} Resposta vazia com status 204.
   * @throws {Error} Se o pagamento ou conta associada não for encontrada.
   * @example
   * // DELETE /payments/1
   * // Retorno: Status 204 (No Content)
   */
  async delete(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;

      const payment = await Payment.findByPk(id, { 
        transaction,
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'name', 'balance']
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      // Encontrar e reverter a transação associada
      const { Transaction } = require('../models');
      const associatedTransaction = await Transaction.findOne({
        where: {
          payment_date: payment.payment_date,
          amount: payment.amount,
          account_id: payment.account_id
        },
        transaction
      });

      if (associatedTransaction) {
        await TransactionService.removeTransaction(associatedTransaction.id, { transaction });
      }

      // Reverter status da conta pai
      if (payment.receivable_id) {
        await this.revertReceivableStatus(payment.receivable_id, payment.amount, { transaction });
      } else if (payment.payable_id) {
        await this.revertPayableStatus(payment.payable_id, payment.amount, { transaction });
      }

      // Remove o pagamento
      await payment.destroy({ transaction });

      await transaction.commit();

      logger.info(`Pagamento excluído com sucesso`, {
        payment_id: id,
        transaction_id: associatedTransaction?.id
      });

      return res.status(204).send();
    } catch (error) {
      await transaction.rollback();
      
      logger.error('Erro ao excluir pagamento', {
        error: error.message,
        payment_id: req.params.id
      });
      
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Reverte o status de uma conta a receber após exclusão de pagamento
   * @param {number} receivableId - ID da conta a receber
   * @param {number} paymentAmount - Valor do pagamento removido
   * @param {Object} options - Opções do Sequelize
   */
  async revertReceivableStatus(receivableId, paymentAmount, options = {}) {
    const receivable = await Receivable.findByPk(receivableId, options);
    if (!receivable) return;

    const newRemainingAmount = receivable.remaining_amount + paymentAmount;
    
    let status = 'pending';
    if (newRemainingAmount >= receivable.amount) {
      status = 'pending';
    } else if (newRemainingAmount > 0) {
      status = 'partially_paid';
    }

    await receivable.update({
      remaining_amount: newRemainingAmount,
      status
    }, options);
  }

  /**
   * Reverte o status de uma conta a pagar após exclusão de pagamento
   * @param {number} payableId - ID da conta a pagar
   * @param {number} paymentAmount - Valor do pagamento removido
   * @param {Object} options - Opções do Sequelize
   */
  async revertPayableStatus(payableId, paymentAmount, options = {}) {
    const payable = await Payable.findByPk(payableId, options);
    if (!payable) return;

    await payable.update({
      status: 'pending',
      payment_date: null
    }, options);
  }
}

module.exports = new PaymentController(); 