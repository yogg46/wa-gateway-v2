const messageService = require('../services/message.service');
const queueService = require('../services/queue.service');
const { sendSuccess, sendCreated } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Send text message
 * POST /api/messages/send-text
 */
const sendTextMessage = async (req, res, next) => {
  try {
    const { to, message } = req.body;
    const userId = req.user?.id;

    const result = await messageService.sendTextMessage(to, message, userId);

    sendCreated(res, result, 'Message sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Send text message via queue (async)
 * POST /api/messages/send-text-async
 */
const sendTextMessageAsync = async (req, res, next) => {
  try {
    const { to, message } = req.body;
    const userId = req.user?.id;

    const job = await queueService.addToMessageQueue({
      to,
      message,
      messageType: 'text',
      userId,
    });

    sendCreated(
      res,
      { jobId: job.id },
      'Message queued successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Send image message
 * POST /api/messages/send-image
 */
const sendImageMessage = async (req, res, next) => {
  try {
    const { to, caption } = req.body;
    const userId = req.user?.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required',
      });
    }

    const result = await messageService.sendImageMessage(
      to,
      req.file.path,
      caption || '',
      userId
    );

    sendCreated(res, result, 'Image sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Send video message
 * POST /api/messages/send-video
 */
const sendVideoMessage = async (req, res, next) => {
  try {
    const { to, caption } = req.body;
    const userId = req.user?.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required',
      });
    }

    const result = await messageService.sendVideoMessage(
      to,
      req.file.path,
      caption || '',
      userId
    );

    sendCreated(res, result, 'Video sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Send document message
 * POST /api/messages/send-document
 */
const sendDocumentMessage = async (req, res, next) => {
  try {
    const { to, filename } = req.body;
    const userId = req.user?.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Document file is required',
      });
    }

    const result = await messageService.sendDocumentMessage(
      to,
      req.file.path,
      filename || req.file.originalname,
      req.file.mimetype,
      userId
    );

    sendCreated(res, result, 'Document sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get message history
 * GET /api/messages
 */
const getMessageHistory = async (req, res, next) => {
  try {
    const filters = {
      from: req.query.from,
      to: req.query.to,
      status: req.query.status,
      messageType: req.query.messageType,
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    };

    const result = await messageService.getMessageHistory(filters, pagination);

    sendSuccess(res, result, 'Message history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get message by ID
 * GET /api/messages/:id
 */
const getMessageById = async (req, res, next) => {
  try {
    const messageId = req.params.id;

    const message = await messageService.getMessageById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    sendSuccess(res, message, 'Message retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get message statistics
 * GET /api/messages/stats
 */
const getMessageStats = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const stats = await messageService.getMessageStats(filters);

    sendSuccess(res, stats, 'Message statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Search messages
 * GET /api/messages/search
 */
const searchMessages = async (req, res, next) => {
  try {
    const { query, limit } = req.query;

    const messages = await messageService.searchMessages(query, parseInt(limit) || 50);

    sendSuccess(res, messages, 'Search completed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get contacts with message count
 * GET /api/messages/contacts
 */
const getContactsWithMessageCount = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const contacts = await messageService.getContactsWithMessageCount(limit);

    sendSuccess(res, contacts, 'Contacts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendTextMessage,
  sendTextMessageAsync,
  sendImageMessage,
  sendVideoMessage,
  sendDocumentMessage,
  getMessageHistory,
  getMessageById,
  getMessageStats,
  searchMessages,
  getContactsWithMessageCount,
};