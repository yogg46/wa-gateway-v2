const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Contact = sequelize.define(
    'Contact',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      phoneNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[0-9]+$/,
        },
        comment: 'Phone number without @s.whatsapp.net',
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of tags for categorization',
      },
      isBlocked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional contact information',
      },
    },
    {
      tableName: 'contacts',
      timestamps: true,
      indexes: [
        { fields: ['phoneNumber'] },
        { fields: ['name'] },
        { fields: ['isBlocked'] },
      ],
    }
  );

  return Contact;
};