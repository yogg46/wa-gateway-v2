
// ============================================
// src/routes/broadcast.routes.js
// ============================================
const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcast.controller');
const { validateBody, validateQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/rbac.middleware');
const { broadcastLimiter } = require('../middlewares/rateLimit.middleware');
const { PERMISSIONS } = require('../utils/constants');
const {
  createBroadcastSchema,
  updateBroadcastSchema,
  getBroadcastsSchema,
} = require('../validators/broadcast.validator');

// All routes require authentication
router.use(authenticate);

// Create and list broadcasts
router.post(
  '/',
  requirePermission(PERMISSIONS.BROADCASTS_CREATE),
  broadcastLimiter,
  validateBody(createBroadcastSchema),
  broadcastController.createBroadcast
);

router.get(
  '/',
  requirePermission(PERMISSIONS.BROADCASTS_READ),
  validateQuery(getBroadcastsSchema),
  broadcastController.getBroadcasts
);

// Broadcast operations
router.get('/:id', requirePermission(PERMISSIONS.BROADCASTS_READ), broadcastController.getBroadcastById);
router.put('/:id', requirePermission(PERMISSIONS.BROADCASTS_CREATE), validateBody(updateBroadcastSchema), broadcastController.updateBroadcast);
router.delete('/:id', requirePermission(PERMISSIONS.BROADCASTS_CREATE), broadcastController.deleteBroadcast);

// Start, cancel, and stats
router.post('/:id/start', requirePermission(PERMISSIONS.BROADCASTS_CREATE), broadcastController.startBroadcast);
router.post('/:id/cancel', requirePermission(PERMISSIONS.BROADCASTS_CREATE), broadcastController.cancelBroadcast);
router.get('/:id/stats', requirePermission(PERMISSIONS.BROADCASTS_READ), broadcastController.getBroadcastStats);

module.exports = router;
