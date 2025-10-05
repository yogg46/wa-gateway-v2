const config = require('./src/config');
const { testConnection } = require('./src/config/database');
const { testRedisConnection } = require('./src/config/redis');
const logger = require('./src/utils/logger');
const { User, ApiKey } = require('./src/models');

async function testSetup() {
  console.log('🧪 Testing Phase 1 Setup...\n');

  // Test 1: Config Loading
  console.log('1️⃣ Testing Configuration...');
  console.log('   App Name:', config.app.name);
  console.log('   Environment:', config.env);
  console.log('   Port:', config.app.port);
  console.log('   ✅ Config loaded successfully\n');

  // Test 2: Database Connection
  console.log('2️⃣ Testing Database Connection...');
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('   ❌ Database connection failed');
    process.exit(1);
  }
  console.log('   ✅ Database connected\n');

  // Test 3: Redis Connection (optional)
  console.log('3️⃣ Testing Redis Connection...');
  try {
    await testRedisConnection();
    console.log('   ✅ Redis connected\n');
  } catch (error) {
    console.log('   ⚠️  Redis not available (optional)\n');
  }

  // Test 4: Models
  console.log('4️⃣ Testing Models...');
  const userCount = await User.count();
  const apiKeyCount = await ApiKey.count();
  console.log('   Users in database:', userCount);
  console.log('   API Keys in database:', apiKeyCount);
  console.log('   ✅ Models working\n');

  // Test 5: Logger
  console.log('5️⃣ Testing Logger...');
  logger.info('Test log message');
  logger.error('Test error message');
  logger.security('Test security message');
  console.log('   ✅ Logger working\n');

  console.log('🎉 All Phase 1 tests passed!\n');
  process.exit(0);
}

testSetup().catch((error) => {
  console.error('❌ Setup test failed:', error);
  process.exit(1);
});