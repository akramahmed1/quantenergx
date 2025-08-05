const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const DerivativesService = require('../services/derivativesService');
const MarginService = require('../services/marginService');
const RegionConfigService = require('../services/regionConfigService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize services
let derivativesService, marginService, regionConfigService;
try {
  regionConfigService = new RegionConfigService();
  marginService = new MarginService(regionConfigService);
  derivativesService = new DerivativesService(regionConfigService, marginService);
} catch (error) {
  console.error('Failed to initialize Derivatives services:', error);
  derivativesService = null;
  marginService = null;
  regionConfigService = null;
}

// Derivatives module routes overview
router.get('/', (req, res) => {
  res.json({
    message: 'Derivatives Trading API',
    endpoints: {
      futures: 'POST /derivatives/futures',
      options: 'POST /derivatives/options',
      swaps: 'POST /derivatives/swaps',
      structured_notes: 'POST /derivatives/structured-notes',
      contracts: 'GET /derivatives/contracts',
      contract_details: 'GET /derivatives/contracts/:contractId',
      market_data: 'GET /derivatives/market-data/:commodity',
      terminate: 'PUT /derivatives/contracts/:contractId/terminate',
    },
    serviceStatus: derivativesService ? 'online' : 'offline',
    supportedDerivatives: ['future', 'option', 'swap', 'structured_note'],
    supportedRegions: ['US', 'EU', 'UK', 'APAC', 'CA'],
  });
});

// Create Future Contract
router.post(
  '/futures',
  authenticateToken,
  [
    body('underlyingCommodity')
      .isString()
      .notEmpty()
      .withMessage('Underlying commodity is required'),
    body('notionalAmount')
      .isNumeric()
      .isFloat({ min: 1000 })
      .withMessage('Notional amount must be at least $1,000'),
    body('deliveryDate').isISO8601().withMessage('Valid delivery date is required'),
    body('settlementType')
      .optional()
      .isIn(['cash', 'physical'])
      .withMessage('Settlement type must be cash or physical'),
    body('region')
      .optional()
      .isString()
      .isLength({ min: 2, max: 10 })
      .withMessage('Invalid region code'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      if (!derivativesService) {
        return res.status(503).json({
          success: false,
          error: 'Derivatives service unavailable',
        });
      }

      const {
        underlyingCommodity,
        notionalAmount,
        deliveryDate,
        settlementType = 'cash',
        region = 'US',
      } = req.body;

      const contract = await derivativesService.createFutureContract({
        underlyingCommodity,
        notionalAmount,
        deliveryDate,
        settlementType,
        region,
        userId: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: contract,
        message: 'Future contract created successfully',
      });
    } catch (error) {
      console.error('Future contract creation error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Create Option Contract
router.post(
  '/options',
  authenticateToken,
  [
    body('underlyingCommodity')
      .isString()
      .notEmpty()
      .withMessage('Underlying commodity is required'),
    body('notionalAmount')
      .isNumeric()
      .isFloat({ min: 1000 })
      .withMessage('Notional amount must be at least $1,000'),
    body('optionType').isIn(['call', 'put']).withMessage('Option type must be call or put'),
    body('strikePrice')
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Strike price must be positive'),
    body('expirationDate').isISO8601().withMessage('Valid expiration date is required'),
    body('exerciseStyle')
      .optional()
      .isIn(['american', 'european', 'bermudan'])
      .withMessage('Invalid exercise style'),
    body('region')
      .optional()
      .isString()
      .isLength({ min: 2, max: 10 })
      .withMessage('Invalid region code'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      if (!derivativesService) {
        return res.status(503).json({
          success: false,
          error: 'Derivatives service unavailable',
        });
      }

      const {
        underlyingCommodity,
        notionalAmount,
        optionType,
        strikePrice,
        expirationDate,
        exerciseStyle = 'european',
        region = 'US',
      } = req.body;

      const contract = await derivativesService.createOptionContract({
        underlyingCommodity,
        notionalAmount,
        optionType,
        strikePrice,
        expirationDate,
        exerciseStyle,
        region,
        userId: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: contract,
        message: 'Option contract created successfully',
      });
    } catch (error) {
      console.error('Option contract creation error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Create Swap Contract
router.post(
  '/swaps',
  authenticateToken,
  [
    body('underlyingCommodity')
      .isString()
      .notEmpty()
      .withMessage('Underlying commodity is required'),
    body('notionalAmount')
      .isNumeric()
      .isFloat({ min: 1000 })
      .withMessage('Notional amount must be at least $1,000'),
    body('swapType')
      .isIn(['commodity_swap', 'basis_swap', 'calendar_swap'])
      .withMessage('Invalid swap type'),
    body('fixedRate').optional().isNumeric().withMessage('Fixed rate must be numeric'),
    body('floatingRateIndex')
      .optional()
      .isString()
      .withMessage('Floating rate index must be a string'),
    body('paymentFrequency')
      .optional()
      .isIn(['monthly', 'quarterly', 'semi-annual', 'annual'])
      .withMessage('Invalid payment frequency'),
    body('maturityDate').isISO8601().withMessage('Valid maturity date is required'),
    body('region')
      .optional()
      .isString()
      .isLength({ min: 2, max: 10 })
      .withMessage('Invalid region code'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      if (!derivativesService) {
        return res.status(503).json({
          success: false,
          error: 'Derivatives service unavailable',
        });
      }

      const {
        underlyingCommodity,
        notionalAmount,
        swapType,
        fixedRate,
        floatingRateIndex,
        paymentFrequency = 'quarterly',
        maturityDate,
        region = 'US',
      } = req.body;

      const contract = await derivativesService.createSwapContract({
        underlyingCommodity,
        notionalAmount,
        swapType,
        fixedRate,
        floatingRateIndex,
        paymentFrequency,
        maturityDate,
        region,
        userId: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: contract,
        message: 'Swap contract created successfully',
      });
    } catch (error) {
      console.error('Swap contract creation error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Create Structured Note
router.post(
  '/structured-notes',
  authenticateToken,
  [
    body('underlyingCommodity')
      .isString()
      .notEmpty()
      .withMessage('Underlying commodity is required'),
    body('notionalAmount')
      .isNumeric()
      .isFloat({ min: 1000 })
      .withMessage('Notional amount must be at least $1,000'),
    body('noteType')
      .isIn(['autocall', 'barrier_note', 'range_accrual'])
      .withMessage('Invalid note type'),
    body('principalProtection')
      .optional()
      .isNumeric()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Principal protection must be between 0-100%'),
    body('maturityDate').isISO8601().withMessage('Valid maturity date is required'),
    body('payoffStructure').isObject().withMessage('Payoff structure is required'),
    body('region')
      .optional()
      .isString()
      .isLength({ min: 2, max: 10 })
      .withMessage('Invalid region code'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      if (!derivativesService) {
        return res.status(503).json({
          success: false,
          error: 'Derivatives service unavailable',
        });
      }

      const {
        underlyingCommodity,
        notionalAmount,
        noteType,
        principalProtection = 100,
        maturityDate,
        payoffStructure,
        region = 'US',
      } = req.body;

      const contract = await derivativesService.createStructuredNote({
        underlyingCommodity,
        notionalAmount,
        noteType,
        principalProtection,
        maturityDate,
        payoffStructure,
        region,
        userId: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: contract,
        message: 'Structured note created successfully',
      });
    } catch (error) {
      console.error('Structured note creation error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get User Contracts
router.get(
  '/contracts',
  authenticateToken,
  [
    query('region')
      .optional()
      .isString()
      .isLength({ min: 2, max: 10 })
      .withMessage('Invalid region code'),
    query('type')
      .optional()
      .isIn(['future', 'option', 'swap', 'structured_note'])
      .withMessage('Invalid contract type'),
    query('status')
      .optional()
      .isIn(['active', 'expired', 'terminated', 'settled'])
      .withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      if (!derivativesService) {
        return res.status(503).json({
          success: false,
          error: 'Derivatives service unavailable',
        });
      }

      const { region, type, status, page = 1, limit = 20 } = req.query;

      let contracts = await derivativesService.getUserContracts(req.user.id, region);

      // Apply filters
      if (type) {
        contracts = contracts.filter(contract => contract.type === type);
      }
      if (status) {
        contracts = contracts.filter(contract => contract.status === status);
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedContracts = contracts.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          contracts: paginatedContracts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: contracts.length,
            hasMore: endIndex < contracts.length,
          },
        },
      });
    } catch (error) {
      console.error('Get contracts error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get Contract Details
router.get(
  '/contracts/:contractId',
  authenticateToken,
  [param('contractId').isUUID().withMessage('Invalid contract ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      if (!derivativesService) {
        return res.status(503).json({
          success: false,
          error: 'Derivatives service unavailable',
        });
      }

      const { contractId } = req.params;
      const contract = await derivativesService.getContract(contractId);

      if (!contract) {
        return res.status(404).json({
          success: false,
          error: 'Contract not found',
        });
      }

      // In production, verify user ownership

      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      console.error('Get contract details error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Terminate Contract
router.put(
  '/contracts/:contractId/terminate',
  authenticateToken,
  [
    param('contractId').isUUID().withMessage('Invalid contract ID'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      if (!derivativesService) {
        return res.status(503).json({
          success: false,
          error: 'Derivatives service unavailable',
        });
      }

      const { contractId } = req.params;
      const { reason = 'user_request' } = req.body;

      const contract = await derivativesService.terminateContract(contractId, reason);

      res.json({
        success: true,
        data: contract,
        message: 'Contract terminated successfully',
      });
    } catch (error) {
      console.error('Contract termination error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get Market Data for Derivatives
router.get(
  '/market-data/:commodity',
  authenticateToken,
  [
    param('commodity').isString().notEmpty().withMessage('Commodity is required'),
    query('region')
      .optional()
      .isString()
      .isLength({ min: 2, max: 10 })
      .withMessage('Invalid region code'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      if (!derivativesService) {
        return res.status(503).json({
          success: false,
          error: 'Derivatives service unavailable',
        });
      }

      const { commodity } = req.params;
      const { region = 'US' } = req.query;

      // Get market data from the service
      const marketData = derivativesService.marketData.get(commodity);

      if (!marketData) {
        return res.status(404).json({
          success: false,
          error: 'Market data not found for commodity',
        });
      }

      // Add derivative-specific market data
      const derivativeMarketData = {
        commodity,
        spot: marketData.spot,
        volatility: marketData.volatility,
        riskFreeRate: marketData.riskFreeRate,
        lastUpdated: marketData.lastUpdated,
        region,
        derivatives: {
          impliedVolatility: marketData.volatility * (0.9 + Math.random() * 0.2),
          openInterest: Math.floor(Math.random() * 10000),
          averageVolume: Math.floor(Math.random() * 5000),
        },
      };

      res.json({
        success: true,
        data: derivativeMarketData,
      });
    } catch (error) {
      console.error('Get market data error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Update Market Data (Admin only - for demo purposes)
router.put(
  '/market-data/:commodity',
  authenticateToken,
  [
    param('commodity').isString().notEmpty().withMessage('Commodity is required'),
    body('spot').optional().isNumeric().withMessage('Spot price must be numeric'),
    body('volatility')
      .optional()
      .isNumeric()
      .isFloat({ min: 0, max: 2 })
      .withMessage('Volatility must be between 0 and 2'),
    body('riskFreeRate')
      .optional()
      .isNumeric()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Risk-free rate must be between 0 and 1'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      if (!derivativesService) {
        return res.status(503).json({
          success: false,
          error: 'Derivatives service unavailable',
        });
      }

      // Check admin permissions (simplified for demo)
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
      }

      const { commodity } = req.params;
      const marketDataUpdate = req.body;

      await derivativesService.updateMarketData(commodity, marketDataUpdate);

      res.json({
        success: true,
        message: 'Market data updated successfully',
        data: { commodity, updates: marketDataUpdate },
      });
    } catch (error) {
      console.error('Update market data error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Derivatives API error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred in the derivatives service',
  });
});

module.exports = router;
