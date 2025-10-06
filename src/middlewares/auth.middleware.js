const authService = require('../services/auth.service');
const { UnauthorizedError } = require('../utils/errors');
const { sendUnauthorized } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Verify JWT token from Authorization header
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = authService.verifyAccessToken(token);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    logger.security('Token verification failed', {
      ip: req.ip,
      error: error.message,
    });
    return sendUnauthorized(res, error.message);
  }
};

/**
 * Verify API key from Authorization header or query parameter
 */
const verifyApiKey = async (req, res, next) => {
  try {
    let key = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      key = authHeader.substring(7);
    }

    // Check query parameter as fallback
    if (!key && req.query.apiKey) {
      key = req.query.apiKey;
    }

    if (!key) {
      throw new UnauthorizedError('No API key provided');
    }

    // Verify API key
    const apiKey = await authService.verifyApiKey(key);

    // Attach API key info to request
    req.apiKey = apiKey;
    req.user = apiKey.user || null;

    next();
  } catch (error) {
    logger.security('API key verification failed', {
      ip: req.ip,
      error: error.message,
    });
    return sendUnauthorized(res, error.message);
  }
};

/**
 * Verify either JWT token or API key
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication provided');
    }

    const token = authHeader.substring(7);

    // Try JWT first
    try {
      const decoded = authService.verifyAccessToken(token);
      req.user = decoded;
      req.authType = 'jwt';
      return next();
    } catch (jwtError) {
      // If JWT fails, try API key
      try {
        const apiKey = await authService.verifyApiKey(token);
        req.apiKey = apiKey;
        req.user = apiKey.user || null;
        req.authType = 'apikey';
        return next();
      } catch (apiKeyError) {
        throw new UnauthorizedError('Invalid authentication');
      }
    }
  } catch (error) {
    logger.security('Authentication failed', {
      ip: req.ip,
      error: error.message,
    });
    return sendUnauthorized(res, error.message);
  }
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = authService.verifyAccessToken(token);
        req.user = decoded;
        req.authType = 'jwt';
      } catch (jwtError) {
        try {
          const apiKey = await authService.verifyApiKey(token);
          req.apiKey = apiKey;
          req.user = apiKey.user || null;
          req.authType = 'apikey';
        } catch (apiKeyError) {
          // Ignore errors for optional auth
        }
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

module.exports = {
  verifyToken,
  verifyApiKey,
  authenticate,
  optionalAuth,
};