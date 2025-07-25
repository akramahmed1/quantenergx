const express = require('express');
const { body, validationResult } = require('express-validator');
const ComplianceService = require('../services/complianceService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const complianceService = new ComplianceService();

// Compliance module status
router.get('/', (req, res) => {
  res.json({
    message: 'Compliance API',
    endpoints: {
      check: 'POST /compliance/check',
      audit: 'GET /compliance/audit',
      reports: 'GET /compliance/reports',
      violations: 'GET /compliance/violations',
      frameworks: 'GET /compliance/frameworks'
    }
  });
});

// Get regulatory frameworks
router.get('/frameworks', (req, res) => {
  res.json({
    frameworks: complianceService.regulatoryFrameworks,
    checks: complianceService.complianceChecks
  });
});

// Perform compliance check
router.post('/check',
  authenticateToken,
  [
    body('transactionData').isObject().withMessage('Transaction data is required'),
    body('region').optional().isIn(['US', 'UK', 'EU', 'ME']).withMessage('Invalid region'),
    body('transactionData.commodity').notEmpty().withMessage('Commodity is required'),
    body('transactionData.volume').isNumeric().withMessage('Volume must be numeric'),
    body('transactionData.traderId').notEmpty().withMessage('Trader ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { transactionData, region = 'US' } = req.body;
      
      const complianceResult = await complianceService.performComplianceCheck(transactionData, region);
      
      res.json({
        success: true,
        complianceResult
      });

    } catch (error) {
      console.error('Compliance check error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Generate compliance report
router.get('/reports/:traderId',
  authenticateToken,
  async (req, res) => {
    try {
      const { traderId } = req.params;
      const { startDate, endDate } = req.query;
      
      const dateRange = {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: endDate || new Date().toISOString()
      };

      const report = await complianceService.generateComplianceReport(traderId, dateRange);
      
      res.json({
        success: true,
        report
      });

    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get audit trail
router.get('/audit',
  authenticateToken,
  async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      
      // This would query the database for audit records
      const auditTrail = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        records: [],
        summary: {
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 0,
          regions: []
        }
      };
      
      res.json({
        success: true,
        auditTrail
      });

    } catch (error) {
      console.error('Audit trail error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get violations
router.get('/violations',
  authenticateToken,
  async (req, res) => {
    try {
      const { status = 'open' } = req.query;
      
      // This would query the database for violations
      const violations = {
        status,
        count: 0,
        violations: [],
        summary: {
          high: 0,
          medium: 0,
          low: 0
        }
      };
      
      res.json({
        success: true,
        violations
      });

    } catch (error) {
      console.error('Violations query error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;