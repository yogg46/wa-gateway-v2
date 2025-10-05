const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config');

// =======================
// Helper untuk Baileys charMap
// =======================
function isCharMap(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }
  
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  
  const allNumericKeys = keys.every(k => /^\d+$/.test(k));
  if (!allNumericKeys) return false;
  
  const values = Object.values(obj);
  return values.every(v => typeof v === 'string' && v.length === 1);
}

function charMapToString(obj) {
  const keys = Object.keys(obj).map(Number).sort((a, b) => a - b);
  return keys.map(k => obj[k]).join('');
}

function sanitizeMessage(msg) {
  if (typeof msg === 'string') return msg;
  if (typeof msg === 'number') return msg.toString();
  if (Buffer.isBuffer(msg)) return msg.toString('utf8');
  if (msg instanceof Uint8Array) return Buffer.from(msg).toString('utf8');
  if (isCharMap(msg)) return charMapToString(msg);
  
  try {
    // 🔥 Return object as-is untuk di-pretty print nanti
    if (msg && typeof msg === 'object') {
      return JSON.stringify(msg);
    }
    return JSON.stringify(msg);
  } catch {
    return String(msg);
  }
}

// Helper untuk cek apakah string adalah JSON
function isJSONString(str) {
  if (typeof str !== 'string') return false;
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}

// =======================
// Define log format
// =======================
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Pretty format for console (development) - Enhanced untuk Baileys
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Sanitize message
    let finalMessage = sanitizeMessage(message);
    
    // 🔥 Parse JSON string untuk pretty print
    let parsedMessage = null;
    if (isJSONString(finalMessage)) {
      try {
        parsedMessage = JSON.parse(finalMessage);
      } catch {
        // Bukan JSON valid, biarkan sebagai string
      }
    }
    
    // Clean up meta - handle charMap dan filter empty values
    const cleanMeta = {};
    let additionalText = '';
    
    for (const [key, value] of Object.entries(meta)) {
      if (value === undefined || value === null || value === '') continue;
      
      if (isCharMap(value)) {
        // Append charMap ke additional text
        additionalText = ' ' + charMapToString(value);
      } else if (key !== 'timestamp' && key !== 'level') {
        cleanMeta[key] = value;
      }
    }
    
    let msg = `${timestamp} [${level}]:`;
    
    // 🔥 Pretty print JSON jika message adalah JSON object
    if (parsedMessage && typeof parsedMessage === 'object') {
      const jsonStr = JSON.stringify(parsedMessage, null, 2);
      
      // Jika JSON terlalu panjang (>200 char), print di baris baru
      if (jsonStr.length > 200) {
        msg += '\n' + jsonStr;
      } else {
        msg += ' ' + jsonStr;
      }
    } else {
      msg += ` ${finalMessage}`;
    }
    
    // Tambahkan additional text (seperti "recv frame", "connected to WA", dll)
    if (additionalText) {
      msg += additionalText;
    }
    
    // Tambahkan meta yang tersisa (jika ada)
    if (Object.keys(cleanMeta).length > 0) {
      msg += '\n' + JSON.stringify(cleanMeta, null, 2);
    }
    
    return msg;
  })
);

// =======================
// Transport: Daily rotating file for all logs
// =======================
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

// =======================
// Create Winston logger instance
// =======================
const winstonLogger = winston.createLogger({
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
  winstonLogger.add(consoleTransport);
}

// =======================
// Pino Logger untuk Baileys (Optional)
// =======================
let pinoLogger = null;

try {
  const pino = require('pino');
  
  pinoLogger = pino({
    level: 'trace',
    transport: config.isDevelopment ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
      }
    } : undefined
  });
  
  // Bridge Pino logs ke Winston untuk file storage
  const originalWrite = pinoLogger[Symbol.for('pino.write')];
  if (originalWrite) {
    pinoLogger[Symbol.for('pino.write')] = function(chunk) {
      // Write ke Pino (console)
      originalWrite.call(this, chunk);
      
      // Bridge ke Winston (file)
      try {
        const log = JSON.parse(chunk);
        const msg = sanitizeMessage(log.msg || '');
        
        if (log.level >= 50) winstonLogger.error(msg);
        else if (log.level >= 40) winstonLogger.warn(msg);
        else if (log.level >= 30) winstonLogger.info(msg);
        else winstonLogger.debug(msg);
      } catch (err) {
        // Ignore parse errors
      }
    };
  }
  
  console.log('✅ Pino logger initialized (hybrid mode)');
} catch (err) {
  console.log('⚠️  Pino not installed, using Winston only');
  console.log('   Install with: npm install pino pino-pretty');
}

// =======================
// Enhanced logger dengan auto-detection
// =======================
const logger = {
  // Standard Winston methods dengan sanitization
  trace: (...args) => winstonLogger.debug(args.map(sanitizeMessage).join(' ')),
  debug: (...args) => winstonLogger.debug(args.map(sanitizeMessage).join(' ')),
  info: (...args) => winstonLogger.info(args.map(sanitizeMessage).join(' ')),
  warn: (...args) => winstonLogger.warn(args.map(sanitizeMessage).join(' ')),
  error: (...args) => winstonLogger.error(args.map(sanitizeMessage).join(' ')),
  fatal: (...args) => winstonLogger.error(args.map(sanitizeMessage).join(' ')),
  
  // Custom logging methods
  security: (message, meta = {}) => {
    winstonLogger.warn(sanitizeMessage(message), { type: 'security', ...meta });
  },
  
  audit: (message, meta = {}) => {
    winstonLogger.info(sanitizeMessage(message), { type: 'audit', ...meta });
  },
  
  whatsapp: (message, meta = {}) => {
    winstonLogger.info(sanitizeMessage(message), { type: 'whatsapp', ...meta });
  },
  
  webhook: (message, meta = {}) => {
    winstonLogger.info(sanitizeMessage(message), { type: 'webhook', ...meta });
  },
  
  queue: (message, meta = {}) => {
    winstonLogger.info(sanitizeMessage(message), { type: 'queue', ...meta });
  },
  
  // Baileys-compatible child logger
  child: (bindings) => {
    // Jika Pino available, gunakan Pino untuk Baileys
    if (pinoLogger) {
      return pinoLogger.child(bindings);
    }
    // Fallback ke wrapper Winston
    return logger;
  },
  
  // Method untuk get Pino logger (jika available)
  getPino: () => pinoLogger,
  
  // Method untuk get Winston logger
  getWinston: () => winstonLogger,
};

// =======================
// Global error handling
// =======================
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = logger;