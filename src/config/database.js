const { Sequelize } = require('sequelize');
const config = require('./index');

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging ? console.log : false,
    pool: config.database.pool,
    timezone: '+07:00', // Adjust to your timezone
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false,
    },
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    return false;
  }
};

// Sync database (create tables if not exist)
const syncDatabase = async (options = {}) => {
  try {
    const defaultOptions = {
      force: false, // Drop tables and recreate (use with caution!)
      alter: config.isDevelopment, // Alter tables in development
      ...options,
    };

    await sequelize.sync(defaultOptions);
    console.log('✅ Database synchronized successfully.');
    return true;
  } catch (error) {
    console.error('❌ Database sync error:', error.message);
    return false;
  }
};

// Close database connection
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
  } catch (error) {
    console.error('❌ Error closing database:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeConnection,
};