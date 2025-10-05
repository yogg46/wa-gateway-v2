const { HTTP_STATUS } = require('./constants');

/**
 * Send success response
 * @param {object} res - Express response object
 * @param {object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {object} errors - Validation errors (optional)
 */
const sendError = (res, message = 'Error', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Send created response (201)
 * @param {object} res - Express response object
 * @param {object} data - Created resource data
 * @param {string} message - Success message
 */
const sendCreated = (res, data = null, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
};

/**
 * Send not found response (404)
 * @param {object} res - Express response object
 * @param {string} message - Not found message
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, HTTP_STATUS.NOT_FOUND);
};

/**
 * Send unauthorized response (401)
 * @param {object} res - Express response object
 * @param {string} message - Unauthorized message
 */
const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, message, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Send forbidden response (403)
 * @param {object} res - Express response object
 * @param {string} message - Forbidden message
 */
const sendForbidden = (res, message = 'Forbidden') => {
  return sendError(res, message, HTTP_STATUS.FORBIDDEN);
};

/**
 * Send validation error response (422)
 * @param {object} res - Express response object
 * @param {object} errors - Validation errors
 * @param {string} message - Error message
 */
const sendValidationError = (res, errors, message = 'Validation failed') => {
  return sendError(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
};

/**
 * Send bad request response (400)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 */
const sendBadRequest = (res, message = 'Bad request') => {
  return sendError(res, message, HTTP_STATUS.BAD_REQUEST);
};

/**
 * Send conflict response (409)
 * @param {object} res - Express response object
 * @param {string} message - Conflict message
 */
const sendConflict = (res, message = 'Resource already exists') => {
  return sendError(res, message, HTTP_STATUS.CONFLICT);
};

/**
 * Send too many requests response (429)
 * @param {object} res - Express response object
 * @param {string} message - Rate limit message
 */
const sendTooManyRequests = (res, message = 'Too many requests') => {
  return sendError(res, message, HTTP_STATUS.TOO_MANY_REQUESTS);
};

/**
 * Send paginated response
 * @param {object} res - Express response object
 * @param {Array} data - Array of data
 * @param {object} pagination - Pagination info
 * @param {string} message - Success message
 */
const sendPaginated = (res, data, pagination, message = 'Success') => {
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendValidationError,
  sendBadRequest,
  sendConflict,
  sendTooManyRequests,
  sendPaginated,
};