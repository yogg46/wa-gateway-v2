const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const messageRoutes = require('./message.routes');
const qrRoutes = require('./qr.routes');
const whatsappRoutes = require('./whatsapp.routes');
const broadcastRoutes = require('./broadcast.routes');
const webhookRoutes = require('./webhook.routes');
const dashboardRoutes = require('./dashboard.routes');

// API version prefix
const API_VERSION = '/api/v1';

// Health check endpoint (public)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: require('../../package.json').version,
  });
});

// Mount all routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/messages`, messageRoutes);
router.use(`${API_VERSION}/qr`, qrRoutes);
router.use(`${API_VERSION}/whatsapp`, whatsappRoutes);
router.use(`${API_VERSION}/broadcasts`, broadcastRoutes);
router.use(`${API_VERSION}/webhooks`, webhookRoutes);
router.use(`${API_VERSION}/dashboard`, dashboardRoutes);

// API documentation endpoint
router.get(`${API_VERSION}`, (req, res) => {
  res.json({
    success: true,
    message: 'WA-Gate v2 API',
    version: '2.0.0',
    endpoints: {
      auth: `${API_VERSION}/auth`,
      messages: `${API_VERSION}/messages`,
      qr: `${API_VERSION}/qr`,
      whatsapp: `${API_VERSION}/whatsapp`,
      broadcasts: `${API_VERSION}/broadcasts`,
      webhooks: `${API_VERSION}/webhooks`,
      dashboard: `${API_VERSION}/dashboard`,
    },
    documentation: '/api/docs',
  });
});

module.exports = router;