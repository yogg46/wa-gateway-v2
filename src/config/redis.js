const Redis = require('ioredis');
const config = require('./index');

// Create Redis client
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  db: config.redis.db,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

// Event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully.');
});

redis.on('ready', () => {
  console.log('✅ Redis is ready to accept commands.');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

redis.on('close', () => {
  console.log('⚠️ Redis connection closed.');
});

redis.on('reconnecting', () => {
  console.log('🔄 Reconnecting to Redis...');
});

// Test Redis connection
const testRedisConnection = async () => {
  try {
    await redis.ping();
    console.log('✅ Redis connection test successful.');
    return true;
  } catch (error) {
    console.error('❌ Redis connection test failed:', error.message);
    return false;
  }
};

// Close Redis connection
const closeRedisConnection = async () => {
  try {
    await redis.quit();
    console.log('✅ Redis connection closed.');
  } catch (error) {
    console.error('❌ Error closing Redis:', error.message);
  }
};

module.exports = {
  redis,
  testRedisConnection,
  closeRedisConnection,
};