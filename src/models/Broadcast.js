const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Broadcast = sequelize.define(
    'Broadcast',
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
      messageContent: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      messageType: {
        type: DataTypes.ENUM('text', 'image', 'video', 'document'),
        allowNull: false,
        defaultValue: 'text',
      },
      mediaUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      recipients: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of phone numbers',
      },
      status: {
        type: DataTypes.ENUM(
          'draft',
          'scheduled',
          'running',
          'completed',
          'failed',
          'cancelled'
        ),
        allowNull: false,
        defaultValue: 'draft',
      },
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      totalRecipients: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sentCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      deliveredCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      failedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'broadcasts',
      timestamps: true,
      indexes: [
        { fields: ['status'] },
        { fields: ['createdBy'] },
        { fields: ['scheduledAt'] },
        { fields: ['createdAt'] },
      ],
    }
  );

  // Associations
  Broadcast.associate = (models) => {
    Broadcast.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
    });
    Broadcast.hasMany(models.Message, {
      foreignKey: 'broadcastId',
      as: 'messages',
    });
  };

  return Broadcast;
};