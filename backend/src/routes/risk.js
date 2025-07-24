const express = require('express');
const router = express.Router();

// Risk management routes
router.get('/', (req, res) => {
  res.json({
    message: 'Risk Management API',
    endpoints: {
      dashboard: 'GET /risk/dashboard',
      positions: 'GET /risk/positions',
      limits: 'GET /risk/limits',
      reports: 'GET /risk/reports'
    }
  });
});

module.exports = router;