const express = require('express');
const { body, validationResult } = require('express-validator');
const NotificationService = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize notification service
let notificationService;
try {
  notificationService = new NotificationService();
} catch (error) {
  console.error('Failed to initialize NotificationService:', error);
  notificationService = null;
}

// Notification service status
router.get('/', (req, res) => {
  res.json({
    message: 'Notifications API',
    supported_channels: ['email', 'whatsapp', 'telegram', 'sms'],
    endpoints: {
      send: 'POST /notifications/send',
      subscribe: 'POST /notifications/subscribe',
      channels: 'GET /notifications/channels',
      test: 'POST /notifications/test',
      trading: {
        trade_executed: 'POST /notifications/trading/trade-executed',
        order_placed: 'POST /notifications/trading/order-placed',
        risk_alert: 'POST /notifications/trading/risk-alert',
        margin_call: 'POST /notifications/trading/margin-call'
      }
    },
    serviceStatus: notificationService ? 'online' : 'offline'
  });
});

// Send notification
router.post('/send',
  authenticateToken,
  [
    body('channel').isIn(['email', 'whatsapp', 'telegram', 'sms'])
      .withMessage('Invalid channel. Supported: email, whatsapp, telegram, sms'),
    body('recipient').notEmpty()
      .withMessage('Recipient is required'),
    body('message').notEmpty()
      .withMessage('Message is required'),
    body('options').optional().isObject()
  ],
  async (req, res) => {
    try {
      if (!notificationService) {
        return res.status(503).json({
          success: false,
          error: 'Notification service unavailable'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { channel, recipient, message, options = {} } = req.body;
      
      const result = await notificationService.sendNotification(
        channel,
        recipient,
        message,
        options
      );
      
      res.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Notification send error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to send notification',
        message: error.message 
      });
    }
  }
);

// Subscribe to notifications
router.post('/subscribe',
  authenticateToken,
  [
    body('channels').isArray()
      .withMessage('Channels must be an array'),
    body('channels.*').isIn(['email', 'whatsapp', 'telegram', 'sms']),
    body('email_address').optional().isEmail(),
    body('telegram_chat_id').optional().isString(),
    body('whatsapp_number').optional().isString(),
    body('sms_number').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userPreferences = {
        userId: req.user.id,
        channels: req.body.channels,
        email_address: req.body.email_address,
        telegram_chat_id: req.body.telegram_chat_id,
        whatsapp_number: req.body.whatsapp_number,
        sms_number: req.body.sms_number,
        updated_at: new Date().toISOString()
      };

      // Store user preferences (in production, save to database)
      console.log('User notification preferences updated:', userPreferences);
      
      res.json({
        success: true,
        message: 'Notification preferences updated',
        preferences: userPreferences
      });

    } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({ 
        error: 'Failed to update notification preferences',
        message: error.message 
      });
    }
  }
);

// Get available channels and their status
router.get('/channels', (req, res) => {
  const channels = {
    email: {
      name: 'Email',
      available: true,
      description: 'Send notifications via email'
    },
    telegram: {
      name: 'Telegram',
      available: !!process.env.TELEGRAM_BOT_TOKEN,
      description: 'Send notifications via Telegram bot'
    },
    whatsapp: {
      name: 'WhatsApp',
      available: !!process.env.WHATSAPP_API_TOKEN,
      description: 'Send notifications via WhatsApp Business API'
    },
    sms: {
      name: 'SMS',
      available: !!process.env.SMS_API_KEY,
      description: 'Send notifications via SMS'
    }
  };

  res.json({
    channels,
    configuration_required: {
      telegram: !process.env.TELEGRAM_BOT_TOKEN,
      whatsapp: !process.env.WHATSAPP_API_TOKEN,
      sms: !process.env.SMS_API_KEY
    }
  });
});

