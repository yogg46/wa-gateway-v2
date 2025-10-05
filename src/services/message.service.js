const { Message, Contact } = require('../models');
const whatsappService = require('./whatsapp.service');
const logger = require('../utils/logger');
const {
  formatPhoneToJid,
  extractPhoneFromJid,
  isValidPhone,
  sanitizeString,
} = require('../utils/helpers');
const {
  MESSAGE_STATUS,
  MESSAGE_TYPES,
  WEBHOOK_EVENTS,
} = require('../utils/constants');
const { WhatsAppError, ValidationError } = require('../utils/errors');
const fs = require('fs');

class MessageService {
  constructor() {
    // Listen to WhatsApp message events
    whatsappService.on(WEBHOOK_EVENTS.MESSAGE_RECEIVED, (data) => {
      this.handleIncomingMessage(data);
    });

    whatsappService.on(WEBHOOK_EVENTS.MESSAGE_DELIVERED, (data) => {
      this.handleMessageDelivered(data);
    });

    whatsappService.on(WEBHOOK_EVENTS.MESSAGE_READ, (data) => {
      this.handleMessageRead(data);
    });
  }

  /**
   * Send text message
   */
  async sendTextMessage(to, text, userId = null) {
    try {
      // Validate phone number
      if (!isValidPhone(to)) {
        throw new ValidationError('Invalid phone number format');
      }

      // Format to JID
      const jid = formatPhoneToJid(to);

      // Sanitize message
      const sanitizedText = sanitizeString(text);

      // Send via WhatsApp
      const result = await whatsappService.sendMessage(jid, sanitizedText);

      // Save to database
      const message = await Message.create({
        messageId: result.messageId,
        from: 'bot', // Bot identifier
        to: jid,
        messageType: MESSAGE_TYPES.TEXT,
        content: sanitizedText,
        status: MESSAGE_STATUS.SENT,
        sentBy: userId,
      });

      // Update contact last message time
      await this.updateContact(to);

      logger.info(`Text message sent to ${to}`);

      return message;
    } catch (error) {
      logger.error(`Failed to send text message to ${to}:`, error);

      // Save failed message
      if (isValidPhone(to)) {
        await Message.create({
          from: 'bot',
          to: formatPhoneToJid(to),
          messageType: MESSAGE_TYPES.TEXT,
          content: text,
          status: MESSAGE_STATUS.FAILED,
          errorMessage: error.message,
          sentBy: userId,
        });
      }

      throw error;
    }
  }

