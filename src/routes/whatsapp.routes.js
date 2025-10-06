// ============================================
// src/routes/whatsapp.routes.js
// ============================================
const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin, requireOperator } = require('../middlewares/rbac.middleware');

// All routes require authentication
router.use(authenticate);

// Status check (all authenticated users)
router.get('/status', whatsappController.getStatus);
router.get('/me', whatsappController.getMe);
router.get('/chats', whatsappController.getChats);
router.get('/check/:number', whatsappController.checkNumber);
router.get('/presence/:number', whatsappController.getPresence);

// System operations (operators and admins)
router.post('/init', requireOperator, whatsappController.initialize);
router.post('/restart', requireOperator, whatsappController.restart);
router.post('/logout', requireAdmin, whatsappController.logout);

module.exports = router;