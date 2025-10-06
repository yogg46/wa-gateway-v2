const whatsappService = require('../services/whatsapp.service');
const { sendSuccess } = require('../utils/response');

/**
 * Get WhatsApp connection status
 * GET /api/whatsapp/status
 */
const getStatus = async (req, res, next) => {
  try {
    const socketInfo = whatsappService.getSocketInfo();

    sendSuccess(res, socketInfo, 'Status retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Initialize WhatsApp connection
 * POST /api/whatsapp/init
 */
const initialize = async (req, res, next) => {
  try {
    await whatsappService.initialize();

    sendSuccess(res, null, 'WhatsApp initialized successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Restart WhatsApp connection
 * POST /api/whatsapp/restart
 */
const restart = async (req, res, next) => {
  try {
    await whatsappService.restart();

    sendSuccess(res, null, 'WhatsApp restarted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout from WhatsApp
 * POST /api/whatsapp/logout
 */
const logout = async (req, res, next) => {
  try {
    await whatsappService.logout();

    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get WhatsApp user info
 * GET /api/whatsapp/me
 */
const getMe = async (req, res, next) => {
  try {
    const sock = whatsappService.getSocket();

    if (!sock || !sock.user) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp not connected',
      });
    }

    sendSuccess(res, sock.user, 'User info retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get WhatsApp chats
 * GET /api/whatsapp/chats
 */
const getChats = async (req, res, next) => {
  try {
    const sock = whatsappService.getSocket();

    if (!sock) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp not connected',
      });
    }

    // Get chats from store (if available)
    const chats = [];

    sendSuccess(res, chats, 'Chats retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Check if number is registered on WhatsApp
 * GET /api/whatsapp/check/:number
 */
const checkNumber = async (req, res, next) => {
  try {
    const { number } = req.params;
    const sock = whatsappService.getSocket();

    if (!sock) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp not connected',
      });
    }

    const { formatPhoneToJid } = require('../utils/helpers');
    const jid = formatPhoneToJid(number);

    try {
      const [result] = await sock.onWhatsApp(jid);

      sendSuccess(
        res,
        {
          number,
          exists: !!result,
          jid: result?.jid,
        },
        'Number checked successfully'
      );
    } catch (error) {
      sendSuccess(
        res,
        {
          number,
          exists: false,
        },
        'Number not registered on WhatsApp'
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get presence/online status of a number
 * GET /api/whatsapp/presence/:number
 */
const getPresence = async (req, res, next) => {
  try {
    const { number } = req.params;
    const sock = whatsappService.getSocket();

    if (!sock) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp not connected',
      });
    }

    const { formatPhoneToJid } = require('../utils/helpers');
    const jid = formatPhoneToJid(number);

    await sock.presenceSubscribe(jid);

    sendSuccess(
      res,
      { subscribed: true },
      'Presence subscription successful'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatus,
  initialize,
  restart,
  logout,
  getMe,
  getChats,
  checkNumber,
  getPresence,
};