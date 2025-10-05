const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QrHistory = sequelize.define(
    'QrHistory',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      qrData: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Base64 encoded QR code data URL',
      },
      status: {
        type: DataTypes.ENUM('pending', 'scanned', 'expired', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      generatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      scannedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'qr_history',
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ['status'] },
        { fields: ['generatedAt'] },
        { fields: ['scannedAt'] },
      ],
    }
  );

  // Instance methods
  QrHistory.prototype.isExpired = function () {
    return this.expiredAt && new Date() > this.expiredAt;
  };

  return QrHistory;
};