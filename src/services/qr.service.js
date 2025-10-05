const qrcode = require('qrcode');
const { QrHistory } = require('../models');
const whatsappService = require('./whatsapp.service');
const logger = require('../utils/logger');
const { QR_STATUS, WEBHOOK_EVENTS } = require('../utils/constants');
const config = require('../config');

class QRService {
  constructor() {
    this.currentQR = null;
    this.qrGeneratedAt = null;
    this.qrTimeout = null;

    // Listen to WhatsApp QR events
    whatsappService.on('qr', (qr) => {
      this.handleQRGenerated(qr);
    });

    // Listen to connection open (QR scanned)
    whatsappService.on(WEBHOOK_EVENTS.CONNECTION_OPEN, () => {
      this.handleQRScanned();
    });
  }

  /**
   * Handle QR code generated
   */
  async handleQRGenerated(qr) {
    try {
      // Generate base64 QR code
      const qrBase64 = await qrcode.toDataURL(qr);

      this.currentQR = qrBase64;
      this.qrGeneratedAt = new Date();

      // Save to database
      await QrHistory.create({
        qrData: qrBase64,
        status: QR_STATUS.PENDING,
        generatedAt: this.qrGeneratedAt,
        expiredAt: new Date(Date.now() + config.whatsapp.qrTimeout),
      });

      logger.info('QR code generated and saved');

      // Set timeout to expire QR
      if (this.qrTimeout) {
        clearTimeout(this.qrTimeout);
      }

      this.qrTimeout = setTimeout(() => {
        this.handleQRExpired();
      }, config.whatsapp.qrTimeout);

    } catch (error) {
      logger.error('Failed to handle QR generation:', error);
    }
  }

  /**
   * Handle QR code scanned
   */
  async handleQRScanned() {
    try {
      if (this.currentQR) {
        // Update latest QR history
        const latestQR = await QrHistory.findOne({
          where: { status: QR_STATUS.PENDING },
          order: [['generatedAt', 'DESC']],
        });

        if (latestQR) {
          await latestQR.update({
            status: QR_STATUS.SCANNED,
            scannedAt: new Date(),
          });
        }

        this.currentQR = null;
        this.qrGeneratedAt = null;

        if (this.qrTimeout) {
          clearTimeout(this.qrTimeout);
          this.qrTimeout = null;
        }

        logger.info('QR code scanned successfully');
      }
    } catch (error) {
      logger.error('Failed to handle QR scanned:', error);
    }
  }

  /**
   * Handle QR code expired
   */
  async handleQRExpired() {
    try {
      if (this.currentQR) {
        // Update latest QR history
        const latestQR = await QrHistory.findOne({
          where: { status: QR_STATUS.PENDING },
          order: [['generatedAt', 'DESC']],
        });

        if (latestQR) {
          await latestQR.update({
            status: QR_STATUS.EXPIRED,
          });
        }

        this.currentQR = null;
        this.qrGeneratedAt = null;

        logger.warn('QR code expired');
      }
    } catch (error) {
      logger.error('Failed to handle QR expiration:', error);
    }
  }

  /**
   * Get current QR code
   */
  getCurrentQR() {
    if (!this.currentQR) {
      return null;
    }

    // Check if expired
    const now = new Date();
    const elapsed = now - this.qrGeneratedAt;

    if (elapsed > config.whatsapp.qrTimeout) {
      this.handleQRExpired();
      return null;
    }

    return {
      qr: this.currentQR,
      generatedAt: this.qrGeneratedAt,
      expiresIn: config.whatsapp.qrTimeout - elapsed,
    };
  }

  /**
   * Force generate new QR (restart connection)
   */
  async refreshQR() {
    try {
      logger.info('Refreshing QR code...');
      await whatsappService.restart();
      
      // Wait for QR to be generated
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('QR generation timeout'));
        }, 30000); // 30 seconds timeout

        const checkQR = setInterval(() => {
          const qr = this.getCurrentQR();
          if (qr) {
            clearInterval(checkQR);
            clearTimeout(timeout);
            resolve(qr);
          }
        }, 1000);
      });
    } catch (error) {
      logger.error('Failed to refresh QR:', error);
      throw error;
    }
  }

  /**
   * Get QR history
   */
  async getQRHistory(limit = 10) {
    try {
      const history = await QrHistory.findAll({
        limit,
        order: [['generatedAt', 'DESC']],
        attributes: ['id', 'status', 'generatedAt', 'scannedAt', 'expiredAt'],
      });

      return history;
    } catch (error) {
      logger.error('Failed to get QR history:', error);
      throw error;
    }
  }

  /**
   * Clean up old QR history
   */
  async cleanupHistory(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deleted = await QrHistory.destroy({
        where: {
          generatedAt: {
            [require('sequelize').Op.lt]: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${deleted} old QR history records`);
      return deleted;
    } catch (error) {
      logger.error('Failed to cleanup QR history:', error);
      throw error;
    }
  }

  /**
   * Get QR statistics
   */
  async getQRStats() {
    try {
      const total = await QrHistory.count();
      const scanned = await QrHistory.count({ where: { status: QR_STATUS.SCANNED } });
      const expired = await QrHistory.count({ where: { status: QR_STATUS.EXPIRED } });
      const pending = await QrHistory.count({ where: { status: QR_STATUS.PENDING } });

      const scanRate = total > 0 ? ((scanned / total) * 100).toFixed(2) : 0;

      return {
        total,
        scanned,
        expired,
        pending,
        scanRate: `${scanRate}%`,
      };
    } catch (error) {
      logger.error('Failed to get QR stats:', error);
      throw error;
    }
  }
}

module.exports = new QRService();