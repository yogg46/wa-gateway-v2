const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Pretty format for console (development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Transport: Daily rotating file for all logs
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(config.logging.dir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: config.logging.maxSize,
  maxFiles: config.logging.maxFiles,
  format: logFormat,
  level: 'info',
});

// Transport: Daily rotating file for errors only
const errorFileTransport = new DailyRotateFile({
  filename: path.join(config.logging.dir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: config.logging.maxSize,
  maxFiles: config.logging.maxFiles,
  format: logFormat,
  level: 'error',
});

// Transport: Daily rotating file for security events
const securityFileTransport = new DailyRotateFile({
  filename: path.join(config.logging.dir, 'security-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: config.logging.maxSize,
  maxFiles: config.logging.maxFiles,
  format: logFormat,
  level: 'warn',
});

// Transport: Console (for development)
const consoleTransport = new winston.transports.Console({
  format: config.prettyLogs ? consoleFormat : logFormat,
  level: config.isDevelopment ? 'debug' : 'info',
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    combinedFileTransport,
    errorFileTransport,
    securityFileTransport,
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(config.logging.dir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(config.logging.dir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    }),
  ],
  exitOnError: false,
});

// Add console transport in development
if (config.isDevelopment || config.debug) {
  logger.add(consoleTransport);
}

// Custom logging methods
logger.security = (message, meta = {}) => {
  logger.warn(message, { type: 'security', ...meta });
};

logger.audit = (message, meta = {}) => {
  logger.info(message, { type: 'audit', ...meta });
};

logger.whatsapp = (message, meta = {}) => {
  logger.info(message, { type: 'whatsapp', ...meta });
};

logger.webhook = (message, meta = {}) => {
  logger.info(message, { type: 'webhook', ...meta });
};

logger.queue = (message, meta = {}) => {
  logger.info(message, { type: 'queue', ...meta });
};

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = logger;