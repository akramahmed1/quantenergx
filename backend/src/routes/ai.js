/**
 * AI/ML Advanced Features Routes
 * Routes for LLM trade recommendations, sentiment analysis, and anomaly detection
 */
const express = require('express');
const router = express.Router();
const LLMTradeRecommendationService = require('../services/llmTradeRecommendationService');
const NLPSentimentAnalysisService = require('../services/nlpSentimentAnalysisService');
const AnomalyDetectionService = require('../services/anomalyDetectionService');

// Initialize services
const llmService = new LLMTradeRecommendationService();
const sentimentService = new NLPSentimentAnalysisService();
const anomalyService = new AnomalyDetectionService();

/**
 * @route POST /api/v1/ai/recommendations/generate
 * @desc Generate AI-powered trade recommendations
 * @access Private
 */
router.post('/recommendations/generate', async (req, res) => {
  try {
    const { portfolio_data, market_context } = req.body;

    if (!portfolio_data) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio data is required'
      });
    }

    const recommendations = await llmService.generateTradeRecommendations(
      portfolio_data,
      market_context || {}
    );

    res.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Trade recommendation generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate trade recommendations',
      details: error.message
    });
  }
});

/**
 * @route GET /api/v1/ai/recommendations/:portfolio_id
 * @desc Get recent recommendations for a portfolio
 * @access Private
 */
router.get('/recommendations/:portfolio_id', async (req, res) => {
  try {
    const { portfolio_id } = req.params;
    const { limit = 10 } = req.query;

    const recommendations = llmService.getRecentRecommendations(portfolio_id, parseInt(limit));

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recommendations',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/v1/ai/recommendations/:recommendation_id/performance
 * @desc Update recommendation performance with actual outcomes
 * @access Private
 */
router.put('/recommendations/:recommendation_id/performance', async (req, res) => {
  try {
    const { recommendation_id } = req.params;
    const { actual_outcome } = req.body;

    if (!actual_outcome) {
      return res.status(400).json({
        success: false,
        error: 'Actual outcome data is required'
      });
    }

    const updatedRecommendation = llmService.updateRecommendationPerformance(
      recommendation_id,
      actual_outcome
    );

    if (!updatedRecommendation) {
      return res.status(404).json({
        success: false,
        error: 'Recommendation not found'
      });
    }

    res.json({
      success: true,
      data: updatedRecommendation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update recommendation performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update recommendation performance',
      details: error.message
    });
  }
});

/**
 * @route POST /api/v1/ai/sentiment/analyze
 * @desc Analyze news sentiment for energy markets
 * @access Private
 */
router.post('/sentiment/analyze', async (req, res) => {
  try {
    const { timeframe = '24h', commodities = ['oil', 'gas', 'renewable'] } = req.body;

    const analysis = await sentimentService.analyzeSentiment(timeframe, commodities);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sentiment',
      details: error.message
    });
  }
});

/**
 * @route GET /api/v1/ai/sentiment/history
 * @desc Get sentiment analysis history
 * @access Private
 */
router.get('/sentiment/history', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const history = sentimentService.getSentimentHistory(parseInt(days));

    res.json({
      success: true,
      data: history,
      count: history.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get sentiment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sentiment history',
      details: error.message
    });
  }
});

/**
 * @route GET /api/v1/ai/sentiment/alerts
 * @desc Get real-time sentiment alerts
 * @access Private
 */
router.get('/sentiment/alerts', async (req, res) => {
  try {
    const alerts = sentimentService.getRealTimeAlerts();

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get sentiment alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sentiment alerts',
      details: error.message
    });
  }
});

/**
 * @route POST /api/v1/ai/anomalies/detect
 * @desc Detect anomalies in trading data
 * @access Private
 */
router.post('/anomalies/detect', async (req, res) => {
  try {
    const { data, commodities = ['oil', 'gas', 'renewable'], methods = ['all'] } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Valid data array is required'
      });
    }

    const anomalies = await anomalyService.detectAnomalies(data, commodities, methods);

    res.json({
      success: true,
      data: anomalies,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect anomalies',
      details: error.message
    });
  }
});

