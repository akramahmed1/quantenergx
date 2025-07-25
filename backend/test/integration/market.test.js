const request = require('supertest');
const express = require('express');
const marketRoutes = require('../../src/routes/market');

// Mock the services
jest.mock('../../src/services/marketDataService');

const app = express();
app.use(express.json());
app.use('/api/v1/market', marketRoutes);

describe('Market API Integration Tests', () => {
  describe('GET /api/v1/market/', () => {
    it('should return API status and endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/market/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Market Data API');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('supportedCommodities');
    });
  });

  describe('GET /api/v1/market/commodities', () => {
    it('should return supported commodities', async () => {
      const response = await request(app)
        .get('/api/v1/market/commodities')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('commodities');
      expect(typeof response.body.commodities).toBe('object');
    });
  });

  describe('GET /api/v1/market/prices/:commodity', () => {
    it('should return market data for a valid commodity', async () => {
      const response = await request(app)
        .get('/api/v1/market/prices/crude_oil')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('marketData');
    });

    it('should return 404 for unsupported commodity', async () => {
      const response = await request(app)
        .get('/api/v1/market/prices/invalid_commodity')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should accept timeframe parameter', async () => {
      const response = await request(app)
        .get('/api/v1/market/prices/crude_oil?timeframe=1W')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 400 for invalid timeframe', async () => {
      const response = await request(app)
        .get('/api/v1/market/prices/crude_oil?timeframe=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/v1/market/analytics/:commodity', () => {
    it('should return analytics for a valid commodity', async () => {
      const response = await request(app)
        .get('/api/v1/market/analytics/crude_oil')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('analytics');
    });

    it('should accept period parameter', async () => {
      const response = await request(app)
        .get('/api/v1/market/analytics/crude_oil?period=90D')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/v1/market/quotes', () => {
    it('should return quotes for valid symbols', async () => {
      const response = await request(app)
        .get('/api/v1/market/quotes?symbols=CL,NG')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('quotes');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 400 when symbols parameter is missing', async () => {
      const response = await request(app)
        .get('/api/v1/market/quotes')
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/v1/market/volatility/:commodity', () => {
    it('should return volatility data for a valid commodity', async () => {
      const response = await request(app)
        .get('/api/v1/market/volatility/crude_oil')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('volatility');
      expect(response.body.volatility).toHaveProperty('current');
      expect(response.body.volatility).toHaveProperty('regime');
    });

    it('should accept period and window parameters', async () => {
      const response = await request(app)
        .get('/api/v1/market/volatility/crude_oil?period=90D&window=20')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.volatility).toHaveProperty('period', '90D');
      expect(response.body.volatility).toHaveProperty('window', 20);
    });
  });

  describe('GET /api/v1/market/correlations', () => {
    it('should return correlations for valid commodities', async () => {
      const response = await request(app)
        .get('/api/v1/market/correlations?base=crude_oil&targets=natural_gas,heating_oil')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('base', 'crude_oil');
      expect(response.body).toHaveProperty('correlations');
    });

    it('should return 400 when required parameters are missing', async () => {
      const response = await request(app)
        .get('/api/v1/market/correlations')
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });
});