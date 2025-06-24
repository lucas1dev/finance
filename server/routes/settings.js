/**
 * Rotas para gerenciamento de configurações do usuário.
 * Inclui endpoints para sessões ativas e configurações de notificação.
 * 
 * @module routes/settings
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const settingsController = require('../controllers/settingsController');
const { z } = require('zod');

// Esquemas de validação
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  transactionAlerts: z.boolean(),
  paymentReminders: z.boolean(),
  securityAlerts: z.boolean(),
  marketingEmails: z.boolean(),
  weeklyReports: z.boolean().optional(),
  monthlyReports: z.boolean().optional(),
  lowBalanceAlerts: z.boolean().optional(),
  overduePaymentAlerts: z.boolean().optional()
});

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Configurações do usuário, sessões e notificações
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Obtém as configurações do usuário
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurações obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: boolean
 *                     push:
 *                       type: boolean
 *                     sms:
 *                       type: boolean
 *                     account_alerts:
 *                       type: boolean
 *                     payment_reminders:
 *                       type: boolean
 *                     security_alerts:
 *                       type: boolean
 *                     marketing:
 *                       type: boolean
 *                 preferences:
 *                   type: object
 *                   properties:
 *                     theme:
 *                       type: string
 *                     currency:
 *                       type: string
 *                     date_format:
 *                       type: string
 *                     decimal_places:
 *                       type: number
 *                     auto_backup:
 *                       type: boolean
 *                 timezone:
 *                   type: string
 *                 language:
 *                   type: string
 *                 email_verified:
 *                   type: boolean
 *                 two_factor_enabled:
 *                   type: boolean
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', auth, settingsController.getSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Atualiza as configurações do usuário
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                   push:
 *                     type: boolean
 *                   sms:
 *                     type: boolean
 *                   account_alerts:
 *                     type: boolean
 *                   payment_reminders:
 *                     type: boolean
 *                   security_alerts:
 *                     type: boolean
 *                   marketing:
 *                     type: boolean
 *               preferences:
 *                 type: object
 *                 properties:
 *                   theme:
 *                     type: string
 *                     enum: [light, dark]
 *                   currency:
 *                     type: string
 *                   date_format:
 *                     type: string
 *                   decimal_places:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 4
 *                   auto_backup:
 *                     type: boolean
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configurações atualizadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 updated:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/', auth, settingsController.updateSettings);

/**
 * @swagger
 * /api/settings/sessions:
 *   get:
 *     summary: Obtém as sessões ativas do usuário
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sessões obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     last_login:
 *                       type: string
 *                       format: date-time
 *                     last_login_ip:
 *                       type: string
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       device:
 *                         type: string
 *                       browser:
 *                         type: string
 *                       ip:
 *                         type: string
 *                       location:
 *                         type: string
 *                       last_activity:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       is_current:
 *                         type: boolean
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/sessions', auth, settingsController.getActiveSessions);

/**
 * @swagger
 * /api/settings/sessions/all:
 *   delete:
 *     summary: Encerra todas as sessões do usuário
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sessões encerradas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/sessions/all', auth, settingsController.endAllSessions);

/**
 * @swagger
 * /api/settings/sessions/{sessionId}:
 *   delete:
 *     summary: Encerra uma sessão específica
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sessão
 *     responses:
 *       200:
 *         description: Sessão encerrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Não é possível encerrar a sessão atual
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Sessão não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/sessions/:sessionId', auth, settingsController.endSession);

/**
 * @swagger
 * /api/settings/notifications:
 *   get:
 *     summary: Obtém as notificações do usuário
 *     tags: [Settings]
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
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filtro por status de leitura
 *     responses:
 *       200:
 *         description: Notificações obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       message:
 *                         type: string
 *                       type:
 *                         type: string
 *                       read:
 *                         type: boolean
 *                       read_at:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
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
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/notifications', auth, settingsController.getNotifications);

/**
 * @swagger
 * /api/settings/notifications/{id}/read:
 *   put:
 *     summary: Marca uma notificação como lida
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação marcada como lida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 notificationId:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Notificação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/notifications/:id/read', auth, settingsController.markNotificationAsRead);

/**
 * @swagger
 * /api/settings/notifications/{id}:
 *   delete:
 *     summary: Exclui uma notificação
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 notificationId:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Notificação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/notifications/:id', auth, settingsController.deleteNotification);

/**
 * @swagger
 * /api/settings/notification-settings:
 *   get:
 *     summary: Obtém as configurações de notificação do usuário
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurações obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     two_factor_enabled:
 *                       type: boolean
 *                 settings:
 *                   type: object
 *                   properties:
 *                     email_notifications:
 *                       type: boolean
 *                     push_notifications:
 *                       type: boolean
 *                     sms_notifications:
 *                       type: boolean
 *                     account_alerts:
 *                       type: boolean
 *                     payment_reminders:
 *                       type: boolean
 *                     security_alerts:
 *                       type: boolean
 *                     marketing_emails:
 *                       type: boolean
 *                     weekly_reports:
 *                       type: boolean
 *                     monthly_reports:
 *                       type: boolean
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/notification-settings', auth, settingsController.getNotificationSettings);

/**
 * @swagger
 * /api/settings/notification-settings:
 *   put:
 *     summary: Atualiza as configurações de notificação do usuário
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email_notifications:
 *                 type: boolean
 *               push_notifications:
 *                 type: boolean
 *               sms_notifications:
 *                 type: boolean
 *               account_alerts:
 *                 type: boolean
 *               payment_reminders:
 *                 type: boolean
 *               security_alerts:
 *                 type: boolean
 *               marketing_emails:
 *                 type: boolean
 *               weekly_reports:
 *                 type: boolean
 *               monthly_reports:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Configurações atualizadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 settings:
 *                   type: object
 *       400:
 *         description: Configurações inválidas
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/notification-settings', auth, settingsController.updateNotificationSettings);

/**
 * @swagger
 * /api/settings/stats:
 *   get:
 *     summary: Obtém estatísticas das configurações do usuário
 *     tags: [Settings]
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
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     two_factor_enabled:
 *                       type: boolean
 *                     last_login:
 *                       type: string
 *                       format: date-time
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                 sessions:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: integer
 *                 notifications:
 *                   type: object
 *                   properties:
 *                     email_enabled:
 *                       type: boolean
 *                     push_enabled:
 *                       type: boolean
 *                     sms_enabled:
 *                       type: boolean
 *                     alerts_enabled:
 *                       type: boolean
 *                     reminders_enabled:
 *                       type: boolean
 *                     security_enabled:
 *                       type: boolean
 *                     marketing_enabled:
 *                       type: boolean
 *                     reports_enabled:
 *                       type: boolean
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', auth, settingsController.getSettingsStats);

module.exports = router; 