const express = require('express');
const { query, validationResult } = require('express-validator');
const MarketDataService = require('../services/marketDataService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize market data service with error handling
let marketDataService;
try {
  marketDataService = new MarketDataService();
} catch (error) {
  console.error('Failed to initialize MarketDataService:', error);
  marketDataService = null;
}

// Market data API status
router.get('/', (req, res) => {
  res.json({
    message: 'Market Data API',
    endpoints: {
      prices: 'GET /market/prices/:commodity',
      analytics: 'GET /market/analytics/:commodity',
      report: 'GET /market/report',
      commodities: 'GET /market/commodities'
    },
    supportedCommodities: marketDataService ? Object.keys(marketDataService.commodities) : [],
    serviceStatus: marketDataService ? 'online' : 'offline'
  });
});

// Get supported commodities
router.get('/commodities', (req, res) => {
  if (!marketDataService) {
    return res.status(503).json({
      success: false,
      error: 'Market data service unavailable'
    });
  }
  
  res.json({
    success: true,
    commodities: marketDataService.commodities
  });
});

// Get market prices for a commodity
router.get('/prices/:commodity',
  [
    query('symbol').optional().isString(),
    query('timeframe').optional().isIn(['1H', '1D', '1W', '1M', '30D', '90D', '1Y'])
  ],
  async (req, res) => {
    try {
      if (!marketDataService) {
        return res.status(503).json({
          success: false,
          error: 'Market data service unavailable'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { commodity } = req.params;
      const { symbol, timeframe = '1D' } = req.query;

      // Validate commodity
      if (!marketDataService.commodities[commodity]) {
        return res.status(404).json({
          success: false,
          error: `Commodity '${commodity}' not supported`
        });
      }

      const symbolToUse = symbol || marketDataService.commodities[commodity].symbols[0];
      const marketData = await marketDataService.getMarketData(commodity, symbolToUse, timeframe);

      res.json({
        success: true,
        marketData
      });

    } catch (error) {
      console.error('Market data error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get analytics for a commodity
router.get('/analytics/:commodity',
  [
    query('period').optional().isIn(['30D', '90D', '1Y'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { commodity } = req.params;
      const { period = '30D' } = req.query;

      // Validate commodity
      if (!marketDataService.commodities[commodity]) {
        return res.status(404).json({
          success: false,
          error: `Commodity '${commodity}' not supported`
        });
      }

      const analytics = await marketDataService.getAggregatedAnalytics(commodity, period);

      res.json({
        success: true,
        analytics
      });

    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Generate comprehensive market report
router.get('/report',
  authenticateToken,
  [
    query('commodities').optional().isString(),
    query('period').optional().isIn(['30D', '90D', '1Y'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { commodities, period = '30D' } = req.query;
      
      // Parse commodities list or use all available
      const commodityList = commodities ? 
        commodities.split(',').filter(c => marketDataService.commodities[c]) :
        Object.keys(marketDataService.commodities);

      if (commodityList.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid commodities specified'
        });
      }

      const report = await marketDataService.generateMarketReport(commodityList, period);

      res.json({
        success: true,
        report
      });

    } catch (error) {
      console.error('Market report error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get real-time quotes (WebSocket endpoint would be better for this)
router.get('/quotes',
  [
    query('symbols').isString().withMessage('Symbols parameter is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { symbols } = req.query;
      const symbolList = symbols.split(',');

      const quotes = await Promise.all(
        symbolList.map(async (symbol) => {
          try {
            // Find commodity for this symbol
            const commodity = Object.keys(marketDataService.commodities)
              .find(c => marketDataService.commodities[c].symbols.includes(symbol));
            
            if (!commodity) {
              return { symbol, error: 'Symbol not found' };
            }

            const data = await marketDataService.getMarketData(commodity, symbol, '1D');
            const latestPrice = data.data[data.data.length - 1];
            
            return {
              symbol,
              commodity,
              price: latestPrice.close,
              change: latestPrice.close - latestPrice.open,
              changePercent: ((latestPrice.close - latestPrice.open) / latestPrice.open) * 100,
              volume: latestPrice.volume,
              timestamp: latestPrice.timestamp
            };
          } catch (error) {
            return { symbol, error: error.message };
          }
        })
      );

      res.json({
        success: true,
        quotes,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Quotes error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get historical volatility
router.get('/volatility/:commodity',
  [
    query('period').optional().isIn(['30D', '90D', '1Y']),
    query('window').optional().isNumeric()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { commodity } = req.params;
      const { period = '90D', window = 30 } = req.query;

      if (!marketDataService.commodities[commodity]) {
        return res.status(404).json({
          success: false,
          error: `Commodity '${commodity}' not supported`
        });
      }

      const analytics = await marketDataService.getAggregatedAnalytics(commodity, period);
      
      res.json({
        success: true,
        volatility: {
          current: analytics.volatilityMetrics.current,
          regime: analytics.volatilityMetrics.regime,
          percentile: analytics.volatilityMetrics.percentile,
          forecast: analytics.volatilityMetrics.garchForecast,
          period,
          window: parseInt(window)
        }
      });

    } catch (error) {
      console.error('Volatility error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get correlations between commodities
router.get('/correlations',
  [
    query('base').isString().withMessage('Base commodity is required'),
    query('targets').isString().withMessage('Target commodities are required'),
    query('period').optional().isIn(['30D', '90D', '1Y'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { base, targets, period = '90D' } = req.query;
      const targetList = targets.split(',');

      if (!marketDataService.commodities[base]) {
        return res.status(404).json({
          success: false,
          error: `Base commodity '${base}' not supported`
        });
      }

      const analytics = await marketDataService.getAggregatedAnalytics(base, period);
      const correlations = {};

      // Get correlations from the analytics
      Object.keys(analytics.correlations).forEach(commodity => {
        if (targetList.includes(commodity)) {
          correlations[commodity] = analytics.correlations[commodity];
        }
      });

      res.json({
        success: true,
        base,
        correlations,
        period
      });

    } catch (error) {
      console.error('Correlations error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;