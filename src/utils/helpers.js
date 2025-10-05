const crypto = require('crypto');

/**
 * Format phone number to WhatsApp JID format
 * @param {string} phone - Phone number (e.g., 628123456789)
 * @returns {string} - Formatted JID (e.g., 628123456789@s.whatsapp.net)
 */
const formatPhoneToJid = (phone) => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');
  
  // Add country code if not present (default to Indonesia +62)
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  
  return `${cleaned}@s.whatsapp.net`;
};

/**
 * Extract phone number from JID
 * @param {string} jid - WhatsApp JID (e.g., 628123456789@s.whatsapp.net)
 * @returns {string} - Phone number (e.g., 628123456789)
 */
const extractPhoneFromJid = (jid) => {
  return jid.split('@')[0];
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
const isValidPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return /^62\d{9,13}$/.test(cleaned);
};

/**
 * Generate random API key
 * @param {string} prefix - Prefix for the key (default: 'wa')
 * @returns {string} - Generated API key
 */
const generateApiKey = (prefix = 'wa') => {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${randomBytes}`;
};

/**
 * Generate HMAC signature for webhook
 * @param {string} payload - JSON payload
 * @param {string} secret - Secret key
 * @returns {string} - HMAC signature
 */
const generateHmacSignature = (payload, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
};

/**
 * Verify HMAC signature
 * @param {string} payload - JSON payload
 * @param {string} signature - Signature to verify
 * @param {string} secret - Secret key
 * @returns {boolean} - True if valid
 */
const verifyHmacSignature = (payload, signature, secret) => {
  const expectedSignature = generateHmacSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * Sanitize string (remove XSS)
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} - Result of function
 */
const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const backoffDelay = delay * Math.pow(2, i);
        await sleep(backoffDelay);
      }
    }
  }
  
  throw lastError;
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} - Array of chunks
 */
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Format bytes to human readable
 * @param {number} bytes - Bytes to format
 * @param {number} decimals - Decimal places
 * @returns {string} - Formatted string
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Get time difference in human readable format
 * @param {Date} date - Date to compare
 * @returns {string} - Human readable difference
 */
const getTimeDifference = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
};

/**
 * Parse metadata JSON safely
 * @param {string|object} metadata - Metadata to parse
 * @returns {object} - Parsed metadata
 */
const parseMetadata = (metadata) => {
  if (typeof metadata === 'object') return metadata;
  
  try {
    return JSON.parse(metadata);
  } catch (error) {
    return {};
  }
};

/**
 * Mask sensitive data (for logging)
 * @param {string} str - String to mask
 * @param {number} visibleChars - Characters to keep visible
 * @returns {string} - Masked string
 */
const maskSensitiveData = (str, visibleChars = 4) => {
  if (!str || str.length <= visibleChars) return str;
  
  const visible = str.slice(0, visibleChars);
  const masked = '*'.repeat(str.length - visibleChars);
  return visible + masked;
};

/**
 * Debounce function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} - Debounced function
 */
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Truncate string
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated string
 */
const truncateString = (str, length = 100) => {
  if (!str || str.length <= length) return str;
  return str.slice(0, length) + '...';
};

module.exports = {
  formatPhoneToJid,
  extractPhoneFromJid,
  isValidPhone,
  generateApiKey,
  generateHmacSignature,
  verifyHmacSignature,
  sanitizeString,
  retryWithBackoff,
  sleep,
  chunkArray,
  formatBytes,
  getTimeDifference,
  parseMetadata,
  maskSensitiveData,
  debounce,
  truncateString,
};