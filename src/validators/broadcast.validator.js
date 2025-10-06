const Joi = require('joi');

/**
 * Create broadcast validation schema
 */
const createBroadcastSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'Broadcast name is required',
    'string.min': 'Name must be at least 3 characters',
    'any.required': 'Broadcast name is required',
  }),
  messageContent: Joi.string().min(1).max(4096).required().messages({
    'string.empty': 'Message content is required',
    'string.max': 'Message must not exceed 4096 characters',
    'any.required': 'Message content is required',
  }),
  messageType: Joi.string()
    .valid('text', 'image', 'video', 'document')
    .default('text'),
  recipients: Joi.array()
    .items(
      Joi.string().pattern(/^62\d{9,13}$/).messages({
        'string.pattern.base': 'Each phone number must start with 62 and have 9-13 digits',
      })
    )
    .min(1)
    .max(1000)
    .required()
    .messages({
      'array.min': 'At least one recipient is required',
      'array.max': 'Maximum 1000 recipients per broadcast',
      'any.required': 'Recipients are required',
    }),
  scheduledAt: Joi.date().greater('now').optional().messages({
    'date.greater': 'Scheduled time must be in the future',
  }),
});

/**
 * Update broadcast validation schema
 */
const updateBroadcastSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  messageContent: Joi.string().min(1).max(4096).optional(),
  messageType: Joi.string().valid('text', 'image', 'video', 'document').optional(),
  recipients: Joi.array()
    .items(Joi.string().pattern(/^62\d{9,13}$/))
    .min(1)
    .max(1000)
    .optional(),
  scheduledAt: Joi.date().greater('now').optional(),
  status: Joi.string()
    .valid('draft', 'scheduled', 'running', 'completed', 'failed', 'cancelled')
    .optional(),
});

/**
 * Get broadcasts validation schema
 */
const getBroadcastsSchema = Joi.object({
  status: Joi.string()
    .valid('draft', 'scheduled', 'running', 'completed', 'failed', 'cancelled')
    .optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createBroadcastSchema,
  updateBroadcastSchema,
  getBroadcastsSchema,
};