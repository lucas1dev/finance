const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth } = require('../middlewares/auth');

router.get('/', auth, settingsController.getSettings);
router.put('/', auth, settingsController.updateSettings);
router.get('/sessions', auth, settingsController.getSessions);
router.get('/sessions/active', auth, settingsController.getActiveSessions);
router.delete('/sessions/:sessionId', auth, settingsController.revokeSession);
router.delete('/sessions', auth, settingsController.revokeAllSessions);
router.get('/security-stats', auth, settingsController.getSecurityStats);

module.exports = router; 