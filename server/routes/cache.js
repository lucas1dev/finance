/**
 * Rotas para gerenciamento de Cache
 * Endpoints para administração do cache Redis
 * @author Lucas Santos
 */

const express = require('express');
const router = express.Router();
const cacheController = require('../controllers/cacheController');
const { adminAuth } = require('../middlewares/adminAuth');

// Middleware de autenticação admin para todas as rotas
router.use(adminAuth);

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Obtém estatísticas do cache
 *     description: Retorna estatísticas básicas do cache Redis
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     totalKeys:
 *                       type: integer
 *                     uptime:
 *                       type: integer
 *                     memory:
 *                       type: string
 *                     clients:
 *                       type: integer
 *       503:
 *         description: Cache service unavailable
 */
router.get('/stats', cacheController.getCacheStats);

/**
 * @swagger
 * /api/cache/health:
 *   get:
 *     summary: Health check do cache
 *     description: Verifica se o cache está saudável e respondendo
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache está saudável
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                 details:
 *                   type: string
 *       503:
 *         description: Cache não está saudável
 */
router.get('/health', cacheController.getCacheHealth);

/**
 * @swagger
 * /api/cache/info:
 *   get:
 *     summary: Obtém informações detalhadas do cache
 *     description: Retorna informações completas do Redis incluindo servidor, clientes, memória, etc.
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informações obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 info:
 *                   type: object
 *                   properties:
 *                     server:
 *                       type: object
 *                     clients:
 *                       type: object
 *                     memory:
 *                       type: object
 *                     stats:
 *                       type: object
 *                     replication:
 *                       type: object
 *                     cpu:
 *                       type: object
 *                     cluster:
 *                       type: object
 *                     keyspace:
 *                       type: object
 *       503:
 *         description: Cache service unavailable
 */
router.get('/info', cacheController.getCacheInfo);

/**
 * @swagger
 * /api/cache/invalidate/{type}/{key}:
 *   delete:
 *     summary: Invalida cache específico
 *     description: Invalida cache por tipo e chave
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [user, query, calculation, stats, pattern]
 *         description: Tipo de cache a ser invalidado
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave ou identificador do cache
 *     responses:
 *       200:
 *         description: Cache invalidado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 details:
 *                   type: string
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro ao invalidar cache
 */
router.delete('/invalidate/:type/:key', cacheController.invalidateCache);

/**
 * @swagger
 * /api/cache/keys:
 *   post:
 *     summary: Define valor no cache
 *     description: Define um valor no cache com TTL opcional
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 description: Chave do cache
 *               value:
 *                 type: any
 *                 description: Valor a ser armazenado
 *               ttl:
 *                 type: integer
 *                 description: TTL em segundos (opcional)
 *     responses:
 *       200:
 *         description: Valor definido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 key:
 *                   type: string
 *                 ttl:
 *                   type: integer
 *       400:
 *         description: Parâmetros obrigatórios
 *       500:
 *         description: Erro ao definir valor
 */
router.post('/keys', cacheController.setCacheKey);

/**
 * @swagger
 * /api/cache/keys:
 *   delete:
 *     summary: Remove múltiplas chaves do cache
 *     description: Remove um array de chaves do cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keys
 *             properties:
 *               keys:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de chaves a serem removidas
 *     responses:
 *       200:
 *         description: Chaves removidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Chaves obrigatórias
 *       500:
 *         description: Erro ao remover chaves
 */
router.delete('/keys', cacheController.deleteMultipleCacheKeys);

/**
 * @swagger
 * /api/cache/keys/{key}:
 *   get:
 *     summary: Obtém valor do cache
 *     description: Obtém um valor específico do cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave do cache
 *     responses:
 *       200:
 *         description: Valor obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 key:
 *                   type: string
 *                 value:
 *                   type: any
 *       400:
 *         description: Chave obrigatória
 *       404:
 *         description: Chave não encontrada
 *       500:
 *         description: Erro ao obter valor
 */
router.get('/keys/:key', cacheController.getCacheKey);

/**
 * @swagger
 * /api/cache/keys/{key}:
 *   head:
 *     summary: Verifica se chave existe no cache
 *     description: Verifica se uma chave existe no cache e retorna o TTL
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave do cache
 *     responses:
 *       200:
 *         description: Chave existe no cache
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 key:
 *                   type: string
 *                 exists:
 *                   type: boolean
 *                 ttl:
 *                   type: integer
 *       400:
 *         description: Chave obrigatória
 *       404:
 *         description: Chave não encontrada
 *       500:
 *         description: Erro ao verificar chave
 */
router.head('/keys/:key', cacheController.checkCacheKey);

/**
 * @swagger
 * /api/cache/keys/{key}:
 *   delete:
 *     summary: Remove chave específica do cache
 *     description: Remove uma chave específica do cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave do cache
 *     responses:
 *       200:
 *         description: Chave removida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 key:
 *                   type: string
 *       400:
 *         description: Chave obrigatória
 *       500:
 *         description: Erro ao remover chave
 */
router.delete('/keys/:key', cacheController.deleteCacheKey);

/**
 * @swagger
 * /api/cache/flush:
 *   delete:
 *     summary: Limpa todo o cache
 *     description: Remove todos os dados do cache Redis
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache limpo com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 details:
 *                   type: string
 *       500:
 *         description: Erro ao limpar cache
 */
router.delete('/flush', cacheController.flushCache);

module.exports = router; 