const express = require('express');
const { body, validationResult } = require('express-validator');
const RiskManagementService = require('../services/riskManagementService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const riskService = new RiskManagementService();

// Risk management status
router.get('/', (req, res) => {
  res.json({
    message: 'Risk Management API',
    endpoints: {
      assess: 'POST /risk/assess',
      dashboard: 'GET /risk/dashboard',
      positions: 'GET /risk/positions',
      limits: 'GET /risk/limits',
      reports: 'GET /risk/reports',
      alerts: 'GET /risk/alerts'
    }
  });
});

// Get risk dashboard
router.get('/dashboard',
  authenticateToken,
  async (req, res) => {
    try {
      const { portfolioId } = req.query;
      
      // Mock portfolio data - would come from database
      const mockPortfolioData = {
        portfolioId: portfolioId || 'default',
        positions: [
          {
            id: '1',
            commodity: 'crude_oil',
            quantity: 1000,
            currentPrice: 80.5,
            value: 80500
          },
          {
            id: '2',
            commodity: 'natural_gas',
            quantity: 5000,
            currentPrice: 3.2,
            value: 16000
          }
        ],
        trades: [],
        counterparties: {},
        marketData: {},
        systems: {}
      };

      const riskAssessment = await riskService.assessPortfolioRisk(mockPortfolioData);
      
      res.json({
        success: true,
        dashboard: {
          portfolioId: mockPortfolioData.portfolioId,
          lastUpdate: new Date().toISOString(),
          riskAssessment,
          quickStats: {
            totalValue: mockPortfolioData.positions.reduce((sum, pos) => sum + pos.value, 0),
            riskLevel: riskAssessment.riskLevel,
            alertCount: riskAssessment.alerts.length,
            complianceStatus: 'compliant'
          }
        }
      });

    } catch (error) {
      console.error('Risk dashboard error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Assess portfolio risk
router.post('/assess',
  authenticateToken,
  [
    body('portfolioData').isObject().withMessage('Portfolio data is required'),
    body('portfolioData.portfolioId').notEmpty().withMessage('Portfolio ID is required'),
    body('portfolioData.positions').isArray().withMessage('Positions must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { portfolioData } = req.body;
      
      const riskAssessment = await riskService.assessPortfolioRisk(portfolioData);
      
      res.json({
        success: true,
        riskAssessment
      });

    } catch (error) {
      console.error('Risk assessment error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get risk limits
router.get('/limits',
  authenticateToken,
  async (req, res) => {
    try {
      const limits = riskService.riskLimits;
      
      res.json({
        success: true,
        limits,
        lastUpdate: new Date().toISOString()
      });

    } catch (error) {
      console.error('Risk limits error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Update risk limits
router.put('/limits',
  authenticateToken,
  [
    body('limits').isObject().withMessage('Limits object is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { limits } = req.body;
      
      // Update risk limits (in production, save to database)
      Object.assign(riskService.riskLimits, limits);
      
      res.json({
        success: true,
        message: 'Risk limits updated successfully',
        limits: riskService.riskLimits
      });

    } catch (error) {
      console.error('Risk limits update error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get positions summary
router.get('/positions',
  authenticateToken,
  async (req, res) => {
    try {
      const { portfolioId, commodity } = req.query;
      
      // Mock positions data
      const positions = [
        {
          id: '1',
          portfolioId: portfolioId || 'default',
          commodity: 'crude_oil',
          quantity: 1000,
          averagePrice: 78.5,
          currentPrice: 80.5,
          marketValue: 80500,
          unrealizedPnL: 2000,
          riskMetrics: {
            var: 8050,
            concentration: 0.15,
            liquidityRisk: 'low'
          }
        }
      ];

      const filteredPositions = commodity ? 
        positions.filter(pos => pos.commodity === commodity) : 
        positions;
      
      res.json({
        success: true,
        positions: filteredPositions,
        summary: {
          totalPositions: filteredPositions.length,
          totalValue: filteredPositions.reduce((sum, pos) => sum + pos.marketValue, 0),
          totalPnL: filteredPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0)
        }
      });

    } catch (error) {
      console.error('Positions query error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Generate risk report
router.get('/reports/:portfolioId',
  authenticateToken,
  async (req, res) => {
    try {
      const { portfolioId } = req.params;
      const { startDate, endDate } = req.query;
      
      const dateRange = {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: endDate || new Date().toISOString()
      };

      const report = await riskService.generateRiskReport(portfolioId, dateRange);
      
      res.json({
        success: true,
        report
      });

    } catch (error) {
      console.error('Risk report error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get risk alerts
router.get('/alerts',
  authenticateToken,
  async (req, res) => {
    try {
      const { status = 'active', severity, portfolioId } = req.query;
      
      // Mock alerts data
      const alerts = [
        {
          id: '1',
          type: 'value_at_risk',
          severity: 'high',
          message: 'VaR limit exceeded',
          timestamp: new Date().toISOString(),
          status: 'active',
          portfolioId: portfolioId || 'default'
        }
      ];

      const filteredAlerts = alerts.filter(alert => {
        if (status && alert.status !== status) return false;
        if (severity && alert.severity !== severity) return false;
        if (portfolioId && alert.portfolioId !== portfolioId) return false;
        return true;
      });
      
      res.json({
        success: true,
        alerts: filteredAlerts,
        summary: {
          total: filteredAlerts.length,
          high: filteredAlerts.filter(a => a.severity === 'high').length,
          medium: filteredAlerts.filter(a => a.severity === 'medium').length,
          low: filteredAlerts.filter(a => a.severity === 'low').length
        }
      });

    } catch (error) {
      console.error('Risk alerts error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;