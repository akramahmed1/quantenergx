const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const MarginService = require('../services/marginService');
const RegionConfigService = require('../services/regionConfigService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize services
let marginService, regionConfigService;
try {
  regionConfigService = new RegionConfigService();
  marginService = new MarginService(regionConfigService);
} catch (error) {
  console.error('Failed to initialize Margin services:', error);
  marginService = null;
  regionConfigService = null;
}

// Margin module routes overview
router.get('/', (req, res) => {
  res.json({
    message: 'Margin Management API',
    endpoints: {
      'portfolio-margin': 'GET /margin/portfolio',
      'margin-requirements': 'POST /margin/calculate',
      'margin-calls': 'GET /margin/calls',
      'margin-call-details': 'GET /margin/calls/:marginCallId',
      'collateral': 'GET /margin/collateral',
      'update-collateral': 'PUT /margin/collateral',
      'margin-reports': 'GET /margin/reports'
    },
    serviceStatus: marginService ? 'online' : 'offline',
    supportedCalculationMethods: ['span', 'portfolio', 'standard'],
    supportedRegions: ['US', 'EU', 'UK', 'APAC', 'CA']
  });
});

// Calculate Portfolio Margin
router.get(
  '/portfolio',
  authenticateToken,
  [
    query('region').optional().isString().isLength({ min: 2, max: 10 }).withMessage('Invalid region code'),
    query('method').optional().isIn(['simple', 'portfolio']).withMessage('Invalid calculation method')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      if (!marginService) {
        return res.status(503).json({
          success: false,
          error: 'Margin service unavailable'
        });
      }

      const { region = 'US' } = req.query;
      const userId = req.user.id;

      const portfolioMargin = await marginService.calculatePortfolioMargin(userId, region);
      const marginStatus = await marginService.checkMarginRequirements(userId, region);

      res.json({
        success: true,
        data: {
          portfolioMargin,
          marginStatus,
          userId,
          region,
          calculatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Portfolio margin calculation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Calculate Margin Requirements for Specific Contract
router.post(
  '/calculate',
  authenticateToken,
  [
    body('contractType').isIn(['future', 'option', 'swap', 'structured_note']).withMessage('Invalid contract type'),
    body('underlyingCommodity').isString().notEmpty().withMessage('Underlying commodity is required'),
    body('notionalAmount').isNumeric().isFloat({ min: 1000 }).withMessage('Notional amount must be at least $1,000'),
    body('region').optional().isString().isLength({ min: 2, max: 10 }).withMessage('Invalid region code'),
    body('maturityDate').optional().isISO8601().withMessage('Invalid maturity date'),
    body('contractDetails').optional().isObject().withMessage('Contract details must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      if (!marginService) {
        return res.status(503).json({
          success: false,
          error: 'Margin service unavailable'
        });
      }

      const {
        contractType,
        underlyingCommodity,
        notionalAmount,
        region = 'US',
        maturityDate,
        contractDetails = {}
      } = req.body;

      // Create a mock contract for margin calculation
      const mockContract = {
        type: contractType,
        underlyingCommodity,
        notionalAmount,
        currency: 'USD',
        maturityDate: maturityDate ? new Date(maturityDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        ...contractDetails
      };

      const marginRequirement = await marginService.calculateInitialMargin(mockContract, region);
      const regionConfig = await regionConfigService.getRegionConfig(region);
      
      res.json({
        success: true,
        data: {
          initialMargin: marginRequirement,
          contractType,
          underlyingCommodity,
          notionalAmount,
          region,
          marginRules: regionConfig?.marginRules,
          calculatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Margin calculation error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get User Margin Calls
router.get(
  '/calls',
  authenticateToken,
  [
    query('region').optional().isString().isLength({ min: 2, max: 10 }).withMessage('Invalid region code'),
    query('status').optional().isIn(['pending', 'met', 'overdue', 'defaulted']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      if (!marginService) {
        return res.status(503).json({
          success: false,
          error: 'Margin service unavailable'
        });
      }

      const { region, status, page = 1, limit = 20 } = req.query;
      const userId = req.user.id;

      // Get all margin calls for user
      let marginCalls = Array.from(marginService.marginCalls.values())
        .filter(call => call.userId === userId);

      // Apply filters
      if (region) {
        marginCalls = marginCalls.filter(call => call.region === region);
      }
      if (status) {
        marginCalls = marginCalls.filter(call => call.status === status);
      }

      // Sort by creation date (newest first)
      marginCalls.sort((a, b) => b.createdAt - a.createdAt);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedCalls = marginCalls.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          marginCalls: paginatedCalls,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: marginCalls.length,
            hasMore: endIndex < marginCalls.length
          }
        }
      });

    } catch (error) {
      console.error('Get margin calls error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get Margin Call Details
router.get(
  '/calls/:marginCallId',
  authenticateToken,
  [
    param('marginCallId').isUUID().withMessage('Invalid margin call ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      if (!marginService) {
        return res.status(503).json({
          success: false,
          error: 'Margin service unavailable'
        });
      }

      const { marginCallId } = req.params;
      const marginCall = await marginService.getMarginCall(marginCallId);

      if (!marginCall) {
        return res.status(404).json({
          success: false,
          error: 'Margin call not found'
        });
      }

      // Verify user ownership
      if (marginCall.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: marginCall
      });

    } catch (error) {
      console.error('Get margin call details error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Resolve Margin Call
router.put(
  '/calls/:marginCallId/resolve',
  authenticateToken,
  [
    param('marginCallId').isUUID().withMessage('Invalid margin call ID'),
    body('resolution').isIn(['met', 'defaulted']).withMessage('Resolution must be met or defaulted'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      if (!marginService) {
        return res.status(503).json({
          success: false,
          error: 'Margin service unavailable'
        });
      }

      const { marginCallId } = req.params;
      const { resolution, notes } = req.body;

      const marginCall = await marginService.getMarginCall(marginCallId);
      if (!marginCall) {
        return res.status(404).json({
          success: false,
          error: 'Margin call not found'
        });
      }

      // Verify user ownership
      if (marginCall.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Admin-only for defaulted resolution
      if (resolution === 'defaulted' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only admin can mark margin call as defaulted'
        });
      }

      const resolvedCall = await marginService.resolveMarginCall(marginCallId, resolution);
      if (notes) {
        resolvedCall.notes = notes;
      }

      res.json({
        success: true,
        data: resolvedCall,
        message: `Margin call ${resolution} successfully`
      });

    } catch (error) {
      console.error('Resolve margin call error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get User Collateral
router.get(
  '/collateral',
  authenticateToken,
  [
    query('region').optional().isString().isLength({ min: 2, max: 10 }).withMessage('Invalid region code')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      if (!marginService) {
        return res.status(503).json({
          success: false,
          error: 'Margin service unavailable'
        });
      }

      const { region = 'US' } = req.query;
      const userId = req.user.id;

      const collateral = marginService.getUserCollateral(userId, region);
      const marginStatus = await marginService.checkMarginRequirements(userId, region);

      res.json({
        success: true,
        data: {
          collateral,
          marginStatus,
          userId,
          region
        }
      });

    } catch (error) {
      console.error('Get collateral error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Update User Collateral
router.put(
  '/collateral',
  authenticateToken,
  [
    body('cash').optional().isNumeric().isFloat({ min: 0 }).withMessage('Cash amount must be positive'),
    body('securities').optional().isNumeric().isFloat({ min: 0 }).withMessage('Securities value must be positive'),
    body('commodities').optional().isNumeric().isFloat({ min: 0 }).withMessage('Commodities value must be positive'),
    body('region').optional().isString().isLength({ min: 2, max: 10 }).withMessage('Invalid region code'),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      if (!marginService) {
        return res.status(503).json({
          success: false,
          error: 'Margin service unavailable'
        });
      }

      const { region = 'US', ...collateralUpdate } = req.body;
      const userId = req.user.id;

      const updatedCollateral = await marginService.updateUserCollateral(userId, collateralUpdate, region);

      res.json({
        success: true,
        data: updatedCollateral,
        message: 'Collateral updated successfully'
      });

    } catch (error) {
      console.error('Update collateral error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get Margin Report
router.get(
  '/reports',
  authenticateToken,
  [
    query('region').optional().isString().isLength({ min: 2, max: 10 }).withMessage('Invalid region code'),
    query('includeHistory').optional().isBoolean().withMessage('Include history must be boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      if (!marginService) {
        return res.status(503).json({
          success: false,
          error: 'Margin service unavailable'
        });
      }

      const { region = 'US', includeHistory = false } = req.query;
      const userId = req.user.id;

      const marginReport = await marginService.getMarginReport(userId, region);

      // Optionally include historical margin calls
      if (includeHistory) {
        const historicalCalls = Array.from(marginService.marginCalls.values())
          .filter(call => call.userId === userId && call.region === region)
          .sort((a, b) => b.createdAt - a.createdAt);
        
        marginReport.historicalMarginCalls = historicalCalls;
      }

      res.json({
        success: true,
        data: marginReport
      });

    } catch (error) {
      console.error('Get margin report error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get Margin Rules for Region (Public endpoint)
router.get(
  '/rules/:region',
  [
    param('region').isString().isLength({ min: 2, max: 10 }).withMessage('Invalid region code')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      if (!regionConfigService) {
        return res.status(503).json({
          success: false,
          error: 'Region config service unavailable'
        });
      }

      const { region } = req.params;
      const marginRules = await regionConfigService.getMarginRules(region);

      if (!marginRules) {
        return res.status(404).json({
          success: false,
          error: 'Margin rules not found for region'
        });
      }

      // Remove sensitive internal parameters
      const publicMarginRules = {
        defaultInitialMarginRate: marginRules.defaultInitialMarginRate,
        defaultMaintenanceMarginRate: marginRules.defaultMaintenanceMarginRate,
        marginCallGracePeriod: marginRules.marginCallGracePeriod,
        marginCallThreshold: marginRules.marginCallThreshold,
        crossMarginingEnabled: marginRules.crossMarginingEnabled,
        portfolioMarginingEnabled: marginRules.portfolioMarginingEnabled,
        region
      };

      res.json({
        success: true,
        data: publicMarginRules
      });

    } catch (error) {
      console.error('Get margin rules error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Admin: Force Margin Call (Admin only)
router.post(
  '/admin/force-margin-call',
  authenticateToken,
  [
    body('userId').isString().notEmpty().withMessage('User ID is required'),
    body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Amount must be positive'),
    body('region').optional().isString().isLength({ min: 2, max: 10 }).withMessage('Invalid region code'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      if (!marginService) {
        return res.status(503).json({
          success: false,
          error: 'Margin service unavailable'
        });
      }

      // Check admin permissions
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { userId, amount, region = 'US', reason = 'administrative_action' } = req.body;

      const marginCall = await marginService.issueMarginCall(userId, amount, region);
      marginCall.forcedBy = req.user.id;
      marginCall.reason = reason;

      res.status(201).json({
        success: true,
        data: marginCall,
        message: 'Margin call issued successfully'
      });

    } catch (error) {
      console.error('Force margin call error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Margin API error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred in the margin service'
  });
});

module.exports = router;