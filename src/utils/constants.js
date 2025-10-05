// User roles
const ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  USER: 'user',
};

// Message status
const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
};

// Message types
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  LOCATION: 'location',
  CONTACT: 'contact',
  STICKER: 'sticker',
};

// Broadcast status
const BROADCAST_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// WhatsApp connection states
const WA_CONNECTION_STATE = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSE: 'close',
};

// QR status
const QR_STATUS = {
  PENDING: 'pending',
  SCANNED: 'scanned',
  EXPIRED: 'expired',
  FAILED: 'failed',
};

// Webhook events
const WEBHOOK_EVENTS = {
  MESSAGE_RECEIVED: 'message.received',
  MESSAGE_SENT: 'message.sent',
  MESSAGE_DELIVERED: 'message.delivered',
  MESSAGE_READ: 'message.read',
  CONNECTION_OPEN: 'connection.open',
  CONNECTION_CLOSE: 'connection.close',
  QR_GENERATED: 'qr.generated',
  BROADCAST_COMPLETED: 'broadcast.completed',
};

// Audit log actions
const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  SEND_MESSAGE: 'send_message',
  CREATE_BROADCAST: 'create_broadcast',
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  CREATE_WEBHOOK: 'create_webhook',
  UPDATE_WEBHOOK: 'update_webhook',
  DELETE_WEBHOOK: 'delete_webhook',
  RESTART_WHATSAPP: 'restart_whatsapp',
};

// API permissions
const PERMISSIONS = {
  ALL: '*',
  MESSAGES_SEND: 'messages:send',
  MESSAGES_READ: 'messages:read',
  BROADCASTS_CREATE: 'broadcasts:create',
  BROADCASTS_READ: 'broadcasts:read',
  WEBHOOKS_MANAGE: 'webhooks:manage',
  USERS_MANAGE: 'users:manage',
  SYSTEM_MANAGE: 'system:manage',
};

// Queue names
const QUEUE_NAMES = {
  MESSAGE: 'message-queue',
  BROADCAST: 'broadcast-queue',
  WEBHOOK: 'webhook-queue',
};

// Queue priorities
const QUEUE_PRIORITIES = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  CRITICAL: 15,
};

// Error codes
const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  WHATSAPP_ERROR: 'WHATSAPP_ERROR',
  QUEUE_ERROR: 'QUEUE_ERROR',
  WEBHOOK_ERROR: 'WEBHOOK_ERROR',
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Rate limit defaults
const RATE_LIMITS = {
  DEFAULT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },
  LOGIN: {
    windowMs: 15 * 60 * 1000,
    max: 5,
  },
  MESSAGE: {
    windowMs: 15 * 60 * 1000,
    max: 50,
  },
  BROADCAST: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
  },
};

module.exports = {
  ROLES,
  MESSAGE_STATUS,
  MESSAGE_TYPES,
  BROADCAST_STATUS,
  WA_CONNECTION_STATE,
  QR_STATUS,
  WEBHOOK_EVENTS,
  AUDIT_ACTIONS,
  PERMISSIONS,
  QUEUE_NAMES,
  QUEUE_PRIORITIES,
  ERROR_CODES,
  HTTP_STATUS,
  RATE_LIMITS,
};