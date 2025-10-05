const { HTTP_STATUS, ERROR_CODES } = require('./constants');

/**
 * Base application error class
 */
class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = ERROR_CODES.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (422)
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = null) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR);
    this.errors = errors;
  }
}

/**
 * Unauthorized error (401)
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }
}

/**
 * Forbidden error (403)
 */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
}

/**
 * Not found error (404)
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
}

/**
 * Conflict error (409)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
  }
}

/**
 * Database error (500)
 */
class DatabaseError extends AppError {
  constructor(message = 'Database error') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR);
  }
}

/**
 * WhatsApp error (500)
 */
class WhatsAppError extends AppError {
  constructor(message = 'WhatsApp error') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.WHATSAPP_ERROR);
  }
}

/**
 * Queue error (500)
 */
class QueueError extends AppError {
  constructor(message = 'Queue error') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.QUEUE_ERROR);
  }
}

/**
 * Webhook error (500)
 */
class WebhookError extends AppError {
  constructor(message = 'Webhook error') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.WEBHOOK_ERROR);
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  WhatsAppError,
  QueueError,
  WebhookError,
};