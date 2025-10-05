const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Webhook = sequelize.define(
    'Webhook',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
          isUrl: true,
        },
      },
      secretKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Secret key for HMAC signature',
      },
      events: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of subscribed events',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      retryAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      timeout: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10000,
        comment: 'Timeout in milliseconds',
      },
      lastTriggeredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastStatus: {
        type: DataTypes.ENUM('success', 'failed', 'pending'),
        allowNull: true,
      },
      lastError: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      successCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      failureCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'webhooks',
      timestamps: true,
      indexes: [
        { fields: ['url'] },
        { fields: ['isActive'] },
        { fields: ['lastTriggeredAt'] },
      ],
    }
  );

  return Webhook;
};