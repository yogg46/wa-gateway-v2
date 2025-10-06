const { Broadcast } = require('../models');
const queueService = require('../services/queue.service');
const { sendSuccess, sendCreated, sendNotFound } = require('../utils/response');
const { BROADCAST_STATUS } = require('../utils/constants');

/**
 * Create new broadcast
 * POST /api/broadcasts
 */
const createBroadcast = async (req, res, next) => {
  try {
    const { name, messageContent, messageType, recipients, scheduledAt } = req.body;
    const userId = req.user.id;

    const broadcast = await Broadcast.create({
      name,
      messageContent,
      messageType,
      recipients,
      scheduledAt,
      totalRecipients: recipients.length,
      status: scheduledAt ? BROADCAST_STATUS.SCHEDULED : BROADCAST_STATUS.DRAFT,
      createdBy: userId,
    });

    sendCreated(res, broadcast, 'Broadcast created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all broadcasts
 * GET /api/broadcasts
 */
const getBroadcasts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const { count, rows } = await Broadcast.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: require('../models').User,
          as: 'creator',
          attributes: ['id', 'username', 'fullName'],
        },
      ],
    });

    sendSuccess(
      res,
      {
        broadcasts: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
      'Broadcasts retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get broadcast by ID
 * GET /api/broadcasts/:id
 */
const getBroadcastById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const broadcast = await Broadcast.findByPk(id, {
      include: [
        {
          model: require('../models').User,
          as: 'creator',
          attributes: ['id', 'username', 'fullName'],
        },
      ],
    });

    if (!broadcast) {
      return sendNotFound(res, 'Broadcast not found');
    }

    sendSuccess(res, broadcast, 'Broadcast retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update broadcast
 * PUT /api/broadcasts/:id
 */
const updateBroadcast = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const broadcast = await Broadcast.findByPk(id);

    if (!broadcast) {
      return sendNotFound(res, 'Broadcast not found');
    }

    // Can't update if already running or completed
    if ([BROADCAST_STATUS.RUNNING, BROADCAST_STATUS.COMPLETED].includes(broadcast.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update broadcast in running or completed status',
      });
    }

    // Update total recipients if recipients changed
    if (updateData.recipients) {
      updateData.totalRecipients = updateData.recipients.length;
    }

    await broadcast.update(updateData);

    sendSuccess(res, broadcast, 'Broadcast updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete broadcast
 * DELETE /api/broadcasts/:id
 */
const deleteBroadcast = async (req, res, next) => {
  try {
    const { id } = req.params;

    const broadcast = await Broadcast.findByPk(id);

    if (!broadcast) {
      return sendNotFound(res, 'Broadcast not found');
    }

    // Can't delete if running
    if (broadcast.status === BROADCAST_STATUS.RUNNING) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete broadcast while running',
      });
    }

    await broadcast.destroy();

    sendSuccess(res, null, 'Broadcast deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Start broadcast (send to queue)
 * POST /api/broadcasts/:id/start
 */
const startBroadcast = async (req, res, next) => {
  try {
    const { id } = req.params;

    const broadcast = await Broadcast.findByPk(id);

    if (!broadcast) {
      return sendNotFound(res, 'Broadcast not found');
    }

    // Check if can be started
    if (broadcast.status !== BROADCAST_STATUS.DRAFT && broadcast.status !== BROADCAST_STATUS.SCHEDULED) {
      return res.status(400).json({
        success: false,
        message: 'Broadcast can only be started from draft or scheduled status',
      });
    }

    // Update status
    await broadcast.update({
      status: BROADCAST_STATUS.RUNNING,
      startedAt: new Date(),
    });

    // Add to queue
    const job = await queueService.addToBroadcastQueue({
      broadcastId: broadcast.id,
      recipients: broadcast.recipients,
      message: broadcast.messageContent,
      messageType: broadcast.messageType,
      userId: broadcast.createdBy,
    });

    sendSuccess(
      res,
      {
        broadcast,
        jobId: job.id,
      },
      'Broadcast started successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel broadcast
 * POST /api/broadcasts/:id/cancel
 */
const cancelBroadcast = async (req, res, next) => {
  try {
    const { id } = req.params;

    const broadcast = await Broadcast.findByPk(id);

    if (!broadcast) {
      return sendNotFound(res, 'Broadcast not found');
    }

    // Can only cancel if scheduled or running
    if (![BROADCAST_STATUS.SCHEDULED, BROADCAST_STATUS.RUNNING].includes(broadcast.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel scheduled or running broadcasts',
      });
    }

    await broadcast.update({
      status: BROADCAST_STATUS.CANCELLED,
    });

    sendSuccess(res, broadcast, 'Broadcast cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get broadcast statistics
 * GET /api/broadcasts/:id/stats
 */
const getBroadcastStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const broadcast = await Broadcast.findByPk(id);

    if (!broadcast) {
      return sendNotFound(res, 'Broadcast not found');
    }

    const stats = {
      totalRecipients: broadcast.totalRecipients,
      sentCount: broadcast.sentCount,
      deliveredCount: broadcast.deliveredCount,
      failedCount: broadcast.failedCount,
      successRate: broadcast.totalRecipients > 0
        ? ((broadcast.sentCount / broadcast.totalRecipients) * 100).toFixed(2) + '%'
        : '0%',
      status: broadcast.status,
      startedAt: broadcast.startedAt,
      completedAt: broadcast.completedAt,
    };

    sendSuccess(res, stats, 'Broadcast statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBroadcast,
  getBroadcasts,
  getBroadcastById,
  updateBroadcast,
  deleteBroadcast,
  startBroadcast,
  cancelBroadcast,
  getBroadcastStats,
};