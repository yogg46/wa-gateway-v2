const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50],
          isAlphanumeric: true,
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'operator', 'user'),
        allowNull: false,
        defaultValue: 'user',
      },
      fullName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      apiKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastLoginIp: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      indexes: [
        { fields: ['username'] },
        { fields: ['email'] },
        { fields: ['apiKey'] },
      ],
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    }
  );

  // Instance methods
  User.prototype.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    delete values.refreshToken;
    return values;
  };

  // Associations
  User.associate = (models) => {
    User.hasMany(models.Message, {
      foreignKey: 'sentBy',
      as: 'messages',
    });
    User.hasMany(models.Broadcast, {
      foreignKey: 'createdBy',
      as: 'broadcasts',
    });
    User.hasMany(models.AuditLog, {
      foreignKey: 'userId',
      as: 'auditLogs',
    });
    User.hasMany(models.ApiKey, {
      foreignKey: 'userId',
      as: 'apiKeys',
    });
  };

  return User;
};