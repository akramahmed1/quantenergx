const express = require('express');
const router = express.Router();

// Import route modules
const ocrRoutes = require('./ocr');
const documentsRoutes = require('./documents');
const tradingRoutes = require('./trading');
const complianceRoutes = require('./compliance');
const riskRoutes = require('./risk');
const notificationsRoutes = require('./notifications');
const marketRoutes = require('./market');
const usersRoutes = require('./users');
const analyticsRoutes = require('./analytics');
const integrationRoutes = require('./integration');

// API Documentation route
router.get('/', (req, res) => {
  res.json({
    name: 'QuantEnergx API',
    version: '1.0.0',
    description: 'Energy trading platform with comprehensive trading, risk, and compliance capabilities',
    endpoints: {
      ocr: '/api/v1/ocr',
      documents: '/api/v1/documents',
      trading: '/api/v1/trading',
      compliance: '/api/v1/compliance',
      risk: '/api/v1/risk',
      notifications: '/api/v1/notifications',
      market: '/api/v1/market',
      users: '/api/v1/users',
      analytics: '/api/v1/analytics',
      integration: '/api/v1/integration'
    },
    features: {
      trading: [
        'Order Management (place, modify, cancel)',
        'Real-time Order Book',
        'Trade Execution Engine',
        'Portfolio Management',
        'Position Tracking with P&L'
      ],
      market_data: [
        'Real-time Price Feeds',
        'Historical Data',
        'Market Analytics',
        'Volatility Indicators',
        'Commodity Correlations'
      ],
      risk_management: [
        'Value-at-Risk (VaR)',
        'Exposure Monitoring',
        'Risk Limits',
        'Stress Testing',
        'Real-time Alerts'
      ],
      compliance: [
        'KYC/AML Workflows',
        'Regulatory Reporting',
        'Audit Trail',
        'Transaction Monitoring',
        'Multi-jurisdiction Support'
      ],
      notifications: [
        'Multi-channel Alerts (Email, SMS, WhatsApp, Telegram)',
        'Trade Confirmations',
        'Risk Breach Alerts',
        'Margin Call Notifications',
        'Compliance Alerts'
      ],
      user_management: [
        'Secure Authentication with JWT',
        'Multi-factor Authentication (MFA)',
        'Role-based Access Control',
        'Session Management',
        'Activity Logging'
      ],
      analytics: [
        'Trading Analytics',
        'Position Reports',
        'Risk Analytics',
        'Compliance Reports',
        'Performance Dashboards'
      ]
    },
    supported_commodities: [
      'Crude Oil (WTI, Brent)',
      'Natural Gas',
      'Heating Oil',
      'Gasoline',
      'Renewable Energy Certificates (RECs)',
      'Carbon Credits'
    ],
    regions: ['US', 'EU', 'UK', 'Middle East']
  });
});

// Mount route modules
router.use('/ocr', ocrRoutes);
router.use('/documents', documentsRoutes);
router.use('/trading', tradingRoutes);
router.use('/compliance', complianceRoutes);
router.use('/risk', riskRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/market', marketRoutes);
router.use('/users', usersRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/integration', integrationRoutes);

module.exports = router;