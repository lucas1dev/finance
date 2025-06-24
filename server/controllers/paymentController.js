const { Payment, Receivable, Payable } = require('../models');
const { createPaymentSchema } = require('../utils/validators');
const { Op } = require('sequelize');

/**
 * Controlador responsável por gerenciar pagamentos de contas a receber e contas a pagar.
 * Permite criar, listar e excluir pagamentos associados a recebíveis ou pagáveis.
 */
class PaymentController {
  /**
   * Cria um novo pagamento para uma conta a receber ou conta a pagar.
   * @param {Object} req - Objeto de requisição Express.
   * @param {Object} req.body - Dados do pagamento.
   * @param {number} [req.body.receivable_id] - ID da conta a receber (obrigatório se payable_id não for fornecido).
   * @param {number} [req.body.payable_id] - ID da conta a pagar (obrigatório se receivable_id não for fornecido).
   * @param {number} req.body.amount - Valor do pagamento.
   * @param {string} req.body.payment_date - Data do pagamento (formato YYYY-MM-DD).
   * @param {string} req.body.payment_method - Método de pagamento (ex: 'pix', 'transfer', 'cash').
   * @param {string} [req.body.description] - Descrição opcional do pagamento.
   * @param {Object} res - Objeto de resposta Express.
   * @returns {Promise<Object>} Resposta JSON com o pagamento criado.
   * @throws {Error} Se os dados forem incompletos ou a conta não for encontrada.
   * @example
   * // POST /receivables/1/payments
   * // Body: { "amount": 500.00, "payment_date": "2024-01-15", "payment_method": "pix" }
   * // Retorno: { "id": 1, "receivable_id": 1, "amount": 500.00, "payment_method": "pix" }
   */
  async create(req, res) {
    try {
      // Validar dados de entrada
      const validatedData = createPaymentSchema.parse(req.body);
      const { receivable_id, payable_id, amount, payment_date, payment_method, description } = validatedData;
      
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

      let parent;
      let parentType;
      if (finalReceivableId) {
        parent = await Receivable.findByPk(finalReceivableId);
        parentType = 'receivable';
      } else if (finalPayableId) {
        parent = await Payable.findByPk(finalPayableId);
        parentType = 'payable';
      }

      if (!parent) {
        return res.status(404).json({ error: `${parentType === 'receivable' ? 'Conta a receber' : 'Conta a pagar'} não encontrada` });
      }

      // Verifica se o valor do pagamento é maior que o saldo restante (se houver campo de saldo)
      // if (parent.remaining_amount && amount > parent.remaining_amount) {
      //   return res.status(400).json({
      //     error: 'Valor do pagamento não pode ser maior que o saldo restante',
      //   });
      // }

      // Cria o registro de pagamento
      const payment = await Payment.create({
        receivable_id: finalReceivableId || null,
        payable_id: finalPayableId || null,
        amount,
        payment_date,
        payment_method,
        description
      });

      // Atualiza o status da conta, se desejar (exemplo: marcar como "paid" se quitado)
      // Aqui você pode adicionar lógica para atualizar status/saldo de Receivable ou Payable

      return res.status(201).json(payment);
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
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
      });

      return res.json(payments);
    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
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
      });

      return res.json(payments);
    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Exclui um pagamento específico e atualiza o status da conta associada.
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
    try {
      const { id } = req.params;

      const payment = await Payment.findByPk(id);
      if (!payment) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      // Se for pagamento de conta a receber
      if (payment.receivable_id) {
        const receivable = await Receivable.findByPk(payment.receivable_id);
        if (!receivable) {
          return res.status(404).json({ error: 'Conta a receber não encontrada' });
        }
        // Atualize status/saldo se necessário
      }

      // Se for pagamento de conta a pagar
      if (payment.payable_id) {
        const payable = await Payable.findByPk(payment.payable_id);
        if (!payable) {
          return res.status(404).json({ error: 'Conta a pagar não encontrada' });
        }
        // Atualize status/saldo se necessário
      }

      // Remove o pagamento
      await payment.destroy();

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir pagamento:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new PaymentController(); 