const express = require('express');
const router = express.Router();

// Trading module routes
router.get('/', (req, res) => {
  res.json({
    message: 'Trading API',
    endpoints: {
      orders: 'GET/POST /trading/orders',
      portfolio: 'GET /trading/portfolio',
      positions: 'GET /trading/positions'
    }
  });
});

module.exports = router;