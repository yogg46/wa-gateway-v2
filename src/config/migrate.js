const { sequelize } = require('./database');
const logger = require('../utils/logger');
const models = require('../models');

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Sync all models (create tables)
    await sequelize.sync({ alter: true });
    console.log('✅ All models synchronized successfully.');

    // Display created tables
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📊 Created tables:', tables);

    logger.info('Database migration completed successfully');
    console.log('\n🎉 Migration completed successfully!\n');

    process.exit(0);
  } catch (error) {
    logger.error('Database migration failed:', error);
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrate();