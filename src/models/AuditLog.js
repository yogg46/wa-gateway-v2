const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User who performed the action (null for system actions)',
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Action performed (e.g., login, send_message, delete_user)',
      },
      resourceType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Type of resource affected (e.g., message, user, broadcast)',
      },
      resourceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the affected resource',
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      details: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional details about the action',
      },
      status: {
        type: DataTypes.ENUM('success', 'failed', 'pending'),
        allowNull: false,
        defaultValue: 'success',
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'audit_logs',
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ['userId'] },
        { fields: ['action'] },
        { fields: ['resourceType'] },
        { fields: ['createdAt'] },
        { fields: ['status'] },
      ],
    }
  );

  // Associations
  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return AuditLog;
};