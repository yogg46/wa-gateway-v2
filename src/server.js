const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { testConnection, syncDatabase } = require('./config/database');
const { testRedisConnection } = require('./config/redis');
const whatsappService = require('./services/whatsapp.service');
const queueService = require('./services/queue.service');
const fs = require('fs');
const path = require('path');

// ============================================
// GRACEFUL SHUTDOWN HANDLER
// ============================================
let server;

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  try {
    // Close WhatsApp connection
    if (whatsappService.isConnected()) {
      logger.info('Closing WhatsApp connection...');
      // Don't logout, just close connection to allow reconnect
      const sock = whatsappService.getSocket();
      if (sock?.ws?.readyState === 1) {
        await sock.ws.close();
      }
    }

    // Close queue connections
    logger.info('Closing queue connections...');
    await queueService.closeAll();

    // Close database connection
    const { closeConnection } = require('./config/database');
    logger.info('Closing database connection...');
    await closeConnection();

    // Close Redis connection
    const { closeRedisConnection } = require('./config/redis');
    logger.info('Closing Redis connection...');
    await closeRedisConnection();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// ============================================
// SIGNAL HANDLERS
// ============================================
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// UNHANDLED ERRORS
// ============================================
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// ============================================
// CREATE REQUIRED DIRECTORIES
// ============================================
const createDirectories = () => {
  const dirs = [
    config.logging.dir,
    config.upload.path,
    path.join(config.upload.path, 'temp'),
    path.join(config.upload.path, 'media'),
    config.whatsapp.sessionPath,
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
};

// ============================================
// STARTUP FUNCTION
// ============================================
const startServer = async () => {
  try {
    logger.info('🚀 Starting WA-Gate v2...');
    logger.info(`Environment: ${config.env}`);
    logger.info(`Node version: ${process.version}`);

    // Create required directories
    createDirectories();

    // Test database connection
    logger.info('📊 Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Sync database (create tables if not exist)
    logger.info('📊 Synchronizing database...');
    await syncDatabase();

    // Test Redis connection (optional)
    try {
      logger.info('🔴 Testing Redis connection...');
      await testRedisConnection();
    } catch (error) {
      logger.warn('Redis connection failed (optional):', error.message);
    }

    // Initialize queue service
    logger.info('🔄 Initializing queue service...');
    await queueService.initialize();

    // Initialize WhatsApp service
    logger.info('📱 Initializing WhatsApp service...');
    await whatsappService.initialize();

    // Start HTTP server
    server = app.listen(config.app.port, config.app.host, () => {
      const address = server.address();
      const host = address.address === '::' ? 'localhost' : address.address;
      const url = `http://${host}:${address.port}`;

      logger.info('✅ Server started successfully');
      logger.info(`🌐 Server running at: ${url}`);
      logger.info(`📚 API Documentation: ${url}/api/v1`);
      logger.info(`🔍 Health Check: ${url}/health`);
      logger.info(`📱 QR Code: ${url}/api/v1/qr/html`);

      console.log('\n' + '='.repeat(50));
      console.log('🎉 WA-Gate v2 is ready!');
      console.log('='.repeat(50));
      console.log(`🌐 Server: ${url}`);
      console.log(`📱 QR Code: ${url}/api/v1/qr/html`);
      console.log(`📚 API Docs: ${url}/api/v1`);
      console.log('='.repeat(50) + '\n');

      // Log startup info
      logger.info('Startup completed', {
        port: address.port,
        host: address.address,
        environment: config.env,
        features: {
          whatsapp: whatsappService.isInitialized,
          queue: queueService.isInitialized,
          dashboard: config.dashboard.enabled,
        },
      });
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.app.port} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// ============================================
// START THE SERVER
// ============================================
startServer();