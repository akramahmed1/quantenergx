const express = require('express');
const router = express.Router();

// Notification service routes
router.get('/', (req, res) => {
  res.json({
    message: 'Notifications API',
    supported_channels: ['email', 'whatsapp', 'telegram', 'sms'],
    endpoints: {
      send: 'POST /notifications/send',
      subscribe: 'POST /notifications/subscribe',
      channels: 'GET /notifications/channels'
    }
  });
});

// Send notification
router.post('/send', (req, res) => {
  res.json({
    message: 'Send notification endpoint - implementation pending',
    request_body: req.body
  });
});

// Subscribe to notifications
router.post('/subscribe', (req, res) => {
  res.json({
    message: 'Subscribe to notifications endpoint - implementation pending',
    request_body: req.body
  });
});

module.exports = router;