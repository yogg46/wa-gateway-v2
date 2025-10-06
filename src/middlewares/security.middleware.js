const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const config = require('../config');
const { sendForbidden } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Helmet security headers
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: config.isProduction
    ? undefined
    : false, // Disable CSP in development for easier testing
  crossOriginEmbedderPolicy: false,
});

/**
 * CORS configuration
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    const allowedOrigins = config.cors.origin;

    // Allow all origins in development
    if (config.isDevelopment || allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.security('CORS blocked', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const corsMiddleware = cors(corsOptions);

/**
 * XSS protection
 */
const xssMiddleware = xss();

/**
 * IP whitelist middleware
 */
const ipWhitelist = (req, res, next) => {
  if (config.security.ipWhitelist.length === 0) {
    return next();
  }

  const clientIp = req.ip || req.connection.remoteAddress;

  if (config.security.ipWhitelist.includes(clientIp)) {
    return next();
  }

  logger.security('IP blocked - not in whitelist', { ip: clientIp });
  return sendForbidden(res, 'Access denied');
};

/**
 * IP blacklist middleware
 */
const ipBlacklist = (req, res, next) => {
  if (config.security.ipBlacklist.length === 0) {
    return next();
  }

  const clientIp = req.ip || req.connection.remoteAddress;

  if (config.security.ipBlacklist.includes(clientIp)) {
    logger.security('IP blocked - in blacklist', { ip: clientIp });
    return sendForbidden(res, 'Access denied');
  }

  next();
};

/**
 * Sanitize request body
 */
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        // Remove potential XSS
        req.body[key] = req.body[key]
          .replace(/[<>]/g, '')
          .trim();
      }
    });
  }
  next();
};

/**
 * Prevent parameter pollution
 */
const preventParameterPollution = (req, res, next) => {
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (Array.isArray(req.query[key])) {
        // Take only the first value if multiple provided
        req.query[key] = req.query[key][0];
      }
    });
  }
  next();
};

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  xssMiddleware,
  ipWhitelist,
  ipBlacklist,
  sanitizeBody,
  preventParameterPollution,
};