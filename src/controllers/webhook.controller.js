const { Webhook } = require('../models');
const queueService = require('../services/queue.service');
const { sendSuccess, sendCreated, sendNotFound } = require('../utils/response');
const { generateHmacSignature } = require('../utils/helpers');

/**
 * Create webhook
 * POST /api/webhooks
 */
const createWebhook = async (req, res, next) => {
  try {
    const { name, url, secretKey, events, retryAttempts, timeout } = req.body;

    const webhook = await Webhook.create({
      name,
      url,
      secretKey,
      events,
      retryAttempts,
      timeout,
      isActive: true,
    });

    sendCreated(res, webhook, 'Webhook created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all webhooks
 * GET /api/webhooks
 */
const getWebhooks = async (req, res, next) => {
  try {
    const webhooks = await Webhook.findAll({
      order: [['createdAt', 'DESC']],
    });

    sendSuccess(res, webhooks, 'Webhooks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get webhook by ID
 * GET /api/webhooks/:id
 */
const getWebhookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const webhook = await Webhook.findByPk(id);

    if (!webhook) {
      return sendNotFound(res, 'Webhook not found');
    }

    sendSuccess(res, webhook, 'Webhook retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update webhook
 * PUT /api/webhooks/:id
 */
const updateWebhook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const webhook = await Webhook.findByPk(id);

    if (!webhook) {
      return sendNotFound(res, 'Webhook not found');
    }

    await webhook.update(updateData);

    sendSuccess(res, webhook, 'Webhook updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete webhook
 * DELETE /api/webhooks/:id
 */
const deleteWebhook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const webhook = await Webhook.findByPk(id);

    if (!webhook) {
      return sendNotFound(res, 'Webhook not found');
    }

    await webhook.destroy();

    sendSuccess(res, null, 'Webhook deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Test webhook
 * POST /api/webhooks/:id/test
 */
const testWebhook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { event, payload } = req.body;

    const webhook = await Webhook.findByPk(id);

    if (!webhook) {
      return sendNotFound(res, 'Webhook not found');
    }

    const testPayload = payload || {
      event,
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook',
      },
    };

    // Add to webhook queue
    const job = await queueService.addToWebhookQueue({
      url: webhook.url,
      payload: testPayload,
      secret: webhook.secretKey,
    });

    sendSuccess(
      res,
      {
        jobId: job.id,
        payload: testPayload,
      },
      'Test webhook queued successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle webhook active status
 * PATCH /api/webhooks/:id/toggle
 */
const toggleWebhook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const webhook = await Webhook.findByPk(id);

    if (!webhook) {
      return sendNotFound(res, 'Webhook not found');
    }

    await webhook.update({
      isActive: !webhook.isActive,
    });

    sendSuccess(
      res,
      webhook,
      `Webhook ${webhook.isActive ? 'enabled' : 'disabled'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get webhook statistics
 * GET /api/webhooks/:id/stats
 */
const getWebhookStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const webhook = await Webhook.findByPk(id);

    if (!webhook) {
      return sendNotFound(res, 'Webhook not found');
    }

    const stats = {
      successCount: webhook.successCount,
      failureCount: webhook.failureCount,
      totalCalls: webhook.successCount + webhook.failureCount,
      successRate:
        webhook.successCount + webhook.failureCount > 0
          ? (
              (webhook.successCount / (webhook.successCount + webhook.failureCount)) *
              100
            ).toFixed(2) + '%'
          : '0%',
      lastTriggeredAt: webhook.lastTriggeredAt,
      lastStatus: webhook.lastStatus,
      lastError: webhook.lastError,
    };

    sendSuccess(res, stats, 'Webhook statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get webhook logs (recent triggers)
 * GET /api/webhooks/:id/logs
 */
const getWebhookLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const webhook = await Webhook.findByPk(id);

    if (!webhook) {
      return sendNotFound(res, 'Webhook not found');
    }

    // Get audit logs related to this webhook
    const { AuditLog } = require('../models');
    const logs = await AuditLog.findAll({
      where: {
        resourceType: 'webhook',
        resourceId: id,
      },
      limit,
      order: [['createdAt', 'DESC']],
    });

    sendSuccess(res, logs, 'Webhook logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWebhook,
  getWebhooks,
  getWebhookById,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  toggleWebhook,
  getWebhookStats,
  getWebhookLogs,
};