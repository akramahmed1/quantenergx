const request = require('supertest');
const fs = require('fs');
const path = require('path');

describe('Regression Tests', () => {
  let app;
  let baselineData;
  
  beforeAll(async () => {
    app = require('../../src/server');
    
    // Load baseline performance data if it exists
    const baselinePath = path.join(__dirname, '..', '..', 'performance-baseline.json');
    if (fs.existsSync(baselinePath)) {
      baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    }
  });

  describe('API Contract Regression', () => {
    it('should maintain API response structure for user profile', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer valid-test-token')
        .expect(200);

      // Verify expected response structure hasn't changed
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        email: expect.any(String),
        preferences: expect.any(Object),
        createdAt: expect.any(String),
        // Add other expected fields
      });

      // Verify no unexpected fields were added
      const expectedFields = ['id', 'email', 'preferences', 'createdAt', 'updatedAt'];
      const responseFields = Object.keys(response.body);
      const unexpectedFields = responseFields.filter(field => !expectedFields.includes(field));
      
      expect(unexpectedFields).toHaveLength(0);
    });

    it('should maintain API response structure for market prices', async () => {
      const response = await request(app)
        .get('/api/market/prices?symbols=CRUDE_OIL')
        .set('Authorization', 'Bearer valid-test-token')
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({
            symbol: expect.any(String),
            price: expect.any(Number),
            timestamp: expect.any(String),
            volume: expect.any(Number),
          })
        ]),
        timestamp: expect.any(String),
      });
    });

    it('should maintain trading order API contract', async () => {
      const orderData = {
        symbol: 'CRUDE_OIL',
        side: 'buy',
        quantity: 100,
        orderType: 'market'
      };

      const response = await request(app)
        .post('/api/trading/orders')
        .set('Authorization', 'Bearer valid-test-token')
        .send(orderData)
        .expect(200);

      expect(response.body).toMatchObject({
        orderId: expect.any(String),
        status: expect.any(String),
        symbol: orderData.symbol,
        side: orderData.side,
        quantity: orderData.quantity,
        orderType: orderData.orderType,
        timestamp: expect.any(String),
      });
    });
  });

  describe('Performance Regression', () => {
    it('should not regress in response time for critical endpoints', async () => {
      const criticalEndpoints = [
        '/api/health',
        '/api/user/profile',
        '/api/market/prices',
        '/api/trading/instruments'
      ];

      for (const endpoint of criticalEndpoints) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', 'Bearer valid-test-token');
        
        const responseTime = Date.now() - startTime;
        
        // Check against baseline if available
        if (baselineData && baselineData[endpoint]) {
          const baselineTime = baselineData[endpoint].responseTime;
          const regressionThreshold = baselineTime * 1.5; // 50% slower is regression
          
          expect(responseTime).toBeLessThan(regressionThreshold);
        } else {
          // Default thresholds
          const defaultThresholds = {
            '/api/health': 500,
            '/api/user/profile': 1500,
            '/api/market/prices': 2000,
            '/api/trading/instruments': 2000
          };
          
          expect(responseTime).toBeLessThan(defaultThresholds[endpoint] || 3000);
        }
      }
    });

    it('should maintain memory usage within acceptable limits', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform a series of operations that previously caused memory issues
      const operations = Array(100).fill(null).map(() =>
        request(app)
          .get('/api/market/prices?symbols=CRUDE_OIL,NATURAL_GAS,BRENT_OIL')
          .set('Authorization', 'Bearer valid-test-token')
      );

      await Promise.all(operations);
      
      // Allow garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Security Regression', () => {
    it('should maintain authentication requirements', async () => {
      const protectedEndpoints = [
        '/api/user/profile',
        '/api/trading/orders',
        '/api/trading/positions',
        '/api/user/settings'
      ];

      for (const endpoint of protectedEndpoints) {
        // Should reject requests without authentication
        await request(app)
          .get(endpoint)
          .expect(401);

        // Should reject requests with invalid token
        await request(app)
          .get(endpoint)
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      }
    });

    it('should maintain input validation for trading orders', async () => {
      const invalidOrders = [
        { symbol: '', side: 'buy', quantity: 100 }, // Empty symbol
        { symbol: 'CRUDE_OIL', side: 'invalid', quantity: 100 }, // Invalid side
        { symbol: 'CRUDE_OIL', side: 'buy', quantity: -100 }, // Negative quantity
        { symbol: 'CRUDE_OIL', side: 'buy', quantity: 0 }, // Zero quantity
        { symbol: 'CRUDE_OIL', side: 'buy' }, // Missing quantity
      ];

      for (const invalidOrder of invalidOrders) {
        const response = await request(app)
          .post('/api/trading/orders')
          .set('Authorization', 'Bearer valid-test-token')
          .send(invalidOrder);

        expect([400, 422].includes(response.status)).toBe(true);
      }
    });

    it('should maintain rate limiting protection', async () => {
      // Make rapid requests to trigger rate limiting
      const rapidRequests = Array(50).fill(null).map(() =>
        request(app)
          .get('/api/market/prices')
          .set('Authorization', 'Bearer valid-test-token')
      );

      const responses = await Promise.allSettled(rapidRequests);
      
      // Should have some rate limited responses
      const rateLimitedResponses = responses.filter(
        r => r.status === 'fulfilled' && r.value.status === 429
      );
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Regression', () => {
    it('should maintain proper error response format', async () => {
      // Test various error scenarios
      const errorScenarios = [
        {
          request: () => request(app).get('/api/nonexistent'),
          expectedStatus: 404
        },
        {
          request: () => request(app).post('/api/trading/orders')
            .set('Authorization', 'Bearer valid-test-token')
            .send({}),
          expectedStatus: 400
        }
      ];

      for (const scenario of errorScenarios) {
        const response = await scenario.request();
        expect(response.status).toBe(scenario.expectedStatus);
        
        // Error response should have proper structure
        expect(response.body).toMatchObject({
          error: expect.any(String),
          status: scenario.expectedStatus,
        });
        
        // Should not expose sensitive information
        expect(response.body.error).not.toMatch(/password|secret|key|token|database/i);
      }
    });

    it('should maintain graceful handling of malformed requests', async () => {
      const malformedRequests = [
        () => request(app)
          .post('/api/trading/orders')
          .set('Authorization', 'Bearer valid-test-token')
          .set('Content-Type', 'application/json')
          .send('invalid json{'),
        
        () => request(app)
          .post('/api/user/profile')
          .set('Authorization', 'Bearer valid-test-token')
          .set('Content-Type', 'application/json')
          .send('"unclosed string'),
      ];

      for (const requestFn of malformedRequests) {
        const response = await requestFn();
        
        // Should handle malformed requests gracefully
        expect([400, 422].includes(response.status)).toBe(true);
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Integration Regression', () => {
    it('should maintain end-to-end trading workflow', async () => {
      // Test complete trading workflow hasn't regressed
      
      // 1. Get user profile
      const profileResponse = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer valid-test-token')
        .expect(200);

      // 2. Get available instruments
      const instrumentsResponse = await request(app)
        .get('/api/trading/instruments')
        .set('Authorization', 'Bearer valid-test-token')
        .expect(200);

      expect(instrumentsResponse.body).toBeInstanceOf(Array);
      expect(instrumentsResponse.body.length).toBeGreaterThan(0);

      // 3. Get market prices
      const pricesResponse = await request(app)
        .get('/api/market/prices?symbols=CRUDE_OIL')
        .set('Authorization', 'Bearer valid-test-token')
        .expect(200);

      expect(pricesResponse.body.data).toBeInstanceOf(Array);

      // 4. Place a test order
      const orderResponse = await request(app)
        .post('/api/trading/orders')
        .set('Authorization', 'Bearer valid-test-token')
        .send({
          symbol: 'CRUDE_OIL',
          side: 'buy',
          quantity: 100,
          orderType: 'market'
        })
        .expect(200);

      expect(orderResponse.body).toHaveProperty('orderId');

      // 5. Check positions
      const positionsResponse = await request(app)
        .get('/api/trading/positions')
        .set('Authorization', 'Bearer valid-test-token')
        .expect(200);

      expect(positionsResponse.body).toBeInstanceOf(Array);
    });
  });

  afterAll(() => {
    // Update performance baseline if needed
    // This would typically be done in CI/CD pipeline
  });
});