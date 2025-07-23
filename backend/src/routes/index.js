const express = require('express');
const router = express.Router();

// Import route modules
const ocrRoutes = require('./ocr');
const documentsRoutes = require('./documents');
const tradingRoutes = require('./trading');
const complianceRoutes = require('./compliance');
const riskRoutes = require('./risk');
const notificationsRoutes = require('./notifications');

// API Documentation route
router.get('/', (req, res) => {
  res.json({
    name: 'QuantEnergx API',
    version: '1.0.0',
    description: 'Energy trading platform with OCR & document processing capabilities',
    endpoints: {
      ocr: '/api/v1/ocr',
      documents: '/api/v1/documents',
      trading: '/api/v1/trading',
      compliance: '/api/v1/compliance',
      risk: '/api/v1/risk',
      notifications: '/api/v1/notifications'
    }
  });
});

// Mount route modules
router.use('/ocr', ocrRoutes);
router.use('/documents', documentsRoutes);
router.use('/trading', tradingRoutes);
router.use('/compliance', complianceRoutes);
router.use('/risk', riskRoutes);
router.use('/notifications', notificationsRoutes);

module.exports = router;