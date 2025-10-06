const Joi = require('joi');

/**
 * Send text message validation schema
 */
const sendTextMessageSchema = Joi.object({
  to: Joi.string()
    .pattern(/^62\d{9,13}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Phone number must start with 62 and have 9-13 digits',
      'any.required': 'Phone number is required',
    }),
  message: Joi.string().min(1).max(4096).required().messages({
    'string.empty': 'Message is required',
    'string.max': 'Message must not exceed 4096 characters',
    'any.required': 'Message is required',
  }),
});

/**
 * Send image message validation schema
 */
const sendImageMessageSchema = Joi.object({
  to: Joi.string()
    .pattern(/^62\d{9,13}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Phone number must start with 62 and have 9-13 digits',
      'any.required': 'Phone number is required',
    }),
  caption: Joi.string().max(1024).optional().allow(''),
  // File will be handled by multer middleware
});

/**
 * Send video message validation schema
 */
const sendVideoMessageSchema = Joi.object({
  to: Joi.string()
    .pattern(/^62\d{9,13}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Phone number must start with 62 and have 9-13 digits',
      'any.required': 'Phone number is required',
    }),
  caption: Joi.string().max(1024).optional().allow(''),
});

/**
 * Send document message validation schema
 */
const sendDocumentMessageSchema = Joi.object({
  to: Joi.string()
    .pattern(/^62\d{9,13}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Phone number must start with 62 and have 9-13 digits',
      'any.required': 'Phone number is required',
    }),
  filename: Joi.string().optional(),
});

/**
 * Get message history validation schema
 */
const getMessageHistorySchema = Joi.object({
  from: Joi.string().pattern(/^62\d{9,13}$/).optional(),
  to: Joi.string().pattern(/^62\d{9,13}$/).optional(),
  status: Joi.string()
    .valid('pending', 'sent', 'delivered', 'read', 'failed')
    .optional(),
  messageType: Joi.string()
    .valid('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker')
    .optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

/**
 * Search messages validation schema
 */
const searchMessagesSchema = Joi.object({
  query: Joi.string().min(1).required().messages({
    'string.empty': 'Search query is required',
    'any.required': 'Search query is required',
  }),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

module.exports = {
  sendTextMessageSchema,
  sendImageMessageSchema,
  sendVideoMessageSchema,
  sendDocumentMessageSchema,
  getMessageHistorySchema,
  searchMessagesSchema,
};