const Joi = require('joi');

/**
 * Create webhook validation schema
 */
const createWebhookSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'Webhook name is required',
    'string.min': 'Name must be at least 3 characters',
    'any.required': 'Webhook name is required',
  }),
  url: Joi.string().uri().required().messages({
    'string.empty': 'Webhook URL is required',
    'string.uri': 'URL must be valid',
    'any.required': 'Webhook URL is required',
  }),
  secretKey: Joi.string().min(16).optional().messages({
    'string.min': 'Secret key must be at least 16 characters',
  }),
  events: Joi.array()
    .items(
      Joi.string().valid(
        'message.received',
        'message.sent',
        'message.delivered',
        'message.read',
        'connection.open',
        'connection.close',
        'qr.generated',
        'broadcast.completed'
      )
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one event is required',
      'any.required': 'Events are required',
    }),
  retryAttempts: Joi.number().integer().min(0).max(10).default(3),
  timeout: Joi.number().integer().min(1000).max(60000).default(10000),
});

/**
 * Update webhook validation schema
 */
const updateWebhookSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  url: Joi.string().uri().optional(),
  secretKey: Joi.string().min(16).optional(),
  events: Joi.array()
    .items(
      Joi.string().valid(
        'message.received',
        'message.sent',
        'message.delivered',
        'message.read',
        'connection.open',
        'connection.close',
        'qr.generated',
        'broadcast.completed'
      )
    )
    .min(1)
    .optional(),
  retryAttempts: Joi.number().integer().min(0).max(10).optional(),
  timeout: Joi.number().integer().min(1000).max(60000).optional(),
  isActive: Joi.boolean().optional(),
});

/**
 * Test webhook validation schema
 */
const testWebhookSchema = Joi.object({
  event: Joi.string()
    .valid(
      'message.received',
      'message.sent',
      'message.delivered',
      'message.read',
      'connection.open',
      'connection.close',
      'qr.generated',
      'broadcast.completed'
    )
    .required(),
  payload: Joi.object().optional(),
});

module.exports = {
  createWebhookSchema,
  updateWebhookSchema,
  testWebhookSchema,
};