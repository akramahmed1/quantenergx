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
const advancedRoutes = require('./advanced');

// API Documentation route
router.get('/', (req, res) => {
  res.json({
    name: 'QuantEnergx API',
    version: '2.0.0',
    description:
      'Industry-disrupting energy trading platform with advanced features across 13 major categories',
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
      integration: '/api/v1/integration',
      streaming: '/api/v1/streaming',
      exchanges: '/api/v1/exchanges',
      grid: '/api/v1/grid',
      'cloud-cost': '/api/v1/cloud-cost',
      iot: '/api/v1/iot',
    },
    features: {
      streaming_engine: [
        'Millisecond-level tick processing',
        'Real-time order execution',
        'WebSocket streaming',
        'Market data aggregation',
        'Performance metrics',
      ],
      risk_analytics: [
        'Value-at-Risk (VaR) calculation',
        'Stress testing with scenarios',
        'Multi-commodity risk analysis',
        'Weather-linked exposures',
        'Cyber risk assessment',
        'Real-time risk dashboard',
      ],
      multi_exchange: [
        'ICE, EEX, CME, APX, MEPEX integration',
        'Unified margin management',
        'Cross-market arbitrage detection',
        'Clearing and reconciliation',
        'Regional exchange support (Guyana, MENA)',
      ],
      grid_integration: [
        'ERCOT, PJM, CAISO, MISO data ingestion',
        'Real-time congestion monitoring',
        'Transmission line status tracking',
        'Smart alert triggers',
        'Project milestone monitoring',
      ],
      enhanced_compliance: [
        'Chat/email/voice logging',
        'Trade intent reconstruction',
        'Blockchain notarization',
        'REMIT II, FERC, SOC2, ISO27001, NERC CIP',
        'Tamper-proof audit trails',
      ],
      cloud_cost_management: [
        'Spend anomaly detection',
        'Automated optimization',
        'Budget monitoring',
        'Security incident automation',
        'Cost forecasting',
      ],
      iot_scada: [
        'IEC 61850, DNP3, Modbus, OpenADR',
        'Device onboarding automation',
        'Real-time data streaming',
        'Protocol-specific handlers',
        'Industrial device monitoring',
      ],
      trading: [
        'Order Management (place, modify, cancel)',
        'Real-time Order Book',
        'Trade Execution Engine',
        'Portfolio Management',
        'Position Tracking with P&L',
      ],
      market_data: [
        'Real-time Price Feeds',
        'Historical Data',
        'Market Analytics',
        'Volatility Indicators',
        'Commodity Correlations',
      ],
      risk_management: [
        'Value-at-Risk (VaR)',
        'Exposure Monitoring',
        'Risk Limits',
        'Stress Testing',
        'Real-time Alerts',
      ],
      compliance: [
        'KYC/AML Workflows',
        'Regulatory Reporting',
        'Audit Trail',
        'Transaction Monitoring',
        'Multi-jurisdiction Support',
      ],
      notifications: [
        'Multi-channel Alerts (Email, SMS, WhatsApp, Telegram)',
        'Trade Confirmations',
        'Risk Breach Alerts',
        'Margin Call Notifications',
        'Compliance Alerts',
      ],
      user_management: [
        'Secure Authentication with JWT',
        'Multi-factor Authentication (MFA)',
        'Role-based Access Control',
        'Session Management',
        'Activity Logging',
      ],
      analytics: [
        'Trading Analytics',
        'Position Reports',
        'Risk Analytics',
        'Compliance Reports',
        'Performance Dashboards',
      ],
    },
    supported_commodities: [
      'Crude Oil (WTI, Brent)',
      'Natural Gas',
      'Heating Oil',
      'Gasoline',
      'Electricity',
      'Renewable Energy Certificates (RECs)',
      'Carbon Credits',
      'Coal',
      'Refined Products',
    ],
    supported_exchanges: [
      'ICE (Intercontinental Exchange)',
      'EEX (European Energy Exchange)',
      'CME (Chicago Mercantile Exchange)',
      'APX (Power Exchange)',
      'MEPEX (Middle East Power Exchange)',
      'Guyana Energy Exchange',
      'Regional MENA Exchanges',
    ],
    supported_protocols: [
      'IEC 61850 (Power Utility Automation)',
      'DNP3 (Distributed Network Protocol)',
      'Modbus TCP/IP',
      'OpenADR (Automated Demand Response)',
      'MQTT (IoT Messaging)',
    ],
    compliance_standards: [
      'REMIT II (EU Energy Market Integrity)',
      'FERC Order 760 (US Federal Energy)',
      'SOC 2 Type II',
      'ISO 27001',
      'NERC CIP (Critical Infrastructure)',
      'MENA Regional Regulations',
      'Guyana Petroleum Act',
    ],
    regions: ['US', 'EU', 'UK', 'Middle East', 'Guyana', 'Global'],
  });
});

// API Info endpoint (alias for easier testing)
router.get('/info', (req, res) => {
  res.json({
    name: 'QuantEnergx API',
    version: '2.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      info: '/api/v1/info',
      docs: '/api/v1',
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
router.use('/market', marketRoutes);
router.use('/users', usersRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/integration', integrationRoutes);

// Mount advanced feature routes
router.use('/', advancedRoutes);

module.exports = router;
