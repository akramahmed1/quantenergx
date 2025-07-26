const express = require('express');
const router = express.Router();
const StreamingEngine = require('../services/streamingEngine');
const RiskAnalyticsService = require('../services/riskAnalyticsService');
const MultiExchangeConnector = require('../services/multiExchangeConnector');
const GridDataIngestionService = require('../services/gridDataIngestionService');
const EnhancedComplianceService = require('../services/enhancedComplianceService');
const CloudCostManagementService = require('../services/cloudCostManagementService');
const IoTSCADAIntegrationService = require('../services/iotSCADAIntegrationService');

// Initialize services
const streamingEngine = new StreamingEngine();
const riskAnalytics = new RiskAnalyticsService();
const exchangeConnector = new MultiExchangeConnector();
const gridDataService = new GridDataIngestionService();
const enhancedCompliance = new EnhancedComplianceService();
const cloudCostService = new CloudCostManagementService();
const iotSCADAService = new IoTSCADAIntegrationService();

// ===== STREAMING ENGINE ROUTES =====

/**
 * @route POST /api/v1/streaming/start
 * @desc Start the streaming engine
 */
router.post('/streaming/start', async (req, res) => {
  try {
    streamingEngine.start();
    
    // Start market data simulation
    streamingEngine.simulateMarketData();
    
    res.json({
      success: true,
      message: 'Streaming engine started successfully',
      status: streamingEngine.getStatus(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/streaming/stop
 * @desc Stop the streaming engine
 */
router.post('/streaming/stop', async (req, res) => {
  try {
    streamingEngine.stop();
    
    res.json({
      success: true,
      message: 'Streaming engine stopped successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/streaming/status
 * @desc Get streaming engine status and metrics
 */
router.get('/streaming/status', async (req, res) => {
  try {
    const status = streamingEngine.getStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/streaming/orders
 * @desc Submit order to streaming engine
 */
router.post('/streaming/orders', async (req, res) => {
  try {
    const { symbol, side, quantity, price, type } = req.body;
    
    if (!symbol || !side || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, side, quantity',
        timestamp: new Date().toISOString()
      });
    }
    
    const orderId = streamingEngine.submitOrder({
      symbol,
      side,
      quantity,
      price,
      type: type || 'market',
      trader: req.user?.id || 'system'
    });
    
    res.json({
      success: true,
      order_id: orderId,
      message: 'Order submitted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/streaming/market-data/:symbol
 * @desc Get current market data for symbol
 */
router.get('/streaming/market-data/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const marketData = streamingEngine.getMarketData(symbol);
    
    if (!marketData) {
      return res.status(404).json({
        success: false,
        error: 'Market data not found for symbol',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== RISK ANALYTICS ROUTES =====

/**
 * @route GET /api/v1/risk/var/:portfolioId
 * @desc Calculate Value at Risk for portfolio
 */
router.get('/risk/var/:portfolioId', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { confidence = 0.95, timeHorizon = 1 } = req.query;
    
    const varAnalysis = await riskAnalytics.calculateVaR(
      portfolioId, 
      parseFloat(confidence), 
      parseInt(timeHorizon)
    );
    
    res.json({
      success: true,
      data: varAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/risk/stress-test/:portfolioId
 * @desc Perform stress test on portfolio
 */
router.post('/risk/stress-test/:portfolioId', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { scenarioId = 'market_crash' } = req.body;
    
    const stressTestResults = await riskAnalytics.performStressTest(portfolioId, scenarioId);
    
    res.json({
      success: true,
      data: stressTestResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/risk/multi-commodity/:portfolioId
 * @desc Analyze multi-commodity risk exposures
 */
router.get('/risk/multi-commodity/:portfolioId', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    
    const commodityRisk = await riskAnalytics.analyzeMultiCommodityRisk(portfolioId);
    
    res.json({
      success: true,
      data: commodityRisk,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/risk/dashboard/:portfolioId
 * @desc Get comprehensive risk dashboard
 */
router.get('/risk/dashboard/:portfolioId', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    
    const dashboard = await riskAnalytics.generateRiskDashboard(portfolioId);
    
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== MULTI-EXCHANGE CONNECTOR ROUTES =====

/**
 * @route POST /api/v1/exchanges/connect/:exchangeId
 * @desc Connect to exchange
 */
router.post('/exchanges/connect/:exchangeId', async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const { credentials } = req.body;
    
    const connectionResult = await exchangeConnector.connectToExchange(exchangeId, credentials);
    
    res.json({
      success: true,
      data: connectionResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/exchanges/margin/dashboard
 * @desc Get unified margin dashboard
 */
router.get('/exchanges/margin/dashboard', async (req, res) => {
  try {
    const marginDashboard = await exchangeConnector.getUnifiedMarginDashboard();
    
    res.json({
      success: true,
      data: marginDashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/exchanges/clearing/dashboard
 * @desc Get unified clearing dashboard
 */
router.get('/exchanges/clearing/dashboard', async (req, res) => {
  try {
    const clearingDashboard = await exchangeConnector.getUnifiedClearingDashboard();
    
    res.json({
      success: true,
      data: clearingDashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/exchanges/arbitrage
 * @desc Analyze cross-market arbitrage opportunities
 */
router.get('/exchanges/arbitrage', async (req, res) => {
  try {
    const arbitrageAnalysis = await exchangeConnector.analyzeCrossMarketArbitrage();
    
    res.json({
      success: true,
      data: arbitrageAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== GRID DATA INGESTION ROUTES =====

/**
 * @route POST /api/v1/grid/ingestion/start
 * @desc Start automated grid data ingestion
 */
router.post('/grid/ingestion/start', async (req, res) => {
  try {
    const result = await gridDataService.startIngestion();
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/grid/dashboard
 * @desc Get grid status dashboard
 */
router.get('/grid/dashboard', async (req, res) => {
  try {
    const dashboard = await gridDataService.getGridStatusDashboard();
    
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/grid/congestion
 * @desc Get congestion analysis
 */
router.get('/grid/congestion', async (req, res) => {
  try {
    const { region, timeRange = '24h' } = req.query;
    
    const congestionAnalysis = await gridDataService.getCongestionAnalysis(region, timeRange);
    
    res.json({
      success: true,
      data: congestionAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== ENHANCED COMPLIANCE ROUTES =====

/**
 * @route POST /api/v1/compliance/communication/log
 * @desc Log communication event
 */
router.post('/compliance/communication/log', async (req, res) => {
  try {
    const communicationData = req.body;
    
    const logResult = await enhancedCompliance.logCommunication(communicationData);
    
    res.json({
      success: true,
      data: logResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/compliance/trade-intent/log
 * @desc Log trade intent for reconstruction
 */
router.post('/compliance/trade-intent/log', async (req, res) => {
  try {
    const tradeData = req.body;
    
    const intentLog = await enhancedCompliance.logTradeIntent(tradeData);
    
    res.json({
      success: true,
      data: intentLog,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/compliance/dashboard
 * @desc Get real-time compliance monitoring dashboard
 */
router.get('/compliance/dashboard', async (req, res) => {
  try {
    const dashboard = await enhancedCompliance.getComplianceDashboard();
    
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/compliance/audit/report
 * @desc Generate comprehensive audit report
 */
router.post('/compliance/audit/report', async (req, res) => {
  try {
    const { reportType = 'full', dateRange, region } = req.body;
    
    const auditReport = await enhancedCompliance.generateAuditReport(reportType, dateRange, region);
    
    res.json({
      success: true,
      data: auditReport,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== CLOUD COST MANAGEMENT ROUTES =====

/**
 * @route GET /api/v1/cloud-cost/dashboard
 * @desc Get cost management dashboard
 */
router.get('/cloud-cost/dashboard', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const dashboard = await cloudCostService.getCostDashboard(timeRange);
    
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/cloud-cost/collect
 * @desc Collect and analyze cloud cost data
 */
router.post('/cloud-cost/collect', async (req, res) => {
  try {
    const costData = await cloudCostService.collectCostData();
    
    res.json({
      success: true,
      data: costData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/cloud-cost/optimize
 * @desc Perform auto-optimization
 */
router.post('/cloud-cost/optimize', async (req, res) => {
  try {
    const { severity = 'medium' } = req.body;
    
    const optimizationResult = await cloudCostService.performAutoOptimization(severity);
    
    res.json({
      success: true,
      data: optimizationResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/cloud-cost/forecast
 * @desc Get cost forecast
 */
router.get('/cloud-cost/forecast', async (req, res) => {
  try {
    const { timeRange = '90d' } = req.query;
    
    const forecast = await cloudCostService.getCostForecast(timeRange);
    
    res.json({
      success: true,
      data: forecast,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== IOT/SCADA INTEGRATION ROUTES =====

/**
 * @route POST /api/v1/iot/devices/onboard
 * @desc Onboard new IoT/SCADA device
 */
router.post('/iot/devices/onboard', async (req, res) => {
  try {
    const deviceConfig = req.body;
    
    const onboardingResult = await iotSCADAService.onboardDevice(deviceConfig);
    
    res.json({
      success: true,
      data: onboardingResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/iot/dashboard
 * @desc Get IoT monitoring dashboard
 */
router.get('/iot/dashboard', async (req, res) => {
  try {
    const dashboard = await iotSCADAService.getMonitoringDashboard();
    
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/iot/devices/:deviceId/analytics
 * @desc Get device analytics and insights
 */
router.get('/iot/devices/:deviceId/analytics', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { timeRange = '24h' } = req.query;
    
    const analytics = await iotSCADAService.getDeviceAnalytics(deviceId, timeRange);
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/iot/devices/:deviceId/data
 * @desc Collect data from specific device
 */
router.post('/iot/devices/:deviceId/data', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const deviceData = await iotSCADAService.collectDeviceData(deviceId);
    
    res.json({
      success: true,
      data: deviceData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;