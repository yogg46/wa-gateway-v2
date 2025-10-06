const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateBody } = require('../middlewares/validate.middleware');
const { verifyToken, authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/rbac.middleware');
const { loginLimiter } = require('../middlewares/rateLimit.middleware');
const {
  loginSchema,
  refreshTokenSchema,
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  createApiKeySchema,
} = require('../validators/auth.validator');

// Public routes
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refreshToken);

// Protected routes (require authentication)
router.use(verifyToken); // All routes below require JWT token

router.post('/logout', authController.logout);
router.get('/me', authController.getProfile);
router.post('/change-password', validateBody(changePasswordSchema), authController.changePassword);

// API Key management (user's own keys)
router.get('/api-keys', authController.getApiKeys);
router.post('/api-keys', validateBody(createApiKeySchema), authController.createApiKey);
router.delete('/api-keys/:id', authController.revokeApiKey);

// User management (admin only)
router.get('/users', requireAdmin, authController.getUsers);
router.get('/users/:id', requireAdmin, authController.getUserById);
router.post('/users', requireAdmin, validateBody(createUserSchema), authController.createUser);
router.put('/users/:id', requireAdmin, validateBody(updateUserSchema), authController.updateUser);
router.delete('/users/:id', requireAdmin, authController.deleteUser);

module.exports = router;