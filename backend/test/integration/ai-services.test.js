/**
 * AI/ML Services Integration Tests
 * Tests for LLM recommendations, sentiment analysis, and anomaly detection
 */
const request = require('supertest');
const express = require('express');
const aiRoutes = require('../../src/routes/ai');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/v1/ai', aiRoutes);

describe('AI/ML Services Integration Tests', () => {
  
  describe('LLM Trade Recommendations', () => {
    test('should generate trade recommendations with portfolio data', async () => {
      const portfolioData = {
        portfolio_id: 'TEST_PORTFOLIO_001',
        total_value: 1000000,
        positions: [
          { commodity: 'crude_oil', quantity: 100, value: 500000 },
          { commodity: 'natural_gas', quantity: 200, value: 300000 }
        ],
        risk_profile: 'Moderate',
        investment_horizon: '6 months',
        returns_30d: 5.2,
        sharpe_ratio: 1.3,
        max_drawdown: -8.5
      };

      const marketContext = {
        oil_price: 78.50,
        gas_price: 3.25,
        volatility: 'Medium',
        economics: {
          gdp_growth: 2.8,
          inflation: 3.1,
          policy_support_renewables: true
        }
      };

      const response = await request(app)
        .post('/api/v1/ai/recommendations/generate')
        .send({ portfolio_data: portfolioData, market_context: marketContext })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('portfolio_id', 'TEST_PORTFOLIO_001');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('reasoning');
      expect(response.body.data).toHaveProperty('confidence_score');
      expect(response.body.data).toHaveProperty('risk_assessment');
      expect(response.body.data.recommendations).toBeInstanceOf(Array);
      expect(response.body.data.confidence_score).toBeGreaterThan(0);
      expect(response.body.data.confidence_score).toBeLessThanOrEqual(1);
    });

    test('should fail without portfolio data', async () => {
      const response = await request(app)
        .post('/api/v1/ai/recommendations/generate')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Portfolio data is required');
    });

    test('should get recent recommendations for portfolio', async () => {
      const response = await request(app)
        .get('/api/v1/ai/recommendations/TEST_PORTFOLIO_001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('count');
    });

    test('should update recommendation performance', async () => {
      // First generate a recommendation to get an ID
      const portfolioData = { portfolio_id: 'TEST_PORTFOLIO_002', total_value: 500000 };
      const genResponse = await request(app)
        .post('/api/v1/ai/recommendations/generate')
        .send({ portfolio_data: portfolioData })
        .expect(200);

      const recommendationId = genResponse.body.data.id;

      const actualOutcome = {
        return_percentage: 12.5,
        execution_date: new Date().toISOString(),
        final_value: 562500
      };

      const response = await request(app)
        .put(`/api/v1/ai/recommendations/${recommendationId}/performance`)
        .send({ actual_outcome: actualOutcome })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('actual_outcome');
      expect(response.body.data).toHaveProperty('performance_score');
    });
  });

  describe('NLP Sentiment Analysis', () => {
    test('should analyze news sentiment', async () => {
      const analysisRequest = {
        timeframe: '24h',
        commodities: ['oil', 'gas', 'renewable']
      };

      const response = await request(app)
        .post('/api/v1/ai/sentiment/analyze')
        .send(analysisRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analysis_id');
      expect(response.body.data).toHaveProperty('overall_sentiment');
      expect(response.body.data).toHaveProperty('commodity_sentiment');
      expect(response.body.data).toHaveProperty('key_themes');
      expect(response.body.data).toHaveProperty('confidence_score');
      expect(response.body.data.overall_sentiment).toHaveProperty('score');
      expect(response.body.data.overall_sentiment).toHaveProperty('label');
      expect(response.body.data.commodity_sentiment).toHaveProperty('oil');
      expect(response.body.data.commodity_sentiment).toHaveProperty('gas');
      expect(response.body.data.commodity_sentiment).toHaveProperty('renewable');
    });

    test('should get sentiment history', async () => {
      const response = await request(app)
        .get('/api/v1/ai/sentiment/history?days=7')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('count');
    });

    test('should get real-time sentiment alerts', async () => {
      const response = await request(app)
        .get('/api/v1/ai/sentiment/alerts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('count');
    });
  });

  describe('Anomaly Detection', () => {
    test('should detect anomalies in trading data', async () => {
      const tradingData = [
        { timestamp: '2024-07-30T10:00:00Z', commodity: 'oil', price: 75.50, volume: 1000 },
        { timestamp: '2024-07-30T11:00:00Z', commodity: 'oil', price: 76.20, volume: 1200 },
        { timestamp: '2024-07-30T12:00:00Z', commodity: 'oil', price: 125.80, volume: 5000 }, // Anomaly
        { timestamp: '2024-07-30T13:00:00Z', commodity: 'oil', price: 75.90, volume: 1100 },
        { timestamp: '2024-07-30T14:00:00Z', commodity: 'gas', price: 3.25, volume: 800 },
        { timestamp: '2024-07-30T15:00:00Z', commodity: 'gas', price: 3.30, volume: 850 }
      ];

      const detectionRequest = {
        data: tradingData,
        commodities: ['oil', 'gas'],
        methods: ['statistical', 'pattern']
      };

      const response = await request(app)
        .post('/api/v1/ai/anomalies/detect')
        .send(detectionRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analysis_id');
      expect(response.body.data).toHaveProperty('anomalies_detected');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data.anomalies_detected).toBeInstanceOf(Array);
      expect(response.body.data.summary).toHaveProperty('total_anomalies');
      expect(response.body.data.summary).toHaveProperty('by_severity');
    });

    test('should fail without data', async () => {
      const response = await request(app)
        .post('/api/v1/ai/anomalies/detect')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Valid data array is required');
    });

    test('should get recent anomalies', async () => {
      const response = await request(app)
        .get('/api/v1/ai/anomalies/recent?hours=24')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('count');
    });

    test('should update anomaly detection baselines', async () => {
      const baselineData = [
        { timestamp: '2024-07-25T10:00:00Z', price: 75.20, volume: 1000 },
        { timestamp: '2024-07-25T11:00:00Z', price: 75.80, volume: 1100 },
        { timestamp: '2024-07-25T12:00:00Z', price: 76.10, volume: 950 },
        { timestamp: '2024-07-25T13:00:00Z', price: 75.90, volume: 1050 }
      ];

      const response = await request(app)
        .put('/api/v1/ai/anomalies/baselines/oil')
        .send({ data: baselineData })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('mean');
      expect(response.body.data).toHaveProperty('std');
      expect(response.body.data).toHaveProperty('volatility');
      expect(response.body.data).toHaveProperty('updated_at');
      expect(response.body.commodity).toBe('oil');
    });
  });

  describe('AI Dashboard', () => {
    test('should get comprehensive AI dashboard data', async () => {
      const response = await request(app)
        .get('/api/v1/ai/dashboard?timeframe=24h')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sentiment');
      expect(response.body.data).toHaveProperty('anomalies');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('system_status');
      
      // Sentiment section
      expect(response.body.data.sentiment).toHaveProperty('alerts');
      expect(response.body.data.sentiment).toHaveProperty('alert_count');
      
      // Anomalies section
      expect(response.body.data.anomalies).toHaveProperty('recent');
      expect(response.body.data.anomalies).toHaveProperty('total_count');
      expect(response.body.data.anomalies).toHaveProperty('by_severity');
      
      // System status
      expect(response.body.data.system_status).toHaveProperty('llm_service');
      expect(response.body.data.system_status).toHaveProperty('sentiment_service');
      expect(response.body.data.system_status).toHaveProperty('anomaly_service');
    });
  });

  describe('Portfolio Rebalancing', () => {
    test('should generate rebalancing recommendations', async () => {
      const portfolioData = {
        portfolio_id: 'REBALANCE_TEST_001',
        total_value: 2000000,
        current_weights: {
          crude_oil: 0.4,
          natural_gas: 0.3,
          renewable_energy: 0.2,
          cash: 0.1
        },
        positions: [
          { commodity: 'crude_oil', value: 800000 },
          { commodity: 'natural_gas', value: 600000 },
          { commodity: 'renewable_energy', value: 400000 },
          { commodity: 'cash', value: 200000 }
        ]
      };

      const constraints = {
        max_single_position: 0.5,
        min_cash_reserve: 0.05,
        max_turnover: 0.3,
        risk_tolerance: 'moderate'
      };

      const response = await request(app)
        .post('/api/v1/ai/portfolio/rebalance')
        .send({ portfolio_data: portfolioData, constraints: constraints })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('optimization_id');
      expect(response.body.data).toHaveProperty('current_weights');
      expect(response.body.data).toHaveProperty('optimized_weights');
      expect(response.body.data).toHaveProperty('expected_return');
      expect(response.body.data).toHaveProperty('expected_risk');
      expect(response.body.data).toHaveProperty('rebalancing_plan');
    });

    test('should fail without portfolio data', async () => {
      const response = await request(app)
        .post('/api/v1/ai/portfolio/rebalance')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Portfolio data is required');
    });
  });

  describe('Scenario Simulation', () => {
    test('should run scenario simulation', async () => {
      const portfolioData = {
        portfolio_id: 'SCENARIO_TEST_001',
        total_value: 1500000,
        positions: [
          { commodity: 'crude_oil', allocation: 0.5 },
          { commodity: 'natural_gas', allocation: 0.3 },
          { commodity: 'renewable_energy', allocation: 0.2 }
        ]
      };

      const scenarios = [
        {
          id: 'oil_crash',
          name: 'Oil Price Crash',
          description: 'Oil prices drop by 30% due to oversupply',
          probability: 0.15,
          oil_price_change: -0.30,
          gas_price_change: -0.10,
          volatility_change: 0.5
        },
        {
          id: 'renewable_boom',
          name: 'Renewable Energy Boom',
          description: 'Renewable energy sector surges on new policies',
          probability: 0.25,
          oil_price_change: -0.05,
          gas_price_change: -0.08,
          renewable_price_change: 0.40
        }
      ];

      const response = await request(app)
        .post('/api/v1/ai/scenario/simulate')
        .send({ 
          portfolio_data: portfolioData, 
          scenarios: scenarios,
          simulation_params: { time_horizon: '6_months' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('simulation_id');
      expect(response.body.data).toHaveProperty('scenarios');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data.scenarios).toHaveLength(2);
      
      // Check scenario results
      response.body.data.scenarios.forEach(scenario => {
        expect(scenario).toHaveProperty('scenario_id');
        expect(scenario).toHaveProperty('portfolio_impact');
        expect(scenario).toHaveProperty('risk_metrics');
        expect(scenario).toHaveProperty('mitigation_strategies');
        expect(scenario.portfolio_impact).toHaveProperty('percentage_change');
        expect(scenario.risk_metrics).toHaveProperty('var_95');
      });
    });

    test('should fail without required data', async () => {
      const response = await request(app)
        .post('/api/v1/ai/scenario/simulate')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Portfolio data and scenarios are required');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/ai/recommendations/generate')
        .send('{"invalid": json}')
        .expect(400);

      // The exact error depends on Express's JSON parser
      expect(response.body.success).toBeFalsy();
    });

    test('should handle large payloads appropriately', async () => {
      const largeData = Array(10000).fill().map((_, i) => ({
        timestamp: new Date(Date.now() + i * 60000).toISOString(),
        commodity: 'oil',
        price: 75 + Math.random() * 10,
        volume: 1000 + Math.random() * 500
      }));

      const response = await request(app)
        .post('/api/v1/ai/anomalies/detect')
        .send({ data: largeData, commodities: ['oil'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data_points).toBe(10000);
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent requests efficiently', async () => {
      const portfolioData = {
        portfolio_id: 'PERF_TEST_001',
        total_value: 1000000
      };

      const requests = Array(5).fill().map(() => 
        request(app)
          .post('/api/v1/ai/recommendations/generate')
          .send({ portfolio_data: portfolioData })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('should complete sentiment analysis within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/v1/ai/sentiment/analyze')
        .send({ timeframe: '24h', commodities: ['oil', 'gas'] })
        .expect(200);

      const duration = Date.now() - startTime;
      
      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

module.exports = {
  app
};