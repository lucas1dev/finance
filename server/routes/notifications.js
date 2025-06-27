/**
 * Rotas para gerenciamento de notificações.
 * Inclui endpoints para CRUD, lembretes, vencimentos e estatísticas.
 * 
 * @module routes/notifications
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { adminAuth } = require('../middlewares/adminAuth');
const notificationController = require('../controllers/notificationController');
const { z } = require('zod');

// Esquemas de validação
const createNotificationSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  type: z.enum(['payment_due', 'payment_overdue', 'reminder', 'system'], {
    errorMap: () => ({ message: 'Tipo deve ser payment_due, payment_overdue, reminder ou system' }),
  }),
  relatedType: z.enum(['financing', 'financing_payment', 'creditor', 'general']).optional(),
  relatedId: z.number().int().positive().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  scheduledFor: z.string().datetime().optional(),
});

const reprocessNotificationsSchema = z.object({
  targetUserId: z.number().int().positive('ID do usuário alvo é obrigatório e deve ser positivo'),
  notificationType: z.enum(['payment_check', 'general_reminders', 'all'], {
    errorMap: () => ({ message: 'Tipo deve ser payment_check, general_reminders ou all' }),
  }).optional().default('all'),
  clearExisting: z.boolean().optional().default(false),
});

const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/**
 * @route GET /notifications
 * @desc Lista todas as notificações do usuário autenticado
 * @access Private
 */
router.get('/', auth, notificationController.listNotifications);

/**
 * @route GET /notifications/stats
 * @desc Obtém estatísticas das notificações do usuário
 * @access Private
 */
router.get('/stats', auth, notificationController.getNotificationStats);

/**
 * @route POST /notifications
 * @desc Cria uma nova notificação manual
 * @access Private
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const validatedData = createNotificationSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    next(error);
  }
}, notificationController.createNotification);

/**
 * @route PATCH /notifications/:id/read
 * @desc Marca uma notificação como lida
 * @access Private
 */
router.patch('/:id/read', auth, notificationController.markAsRead);

/**
 * @route PATCH /notifications/read-all
 * @desc Marca todas as notificações do usuário como lidas
 * @access Private
 */
router.patch('/read-all', auth, notificationController.markAllAsRead);

/**
 * @route DELETE /notifications/:id
 * @desc Remove uma notificação (marca como inativa)
 * @access Private
 */
router.delete('/:id', auth, notificationController.deleteNotification);

/**
 * @route POST /notifications/reprocess
 * @desc Reprocessa notificações específicas para um usuário
 * @access Admin
 */
router.post('/reprocess', adminAuth, async (req, res, next) => {
  try {
    const validatedData = reprocessNotificationsSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    next(error);
  }
}, notificationController.reprocessNotifications);

module.exports = router; 