/**
 * @route GET /api/v1/ai/anomalies/recent
 * @desc Get recent anomalies
 * @access Private
 */
router.get('/anomalies/recent', async (req, res) => {
  try {
    const { hours = 24 } = req.query;

    const anomalies = anomalyService.getRecentAnomalies(parseInt(hours));

    res.json({
      success: true,
      data: anomalies,
      count: anomalies.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get recent anomalies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recent anomalies',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/v1/ai/anomalies/baselines/:commodity
 * @desc Update detection baselines for a commodity
 * @access Private
 */
router.put('/anomalies/baselines/:commodity', async (req, res) => {
  try {
    const { commodity } = req.params;
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Valid data array is required'
      });
    }

    const updatedBaselines = anomalyService.updateBaselines(commodity, data);

    res.json({
      success: true,
      data: updatedBaselines,
      commodity: commodity,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update baselines error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update baselines',
      details: error.message
    });
  }
});

/**
 * @route GET /api/v1/ai/dashboard
 * @desc Get comprehensive AI/ML dashboard data
 * @access Private
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;

    // Get data from all services
    const [sentimentAlerts, recentAnomalies] = await Promise.all([
      sentimentService.getRealTimeAlerts(),
      anomalyService.getRecentAnomalies(24)
    ]);

    const dashboard = {
      sentiment: {
        alerts: sentimentAlerts.slice(0, 5),
        alert_count: sentimentAlerts.length
      },
      anomalies: {
        recent: recentAnomalies.slice(0, 10),
        total_count: recentAnomalies.length,
        by_severity: {
          severe: recentAnomalies.filter(a => a.severity === 'SEVERE').length,
          moderate: recentAnomalies.filter(a => a.severity === 'MODERATE').length,
          mild: recentAnomalies.filter(a => a.severity === 'MILD').length
        }
      },
      recommendations: {
        total_active: 0, // Would be calculated from active recommendations
        performance_summary: {
          success_rate: 0.75, // Placeholder
          avg_return: 0.08
        }
      },
      system_status: {
        llm_service: 'operational',
        sentiment_service: 'operational',
        anomaly_service: 'operational',
        last_updated: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve AI dashboard data',
      details: error.message
    });
  }
});

/**
 * @route POST /api/v1/ai/portfolio/rebalance
 * @desc Get AI-powered portfolio rebalancing recommendations
 * @access Private
 */
router.post('/portfolio/rebalance', async (req, res) => {
  try {
    const { portfolio_data, constraints = {} } = req.body;

    if (!portfolio_data) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio data is required'
      });
    }

    // Use existing ML service for portfolio optimization
    const MLPredictionService = require('../services/mlPredictionService');
    const mlService = new MLPredictionService();
    
    // Initialize the portfolio optimization model
    await mlService.trainModel('portfolio_optimization_rl');
    
    const optimization = await mlService.optimizeAssets(portfolio_data, constraints);

    res.json({
      success: true,
      data: optimization,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Portfolio rebalancing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate rebalancing recommendations',
      details: error.message
    });
  }
});

/**
 * @route POST /api/v1/ai/scenario/simulate
 * @desc Run scenario simulation for risk analysis
 * @access Private
 */
router.post('/scenario/simulate', async (req, res) => {
  try {
    const { portfolio_data, scenarios, simulation_params = {} } = req.body;

    if (!portfolio_data || !scenarios) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio data and scenarios are required'
      });
    }

    // Simulate scenario analysis
    const results = scenarios.map(scenario => {
      const impact = simulateScenarioImpact(portfolio_data, scenario);
      return {
        scenario_id: scenario.id || `SCENARIO_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        scenario_name: scenario.name,
        description: scenario.description,
        probability: scenario.probability || 0.1,
        portfolio_impact: impact,
        risk_metrics: calculateScenarioRiskMetrics(portfolio_data, impact),
        mitigation_strategies: generateMitigationStrategies(scenario, impact)
      };
    });

    res.json({
      success: true,
      data: {
        simulation_id: `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        portfolio_id: portfolio_data.portfolio_id,
        scenarios: results,
        summary: generateScenarioSummary(results),
        recommendations: generateScenarioRecommendations(results)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scenario simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run scenario simulation',
      details: error.message
    });
  }
});

