/**
 * Rotas para gerenciar configurações de timeout de jobs.
 * Permite visualizar e atualizar configurações de timeout para diferentes tipos de jobs.
 * 
 * @module routes/jobTimeouts
 */

const express = require('express');
const router = express.Router();
const jobTimeoutController = require('../controllers/jobTimeoutController');
const { auth } = require('../middlewares/auth');
const { adminAuth } = require('../middlewares/adminAuth');

/**
 * @route GET /api/job-timeouts
 * @desc Obtém todas as configurações de timeout de jobs
 * @access Admin
 */
router.get('/', 
  auth, 
  adminAuth, 
  jobTimeoutController.getAllTimeoutConfigurations
);

/**
 * @route GET /api/job-timeouts/stats
 * @desc Obtém estatísticas de uso dos timeouts
 * @access Admin
 */
router.get('/stats', 
  auth, 
  adminAuth, 
  jobTimeoutController.getTimeoutStats
);

/**
 * @route GET /api/job-timeouts/:jobName
 * @desc Obtém a configuração de timeout para um job específico
 * @access Admin
 */
router.get('/:jobName', 
  auth, 
  adminAuth, 
  jobTimeoutController.getTimeoutConfiguration
);

/**
 * @route PUT /api/job-timeouts/:jobName
 * @desc Atualiza a configuração de timeout para um job específico
 * @access Admin
 */
router.put('/:jobName', 
  auth, 
  adminAuth, 
  jobTimeoutController.updateTimeoutConfiguration
);

/**
 * @route DELETE /api/job-timeouts/:jobName
 * @desc Reseta a configuração de timeout para um job para o valor padrão
 * @access Admin
 */
router.delete('/:jobName', 
  auth, 
  adminAuth, 
  jobTimeoutController.resetTimeoutConfiguration
);

module.exports = router; 