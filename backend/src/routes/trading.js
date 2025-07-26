const express = require('express');
const { body, query, validationResult } = require('express-validator');
const TradingService = require('../services/tradingService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize trading service
let tradingService;
try {
  tradingService = new TradingService();
} catch (error) {
  console.error('Failed to initialize TradingService:', error);
  tradingService = null;
}

// Trading module routes
router.get('/', (req, res) => {
  res.json({
    message: 'Trading API',
    endpoints: {
      orders: 'GET/POST /trading/orders',
      'order-management': 'PUT/DELETE /trading/orders/:orderId',
      portfolio: 'GET /trading/portfolio',
      positions: 'GET /trading/positions',
      trades: 'GET /trading/trades',
      orderbook: 'GET /trading/orderbook/:commodity',
    },
    serviceStatus: tradingService ? 'online' : 'offline',
  });
});

// Place a new order
router.post(
  '/orders',
  authenticateToken,
  [
    body('commodity').isString().notEmpty().withMessage('Commodity is required'),
    body('side').isIn(['buy', 'sell']).withMessage('Side must be buy or sell'),
    body('type').isIn(['market', 'limit', 'stop', 'stop_limit']).withMessage('Invalid order type'),
    body('quantity').isNumeric().isFloat({ min: 0 }).withMessage('Quantity must be positive'),
    body('price').optional().isNumeric().isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('stopPrice')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Stop price must be positive'),
    body('timeInForce')
      .optional()
      .isIn(['day', 'gtc', 'ioc', 'fok'])
      .withMessage('Invalid time in force'),
  ],
  async (req, res) => {
    try {
      if (!tradingService) {
        return res.status(503).json({
          success: false,
          error: 'Trading service unavailable',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const orderRequest = {
        ...req.body,
        userId: req.user.id,
        timeInForce: req.body.timeInForce || 'day',
      };

      const order = await tradingService.placeOrder(orderRequest);

      res.status(201).json({
        success: true,
        order,
      });
    } catch (error) {
      console.error('Order placement error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get orders
router.get(
  '/orders',
  authenticateToken,
  [
    query('status')
      .optional()
      .isIn(['pending', 'partial', 'filled', 'cancelled'])
      .withMessage('Invalid status'),
    query('commodity').optional().isString().withMessage('Commodity must be string'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
  ],
  async (req, res) => {
    try {
      if (!tradingService) {
        return res.status(503).json({
          success: false,
          error: 'Trading service unavailable',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { status, commodity, limit = 100 } = req.query;
      let orders = tradingService.getUserOrders(req.user.id, status);

      if (commodity) {
        orders = orders.filter(order => order.commodity === commodity);
      }

      // Sort by creation time descending
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      orders = orders.slice(0, parseInt(limit));

      res.json({
        success: true,
        orders,
        total: orders.length,
      });
    } catch (error) {
      console.error('Orders retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get specific order
router.get('/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    if (!tradingService) {
      return res.status(503).json({
        success: false,
        error: 'Trading service unavailable',
      });
    }

    const { orderId } = req.params;
    const order = tradingService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Check if user owns this order
    if (order.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Order retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Modify an order
router.put(
  '/orders/:orderId',
  authenticateToken,
  [
    body('quantity')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Quantity must be positive'),
    body('price').optional().isNumeric().isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('stopPrice')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Stop price must be positive'),
  ],
  async (req, res) => {
    try {
      if (!tradingService) {
        return res.status(503).json({
          success: false,
          error: 'Trading service unavailable',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { orderId } = req.params;
      const order = tradingService.getOrder(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      // Check if user owns this order
      if (order.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      const modifiedOrder = await tradingService.modifyOrder(orderId, req.body);

      res.json({
        success: true,
        order: modifiedOrder,
      });
    } catch (error) {
      console.error('Order modification error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Cancel an order
router.delete('/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    if (!tradingService) {
      return res.status(503).json({
        success: false,
        error: 'Trading service unavailable',
      });
    }

    const { orderId } = req.params;
    const order = tradingService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Check if user owns this order
    if (order.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const cancelledOrder = await tradingService.cancelOrder(orderId);

    res.json({
      success: true,
      order: cancelledOrder,
    });
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get user portfolio
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    if (!tradingService) {
      return res.status(503).json({
        success: false,
        error: 'Trading service unavailable',
      });
    }

    const portfolio = await tradingService.getPortfolioSummary(req.user.id);

    res.json({
      success: true,
      portfolio,
    });
  } catch (error) {
    console.error('Portfolio retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get user positions
router.get(
  '/positions',
  authenticateToken,
  [query('commodity').optional().isString().withMessage('Commodity must be string')],
  async (req, res) => {
    try {
      if (!tradingService) {
        return res.status(503).json({
          success: false,
          error: 'Trading service unavailable',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      let positions = tradingService.getUserPositions(req.user.id);

      if (req.query.commodity) {
        positions = positions.filter(pos => pos.commodity === req.query.commodity);
      }

      // Update unrealized P&L for all positions
      for (const position of positions) {
        await tradingService.updateUnrealizedPnL(position);
      }

      const summary = {
        totalPositions: positions.length,
        totalValue: positions.reduce((sum, pos) => sum + Math.abs(pos.quantity * pos.avgPrice), 0),
        totalPnL: positions.reduce((sum, pos) => sum + pos.realizedPnL + pos.unrealizedPnL, 0),
        realizedPnL: positions.reduce((sum, pos) => sum + pos.realizedPnL, 0),
        unrealizedPnL: positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0),
      };

      res.json({
        success: true,
        positions,
        summary,
      });
    } catch (error) {
      console.error('Positions retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get trade history
router.get(
  '/trades',
  authenticateToken,
  [
    query('commodity').optional().isString().withMessage('Commodity must be string'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
  ],
  async (req, res) => {
    try {
      if (!tradingService) {
        return res.status(503).json({
          success: false,
          error: 'Trading service unavailable',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { commodity, limit = 100 } = req.query;
      const trades = tradingService.getTradeHistory(req.user.id, commodity, parseInt(limit));

      const summary = {
        totalTrades: trades.length,
        totalVolume: trades.reduce((sum, trade) => sum + trade.quantity, 0),
        totalValue: trades.reduce((sum, trade) => sum + trade.value, 0),
      };

      res.json({
        success: true,
        trades,
        summary,
      });
    } catch (error) {
      console.error('Trades retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get order book
router.get(
  '/orderbook/:commodity',
  [
    query('depth')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Depth must be between 1 and 100'),
  ],
  async (req, res) => {
    try {
      if (!tradingService) {
        return res.status(503).json({
          success: false,
          error: 'Trading service unavailable',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { commodity } = req.params;
      const { depth = 10 } = req.query;

      const orderBook = tradingService.getOrderBook(commodity, parseInt(depth));

      res.json({
        success: true,
        orderBook,
      });
    } catch (error) {
      console.error('Order book retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

module.exports = router;
