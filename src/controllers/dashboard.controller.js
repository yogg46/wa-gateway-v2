const whatsappService = require('../services/whatsapp.service');
const messageService = require('../services/message.service');
const qrService = require('../services/qr.service');
const queueService = require('../services/queue.service');
const { sendSuccess } = require('../utils/response');
const { User, Message, Broadcast, Contact } = require('../models');
const { formatBytes } = require('../utils/helpers');

/**
 * Get dashboard overview
 * GET /api/dashboard/overview
 */
const getOverview = async (req, res, next) => {
  try {
    // Get counts
    const [
      totalUsers,
      totalMessages,
      totalContacts,
      totalBroadcasts,
      todayMessages,
    ] = await Promise.all([
      User.count(),
      Message.count(),
      Contact.count(),
      Broadcast.count(),
      Message.count({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: new Date(
              new Date().setHours(0, 0, 0, 0)
            ),
          },
        },
      }),
    ]);

    // Get WhatsApp status
    const waStatus = whatsappService.getSocketInfo();

    // Get queue stats
    const queueStats = await queueService.getAllQueuesStats();

    // Calculate total queue items
    const totalQueueItems = Object.values(queueStats).reduce(
      (sum, queue) => sum + queue.waiting + queue.active,
      0
    );

    const overview = {
      users: totalUsers,
      messages: {
        total: totalMessages,
        today: todayMessages,
      },
      contacts: totalContacts,
      broadcasts: totalBroadcasts,
      whatsapp: {
        isConnected: waStatus.isConnected,
        connectionState: waStatus.connectionState,
        user: waStatus.user,
      },
      queues: {
        stats: queueStats,
        totalItems: totalQueueItems,
      },
      systemInfo: {
        uptime: process.uptime(),
        memory: {
          used: formatBytes(process.memoryUsage().heapUsed),
          total: formatBytes(process.memoryUsage().heapTotal),
        },
        nodeVersion: process.version,
      },
    };

    sendSuccess(res, overview, 'Overview retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get message statistics
 * GET /api/dashboard/message-stats
 */
const getMessageStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await messageService.getMessageStats({
      startDate,
      endDate,
    });

    sendSuccess(res, stats, 'Message statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activity
 * GET /api/dashboard/activity
 */
const getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Get recent messages
    const recentMessages = await Message.findAll({
      limit,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'from', 'to', 'messageType', 'status', 'createdAt'],
    });

    // Get recent broadcasts
    const recentBroadcasts = await Broadcast.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'status', 'totalRecipients', 'sentCount', 'createdAt'],
    });

    sendSuccess(
      res,
      {
        messages: recentMessages,
        broadcasts: recentBroadcasts,
      },
      'Recent activity retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get chart data for messages
 * GET /api/dashboard/charts/messages
 */
const getMessageChartData = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const daysCount = parseInt(days);

    const data = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await Message.count({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: date,
            [require('sequelize').Op.lt]: nextDate,
          },
        },
      });

      data.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    sendSuccess(res, data, 'Message chart data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get top contacts by message count
 * GET /api/dashboard/top-contacts
 */
const getTopContacts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const contacts = await messageService.getContactsWithMessageCount(limit);

    // Sort by message count
    contacts.sort((a, b) => b.messageCount - a.messageCount);

    sendSuccess(res, contacts.slice(0, limit), 'Top contacts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get system health
 * GET /api/dashboard/health
 */
const getSystemHealth = async (req, res, next) => {
  try {
    const { testConnection: testDB } = require('../config/database');
    const { testRedisConnection } = require('../config/redis');

    // Test connections
    const [dbHealthy, redisHealthy] = await Promise.allSettled([
      testDB(),
      testRedisConnection(),
    ]);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        whatsapp: whatsappService.isConnected() ? 'connected' : 'disconnected',
        database: dbHealthy.status === 'fulfilled' && dbHealthy.value ? 'connected' : 'disconnected',
        redis: redisHealthy.status === 'fulfilled' && redisHealthy.value ? 'connected' : 'disconnected',
      },
      system: {
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: ((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100).toFixed(2) + '%',
        },
        cpu: process.cpuUsage(),
      },
    };

    // Determine overall status
    const allServicesHealthy = Object.values(health.services).every(
      (status) => status === 'connected'
    );

    if (!allServicesHealthy) {
      health.status = 'degraded';
    }

    sendSuccess(res, health, 'System health retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get queue status
 * GET /api/dashboard/queues
 */
const getQueueStatus = async (req, res, next) => {
  try {
    const stats = await queueService.getAllQueuesStats();

    sendSuccess(res, stats, 'Queue status retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get logs summary
 * GET /api/dashboard/logs-summary
 */
const getLogsSummary = async (req, res, next) => {
  try {
    const { AuditLog } = require('../models');

    // Get recent audit logs
    const recentLogs = await AuditLog.findAll({
      limit: 50,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
        },
      ],
    });

    // Count by action
    const actionCounts = await AuditLog.findAll({
      attributes: [
        'action',
        [require('sequelize').fn('COUNT', 'action'), 'count'],
      ],
      group: ['action'],
      order: [[require('sequelize').literal('count'), 'DESC']],
      limit: 10,
    });

    sendSuccess(
      res,
      {
        recent: recentLogs,
        byAction: actionCounts,
      },
      'Logs summary retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Export data (CSV/JSON)
 * GET /api/dashboard/export/:type
 */
const exportData = async (req, res, next) => {
  try {
    const { type } = req.params; // messages, contacts, broadcasts
    const format = req.query.format || 'json'; // json or csv

    let data = [];

    switch (type) {
      case 'messages':
        data = await Message.findAll({
          limit: 10000,
          order: [['createdAt', 'DESC']],
        });
        break;

      case 'contacts':
        data = await Contact.findAll({
          order: [['lastMessageAt', 'DESC']],
        });
        break;

      case 'broadcasts':
        data = await Broadcast.findAll({
          order: [['createdAt', 'DESC']],
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type',
        });
    }

    if (format === 'csv') {
      // Convert to CSV (simple implementation)
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-${Date.now()}.csv"`);
      return res.send(csv);
    }

    // JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-${Date.now()}.json"`);
    return res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to convert JSON to CSV
 */
function convertToCSV(data) {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0].toJSON ? data[0].toJSON() : data[0]);
  const rows = data.map((item) => {
    const obj = item.toJSON ? item.toJSON() : item;
    return headers.map((header) => JSON.stringify(obj[header] || '')).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

module.exports = {
  getOverview,
  getMessageStats,
  getRecentActivity,
  getMessageChartData,
  getTopContacts,
  getSystemHealth,
  getQueueStatus,
  getLogsSummary,
  exportData,
};