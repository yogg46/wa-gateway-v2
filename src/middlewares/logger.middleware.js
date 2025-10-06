const morgan = require('morgan');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Morgan stream for Winston
 */
const stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

/**
 * Morgan format for development
 */
const devFormat = morgan('dev', { stream });

/**
 * Morgan format for production
 */
const prodFormat = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms',
  { stream }
);

/**
 * Request logger middleware
 */
const requestLogger = config.isDevelopment ? devFormat : prodFormat;

/**
 * Custom request logger with additional info
 */
const detailedLogger = (req, res, next) => {
  const start = Date.now();

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      user: req.user?.username || 'anonymous',
    });
  });

  next();
};

module.exports = {
  requestLogger,
  detailedLogger,
};