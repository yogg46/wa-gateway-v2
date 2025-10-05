const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Message = require('./Message');
const Contact = require('./Contact');
const Broadcast = require('./Broadcast');
const Webhook = require('./Webhook');
const ApiKey = require('./ApiKey');
const AuditLog = require('./AuditLog');
const QrHistory = require('./QrHistory');

// Initialize models
const models = {
  User: User(sequelize),
  Message: Message(sequelize),
  Contact: Contact(sequelize),
  Broadcast: Broadcast(sequelize),
  Webhook: Webhook(sequelize),
  ApiKey: ApiKey(sequelize),
  AuditLog: AuditLog(sequelize),
  QrHistory: QrHistory(sequelize),
};

// Define associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  ...models,
};