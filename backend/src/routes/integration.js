const express = require('express');
const { body, validationResult } = require('express-validator');
const IntegrationService = require('../services/integrationService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize integration service
let integrationService;
try {
  integrationService = new IntegrationService();
} catch (error) {
  console.error('Failed to initialize IntegrationService:', error);
  integrationService = null;
}

// Integration service status
router.get('/', (req, res) => {
  res.json({
    message: 'Integration Service API',
    description: 'Coordinates between trading, risk, notifications, and compliance services',
    endpoints: {
      health: 'GET /integration/health',
      preferences: 'GET/PUT /integration/preferences',
      external_trade: 'POST /integration/external-trade',
      test_notification: 'POST /integration/test-notification',
      daily_reports: 'POST /integration/daily-reports',
      market_opening: 'POST /integration/market-opening',
    },
    serviceStatus: integrationService ? 'online' : 'offline',
  });
});

// Get system health
router.get('/health', async (req, res) => {
  try {
    if (!integrationService) {
      return res.status(503).json({
        success: false,
        error: 'Integration service unavailable',
      });
    }

    const health = await integrationService.getSystemHealth();

    res.json({
      success: true,
      health,
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    if (!integrationService) {
      return res.status(503).json({
        success: false,
        error: 'Integration service unavailable',
      });
    }

    const preferences = integrationService.getUserPreferences(req.user.id);

    res.json({
      success: true,
      preferences: preferences || {
        channels: [],
        preferences: {},
      },
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update user preferences
router.put(
  '/preferences',
  authenticateToken,
  [
    body('channels').optional().isArray().withMessage('Channels must be an array'),
    body('email').optional().isEmail().withMessage('Email must be valid'),
    body('phone').optional().isString().withMessage('Phone must be string'),
    body('preferences').optional().isObject().withMessage('Preferences must be object'),
  ],
  async (req, res) => {
    try {
      if (!integrationService) {
        return res.status(503).json({
          success: false,
          error: 'Integration service unavailable',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const updatedPreferences = await integrationService.updateUserPreferences(
        req.user.id,
        req.body
      );

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: updatedPreferences,
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Process external trade
router.post(
  '/external-trade',
  authenticateToken,
  [
    body('externalId').notEmpty().withMessage('External ID is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
    body('commodity').notEmpty().withMessage('Commodity is required'),
    body('side').isIn(['buy', 'sell']).withMessage('Side must be buy or sell'),
    body('quantity').isNumeric().withMessage('Quantity must be numeric'),
    body('source').optional().isString().withMessage('Source must be string'),
  ],
  async (req, res) => {
    try {
      if (!integrationService) {
        return res.status(503).json({
          success: false,
          error: 'Integration service unavailable',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      // Check permissions - only admin or the user themselves can process external trades
      if (req.user.role !== 'admin' && req.user.id !== req.body.userId) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
      }

      const order = await integrationService.processExternalTrade(req.body);

      res.json({
        success: true,
        message: 'External trade processed successfully',
        order,
      });
    } catch (error) {
      console.error('External trade processing error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Send test notification
router.post(
  '/test-notification',
  authenticateToken,
  [
    body('type')
      .isIn(['trade_executed', 'risk_alert', 'margin_call', 'compliance_alert'])
      .withMessage('Invalid notification type'),
    body('data').isObject().withMessage('Data must be object'),
  ],
  async (req, res) => {
    try {
      if (!integrationService) {
        return res.status(503).json({
          success: false,
          error: 'Integration service unavailable',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { type, data } = req.body;

      const result = await integrationService.triggerTestNotification(req.user.id, type, data);

      res.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error('Test notification error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Trigger daily reports (admin only)
router.post('/daily-reports', authenticateToken, async (req, res) => {
  try {
    if (!integrationService) {
      return res.status(503).json({
        success: false,
        error: 'Integration service unavailable',
      });
    }

    // Check admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    await integrationService.sendDailyReports();

    res.json({
      success: true,
      message: 'Daily reports sent successfully',
    });
  } catch (error) {
    console.error('Daily reports error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Trigger market opening alerts (admin only)
router.post('/market-opening', authenticateToken, async (req, res) => {
  try {
    if (!integrationService) {
      return res.status(503).json({
        success: false,
        error: 'Integration service unavailable',
      });
    }

    // Check admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    await integrationService.sendMarketOpeningAlerts();

    res.json({
      success: true,
      message: 'Market opening alerts sent successfully',
    });
  } catch (error) {
    console.error('Market opening alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Perform compliance check
router.post(
  '/compliance-check',
  authenticateToken,
  [body('transactionData').isObject().withMessage('Transaction data is required')],
  async (req, res) => {
    try {
      if (!integrationService) {
        return res.status(503).json({
          success: false,
          error: 'Integration service unavailable',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const complianceResult = await integrationService.performComplianceCheck(
        req.user.id,
        req.body.transactionData
      );

      res.json({
        success: true,
        complianceResult,
      });
    } catch (error) {
      console.error('Compliance check error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get integration statistics (admin only)
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    if (!integrationService) {
      return res.status(503).json({
        success: false,
        error: 'Integration service unavailable',
      });
    }

    // Check admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    const health = await integrationService.getSystemHealth();

    res.json({
      success: true,
      statistics: health.statistics,
      services: health.services,
      lastUpdate: health.timestamp,
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
