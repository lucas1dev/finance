const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { adminAuth } = require('../middlewares/adminAuth');
const userController = require('../controllers/userController');
const { z } = require('zod');

/**
 * Rotas de Gerenciamento de Usuários (Administrativas)
 * Endpoints para administradores gerenciarem usuários do sistema
 */

// Todas as rotas requerem autenticação e permissão de admin
router.use(auth);
router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: AdminUsers
 *   description: Gerenciamento de usuários por administradores
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Lista de usuários (apenas para administradores)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página atual
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limite por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Status do usuário
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user]
 *         description: Role do usuário
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por nome ou email
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                       last_login:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (não é admin)
 */
router.get('/', userController.getUsers);

/**
 * @swagger
 * /api/admin/users/stats:
 *   get:
 *     summary: Estatísticas de usuários (apenas para administradores)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Período para estatísticas
 *     responses:
 *       200:
 *         description: Estatísticas de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 active:
 *                   type: integer
 *                 inactive:
 *                   type: integer
 *                 newUsers:
 *                   type: integer
 *                 adminUsers:
 *                   type: integer
 *                 regularUsers:
 *                   type: integer
 *                 recentActivityUsers:
 *                   type: integer
 *                 growthRate:
 *                   type: number
 *                 period:
 *                   type: string
 *                 periodStart:
 *                   type: string
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (não é admin)
 */
router.get('/stats', userController.getUsersStats);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Detalhes de um usuário específico (apenas para administradores)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Detalhes do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 status:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                 last_login:
 *                   type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: integer
 *                     accounts:
 *                       type: integer
 *                     notifications:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (não é admin)
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:id', userController.getUser);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: Ativa ou desativa um usuário (apenas para administradores)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Novo status do usuário
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: integer
 *                 newStatus:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (não é admin)
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/:id/status', userController.updateUserStatus);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Altera o role de um usuário (apenas para administradores)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 description: Novo role do usuário
 *     responses:
 *       200:
 *         description: Role atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: integer
 *                 newRole:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (não é admin)
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/:id/role', userController.updateUserRole);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Exclui um usuário (apenas para administradores)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: integer
 *       400:
 *         description: Dados inválidos ou usuário com dados associados
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (não é admin)
 *       404:
 *         description: Usuário não encontrado
 */
router.delete('/:id', userController.deleteUser);

module.exports = router; 