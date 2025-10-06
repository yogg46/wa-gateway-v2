
// ============================================
// src/routes/qr.routes.js
// ============================================
const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qr.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Public QR endpoint (can be accessed with API key)
router.get('/', authenticate, qrController.getCurrentQR);
router.get('/html', qrController.getQRHtml); // Public HTML view
router.get('/status', authenticate, qrController.getQRStatus);

// Protected routes
router.post('/refresh', authenticate, qrController.refreshQR);
router.get('/history', authenticate, qrController.getQRHistory);
router.get('/stats', authenticate, qrController.getQRStats);

module.exports = router;