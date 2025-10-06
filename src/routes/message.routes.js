const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const messageController = require('../controllers/message.controller');
const { validateBody, validateQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/rbac.middleware');
const { messageLimiter } = require('../middlewares/rateLimit.middleware');
const { PERMISSIONS } = require('../utils/constants');
const {
  sendTextMessageSchema,
  sendImageMessageSchema,
  sendVideoMessageSchema,
  sendDocumentMessageSchema,
  getMessageHistorySchema,
  searchMessagesSchema,
} = require('../validators/message.validator');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// Send messages (require permission)
router.post(
  '/send-text',
  requirePermission(PERMISSIONS.MESSAGES_SEND),
  messageLimiter,
  validateBody(sendTextMessageSchema),
  messageController.sendTextMessage
);

router.post(
  '/send-text-async',
  requirePermission(PERMISSIONS.MESSAGES_SEND),
  messageLimiter,
  validateBody(sendTextMessageSchema),
  messageController.sendTextMessageAsync
);

router.post(
  '/send-image',
  requirePermission(PERMISSIONS.MESSAGES_SEND),
  messageLimiter,
  upload.single('image'),
  validateBody(sendImageMessageSchema),
  messageController.sendImageMessage
);

router.post(
  '/send-video',
  requirePermission(PERMISSIONS.MESSAGES_SEND),
  messageLimiter,
  upload.single('video'),
  validateBody(sendVideoMessageSchema),
  messageController.sendVideoMessage
);

router.post(
  '/send-document',
  requirePermission(PERMISSIONS.MESSAGES_SEND),
  messageLimiter,
  upload.single('document'),
  validateBody(sendDocumentMessageSchema),
  messageController.sendDocumentMessage
);

// Get messages (require read permission)
router.get(
  '/',
  requirePermission(PERMISSIONS.MESSAGES_READ),
  validateQuery(getMessageHistorySchema),
  messageController.getMessageHistory
);

router.get(
  '/stats',
  requirePermission(PERMISSIONS.MESSAGES_READ),
  messageController.getMessageStats
);

router.get(
  '/search',
  requirePermission(PERMISSIONS.MESSAGES_READ),
  validateQuery(searchMessagesSchema),
  messageController.searchMessages
);

router.get(
  '/contacts',
  requirePermission(PERMISSIONS.MESSAGES_READ),
  messageController.getContactsWithMessageCount
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.MESSAGES_READ),
  messageController.getMessageById
);

module.exports = router;