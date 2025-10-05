const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const config = require('../config');
const logger = require('../utils/logger');
const { WhatsAppError } = require('../utils/errors');
const { WA_CONNECTION_STATE, WEBHOOK_EVENTS } = require('../utils/constants');
const fs = require('fs');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.qr = null;
    this.connectionState = WA_CONNECTION_STATE.CLOSE;
    this.reconnectAttempts = 0;
    this.isInitialized = false;
    this.eventHandlers = new Map();
  }

  /**
   * Initialize WhatsApp connection
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        logger.warn('WhatsApp service already initialized');
        return;
      }

      logger.info('Initializing WhatsApp service...');

      // Create auth folder if not exists
      if (!fs.existsSync(config.whatsapp.sessionPath)) {
        fs.mkdirSync(config.whatsapp.sessionPath, { recursive: true });
      }

      // Load auth state
      const { state, saveCreds } = await useMultiFileAuthState(config.whatsapp.sessionPath);
      
      // Fetch latest Baileys version
      const { version } = await fetchLatestBaileysVersion();
      
      logger.info(`Using Baileys version: ${version.join('.')}`);

      // 🔥 Gunakan Pino jika available, fallback ke Winston
      const baileysLogger = logger.getPino ? (logger.getPino() || logger) : logger;

      // Create socket
      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: config.isDevelopment,
        logger: baileysLogger, // Langsung pakai logger yang sudah powerful
      });

      // Setup event handlers
      this.setupEventHandlers(saveCreds);

      this.isInitialized = true;
      logger.info('WhatsApp service initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize WhatsApp service:', error);
      throw new WhatsAppError('Failed to initialize WhatsApp');
    }
  }

  /**
   * Setup Baileys event handlers
   */
  setupEventHandlers(saveCreds) {
    // Connection update
    this.sock.ev.on('connection.update', async (update) => {
      await this.handleConnectionUpdate(update);
    });

    // Credentials update
    this.sock.ev.on('creds.update', saveCreds);

    // Messages upsert (incoming messages)
    this.sock.ev.on('messages.upsert', async ({ messages }) => {
      await this.handleMessagesUpsert(messages);
    });

    // Message update (delivery, read receipts)
    this.sock.ev.on('messages.update', async (updates) => {
      await this.handleMessagesUpdate(updates);
    });

    logger.info('Event handlers setup completed');
  }

  /**
   * Handle connection updates
   */
  async handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    // QR code received
    if (qr) {
      this.qr = qr;
      logger.info('QR code received');
      this.emitEvent('qr', qr);
    }

    // Connection opened
    if (connection === 'open') {
      this.connectionState = WA_CONNECTION_STATE.OPEN;
      this.reconnectAttempts = 0;
      this.qr = null;
      
      logger.info('✅ WhatsApp connected successfully');
      this.emitEvent(WEBHOOK_EVENTS.CONNECTION_OPEN, {
        timestamp: new Date(),
      });
    }

    // Connection closed
    if (connection === 'close') {
      this.connectionState = WA_CONNECTION_STATE.CLOSE;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      
      logger.warn(`WhatsApp connection closed. Status code: ${statusCode}`);

      // Handle logout (401)
      if (statusCode === DisconnectReason.loggedOut) {
        logger.warn('WhatsApp logged out. Clearing session...');
        await this.clearSession();
        this.emitEvent(WEBHOOK_EVENTS.CONNECTION_CLOSE, {
          reason: 'logged_out',
          timestamp: new Date(),
        });
        return;
      }

      // Auto reconnect
      if (config.whatsapp.autoReconnect && this.reconnectAttempts < config.whatsapp.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = config.whatsapp.reconnectInterval * this.reconnectAttempts;
        
        logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${config.whatsapp.maxReconnectAttempts})...`);
        
        setTimeout(async () => {
          await this.initialize();
        }, delay);
      } else {
        logger.error('Max reconnect attempts reached. Manual intervention required.');
        this.emitEvent(WEBHOOK_EVENTS.CONNECTION_CLOSE, {
          reason: 'max_retries_reached',
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * Handle incoming messages
   */
  async handleMessagesUpsert(messages) {
    for (const msg of messages) {
      // Skip own messages
      if (msg.key.fromMe) continue;

      const from = msg.key.remoteJid;
      const messageType = Object.keys(msg.message || {})[0];
      const body = msg.message?.conversation || 
                   msg.message?.extendedTextMessage?.text || 
                   msg.message?.imageMessage?.caption || 
                   '';

      logger.whatsapp(`Message received from ${from}: ${body.substring(0, 50)}...`);

      // Emit message received event
      this.emitEvent(WEBHOOK_EVENTS.MESSAGE_RECEIVED, {
        from,
        messageId: msg.key.id,
        messageType,
        body,
        timestamp: msg.messageTimestamp,
        message: msg,
      });
    }
  }

  /**
   * Handle message updates (delivery, read)
   */
  async handleMessagesUpdate(updates) {
    for (const update of updates) {
      const { key, update: messageUpdate } = update;

      if (messageUpdate.status === 3) {
        // Status 3 = Delivered
        logger.whatsapp(`Message ${key.id} delivered`);
        this.emitEvent(WEBHOOK_EVENTS.MESSAGE_DELIVERED, {
          messageId: key.id,
          to: key.remoteJid,
          timestamp: new Date(),
        });
      }

      if (messageUpdate.status === 4) {
        // Status 4 = Read
        logger.whatsapp(`Message ${key.id} read`);
        this.emitEvent(WEBHOOK_EVENTS.MESSAGE_READ, {
          messageId: key.id,
          to: key.remoteJid,
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * Send text message
   */
  async sendMessage(to, text) {
    try {
      if (!this.isConnected()) {
        throw new WhatsAppError('WhatsApp not connected');
      }

      const result = await this.sock.sendMessage(to, { text });
      
      logger.whatsapp(`Message sent to ${to}`);
      
      return {
        messageId: result.key.id,
        timestamp: result.messageTimestamp,
        status: 'sent',
      };
    } catch (error) {
      logger.error(`Failed to send message to ${to}:`, error);
      throw new WhatsAppError(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Send image message
   */
  async sendImage(to, imageBuffer, caption = '') {
    try {
      if (!this.isConnected()) {
        throw new WhatsAppError('WhatsApp not connected');
      }

      const result = await this.sock.sendMessage(to, {
        image: imageBuffer,
        caption,
      });

      logger.whatsapp(`Image sent to ${to}`);

      return {
        messageId: result.key.id,
        timestamp: result.messageTimestamp,
        status: 'sent',
      };
    } catch (error) {
      logger.error(`Failed to send image to ${to}:`, error);
      throw new WhatsAppError(`Failed to send image: ${error.message}`);
    }
  }

  /**
   * Send video message
   */
  async sendVideo(to, videoBuffer, caption = '') {
    try {
      if (!this.isConnected()) {
        throw new WhatsAppError('WhatsApp not connected');
      }

      const result = await this.sock.sendMessage(to, {
        video: videoBuffer,
        caption,
      });

      logger.whatsapp(`Video sent to ${to}`);

      return {
        messageId: result.key.id,
        timestamp: result.messageTimestamp,
        status: 'sent',
      };
    } catch (error) {
      logger.error(`Failed to send video to ${to}:`, error);
      throw new WhatsAppError(`Failed to send video: ${error.message}`);
    }
  }

  /**
   * Send document message
   */
  async sendDocument(to, documentBuffer, filename, mimetype) {
    try {
      if (!this.isConnected()) {
        throw new WhatsAppError('WhatsApp not connected');
      }

      const result = await this.sock.sendMessage(to, {
        document: documentBuffer,
        fileName: filename,
        mimetype,
      });

      logger.whatsapp(`Document sent to ${to}`);

      return {
        messageId: result.key.id,
        timestamp: result.messageTimestamp,
        status: 'sent',
      };
    } catch (error) {
      logger.error(`Failed to send document to ${to}:`, error);
      throw new WhatsAppError(`Failed to send document: ${error.message}`);
    }
  }

  /**
   * Check if WhatsApp is connected
   */
  isConnected() {
    return this.connectionState === WA_CONNECTION_STATE.OPEN && this.sock;
  }

  /**
   * Get current QR code
   */
  getQR() {
    return this.qr;
  }

  /**
   * Get connection state
   */
  getConnectionState() {
    return this.connectionState;
  }

  /**
   * Get socket instance
   */
  getSocket() {
    return this.sock;
  }

  /**
   * Clear session and logout
   */
  async clearSession() {
    try {
      if (fs.existsSync(config.whatsapp.sessionPath)) {
        fs.rmSync(config.whatsapp.sessionPath, { recursive: true, force: true });
        logger.info('Session cleared successfully');
      }
    } catch (error) {
      logger.error('Failed to clear session:', error);
    }
  }

  /**
   * Restart WhatsApp connection
   */
  async restart() {
    try {
      logger.info('Restarting WhatsApp connection...');

      if (this.sock?.ws?.readyState === 1) {
        await this.sock.ws.close();
      }

      this.sock = null;
      this.isInitialized = false;
      this.reconnectAttempts = 0;

      await this.initialize();

      logger.info('WhatsApp connection restarted successfully');
    } catch (error) {
      logger.error('Failed to restart WhatsApp:', error);
      throw new WhatsAppError('Failed to restart WhatsApp');
    }
  }

  /**
   * Logout from WhatsApp
   */
  async logout() {
    try {
      if (this.sock) {
        await this.sock.logout();
      }
      await this.clearSession();
      this.sock = null;
      this.qr = null;
      this.isInitialized = false;
      logger.info('Logged out successfully');
    } catch (error) {
      logger.error('Failed to logout:', error);
      throw new WhatsAppError('Failed to logout');
    }
  }

  /**
   * Register event listener
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Emit event to registered handlers
   */
  emitEvent(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          logger.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get socket info
   */
  getSocketInfo() {
    return {
      isConnected: this.isConnected(),
      connectionState: this.connectionState,
      hasQR: !!this.qr,
      reconnectAttempts: this.reconnectAttempts,
      user: this.sock?.user,
    };
  }
}

// Export singleton instance
module.exports = new WhatsAppService();