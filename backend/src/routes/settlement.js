const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const SettlementService = require('../services/settlementService');
const RegionConfigService = require('../services/regionConfigService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize services
let settlementService, regionConfigService;
try {
  regionConfigService = new RegionConfigService();
  settlementService = new SettlementService(regionConfigService);
} catch (error) {
  console.error('Failed to initialize Settlement services:', error);
  settlementService = null;
  regionConfigService = null;
}

// Settlement module routes overview
router.get('/', (req, res) => {
  res.json({
    message: 'Settlement Processing API',
    endpoints: {
      'create-instruction': 'POST /settlement/instructions',
      'get-instructions': 'GET /settlement/instructions',
      'instruction-details': 'GET /settlement/instructions/:settlementId',
      'execute-settlement': 'PUT /settlement/instructions/:settlementId/execute',
      'cancel-settlement': 'PUT /settlement/instructions/:settlementId/cancel',
      'workflow-status': 'GET /settlement/workflows/:workflowId',
      'settlement-history': 'GET /settlement/history'
    },
    serviceStatus: settlementService ? 'online' : 'offline',
    supportedSettlementTypes: ['cash', 'physical', 'net_cash'],
    supportedRegions: ['US', 'EU', 'UK', 'APAC', 'CA']
  });
});

// Create Settlement Instruction
router.post(
  '/instructions',
  authenticateToken,
  [
    body('contractId').isUUID().withMessage('Valid contract ID is required'),
    body('settlementType').isIn(['cash', 'physical', 'net_cash']).withMessage('Invalid settlement type'),
    body('amount').isNumeric().isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('settlementDate').optional().isISO8601().withMessage('Invalid settlement date'),
    body('region').optional().isString().isLength({ min: 2, max: 10 }).withMessage('Invalid region code'),
    body('deliveryInstructions').optional().isObject().withMessage('Delivery instructions must be an object'),
    body('autoSettle').optional().isBoolean().withMessage('Auto settle must be boolean')
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

      if (!settlementService) {
        return res.status(503).json({
          success: false,
          error: 'Settlement service unavailable'
        });
      }

      const {
        contractId,
        settlementType,
        amount,
        currency = 'USD',
        settlementDate,
        region = 'US',
        deliveryInstructions,
        autoSettle = false
      } = req.body;

      const instruction = await settlementService.createSettlementInstruction({
        contractId,
        userId: req.user.id,
        settlementType,
        amount,
        currency,
        settlementDate,
        region,
        deliveryInstructions,
        autoSettle
      });

      res.status(201).json({
        success: true,
        data: instruction,
        message: 'Settlement instruction created successfully'
      });

    } catch (error) {
      console.error('Settlement instruction creation error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get User Settlement Instructions
router.get(
  '/instructions',
  authenticateToken,
  [
    query('region').optional().isString().isLength({ min: 2, max: 10 }).withMessage('Invalid region code'),
    query('status').optional().isIn(['pending', 'processing', 'settled', 'failed', 'cancelled']).withMessage('Invalid status'),
    query('settlementType').optional().isIn(['cash', 'physical', 'net_cash']).withMessage('Invalid settlement type'),
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

      if (!settlementService) {
        return res.status(503).json({
          success: false,
          error: 'Settlement service unavailable'
        });
      }

      const { region, status, settlementType, page = 1, limit = 20 } = req.query;
      const userId = req.user.id;

      let instructions = await settlementService.getUserSettlements(userId, region);

      // Apply filters
      if (status) {
        instructions = instructions.filter(instruction => instruction.status === status);
      }
      if (settlementType) {
        instructions = instructions.filter(instruction => instruction.settlementType === settlementType);
      }

      // Sort by creation date (newest first)
      instructions.sort((a, b) => b.createdAt - a.createdAt);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedInstructions = instructions.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          instructions: paginatedInstructions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: instructions.length,
            hasMore: endIndex < instructions.length
          }
        }
      });

    } catch (error) {
      console.error('Get settlement instructions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get Settlement Instruction Details
router.get(
  '/instructions/:settlementId',
  authenticateToken,
  [
    param('settlementId').isUUID().withMessage('Invalid settlement ID')
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

      if (!settlementService) {
        return res.status(503).json({
          success: false,
          error: 'Settlement service unavailable'
        });
      }

      const { settlementId } = req.params;
      const instruction = await settlementService.getSettlementInstruction(settlementId);

      if (!instruction) {
        return res.status(404).json({
          success: false,
          error: 'Settlement instruction not found'
        });
      }

      // Verify user ownership
      if (instruction.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Get associated workflow
      const workflow = Array.from(settlementService.settlementWorkflows.values())
        .find(w => w.settlementId === settlementId);

      res.json({
        success: true,
        data: {
          instruction,
          workflow
        }
      });

    } catch (error) {
      console.error('Get settlement instruction details error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Execute Settlement
router.put(
  '/instructions/:settlementId/execute',
  authenticateToken,
  [
    param('settlementId').isUUID().withMessage('Invalid settlement ID')
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

      if (!settlementService) {
        return res.status(503).json({
          success: false,
          error: 'Settlement service unavailable'
        });
      }

      const { settlementId } = req.params;
      const instruction = await settlementService.getSettlementInstruction(settlementId);

      if (!instruction) {
        return res.status(404).json({
          success: false,
          error: 'Settlement instruction not found'
        });
      }

      // Verify user ownership
      if (instruction.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      if (instruction.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: `Cannot execute settlement in status: ${instruction.status}`
        });
      }

      const executedInstruction = await settlementService.executeSettlement(settlementId);

      res.json({
        success: true,
        data: executedInstruction,
        message: 'Settlement execution initiated successfully'
      });

    } catch (error) {
      console.error('Settlement execution error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Cancel Settlement
router.put(
  '/instructions/:settlementId/cancel',
  authenticateToken,
  [
    param('settlementId').isUUID().withMessage('Invalid settlement ID'),
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

      if (!settlementService) {
        return res.status(503).json({
          success: false,
          error: 'Settlement service unavailable'
        });
      }

      const { settlementId } = req.params;
      const { reason = 'user_request' } = req.body;

      const instruction = await settlementService.getSettlementInstruction(settlementId);

      if (!instruction) {
        return res.status(404).json({
          success: false,
          error: 'Settlement instruction not found'
        });
      }

      // Verify user ownership
      if (instruction.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const cancelledInstruction = await settlementService.cancelSettlement(settlementId, reason);

      res.json({
        success: true,
        data: cancelledInstruction,
        message: 'Settlement cancelled successfully'
      });

    } catch (error) {
      console.error('Settlement cancellation error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get Settlement Workflow Status
router.get(
  '/workflows/:workflowId',
  authenticateToken,
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID')
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

      if (!settlementService) {
        return res.status(503).json({
          success: false,
          error: 'Settlement service unavailable'
        });
      }

      const { workflowId } = req.params;
      const workflow = await settlementService.getSettlementWorkflow(workflowId);

      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Settlement workflow not found'
        });
      }

      // Get associated settlement instruction to verify ownership
      const instruction = await settlementService.getSettlementInstruction(workflow.settlementId);
      
      if (!instruction || instruction.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: workflow
      });

    } catch (error) {
      console.error('Get workflow status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get Settlement History
router.get(
  '/history',
  authenticateToken,
  [
    query('region').optional().isString().isLength({ min: 2, max: 10 }).withMessage('Invalid region code'),
    query('settlementType').optional().isIn(['cash', 'physical', 'net_cash']).withMessage('Invalid settlement type'),
    query('fromDate').optional().isISO8601().withMessage('Invalid from date'),
    query('toDate').optional().isISO8601().withMessage('Invalid to date'),
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

      if (!settlementService) {
        return res.status(503).json({
          success: false,
          error: 'Settlement service unavailable'
        });
      }

      const { 
        region, 
        settlementType, 
        fromDate, 
        toDate, 
        page = 1, 
        limit = 20 
      } = req.query;
      const userId = req.user.id;

      // Get settled instructions from history
      let settlements = Array.from(settlementService.settlementHistory.values())
        .filter(settlement => settlement.userId === userId);

      // Apply filters
      if (region) {
        settlements = settlements.filter(settlement => settlement.region === region);
      }
      if (settlementType) {
        settlements = settlements.filter(settlement => settlement.settlementType === settlementType);
      }
      if (fromDate) {
        const from = new Date(fromDate);
        settlements = settlements.filter(settlement => settlement.completedAt >= from);
      }
      if (toDate) {
        const to = new Date(toDate);
        settlements = settlements.filter(settlement => settlement.completedAt <= to);
      }

      // Sort by completion date (newest first)
      settlements.sort((a, b) => b.completedAt - a.completedAt);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedSettlements = settlements.slice(startIndex, endIndex);

      // Calculate summary statistics
      const summary = {
        totalSettlements: settlements.length,
        totalAmount: settlements.reduce((sum, s) => sum + s.finalAmount, 0),
        byType: {
          cash: settlements.filter(s => s.settlementType === 'cash').length,
          physical: settlements.filter(s => s.settlementType === 'physical').length,
          net_cash: settlements.filter(s => s.settlementType === 'net_cash').length
        },
        byRegion: {}
      };

      // Count by region
      settlements.forEach(settlement => {
        summary.byRegion[settlement.region] = (summary.byRegion[settlement.region] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          settlements: paginatedSettlements,
          summary,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: settlements.length,
            hasMore: endIndex < settlements.length
          }
        }
      });

    } catch (error) {
      console.error('Get settlement history error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get Settlement Rules for Region (Public endpoint)
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
      const settlementRules = await regionConfigService.getSettlementRules(region);

      if (!settlementRules) {
        return res.status(404).json({
          success: false,
          error: 'Settlement rules not found for region'
        });
      }

      // Remove sensitive internal parameters
      const publicSettlementRules = {
        standardSettlementPeriod: settlementRules.standardSettlementPeriod,
        supportedSettlementMethods: settlementRules.supportedSettlementMethods,
        physicalDeliveryEnabled: settlementRules.physicalDeliveryEnabled,
        cashSettlementEnabled: settlementRules.cashSettlementEnabled,
        nettingEnabled: settlementRules.nettingEnabled,
        cutoffTimes: settlementRules.cutoffTimes,
        region
      };

      res.json({
        success: true,
        data: publicSettlementRules
      });

    } catch (error) {
      console.error('Get settlement rules error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get Settlements by Status (Admin endpoint)
router.get(
  '/admin/status/:status',
  authenticateToken,
  [
    param('status').isIn(['pending', 'processing', 'settled', 'failed', 'cancelled']).withMessage('Invalid status'),
    query('region').optional().isString().isLength({ min: 2, max: 10 }).withMessage('Invalid region code'),
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

      if (!settlementService) {
        return res.status(503).json({
          success: false,
          error: 'Settlement service unavailable'
        });
      }

      // Check admin permissions
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { status } = req.params;
      const { region, page = 1, limit = 20 } = req.query;

      const settlements = await settlementService.getSettlementsByStatus(status, region);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedSettlements = settlements.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          settlements: paginatedSettlements,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: settlements.length,
            hasMore: endIndex < settlements.length
          }
        }
      });

    } catch (error) {
      console.error('Get settlements by status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Settlement API error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred in the settlement service'
  });
});

module.exports = router;