const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define(
    'Message',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      messageId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'WhatsApp message ID',
      },
      from: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Sender JID (e.g., 628123456789@s.whatsapp.net)',
      },
      to: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Recipient JID',
      },
      messageType: {
        type: DataTypes.ENUM(
          'text',
          'image',
          'video',
          'audio',
          'document',
          'location',
          'contact',
          'sticker'
        ),
        allowNull: false,
        defaultValue: 'text',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Message text content',
      },
      mediaUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL or path to media file',
      },
      caption: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Media caption',
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'sent',
          'delivered',
          'read',
          'failed'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sentBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User ID who sent the message',
      },
      broadcastId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Broadcast campaign ID (if part of broadcast)',
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional metadata',
      },
    },
    {
      tableName: 'messages',
      timestamps: true,
      indexes: [
        { fields: ['messageId'] },
        { fields: ['from'] },
        { fields: ['to'] },
        { fields: ['status'] },
        { fields: ['createdAt'] },
        { fields: ['broadcastId'] },
      ],
    }
  );

  // Associations
  Message.associate = (models) => {
    Message.belongsTo(models.User, {
      foreignKey: 'sentBy',
      as: 'sender',
    });
    Message.belongsTo(models.Broadcast, {
      foreignKey: 'broadcastId',
      as: 'broadcast',
    });
  };

  return Message;
};