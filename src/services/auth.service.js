const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, ApiKey, AuditLog } = require('../models');
const config = require('../config');
const logger = require('../utils/logger');
const { generateApiKey } = require('../utils/helpers');
const {
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  ValidationError,
} = require('../utils/errors');
const { AUDIT_ACTIONS } = require('../utils/constants');

class AuthService {
  /**
   * Login user with username/email and password
   */
  async login(usernameOrEmail, password, ipAddress, userAgent) {
    try {
      // Find user by username or email
      const user = await User.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { username: usernameOrEmail },
            { email: usernameOrEmail },
          ],
        },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedError('Account is disabled');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Update user
      await user.update({
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        refreshToken,
      });

      // Log audit
      await this.createAuditLog({
        userId: user.id,
        action: AUDIT_ACTIONS.LOGIN,
        ipAddress,
        userAgent,
        details: { username: user.username },
        status: 'success',
      });

      logger.info(`User logged in: ${user.username}`);

      return {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

      // Find user
      const user = await User.findByPk(decoded.id);

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Check if refresh token matches
      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Update user
      await user.update({ refreshToken: newRefreshToken });

      logger.info(`Token refreshed for user: ${user.username}`);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId, ipAddress, userAgent) {
    try {
      const user = await User.findByPk(userId);

      if (user) {
        await user.update({ refreshToken: null });

        await this.createAuditLog({
          userId: user.id,
          action: AUDIT_ACTIONS.LOGOUT,
          ipAddress,
          userAgent,
          status: 'success',
        });

        logger.info(`User logged out: ${user.username}`);
      }
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  /**
   * Verify JWT access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  /**
   * Verify API key
   */
  async verifyApiKey(key) {
    try {
      const apiKey = await ApiKey.findOne({
        where: { key, isActive: true },
        include: [{ model: User, as: 'user' }],
      });

      if (!apiKey) {
        throw new UnauthorizedError('Invalid API key');
      }

      // Check expiration
      if (apiKey.isExpired()) {
        throw new UnauthorizedError('API key expired');
      }

      // Update last used
      await apiKey.update({
        lastUsedAt: new Date(),
        usageCount: apiKey.usageCount + 1,
      });

      return apiKey;
    } catch (error) {
      logger.error('API key verification failed:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    try {
      // Check if username exists
      const existingUser = await User.findOne({
        where: { username: userData.username },
      });

      if (existingUser) {
        throw new ConflictError('Username already exists');
      }

      // Check if email exists
      const existingEmail = await User.findOne({
        where: { email: userData.email },
      });

      if (existingEmail) {
        throw new ConflictError('Email already exists');
      }

      // Create user
      const user = await User.create(userData);

      logger.info(`User created: ${user.username}`);

      return user.toJSON();
    } catch (error) {
      logger.error('User creation failed:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, userData) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check username uniqueness if changed
      if (userData.username && userData.username !== user.username) {
        const existing = await User.findOne({
          where: { username: userData.username },
        });
        if (existing) {
          throw new ConflictError('Username already exists');
        }
      }

      // Check email uniqueness if changed
      if (userData.email && userData.email !== user.email) {
        const existing = await User.findOne({
          where: { email: userData.email },
        });
        if (existing) {
          throw new ConflictError('Email already exists');
        }
      }

      await user.update(userData);

      logger.info(`User updated: ${user.username}`);

      return user.toJSON();
    } catch (error) {
      logger.error('User update failed:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      await user.destroy();

      logger.info(`User deleted: ${user.username}`);
    } catch (error) {
      logger.error('User deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user.toJSON();
  }

  /**
   * Create API key for user
   */
  async createApiKey(userId, name, permissions = [], rateLimit = 100) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const apiKey = await ApiKey.create({
        name,
        userId,
        permissions,
        rateLimit,
        key: generateApiKey('wa'),
      });

      logger.info(`API key created: ${name} for user ${user.username}`);

      return apiKey;
    } catch (error) {
      logger.error('API key creation failed:', error);
      throw error;
    }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(keyId) {
    try {
      const apiKey = await ApiKey.findByPk(keyId);

      if (!apiKey) {
        throw new NotFoundError('API key not found');
      }

      await apiKey.update({ isActive: false });

      logger.info(`API key revoked: ${apiKey.name}`);
    } catch (error) {
      logger.error('API key revocation failed:', error);
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(data) {
    try {
      await AuditLog.create(data);
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify old password
      const isValid = await user.comparePassword(oldPassword);
      if (!isValid) {
        throw new UnauthorizedError('Invalid old password');
      }

      // Update password
      await user.update({ password: newPassword });

      logger.info(`Password changed for user: ${user.username}`);
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();