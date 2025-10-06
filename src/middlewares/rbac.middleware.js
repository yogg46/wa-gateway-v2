const { ForbiddenError } = require('../utils/errors');
const { sendForbidden } = require('../utils/response');
const { ROLES, PERMISSIONS } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Check if user has required role
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('User not authenticated');
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        logger.security('Access denied - insufficient role', {
          user: req.user.username,
          requiredRoles: allowedRoles,
          userRole,
          ip: req.ip,
        });
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      return sendForbidden(res, error.message);
    }
  };
};

/**
 * Check if user/API key has required permission
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    try {
      let hasPermission = false;

      // Check JWT user role
      if (req.user) {
        const userRole = req.user.role;

        // Admins have all permissions
        if (userRole === ROLES.ADMIN) {
          hasPermission = true;
        }
      }

      // Check API key permissions
      if (req.apiKey && !hasPermission) {
        const apiKeyPermissions = req.apiKey.permissions || [];

        // Check if has wildcard permission
        if (apiKeyPermissions.includes(PERMISSIONS.ALL)) {
          hasPermission = true;
        } else {
          // Check if has any of the required permissions
          hasPermission = requiredPermissions.some((perm) =>
            apiKeyPermissions.includes(perm)
          );
        }
      }

      if (!hasPermission) {
        logger.security('Access denied - insufficient permissions', {
          user: req.user?.username || 'API Key',
          requiredPermissions,
          ip: req.ip,
        });
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      return sendForbidden(res, error.message);
    }
  };
};

/**
 * Admin only access
 */
const requireAdmin = requireRole(ROLES.ADMIN);

/**
 * Admin or Operator access
 */
const requireOperator = requireRole(ROLES.ADMIN, ROLES.OPERATOR);

module.exports = {
  requireRole,
  requirePermission,
  requireAdmin,
  requireOperator,
};