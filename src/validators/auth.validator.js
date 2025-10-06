const Joi = require('joi');

/**
 * Login validation schema
 */
const loginSchema = Joi.object({
  usernameOrEmail: Joi.string().required().messages({
    'string.empty': 'Username or email is required',
    'any.required': 'Username or email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
});

/**
 * Refresh token validation schema
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required',
    'any.required': 'Refresh token is required',
  }),
});

/**
 * Create user validation schema
 */
const createUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required().messages({
    'string.empty': 'Username is required',
    'string.alphanum': 'Username must be alphanumeric',
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username must not exceed 50 characters',
    'any.required': 'Username is required',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be valid',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
  fullName: Joi.string().max(100).optional(),
  role: Joi.string().valid('admin', 'operator', 'user').default('user'),
});

/**
 * Update user validation schema
 */
const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
  fullName: Joi.string().max(100).optional(),
  role: Joi.string().valid('admin', 'operator', 'user').optional(),
  isActive: Joi.boolean().optional(),
});

/**
 * Change password validation schema
 */
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': 'Old password is required',
    'any.required': 'Old password is required',
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 8 characters',
    'any.required': 'New password is required',
  }),
});

/**
 * Create API key validation schema
 */
const createApiKeySchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'API key name is required',
    'string.min': 'Name must be at least 3 characters',
    'any.required': 'API key name is required',
  }),
  permissions: Joi.array().items(Joi.string()).default([]),
  rateLimit: Joi.number().integer().min(1).default(100),
  expiresAt: Joi.date().optional(),
});

module.exports = {
  loginSchema,
  refreshTokenSchema,
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  createApiKeySchema,
};