// Test notification
router.post('/test',
  authenticateToken,
  [
    body('channel').isIn(['email', 'whatsapp', 'telegram', 'sms']),
    body('recipient').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { channel, recipient } = req.body;
      
      const testMessage = `🧪 Test notification from QuantEnergx

This is a test message to verify your ${channel} notifications are working correctly.

✅ If you received this message, your notifications are configured properly!

Timestamp: ${new Date().toISOString()}`;

      const result = await notificationService.sendNotification(
        channel,
        recipient,
        testMessage,
        { subject: 'QuantEnergx Test Notification' }
      );
      
      res.json({
        success: true,
        message: 'Test notification sent successfully',
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Test notification error:', error);
      res.status(500).json({ 
        error: 'Failed to send test notification',
        message: error.message 
      });
    }
  }
);

// OCR-specific notification endpoints
router.post('/ocr/document-processed',
  authenticateToken,
  async (req, res) => {
    try {
      const { documentId, result, userPreferences } = req.body;
      
      const notifications = await notificationService.notifyDocumentProcessed(
        documentId,
        result,
        userPreferences
      );
      
      res.json({
        success: true,
        notifications_sent: notifications.length,
        notifications
      });

    } catch (error) {
      console.error('OCR notification error:', error);
      res.status(500).json({ 
        error: 'Failed to send OCR notification',
        message: error.message 
      });
    }
  }
);

router.post('/ocr/review-required',
  authenticateToken,
  async (req, res) => {
    try {
      const { documentId, confidence, userPreferences } = req.body;
      
      const notifications = await notificationService.notifyReviewRequired(
        documentId,
        confidence,
        userPreferences
      );
      
      res.json({
        success: true,
        notifications_sent: notifications.length,
        notifications
      });

    } catch (error) {
      console.error('Review notification error:', error);
      res.status(500).json({ 
        error: 'Failed to send review notification',
        message: error.message 
      });
    }
  }
);

// Trading notification endpoints
router.post('/trading/trade-executed',
  authenticateToken,
  [
    body('trade').isObject().withMessage('Trade data is required'),
    body('userPreferences').isObject().withMessage('User preferences are required')
  ],
  async (req, res) => {
    try {
      if (!notificationService) {
        return res.status(503).json({
          success: false,
          error: 'Notification service unavailable'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { trade, userPreferences } = req.body;
      
      const notifications = await notificationService.notifyTradeExecuted(
        trade,
        userPreferences
      );
      
      res.json({
        success: true,
        notifications_sent: notifications.length,
        notifications
      });

    } catch (error) {
      console.error('Trade notification error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to send trade notification',
        message: error.message 
      });
    }
  }
);

router.post('/trading/order-placed',
  authenticateToken,
  [
    body('order').isObject().withMessage('Order data is required'),
    body('userPreferences').isObject().withMessage('User preferences are required')
  ],
  async (req, res) => {
    try {
      if (!notificationService) {
        return res.status(503).json({
          success: false,
          error: 'Notification service unavailable'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { order, userPreferences } = req.body;
      
      const notifications = await notificationService.notifyOrderPlaced(
        order,
        userPreferences
      );
      
      res.json({
        success: true,
        notifications_sent: notifications.length,
        notifications
      });

    } catch (error) {
      console.error('Order notification error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to send order notification',
        message: error.message 
      });
    }
  }
);

router.post('/trading/risk-alert',
  authenticateToken,
  [
    body('riskData').isObject().withMessage('Risk data is required'),
    body('userPreferences').isObject().withMessage('User preferences are required')
  ],
  async (req, res) => {
    try {
      if (!notificationService) {
        return res.status(503).json({
          success: false,
          error: 'Notification service unavailable'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { riskData, userPreferences } = req.body;
      
      const notifications = await notificationService.notifyRiskLimitBreach(
        riskData,
        userPreferences
      );
      
      res.json({
        success: true,
        notifications_sent: notifications.length,
        notifications
      });

    } catch (error) {
      console.error('Risk alert notification error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to send risk alert notification',
        message: error.message 
      });
    }
  }
);

router.post('/trading/margin-call',
  authenticateToken,
  [
    body('marginData').isObject().withMessage('Margin data is required'),
    body('userPreferences').isObject().withMessage('User preferences are required')
  ],
  async (req, res) => {
    try {
      if (!notificationService) {
        return res.status(503).json({
          success: false,
          error: 'Notification service unavailable'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { marginData, userPreferences } = req.body;
      
      const notifications = await notificationService.notifyMarginCall(
        marginData,
        userPreferences
      );
      
      res.json({
        success: true,
        notifications_sent: notifications.length,
        notifications
      });

    } catch (error) {
      console.error('Margin call notification error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to send margin call notification',
        message: error.message 
      });
    }
  }
);

router.post('/trading/compliance-alert',
  authenticateToken,
  [
    body('complianceData').isObject().withMessage('Compliance data is required'),
    body('userPreferences').isObject().withMessage('User preferences are required')
  ],
  async (req, res) => {
    try {
      if (!notificationService) {
        return res.status(503).json({
          success: false,
          error: 'Notification service unavailable'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { complianceData, userPreferences } = req.body;
      
      const notifications = await notificationService.notifyComplianceAlert(
        complianceData,
        userPreferences
      );
      
      res.json({
        success: true,
        notifications_sent: notifications.length,
        notifications
      });

    } catch (error) {
      console.error('Compliance alert notification error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to send compliance alert notification',
        message: error.message 
      });
    }
  }
);

module.exports = router;