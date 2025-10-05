const { User, ApiKey, Webhook } = require('../models');
const logger = require('../utils/logger');
const crypto = require('crypto');

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create default admin user
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    
    if (!adminExists) {
      const admin = await User.create({
        username: 'admin',
        email: 'admin@wagate.local',
        password: 'Th3Glo0myGloryEnds!',
        role: 'admin',
        fullName: 'System Administrator',
        isActive: true,
      });
      console.log('✅ Admin user created:', admin.username);
      logger.info('Admin user created', { userId: admin.id });
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create default operator user
    const operatorExists = await User.findOne({ where: { username: 'operator' } });
    
    if (!operatorExists) {
      const operator = await User.create({
        username: 'operator',
        email: 'operator@wagate.local',
        password: 'Operator123!',
        role: 'operator',
        fullName: 'Default Operator',
        isActive: true,
      });
      console.log('✅ Operator user created:', operator.username);
      logger.info('Operator user created', { userId: operator.id });
    } else {
      console.log('ℹ️  Operator user already exists');
    }

    // Create default API keys
    const apiKeyExists = await ApiKey.findOne({ where: { name: 'Default Admin Key' } });
    
    if (!apiKeyExists) {
      const adminUser = await User.findOne({ where: { username: 'admin' } });
      
      const adminApiKey = await ApiKey.create({
        name: 'Default Admin Key',
        userId: adminUser.id,
        permissions: ['*'], // All permissions
        rateLimit: 1000,
        isActive: true,
      });
      console.log('✅ Admin API Key created:', adminApiKey.key);
      logger.info('Admin API Key created', { keyId: adminApiKey.id });
    } else {
      console.log('ℹ️  Admin API Key already exists');
    }

    // Create default webhook (optional - for Laravel integration)
    const webhookExists = await Webhook.findOne({ where: { name: 'Laravel Webhook' } });
    
    if (!webhookExists && process.env.WEBHOOK_URL) {
      const webhook = await Webhook.create({
        name: 'Laravel Webhook',
        url: process.env.WEBHOOK_URL,
        secretKey: process.env.WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex'),
        events: ['message.received', 'message.sent'],
        isActive: true,
        retryAttempts: 3,
        timeout: 10000,
      });
      console.log('✅ Default webhook created:', webhook.name);
      logger.info('Default webhook created', { webhookId: webhook.id });
    } else {
      console.log('ℹ️  Webhook already exists or WEBHOOK_URL not configured');
    }

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📝 Default Credentials:');
    console.log('   Admin:');
    console.log('   - Username: admin');
    console.log('   - Password: Th3Glo0myGloryEnds!');
    console.log('');
    console.log('   Operator:');
    console.log('   - Username: operator');
    console.log('   - Password: Operator123!');
    console.log('');
    console.log('⚠️  IMPORTANT: Change these passwords in production!\n');

    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run seeder
seed();