const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const ApiKey = sequelize.define(
    'ApiKey',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Friendly name for the API key',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User who owns this API key',
      },
      permissions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of permissions (e.g., ["messages:send", "messages:read"])',
      },
      rateLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
        comment: 'Requests per hour',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastUsedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      usageCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ipWhitelist: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of allowed IP addresses',
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'api_keys',
      timestamps: true,
      indexes: [
        { fields: ['key'] },
        { fields: ['userId'] },
        { fields: ['isActive'] },
        { fields: ['expiresAt'] },
      ],
      hooks: {
        beforeCreate: (apiKey) => {
          if (!apiKey.key) {
            apiKey.key = `wa_${crypto.randomBytes(32).toString('hex')}`;
          }
        },
      },
    }
  );

  // Instance methods
  ApiKey.prototype.isExpired = function () {
    return this.expiresAt && new Date() > this.expiresAt;
  };

  ApiKey.prototype.hasPermission = function (permission) {
    return this.permissions.includes(permission) || this.permissions.includes('*');
  };

  // Associations
  ApiKey.associate = (models) => {
    ApiKey.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return ApiKey;
};