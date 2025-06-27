const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middlewares/auth');

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-token', authController.verifyToken);

// Rotas protegidas
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/password', auth, authController.updatePassword);
router.post('/logout', auth, authController.logout);

// Rotas de Autenticação de Dois Fatores (2FA)
router.post('/2fa/setup', auth, authController.setupTwoFactor);
router.post('/2fa/verify', auth, authController.verifyTwoFactor);
router.post('/2fa/disable', auth, authController.disableTwoFactor);
router.post('/2fa/backup-codes', auth, authController.generateBackupCodes);
router.get('/2fa/settings', auth, authController.get2FASettings);
router.post('/2fa/backup-verify', auth, authController.verifyBackupCode);

module.exports = router; 