const express = require('express');
const router = express.Router();
const ExchangeConnectorRegistry = require('../services/exchangeConnectorRegistry');
const EnhancedRegulatoryService = require('../services/enhancedRegulatoryService');

// Initialize services
const connectorRegistry = new ExchangeConnectorRegistry();
const regulatoryService = new EnhancedRegulatoryService();

/**
 * GET /api/exchanges
 * Get all registered exchange connectors
 */
router.get('/', async (req, res) => {
  try {
    const connectors = connectorRegistry.getRegisteredConnectors();

    res.json({
      success: true,
      data: connectors,
      total: connectors.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/exchanges/active
 * Get all active exchange connections
 */
router.get('/active', async (req, res) => {
  try {
    const connections = connectorRegistry.getActiveConnections();

    res.json({
      success: true,
      data: connections,
      total: connections.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/exchanges/health
 * Get system health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = connectorRegistry.getSystemHealth();

    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/exchanges/region/:region
 * Get connectors by region
 */
router.get('/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const connectors = connectorRegistry.getConnectorsByRegion(region);

    res.json({
      success: true,
      data: connectors,
      region,
      total: connectors.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/exchanges/market/:market
 * Get connectors by market
 */
router.get('/market/:market', async (req, res) => {
  try {
    const { market } = req.params;
    const connectors = connectorRegistry.getConnectorsByMarket(market);

    res.json({
      success: true,
      data: connectors,
      market,
      total: connectors.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/exchanges/regulation/:regulation
 * Get connectors by regulation
 */
router.get('/regulation/:regulation', async (req, res) => {
  try {
    const { regulation } = req.params;
    const connectors = connectorRegistry.getConnectorsByRegulation(regulation);

    res.json({
      success: true,
      data: connectors,
      regulation,
      total: connectors.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/exchanges/:exchangeId/connect
 * Connect to an exchange
 */
router.post('/:exchangeId/connect', async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const credentials = req.body;

    if (!credentials.apiKey || !credentials.apiSecret) {
      return res.status(400).json({
        success: false,
        error: 'API key and secret are required',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await connectorRegistry.connectToExchange(exchangeId, credentials);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/exchanges/:exchangeId/disconnect
 * Disconnect from an exchange
 */
router.post('/:exchangeId/disconnect', async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const result = await connectorRegistry.disconnectFromExchange(exchangeId);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/exchanges/disconnect-all
 * Disconnect from all exchanges
 */
router.post('/disconnect-all', async (req, res) => {
  try {
    const result = await connectorRegistry.disconnectAll();

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/exchanges/:exchangeId/orders
 * Submit order to an exchange
 */
router.post('/:exchangeId/orders', async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const orderData = req.body;

    // Validate order data
    const requiredFields = ['symbol', 'quantity', 'price', 'side'];
    const missingFields = requiredFields.filter(field => !orderData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
    }

    const result = await connectorRegistry.submitOrder(exchangeId, orderData);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/exchanges/:exchangeId/market-data/:symbol
 * Get market data for a symbol from an exchange
 */
router.get('/:exchangeId/market-data/:symbol', async (req, res) => {
  try {
    const { exchangeId, symbol } = req.params;
    const result = await connectorRegistry.getMarketData(exchangeId, symbol);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/exchanges/:exchangeId/market-data/subscribe
 * Subscribe to market data from an exchange
 */
router.post('/:exchangeId/market-data/subscribe', async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Symbols array is required',
        timestamp: new Date().toISOString(),
      });
    }

    // Callback function for market data updates (would typically use WebSocket)
    const callback = marketData => {
      console.log(`Market data update from ${exchangeId}:`, marketData);
      // In a real implementation, this would send data via WebSocket
    };

    const result = await connectorRegistry.subscribeToMarketData(exchangeId, symbols, callback);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/exchanges/find-best
 * Find best exchange for trading criteria
 */
router.post('/find-best', async (req, res) => {
  try {
    const criteria = req.body;
    const result = connectorRegistry.findBestExchange(criteria);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'No suitable exchange found for the given criteria',
        criteria,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: result,
      criteria,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/exchanges/plugins/load
 * Load external connector plugin
 */
router.post('/plugins/load', async (req, res) => {
  try {
    const { pluginPath, exchangeId } = req.body;

    if (!pluginPath || !exchangeId) {
      return res.status(400).json({
        success: false,
        error: 'Plugin path and exchange ID are required',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await connectorRegistry.loadConnectorPlugin(pluginPath, exchangeId);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
