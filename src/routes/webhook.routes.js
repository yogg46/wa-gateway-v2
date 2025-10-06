
// ============================================
// src/routes/webhook.routes.js
// ============================================
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { validateBody } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../utils/constants');
const {
  createWebhookSchema,
  updateWebhookSchema,
  testWebhookSchema,
} = require('../validators/webhook.validator');

// All routes require authentication and webhook management permission
router.use(authenticate);
router.use(requirePermission(PERMISSIONS.WEBHOOKS_MANAGE));

// CRUD operations
router.post('/', validateBody(createWebhookSchema), webhookController.createWebhook);
router.get('/', webhookController.getWebhooks);
router.get('/:id', webhookController.getWebhookById);
router.put('/:id', validateBody(updateWebhookSchema), webhookController.updateWebhook);
router.delete('/:id', webhookController.deleteWebhook);

// Webhook operations
router.post('/:id/test', validateBody(testWebhookSchema), webhookController.testWebhook);
router.patch('/:id/toggle', webhookController.toggleWebhook);
router.get('/:id/stats', webhookController.getWebhookStats);
router.get('/:id/logs', webhookController.getWebhookLogs);

module.exports = router;