const rateLimit = require('express-rate-limit');
const config = require('../config');
const { RATE_LIMITS } = require('../utils/constants');
const { sendTooManyRequests } = require('../utils/response');

/**
 * Default rate limiter
 */
const defaultLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendTooManyRequests(res, 'Too many requests, please try again later');
  },
});

/**
 * Strict rate limiter for login attempts
 */
const loginLimiter = rateLimit({
  windowMs: RATE_LIMITS.LOGIN.windowMs,
  max: RATE_LIMITS.LOGIN.max,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    return sendTooManyRequests(res, 'Too many login attempts, please try again after 15 minutes');
  },
});

/**
 * Rate limiter for message sending
 */
const messageLimiter = rateLimit({
  windowMs: RATE_LIMITS.MESSAGE.windowMs,
  max: config.rateLimit.messageMax,
  message: 'Too many messages sent, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendTooManyRequests(res, 'Too many messages sent, please try again later');
  },
});

/**
 * Rate limiter for broadcast operations
 */
const broadcastLimiter = rateLimit({
  windowMs: RATE_LIMITS.BROADCAST.windowMs,
  max: RATE_LIMITS.BROADCAST.max,
  message: 'Too many broadcast requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendTooManyRequests(res, 'Too many broadcast requests, please try again after 1 hour');
  },
});

/**
 * Create custom rate limiter
 */
const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || config.rateLimit.windowMs,
    max: options.max || config.rateLimit.maxRequests,
    message: options.message || 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return sendTooManyRequests(res, options.message || 'Too many requests');
    },
    ...options,
  });
};

module.exports = {
  defaultLimiter,
  loginLimiter,
  messageLimiter,
  broadcastLimiter,
  createRateLimiter,
};