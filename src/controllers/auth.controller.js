const authService = require('../services/auth.service');
const {
  sendSuccess,
  sendCreated,
  sendNotFound,
} = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    const result = await authService.login(
      usernameOrEmail,
      password,
      ipAddress,
      userAgent
    );

    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshToken(refreshToken);

    sendSuccess(res, tokens, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    await authService.logout(userId, ipAddress, userAgent);

    sendSuccess(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await authService.getUserById(userId);

    sendSuccess(res, user, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    await authService.changePassword(userId, oldPassword, newPassword);

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (admin only)
 * GET /api/auth/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { User } = require('../models');
    
    const users = await User.findAll({
      attributes: { exclude: ['password', 'refreshToken'] },
      order: [['createdAt', 'DESC']],
    });

    sendSuccess(res, users, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (admin only)
 * GET /api/auth/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await authService.getUserById(userId);

    sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user (admin only)
 * POST /api/auth/users
 */
const createUser = async (req, res, next) => {
  try {
    const userData = req.body;

    const user = await authService.createUser(userData);

    sendCreated(res, user, 'User created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update user (admin only)
 * PUT /api/auth/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const userData = req.body;

    const user = await authService.updateUser(userId, userData);

    sendSuccess(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (admin only)
 * DELETE /api/auth/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    await authService.deleteUser(userId);

    sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create API key
 * POST /api/auth/api-keys
 */
const createApiKey = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, permissions, rateLimit } = req.body;

    const apiKey = await authService.createApiKey(
      userId,
      name,
      permissions,
      rateLimit
    );

    sendCreated(res, apiKey, 'API key created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's API keys
 * GET /api/auth/api-keys
 */
const getApiKeys = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { ApiKey } = require('../models');

    const apiKeys = await ApiKey.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    sendSuccess(res, apiKeys, 'API keys retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke API key
 * DELETE /api/auth/api-keys/:id
 */
const revokeApiKey = async (req, res, next) => {
  try {
    const keyId = req.params.id;

    await authService.revokeApiKey(keyId);

    sendSuccess(res, null, 'API key revoked successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getProfile,
  changePassword,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  createApiKey,
  getApiKeys,
  revokeApiKey,
};