// Helper methods for scenario simulation
function simulateScenarioImpact(portfolioData, scenario) {
  // Simplified scenario impact calculation
  const baseValue = portfolioData.total_value || 1000000;
  let impactMultiplier = 1.0;

  // Apply scenario-specific impacts
  if (scenario.oil_price_change) {
    impactMultiplier *= (1 + scenario.oil_price_change * 0.5); // 50% correlation assumption
  }
  if (scenario.gas_price_change) {
    impactMultiplier *= (1 + scenario.gas_price_change * 0.3);
  }
  if (scenario.volatility_change) {
    impactMultiplier *= (1 - Math.abs(scenario.volatility_change) * 0.1);
  }

  return {
    absolute_change: baseValue * (impactMultiplier - 1),
    percentage_change: (impactMultiplier - 1) * 100,
    new_value: baseValue * impactMultiplier
  };
}

function calculateScenarioRiskMetrics(portfolioData, impact) {
  return {
    var_95: Math.abs(impact.absolute_change) * 1.2,
    expected_shortfall: Math.abs(impact.absolute_change) * 1.5,
    maximum_drawdown: Math.min(impact.percentage_change, 0),
    recovery_time_estimate: Math.abs(impact.percentage_change) * 2 // weeks
  };
}

function generateMitigationStrategies(scenario, impact) {
  const strategies = [];

  if (impact.percentage_change < -10) {
    strategies.push({
      strategy: 'Increase hedging positions',
      description: 'Add protective derivatives to limit downside risk',
      estimated_cost: Math.abs(impact.absolute_change) * 0.02
    });
  }

  if (scenario.volatility_change > 0.5) {
    strategies.push({
      strategy: 'Reduce position sizes',
      description: 'Decrease exposure during high volatility periods',
      estimated_impact: 'Reduce potential losses by 30-40%'
    });
  }

  strategies.push({
    strategy: 'Portfolio diversification',
    description: 'Spread risk across uncorrelated assets',
    estimated_impact: 'Reduce scenario impact by 15-25%'
  });

  return strategies;
}

function generateScenarioSummary(results) {
  return {
    worst_case_impact: Math.min(...results.map(r => r.portfolio_impact.percentage_change)),
    best_case_impact: Math.max(...results.map(r => r.portfolio_impact.percentage_change)),
    average_impact: results.reduce((sum, r) => sum + r.portfolio_impact.percentage_change, 0) / results.length,
    high_risk_scenarios: results.filter(r => r.portfolio_impact.percentage_change < -10).length
  };
}

function generateScenarioRecommendations(results) {
  const recommendations = [];

  const severeScenarios = results.filter(r => r.portfolio_impact.percentage_change < -15);
  if (severeScenarios.length > 0) {
    recommendations.push({
      type: 'RISK_MITIGATION',
      priority: 'HIGH',
      action: 'Implement immediate hedging strategies for severe downside scenarios',
      affected_scenarios: severeScenarios.length
    });
  }

  const highProbabilityRisks = results.filter(r => r.probability > 0.2 && r.portfolio_impact.percentage_change < -5);
  if (highProbabilityRisks.length > 0) {
    recommendations.push({
      type: 'PROACTIVE_HEDGING',
      priority: 'MEDIUM',
      action: 'Consider preemptive hedging for high-probability negative scenarios',
      affected_scenarios: highProbabilityRisks.length
    });
  }

  return recommendations;
}

module.exports = router;