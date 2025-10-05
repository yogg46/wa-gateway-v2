const Joi = require('joi');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Environment variables validation schema
const envSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_NAME: Joi.string().default('WA-Gate-v2'),
  APP_VERSION: Joi.string().default('2.0.0'),
  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().default('0.0.0.0'),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(3306),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_DIALECT: Joi.string()
    .valid('mysql', 'postgres', 'sqlite', 'mariadb')
    .default('mysql'),
  DB_POOL_MAX: Joi.number().default(10),
  DB_POOL_MIN: Joi.number().default(2),
  DB_POOL_ACQUIRE: Joi.number().default(30000),
  DB_POOL_IDLE: Joi.number().default(10000),
  DB_LOGGING: Joi.boolean().default(false),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Session
  SESSION_SECRET: Joi.string().min(32).required(),
  SESSION_MAX_AGE: Joi.number().default(86400000),

  // API Keys
  API_KEY_ADMIN: Joi.string().min(32).required(),
  API_KEY_USER: Joi.string().min(32).required(),

  // WhatsApp
  WA_SESSION_PATH: Joi.string().default('./auth'),
  WA_AUTO_RECONNECT: Joi.boolean().default(true),
  WA_MAX_RECONNECT_ATTEMPTS: Joi.number().default(5),
  WA_RECONNECT_INTERVAL: Joi.number().default(5000),
  WA_QR_TIMEOUT: Joi.number().default(60000),
  WA_PRESENCE_UPDATE: Joi.boolean().default(true),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  RATE_LIMIT_LOGIN_MAX: Joi.number().default(5),
  RATE_LIMIT_MESSAGE_MAX: Joi.number().default(50),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),
  CORS_CREDENTIALS: Joi.boolean().default(true),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),

  // Webhook
  WEBHOOK_URL: Joi.string().uri().allow('').optional(),
  WEBHOOK_SECRET: Joi.string().allow('').optional(),
  WEBHOOK_RETRY_ATTEMPTS: Joi.number().default(3),
  WEBHOOK_RETRY_DELAY: Joi.number().default(5000),

  // Upload
  UPLOAD_MAX_FILE_SIZE: Joi.number().default(10485760),
  UPLOAD_ALLOWED_TYPES: Joi.string().default(
    'image/jpeg,image/png,image/gif,application/pdf,video/mp4'
  ),
  UPLOAD_PATH: Joi.string().default('./uploads'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  LOG_MAX_SIZE: Joi.string().default('10m'),
  LOG_MAX_FILES: Joi.string().default('30d'),
  LOG_DIR: Joi.string().default('./logs'),

  // Security
  HELMET_ENABLED: Joi.boolean().default(true),
  XSS_PROTECTION: Joi.boolean().default(true),
  IP_WHITELIST: Joi.string().allow('').default(''),
  IP_BLACKLIST: Joi.string().allow('').default(''),

  // Dashboard
  DASHBOARD_ENABLED: Joi.boolean().default(true),
  DASHBOARD_USERNAME: Joi.string().required(),
  DASHBOARD_PASSWORD: Joi.string().min(8).required(),

  // Monitoring
  ENABLE_METRICS: Joi.boolean().default(true),
  ENABLE_HEALTH_CHECK: Joi.boolean().default(true),

  // External Services
  LARAVEL_API_URL: Joi.string().uri().allow('').optional(),
  LARAVEL_API_KEY: Joi.string().allow('').optional(),

  // Development
  DEBUG: Joi.boolean().default(false),
  PRETTY_LOGS: Joi.boolean().default(true),
})
  .unknown()
  .required();

// Validate environment variables
const { error, value: env } = envSchema.validate(process.env);

if (error) {
  throw new Error(`❌ Config validation error: ${error.message}`);
}

// Export validated configuration
module.exports = {
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  app: {
    name: env.APP_NAME,
    version: env.APP_VERSION,
    port: env.PORT,
    host: env.HOST,
  },

  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    dialect: env.DB_DIALECT,
    logging: env.DB_LOGGING,
    pool: {
      max: env.DB_POOL_MAX,
      min: env.DB_POOL_MIN,
      acquire: env.DB_POOL_ACQUIRE,
      idle: env.DB_POOL_IDLE,
    },
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  session: {
    secret: env.SESSION_SECRET,
    maxAge: env.SESSION_MAX_AGE,
  },

  apiKeys: {
    admin: env.API_KEY_ADMIN,
    user: env.API_KEY_USER,
  },

  whatsapp: {
    sessionPath: path.resolve(env.WA_SESSION_PATH),
    autoReconnect: env.WA_AUTO_RECONNECT,
    maxReconnectAttempts: env.WA_MAX_RECONNECT_ATTEMPTS,
    reconnectInterval: env.WA_RECONNECT_INTERVAL,
    qrTimeout: env.WA_QR_TIMEOUT,
    presenceUpdate: env.WA_PRESENCE_UPDATE,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    loginMax: env.RATE_LIMIT_LOGIN_MAX,
    messageMax: env.RATE_LIMIT_MESSAGE_MAX,
  },

  cors: {
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: env.CORS_CREDENTIALS,
  },

  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  },

  webhook: {
    url: env.WEBHOOK_URL,
    secret: env.WEBHOOK_SECRET,
    retryAttempts: env.WEBHOOK_RETRY_ATTEMPTS,
    retryDelay: env.WEBHOOK_RETRY_DELAY,
  },

  upload: {
    maxFileSize: env.UPLOAD_MAX_FILE_SIZE,
    allowedTypes: env.UPLOAD_ALLOWED_TYPES.split(',').map((t) => t.trim()),
    path: path.resolve(env.UPLOAD_PATH),
  },

  logging: {
    level: env.LOG_LEVEL,
    maxSize: env.LOG_MAX_SIZE,
    maxFiles: env.LOG_MAX_FILES,
    dir: path.resolve(env.LOG_DIR),
  },

  security: {
    helmetEnabled: env.HELMET_ENABLED,
    xssProtection: env.XSS_PROTECTION,
    ipWhitelist: env.IP_WHITELIST
      ? env.IP_WHITELIST.split(',').map((ip) => ip.trim())
      : [],
    ipBlacklist: env.IP_BLACKLIST
      ? env.IP_BLACKLIST.split(',').map((ip) => ip.trim())
      : [],
  },

  dashboard: {
    enabled: env.DASHBOARD_ENABLED,
    username: env.DASHBOARD_USERNAME,
    password: env.DASHBOARD_PASSWORD,
  },

  monitoring: {
    enableMetrics: env.ENABLE_METRICS,
    enableHealthCheck: env.ENABLE_HEALTH_CHECK,
  },

  external: {
    laravelApiUrl: env.LARAVEL_API_URL,
    laravelApiKey: env.LARAVEL_API_KEY,
  },

  debug: env.DEBUG,
  prettyLogs: env.PRETTY_LOGS,
};