  /**
   * Send image message
   */
  async sendImageMessage(to, imagePath, caption = '', userId = null) {
    try {
      if (!isValidPhone(to)) {
        throw new ValidationError('Invalid phone number format');
      }

      const jid = formatPhoneToJid(to);

      // Read image file
      if (!fs.existsSync(imagePath)) {
        throw new ValidationError('Image file not found');
      }

      const imageBuffer = fs.readFileSync(imagePath);

      // Send via WhatsApp
      const result = await whatsappService.sendImage(jid, imageBuffer, caption);

      // Save to database
      const message = await Message.create({
        messageId: result.messageId,
        from: 'bot',
        to: jid,
        messageType: MESSAGE_TYPES.IMAGE,
        content: caption,
        mediaUrl: imagePath,
        status: MESSAGE_STATUS.SENT,
        sentBy: userId,
      });

      await this.updateContact(to);

      logger.info(`Image message sent to ${to}`);

      return message;
    } catch (error) {
      logger.error(`Failed to send image to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send video message
   */
  async sendVideoMessage(to, videoPath, caption = '', userId = null) {
    try {
      if (!isValidPhone(to)) {
        throw new ValidationError('Invalid phone number format');
      }

      const jid = formatPhoneToJid(to);

      if (!fs.existsSync(videoPath)) {
        throw new ValidationError('Video file not found');
      }

      const videoBuffer = fs.readFileSync(videoPath);

      // Send via WhatsApp
      const result = await whatsappService.sendVideo(jid, videoBuffer, caption);

      // Save to database
      const message = await Message.create({
        messageId: result.messageId,
        from: 'bot',
        to: jid,
        messageType: MESSAGE_TYPES.VIDEO,
        content: caption,
        mediaUrl: videoPath,
        status: MESSAGE_STATUS.SENT,
        sentBy: userId,
      });

      await this.updateContact(to);

      logger.info(`Video message sent to ${to}`);

      return message;
    } catch (error) {
      logger.error(`Failed to send video to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send document message
   */
  async sendDocumentMessage(to, documentPath, filename, mimetype, userId = null) {
    try {
      if (!isValidPhone(to)) {
        throw new ValidationError('Invalid phone number format');
      }

      const jid = formatPhoneToJid(to);

      if (!fs.existsSync(documentPath)) {
        throw new ValidationError('Document file not found');
      }

      const documentBuffer = fs.readFileSync(documentPath);

      // Send via WhatsApp
      const result = await whatsappService.sendDocument(jid, documentBuffer, filename, mimetype);

      // Save to database
      const message = await Message.create({
        messageId: result.messageId,
        from: 'bot',
        to: jid,
        messageType: MESSAGE_TYPES.DOCUMENT,
        content: filename,
        mediaUrl: documentPath,
        status: MESSAGE_STATUS.SENT,
        sentBy: userId,
        metadata: { filename, mimetype },
      });

      await this.updateContact(to);

      logger.info(`Document sent to ${to}`);

      return message;
    } catch (error) {
      logger.error(`Failed to send document to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  async handleIncomingMessage(data) {
    try {
      const { from, messageId, messageType, body, timestamp } = data;

      // Check if message already exists
      const existing = await Message.findOne({ where: { messageId } });
      if (existing) return;

      // Save to database
      await Message.create({
        messageId,
        from,
        to: 'bot',
        messageType,
        content: body,
        status: MESSAGE_STATUS.DELIVERED,
      });

      // Update contact
      const phone = extractPhoneFromJid(from);
      await this.updateContact(phone);

      logger.info(`Incoming message saved from ${from}`);
    } catch (error) {
      logger.error('Failed to handle incoming message:', error);
    }
  }

  /**
   * Handle message delivered
   */
  async handleMessageDelivered(data) {
    try {
      const { messageId } = data;

      await Message.update(
        { status: MESSAGE_STATUS.DELIVERED },
        { where: { messageId } }
      );

      logger.info(`Message ${messageId} delivered`);
    } catch (error) {
      logger.error('Failed to handle message delivered:', error);
    }
  }

  /**
   * Handle message read
   */
  async handleMessageRead(data) {
    try {
      const { messageId } = data;

      await Message.update(
        { status: MESSAGE_STATUS.READ },
        { where: { messageId } }
      );

      logger.info(`Message ${messageId} read`);
    } catch (error) {
      logger.error('Failed to handle message read:', error);
    }
  }

  /**
   * Update or create contact
   */
  async updateContact(phoneNumber) {
    try {
      const [contact] = await Contact.findOrCreate({
        where: { phoneNumber },
        defaults: {
          phoneNumber,
          lastMessageAt: new Date(),
        },
      });

      if (contact) {
        await contact.update({ lastMessageAt: new Date() });
      }
    } catch (error) {
      logger.error('Failed to update contact:', error);
    }
  }

  /**
   * Get message history
   */
  async getMessageHistory(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 50 } = pagination;
      const offset = (page - 1) * limit;

      const where = {};

      if (filters.from) {
        where.from = formatPhoneToJid(filters.from);
      }

      if (filters.to) {
        where.to = formatPhoneToJid(filters.to);
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.messageType) {
        where.messageType = filters.messageType;
      }

      const { count, rows } = await Message.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return {
        messages: rows,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('Failed to get message history:', error);
      throw error;
    }
  }

  /**
   * Get message by ID
   */
  async getMessageById(id) {
    try {
      const message = await Message.findByPk(id);
      return message;
    } catch (error) {
      logger.error('Failed to get message:', error);
      throw error;
    }
  }

  /**
   * Get message statistics
   */
  async getMessageStats(filters = {}) {
    try {
      const where = {};

      if (filters.startDate) {
        where.createdAt = {
          [require('sequelize').Op.gte]: new Date(filters.startDate),
        };
      }

      if (filters.endDate) {
        if (where.createdAt) {
          where.createdAt[require('sequelize').Op.lte] = new Date(filters.endDate);
        } else {
          where.createdAt = {
            [require('sequelize').Op.lte]: new Date(filters.endDate),
          };
        }
      }

      const total = await Message.count({ where });
      const sent = await Message.count({ where: { ...where, status: MESSAGE_STATUS.SENT } });
      const delivered = await Message.count({ where: { ...where, status: MESSAGE_STATUS.DELIVERED } });
      const read = await Message.count({ where: { ...where, status: MESSAGE_STATUS.READ } });
      const failed = await Message.count({ where: { ...where, status: MESSAGE_STATUS.FAILED } });

      const successRate = total > 0 ? ((sent / total) * 100).toFixed(2) : 0;
      const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(2) : 0;
      const readRate = total > 0 ? ((read / total) * 100).toFixed(2) : 0;

      return {
        total,
        sent,
        delivered,
        read,
        failed,
        successRate: `${successRate}%`,
        deliveryRate: `${deliveryRate}%`,
        readRate: `${readRate}%`,
      };
    } catch (error) {
      logger.error('Failed to get message stats:', error);
      throw error;
    }
  }

  /**
   * Delete old messages
   */
  async cleanupOldMessages(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deleted = await Message.destroy({
        where: {
          createdAt: {
            [require('sequelize').Op.lt]: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${deleted} old messages`);
      return deleted;
    } catch (error) {
      logger.error('Failed to cleanup old messages:', error);
      throw error;
    }
  }

  /**
   * Search messages
   */
  async searchMessages(query, limit = 50) {
    try {
      const messages = await Message.findAll({
        where: {
          content: {
            [require('sequelize').Op.like]: `%${query}%`,
          },
        },
        limit,
        order: [['createdAt', 'DESC']],
      });

      return messages;
    } catch (error) {
      logger.error('Failed to search messages:', error);
      throw error;
    }
  }

  /**
   * Get contacts with message count
   */
  async getContactsWithMessageCount(limit = 50) {
    try {
      const contacts = await Contact.findAll({
        limit,
        order: [['lastMessageAt', 'DESC']],
      });

      const contactsWithCount = await Promise.all(
        contacts.map(async (contact) => {
          const jid = formatPhoneToJid(contact.phoneNumber);
          const messageCount = await Message.count({
            where: {
              [require('sequelize').Op.or]: [
                { from: jid },
                { to: jid },
              ],
            },
          });

          return {
            ...contact.toJSON(),
            messageCount,
          };
        })
      );

      return contactsWithCount;
    } catch (error) {
      logger.error('Failed to get contacts with message count:', error);
      throw error;
    }
  }
}

module.exports = new MessageService();