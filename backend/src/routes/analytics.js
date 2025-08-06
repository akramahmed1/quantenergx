const express = require('express');
const { query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Analytics service status
router.get('/', (req, res) => {
  res.json({
    message: 'Analytics & Reporting API',
    endpoints: {
      dashboard: 'GET /analytics/dashboard',
      trading: 'GET /analytics/trading',
      positions: 'GET /analytics/positions',
      risk: 'GET /analytics/risk',
      compliance: 'GET /analytics/compliance',
      market: 'GET /analytics/market',
      reports: {
        trading: 'GET /analytics/reports/trading',
        positions: 'GET /analytics/reports/positions',
        risk: 'GET /analytics/reports/risk',
        compliance: 'GET /analytics/reports/compliance',
      },
    },
  });
});

// Get comprehensive dashboard analytics
router.get(
  '/dashboard',
  authenticateToken,
  [
    query('period').optional().isIn(['1D', '7D', '30D', '90D', '1Y']).withMessage('Invalid period'),
    query('portfolioId').optional().isString().withMessage('Portfolio ID must be string'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { period = '30D', portfolioId = 'default' } = req.query;
      const userId = req.user.id;

      // Generate comprehensive dashboard analytics
      const dashboard = await generateDashboardAnalytics(userId, portfolioId, period);

      res.json({
        success: true,
        dashboard,
        period,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get trading analytics
router.get(
  '/trading',
  authenticateToken,
  [
    query('period').optional().isIn(['1D', '7D', '30D', '90D', '1Y']).withMessage('Invalid period'),
    query('commodity').optional().isString().withMessage('Commodity must be string'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { period = '30D', commodity } = req.query;
      const userId = req.user.id;

      const analytics = await generateTradingAnalytics(userId, period, commodity);

      res.json({
        success: true,
        analytics,
        period,
        commodity: commodity || 'all',
      });
    } catch (error) {
      console.error('Trading analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get position analytics
router.get(
  '/positions',
  authenticateToken,
  [
    query('groupBy')
      .optional()
      .isIn(['commodity', 'date', 'region'])
      .withMessage('Invalid groupBy'),
    query('includeHistorical')
      .optional()
      .isBoolean()
      .withMessage('includeHistorical must be boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { groupBy = 'commodity', includeHistorical = false } = req.query;
      const userId = req.user.id;

      const analytics = await generatePositionAnalytics(userId, groupBy, includeHistorical);

      res.json({
        success: true,
        analytics,
        groupBy,
        includeHistorical,
      });
    } catch (error) {
      console.error('Position analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get risk analytics
router.get(
  '/risk',
  authenticateToken,
  [
    query('riskType')
      .optional()
      .isIn(['var', 'exposure', 'concentration', 'correlation'])
      .withMessage('Invalid risk type'),
    query('confidence')
      .optional()
      .isFloat({ min: 0.8, max: 0.99 })
      .withMessage('Confidence must be between 0.8 and 0.99'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { riskType = 'var', confidence = 0.95 } = req.query;
      const userId = req.user.id;

      const analytics = await generateRiskAnalytics(userId, riskType, confidence);

      res.json({
        success: true,
        analytics,
        riskType,
        confidence: parseFloat(confidence),
      });
    } catch (error) {
      console.error('Risk analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get compliance analytics
router.get(
  '/compliance',
  authenticateToken,
  [
    query('region').optional().isIn(['US', 'EU', 'UK', 'ME']).withMessage('Invalid region'),
    query('regulation').optional().isString().withMessage('Regulation must be string'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { region, regulation } = req.query;
      const userId = req.user.id;

      const analytics = await generateComplianceAnalytics(userId, region, regulation);

      res.json({
        success: true,
        analytics,
        region: region || 'all',
        regulation: regulation || 'all',
      });
    } catch (error) {
      console.error('Compliance analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get market analytics
router.get(
  '/market',
  [
    query('commodities')
      .optional()
      .isString()
      .withMessage('Commodities must be comma-separated string'),
    query('timeframe').optional().isIn(['1H', '1D', '1W', '1M']).withMessage('Invalid timeframe'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { commodities = 'crude_oil,natural_gas', timeframe = '1D' } = req.query;
      const commodityList = commodities.split(',');

      const analytics = await generateMarketAnalytics(commodityList, timeframe);

      res.json({
        success: true,
        analytics,
        commodities: commodityList,
        timeframe,
      });
    } catch (error) {
      console.error('Market analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Generate trading report
router.get(
  '/reports/trading',
  authenticateToken,
  [
    query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Invalid format'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { format = 'json', startDate, endDate } = req.query;
      const userId = req.user.id;

      const dateRange = {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: endDate || new Date().toISOString(),
      };

      const report = await generateTradingReport(userId, dateRange, format);

      if (format === 'json') {
        res.json({
          success: true,
          report,
          dateRange,
          format,
        });
      } else {
        // For CSV/PDF, set appropriate headers and send file
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=trading-report-${Date.now()}.${format}`
        );
        res.setHeader('Content-Type', getMimeType(format));
        res.send(report);
      }
    } catch (error) {
      console.error('Trading report error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Generate positions report
router.get(
  '/reports/positions',
  authenticateToken,
  [
    query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Invalid format'),
    query('asOfDate').optional().isISO8601().withMessage('Invalid as of date'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { format = 'json', asOfDate } = req.query;
      const userId = req.user.id;
      const reportDate = asOfDate || new Date().toISOString();

      const report = await generatePositionsReport(userId, reportDate, format);

      if (format === 'json') {
        res.json({
          success: true,
          report,
          asOfDate: reportDate,
          format,
        });
      } else {
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=positions-report-${Date.now()}.${format}`
        );
        res.setHeader('Content-Type', getMimeType(format));
        res.send(report);
      }
    } catch (error) {
      console.error('Positions report error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Analytics helper functions
async function generateDashboardAnalytics(userId, portfolioId, period) {
  // Mock implementation - in production, this would query actual data
  return {
    summary: {
      totalValue: 2500000,
      totalPnL: 125000,
      totalPnLPercent: 5.26,
      activePositions: 8,
      todaysTrades: 12,
      riskUtilization: 0.65,
    },
    performance: {
      dailyPnL: generateMockTimeSeries('daily_pnl', period),
      cumulativePnL: generateMockTimeSeries('cumulative_pnl', period),
      returns: generateMockTimeSeries('returns', period),
    },
    positions: {
      byCommodity: [
        { commodity: 'crude_oil', value: 1200000, pnl: 85000, weight: 0.48 },
        { commodity: 'natural_gas', value: 800000, pnl: 25000, weight: 0.32 },
        { commodity: 'renewable_certificates', value: 500000, pnl: 15000, weight: 0.2 },
      ],
      topPositions: [
        { symbol: 'CL_NOV23', commodity: 'crude_oil', quantity: 1000, value: 850000, pnl: 42000 },
        { symbol: 'NG_DEC23', commodity: 'natural_gas', quantity: 5000, value: 400000, pnl: 15000 },
      ],
    },
    risk: {
      var95: 125000,
      var99: 200000,
      maxDrawdown: -75000,
      sharpeRatio: 1.85,
      riskLimits: {
        utilizationPercent: 65,
        breachCount: 0,
        lastBreach: null,
      },
    },
    trading: {
      volume: {
        today: 15000000,
        month: 450000000,
        avgDaily: 18500000,
      },
      activity: {
        ordersPlaced: 45,
        tradesExecuted: 38,
        avgTradeSize: 125000,
        successRate: 0.84,
      },
    },
    compliance: {
      status: 'compliant',
      alerts: 0,
      lastCheck: new Date().toISOString(),
      reguiredActions: [],
    },
  };
}

async function generateTradingAnalytics(userId, period, commodity) {
  return {
    summary: {
      totalTrades: 156,
      totalVolume: 4500000000,
      avgTradeSize: 28846153,
      successfulTrades: 128,
      successRate: 0.82,
      totalPnL: 2350000,
      avgPnL: 15064,
    },
    performance: {
      pnlByTrade: generateMockTimeSeries('trade_pnl', period),
      volumeByDay: generateMockTimeSeries('volume', period),
      tradeCount: generateMockTimeSeries('trade_count', period),
    },
    breakdown: {
      byCommodity: commodity
        ? [{ commodity, trades: 156, volume: 4500000000, pnl: 2350000 }]
        : [
          { commodity: 'crude_oil', trades: 85, volume: 2500000000, pnl: 1200000 },
          { commodity: 'natural_gas', trades: 45, volume: 1500000000, pnl: 850000 },
          { commodity: 'renewable_certificates', trades: 26, volume: 500000000, pnl: 300000 },
        ],
      byDirection: [
        { direction: 'buy', trades: 78, volume: 2250000000, pnl: 1100000 },
        { direction: 'sell', trades: 78, volume: 2250000000, pnl: 1250000 },
      ],
      byOrderType: [
        { type: 'market', trades: 89, volume: 2800000000, avgSlippage: 0.02 },
        { type: 'limit', trades: 67, volume: 1700000000, fillRate: 0.85 },
      ],
    },
    metrics: {
      winRate: 0.71,
      avgWin: 45000,
      avgLoss: -18000,
      largestWin: 250000,
      largestLoss: -95000,
      profitFactor: 2.5,
    },
  };
}

async function generatePositionAnalytics(userId, groupBy, includeHistorical) {
  const basePositions = [
    {
      commodity: 'crude_oil',
      quantity: 15000,
      avgPrice: 78.5,
      currentPrice: 80.25,
      marketValue: 1203750,
      unrealizedPnL: 26250,
      weight: 0.48,
    },
    {
      commodity: 'natural_gas',
      quantity: 25000,
      avgPrice: 3.2,
      currentPrice: 3.35,
      marketValue: 83750,
      unrealizedPnL: 3750,
      weight: 0.32,
    },
  ];

  const analytics = {
    current: {
      positions: basePositions,
      summary: {
        totalValue: basePositions.reduce((sum, pos) => sum + pos.marketValue, 0),
        totalPnL: basePositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0),
        longPositions: basePositions.filter(pos => pos.quantity > 0).length,
        shortPositions: basePositions.filter(pos => pos.quantity < 0).length,
      },
    },
    concentration: {
      herfindahlIndex: 0.31,
      topCommodityWeight: 0.48,
      diversificationRatio: 0.75,
    },
    exposure: {
      grossExposure: 1287500,
      netExposure: 1287500,
      leverage: 1.15,
    },
  };

  if (includeHistorical) {
    analytics.historical = {
      positionHistory: generateMockTimeSeries('position_value', '30D'),
      pnlHistory: generateMockTimeSeries('position_pnl', '30D'),
    };
  }

  return analytics;
}

async function generateRiskAnalytics(userId, riskType, _confidence) {
  const baseRisk = {
    var: {
      var95: 125000,
      var99: 200000,
      expectedShortfall: 275000,
      backtest: {
        exceptions: 5,
        expectedExceptions: 13,
        pValue: 0.12,
      },
    },
    exposure: {
      grossExposure: 2500000,
      netExposure: 1200000,
      leverage: 2.08,
      concentration: {
        commodity: 0.48,
        geography: 0.65,
        counterparty: 0.25,
      },
    },
    stress: {
      scenarios: [
        { name: 'Oil Price Crash -30%', impact: -450000 },
        { name: 'Gas Supply Shock +50%', impact: +125000 },
        { name: 'Credit Spread Widening', impact: -85000 },
      ],
      worstCase: -450000,
    },
    correlation: {
      portfolioCorrelation: 0.65,
      commodityCorrelations: [
        { pair: 'crude_oil-natural_gas', correlation: 0.45 },
        { pair: 'crude_oil-gasoline', correlation: 0.85 },
        { pair: 'natural_gas-heating_oil', correlation: 0.32 },
      ],
    },
  };

  return riskType === 'all' ? baseRisk : { [riskType]: baseRisk[riskType] };
}

async function generateComplianceAnalytics(_userId, _region, _regulation) {
  return {
    overview: {
      complianceScore: 95,
      violations: 0,
      warnings: 2,
      lastAudit: '2024-01-15',
      nextAudit: '2024-04-15',
    },
    regulations: {
      US: {
        CFTC: { status: 'compliant', lastCheck: '2024-01-20' },
        FERC: { status: 'compliant', lastCheck: '2024-01-18' },
        EPA: { status: 'compliant', lastCheck: '2024-01-22' },
      },
      EU: {
        REMIT: { status: 'compliant', lastCheck: '2024-01-19' },
        MiFID_II: { status: 'compliant', lastCheck: '2024-01-21' },
        ETS: { status: 'warning', lastCheck: '2024-01-20', issues: ['Reporting delay'] },
      },
    },
    reporting: {
      required: 12,
      completed: 11,
      pending: 1,
      overdue: 0,
    },
    kycAml: {
      clientsReviewed: 45,
      clientsPending: 3,
      amlAlerts: 0,
      sanctionsChecks: 48,
    },
  };
}

async function generateMarketAnalytics(commodities, _timeframe) {
  return {
    overview: {
      totalCommodities: commodities.length,
      activeMarkets: commodities.length,
      avgVolatility: 0.25,
      marketSentiment: 'neutral',
    },
    commodities: commodities.map(commodity => ({
      commodity,
      price: getBasePrice(commodity),
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 0.05,
      volume: Math.random() * 10000000,
      volatility: 0.15 + Math.random() * 0.2,
      marketCap: Math.random() * 1000000000,
    })),
    correlations: generateCorrelationMatrix(commodities),
    technicalIndicators: commodities.reduce((acc, commodity) => {
      acc[commodity] = {
        rsi: 45 + Math.random() * 20,
        macd: (Math.random() - 0.5) * 2,
        bollinger: {
          upper: getBasePrice(commodity) * 1.02,
          middle: getBasePrice(commodity),
          lower: getBasePrice(commodity) * 0.98,
        },
      };
      return acc;
    }, {}),
    seasonality: {
      currentSeason: 'winter',
      seasonalTrends: commodities.map(commodity => ({
        commodity,
        seasonal_bias: Math.random() > 0.5 ? 'bullish' : 'bearish',
        strength: Math.random(),
      })),
    },
  };
}

async function generateTradingReport(userId, dateRange, format) {
  const reportData = {
    reportInfo: {
      generatedAt: new Date().toISOString(),
      period: dateRange,
      userId,
      format,
    },
    executiveSummary: {
      totalTrades: 156,
      totalVolume: 4500000000,
      totalPnL: 2350000,
      successRate: 0.82,
      avgTradeSize: 28846153,
    },
    tradeDetails: Array.from({ length: 50 }, (_, i) => ({
      tradeId: `T${String(i + 1).padStart(6, '0')}`,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      commodity: ['crude_oil', 'natural_gas', 'gasoline'][Math.floor(Math.random() * 3)],
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      quantity: Math.floor(Math.random() * 10000) + 1000,
      price: 50 + Math.random() * 100,
      value: 0,
      pnl: (Math.random() - 0.4) * 50000,
    })).map(trade => ({
      ...trade,
      value: trade.quantity * trade.price,
    })),
    performance: {
      daily: generateMockTimeSeries('daily_pnl', '30D'),
      monthly: generateMockTimeSeries('monthly_pnl', '12M'),
    },
  };

  if (format === 'csv') {
    return convertToCSV(reportData.tradeDetails);
  } else if (format === 'pdf') {
    return generatePDFReport(reportData);
  }

  return reportData;
}

async function generatePositionsReport(userId, asOfDate, format) {
  const positions = [
    {
      positionId: 'P000001',
      commodity: 'crude_oil',
      quantity: 15000,
      avgPrice: 78.5,
      currentPrice: 80.25,
      marketValue: 1203750,
      unrealizedPnL: 26250,
      lastUpdate: asOfDate,
    },
    {
      positionId: 'P000002',
      commodity: 'natural_gas',
      quantity: 25000,
      avgPrice: 3.2,
      currentPrice: 3.35,
      marketValue: 83750,
      unrealizedPnL: 3750,
      lastUpdate: asOfDate,
    },
  ];

  const reportData = {
    reportInfo: {
      generatedAt: new Date().toISOString(),
      asOfDate,
      userId,
      format,
    },
    summary: {
      totalPositions: positions.length,
      totalValue: positions.reduce((sum, pos) => sum + pos.marketValue, 0),
      totalPnL: positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0),
    },
    positions,
  };

  if (format === 'csv') {
    return convertToCSV(positions);
  } else if (format === 'pdf') {
    return generatePDFReport(reportData);
  }

  return reportData;
}

// Utility functions
function generateMockTimeSeries(type, period) {
  const days =
    period === '1D' ? 1 : period === '7D' ? 7 : period === '30D' ? 30 : period === '90D' ? 90 : 365;
  const data = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    let value;
    switch (type) {
    case 'daily_pnl':
      value = (Math.random() - 0.45) * 50000;
      break;
    case 'cumulative_pnl':
      value =
          i === days ? 0 : (data[data.length - 1]?.value || 0) + (Math.random() - 0.45) * 50000;
      break;
    case 'returns':
      value = (Math.random() - 0.5) * 0.05;
      break;
    case 'volume':
      value = Math.random() * 10000000 + 5000000;
      break;
    default:
      value = Math.random() * 100;
    }

    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
    });
  }

  return data;
}

function getBasePrice(commodity) {
  const basePrices = {
    crude_oil: 80.5,
    natural_gas: 3.2,
    heating_oil: 2.45,
    gasoline: 2.3,
    renewable_certificates: 45.0,
    carbon_credits: 85.0,
  };
  return basePrices[commodity] || 50.0;
}

function generateCorrelationMatrix(commodities) {
  const matrix = {};
  commodities.forEach(c1 => {
    matrix[c1] = {};
    commodities.forEach(c2 => {
      if (c1 === c2) {
        matrix[c1][c2] = 1.0;
      } else {
        matrix[c1][c2] = Math.random() * 0.8 - 0.4; // Correlation between -0.4 and 0.4
      }
    });
  });
  return matrix;
}

function getMimeType(format) {
  const mimeTypes = {
    csv: 'text/csv',
    pdf: 'application/pdf',
    json: 'application/json',
  };
  return mimeTypes[format] || 'application/octet-stream';
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

function generatePDFReport(data) {
  // Simplified PDF generation - in production, use a proper PDF library
  return `PDF Report Generated: ${JSON.stringify(data, null, 2)}`;
}

module.exports = router;
