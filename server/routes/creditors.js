/**
 * Rotas para gerenciamento de Credores (Creditors)
 * Implementa endpoints CRUD com autenticação e validação
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const {
  createCreditor,
  listCreditors,
  getCreditor,
  updateCreditor,
  deleteCreditor,
  searchCreditors
} = require('../controllers/creditorController');

/**
 * @swagger
 * /creditors:
 *   post:
 *     summary: Cria um novo credor
 *     tags: [Creditors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - document_type
 *               - document_number
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do credor
 *               document_type:
 *                 type: string
 *                 enum: [CPF, CNPJ]
 *                 description: Tipo de documento
 *               document_number:
 *                 type: string
 *                 description: Número do documento (CPF ou CNPJ)
 *               address:
 *                 type: string
 *                 description: Endereço do credor
 *               phone:
 *                 type: string
 *                 description: Telefone do credor
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do credor
 *     responses:
 *       201:
 *         description: Credor criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/', auth, createCreditor);

/**
 * @swagger
 * /creditors:
 *   get:
 *     summary: Lista todos os credores do usuário
 *     tags: [Creditors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limite de itens por página
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtrar por nome
 *       - in: query
 *         name: document_type
 *         schema:
 *           type: string
 *           enum: [CPF, CNPJ]
 *         description: Filtrar por tipo de documento
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativo, inativo]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de credores
 *       401:
 *         description: Não autorizado
 */
router.get('/', auth, listCreditors);

/**
 * @swagger
 * /creditors/search:
 *   get:
 *     summary: Busca credores por termo
 *     tags: [Creditors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca (nome ou documento)
 *     responses:
 *       200:
 *         description: Lista de credores encontrados
 *       401:
 *         description: Não autorizado
 */
router.get('/search', auth, searchCreditors);

/**
 * @swagger
 * /creditors/{id}:
 *   get:
 *     summary: Obtém um credor específico
 *     tags: [Creditors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do credor
 *     responses:
 *       200:
 *         description: Dados do credor
 *       404:
 *         description: Credor não encontrado
 *       401:
 *         description: Não autorizado
 */
router.get('/:id', auth, getCreditor);

/**
 * @swagger
 * /creditors/{id}:
 *   put:
 *     summary: Atualiza um credor
 *     tags: [Creditors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do credor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do credor
 *               document_type:
 *                 type: string
 *                 enum: [CPF, CNPJ]
 *                 description: Tipo de documento
 *               document_number:
 *                 type: string
 *                 description: Número do documento
 *               address:
 *                 type: string
 *                 description: Endereço do credor
 *               phone:
 *                 type: string
 *                 description: Telefone do credor
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do credor
 *               status:
 *                 type: string
 *                 enum: [ativo, inativo]
 *                 description: Status do credor
 *     responses:
 *       200:
 *         description: Credor atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Credor não encontrado
 *       401:
 *         description: Não autorizado
 */
router.put('/:id', auth, updateCreditor);

/**
 * @swagger
 * /creditors/{id}:
 *   delete:
 *     summary: Remove um credor
 *     tags: [Creditors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do credor
 *     responses:
 *       200:
 *         description: Credor removido com sucesso
 *       404:
 *         description: Credor não encontrado
 *       400:
 *         description: Não é possível remover credor com financiamentos
 *       401:
 *         description: Não autorizado
 */
router.delete('/:id', auth, deleteCreditor);

module.exports = router; 