const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, requireTwoFactor } = require('../middlewares/auth');
const User = require('../models/User');

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Rotas protegidas
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/password', auth, authController.updatePassword);
router.post('/2fa/setup', auth, authController.setupTwoFactor);
router.post('/2fa/verify', auth, authController.verifyTwoFactor);
router.post('/2fa/disable', auth, authController.disableTwoFactor);

module.exports = router; 