const express = require('express');
const compression = require('compression');
const config = require('./config');
const logger = require('./utils/logger');

// Import middlewares
const {
  helmetMiddleware,
  corsMiddleware,
  xssMiddleware,
  ipWhitelist,
  ipBlacklist,
  sanitizeBody,
  preventParameterPollution,
} = require('./middlewares/security.middleware');
const { requestLogger } = require('./middlewares/logger.middleware');
const { defaultLimiter } = require('./middlewares/rateLimit.middleware');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

// Import routes
const routes = require('./routes');

// Create Express app
const app = express();

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// ============================================
// SECURITY MIDDLEWARES
// ============================================
if (config.security.helmetEnabled) {
  app.use(helmetMiddleware);
}

app.use(corsMiddleware);

if (config.security.xssProtection) {
  app.use(xssMiddleware);
}

// IP filtering
if (config.security.ipWhitelist.length > 0) {
  app.use(ipWhitelist);
}

if (config.security.ipBlacklist.length > 0) {
  app.use(ipBlacklist);
}

// ============================================
// GENERAL MIDDLEWARES
// ============================================

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request sanitization
app.use(sanitizeBody);
app.use(preventParameterPollution);

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// Rate limiting (global)
app.use(defaultLimiter);

// ============================================
// STATIC FILES
// ============================================
app.use('/public', express.static('public'));

// ============================================
// API ROUTES
// ============================================
app.use('/', routes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// STARTUP MESSAGE
// ============================================
logger.info('Express app configured successfully', {
  environment: config.env,
  port: config.app.port,
});

module.exports = app;