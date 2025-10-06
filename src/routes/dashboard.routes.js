
// ============================================
// src/routes/dashboard.routes.js
// ============================================
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Dashboard endpoints
router.get('/overview', dashboardController.getOverview);
router.get('/message-stats', dashboardController.getMessageStats);
router.get('/activity', dashboardController.getRecentActivity);
router.get('/charts/messages', dashboardController.getMessageChartData);
router.get('/top-contacts', dashboardController.getTopContacts);
router.get('/health', dashboardController.getSystemHealth);
router.get('/queues', dashboardController.getQueueStatus);
router.get('/logs-summary', dashboardController.getLogsSummary);
router.get('/export/:type', dashboardController.exportData);

module.exports = router;