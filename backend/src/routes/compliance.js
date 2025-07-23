const express = require('express');
const router = express.Router();

// Compliance module routes
router.get('/', (req, res) => {
  res.json({
    message: 'Compliance API',
    endpoints: {
      audit: 'GET /compliance/audit',
      reports: 'GET /compliance/reports',
      violations: 'GET /compliance/violations'
    }
  });
});

module.exports = router;