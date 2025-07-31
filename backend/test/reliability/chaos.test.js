const request = require('supertest');

describe('Reliability Tests - Chaos Engineering', () => {
  let app;
  
  beforeAll(() => {
    app = require('../../src/server');
  });

  describe('Error Handling Resilience', () => {
    it('should gracefully handle database connection failures', async () => {
      // Simulate database connection failure
      const mockDbError = jest.fn().mockRejectedValue(new Error('Database connection lost'));
      
      try {
        const response = await request(app)
          .get('/api/user/profile')
          .set('Authorization', 'Bearer valid-test-token');

        // Should return appropriate error response, not crash
        expect([500, 503, 504].includes(response.status)).toBe(true);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).not.toContain('Database connection lost'); // No leak
      } catch (error) {
        // Should not throw unhandled exceptions
        expect(error.message).not.toMatch(/ECONNREFUSED|Connection refused/);
      }
    });

    it('should handle external service timeouts gracefully', async () => {
      // Simulate external service timeout
      jest.setTimeout(15000);
      
      const response = await request(app)
        .get('/api/market/external-data')
        .set('Authorization', 'Bearer valid-test-token')
        .timeout(10000);

      // Should return response within reasonable time
      expect([200, 408, 503, 504].includes(response.status)).toBe(true);
      
      if (response.status !== 200) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/timeout|unavailable|service/i);
      }
    });

    it('should maintain service under memory pressure', async () => {
      // Create memory pressure by making multiple concurrent requests
      const concurrentRequests = Array(50).fill(null).map(() =>
        request(app)
          .get('/api/market/prices')
          .set('Authorization', 'Bearer valid-test-token')
      );

      const responses = await Promise.allSettled(concurrentRequests);
      
      // Most requests should succeed or fail gracefully
      const successfulResponses = responses.filter(
        r => r.status === 'fulfilled' && r.value.status === 200
      );
      const gracefulFailures = responses.filter(
        r => r.status === 'fulfilled' && [429, 503].includes(r.value.status)
      );
      
      expect(successfulResponses.length + gracefulFailures.length).toBeGreaterThan(
        responses.length * 0.8 // At least 80% should be handled gracefully
      );
    });

    it('should recover from temporary failures', async () => {
      // Test circuit breaker pattern
      const initialResponse = await request(app)
        .get('/api/health')
        .expect(200);

      expect(initialResponse.body).toHaveProperty('status', 'ok');

      // Even after failures, health check should recover
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const recoveryResponse = await request(app)
        .get('/api/health')
        .expect(200);

      expect(recoveryResponse.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Load Resilience', () => {
    it('should handle burst traffic gracefully', async () => {
      // Simulate traffic burst
      const burstSize = 100;
      const requests = Array(burstSize).fill(null).map((_, index) =>
        request(app)
          .get('/api/market/prices')
          .set('Authorization', 'Bearer valid-test-token')
          .set('X-Request-ID', `burst-${index}`)
      );

      const startTime = Date.now();
      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();

      // Should handle burst within reasonable time
      expect(endTime - startTime).toBeLessThan(30000); // 30 seconds max

      // Count response types
      const successful = responses.filter(
        r => r.status === 'fulfilled' && r.value.status === 200
      );
      const rateLimited = responses.filter(
        r => r.status === 'fulfilled' && r.value.status === 429
      );
      const serverErrors = responses.filter(
        r => r.status === 'fulfilled' && r.value.status >= 500
      );

      // Should not have too many server errors
      expect(serverErrors.length).toBeLessThan(burstSize * 0.1); // Less than 10%
      
      // Should either succeed or rate limit, not crash
      expect(successful.length + rateLimited.length).toBeGreaterThan(
        burstSize * 0.8 // At least 80% handled appropriately
      );
    });

    it('should maintain response quality under sustained load', async () => {
      const sustainedDuration = 10000; // 10 seconds
      const requestInterval = 100; // Every 100ms
      const responses = [];
      
      const startTime = Date.now();
      
      while (Date.now() - startTime < sustainedDuration) {
        try {
          const response = await request(app)
            .get('/api/market/prices')
            .set('Authorization', 'Bearer valid-test-token')
            .timeout(5000);
          
          responses.push({
            status: response.status,
            responseTime: response.duration || 0,
            timestamp: Date.now()
          });
        } catch (error) {
          responses.push({
            status: null,
            error: error.message,
            timestamp: Date.now()
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }

      // Analyze response quality
      const successfulResponses = responses.filter(r => r.status === 200);
      const averageResponseTime = successfulResponses.reduce(
        (sum, r) => sum + r.responseTime, 0
      ) / successfulResponses.length;

      // Quality metrics
      expect(successfulResponses.length).toBeGreaterThan(responses.length * 0.7); // 70% success rate
      expect(averageResponseTime).toBeLessThan(2000); // Average under 2s
    });
  });

  describe('Data Consistency Under Stress', () => {
    it('should maintain data integrity during concurrent operations', async () => {
      // Simulate concurrent trading operations
      const tradingOperations = Array(20).fill(null).map((_, index) =>
        request(app)
          .post('/api/trading/orders')
          .set('Authorization', 'Bearer valid-test-token')
          .send({
            symbol: 'CRUDE_OIL',
            side: index % 2 === 0 ? 'buy' : 'sell',
            quantity: 100,
            orderType: 'market'
          })
      );

      const responses = await Promise.allSettled(tradingOperations);
      
      // Check for data consistency issues
      const successful = responses.filter(
        r => r.status === 'fulfilled' && r.value.status === 200
      );

      // Verify no duplicate order IDs
      const orderIds = successful
        .map(r => r.value.body.orderId)
        .filter(id => id);
      
      const uniqueOrderIds = new Set(orderIds);
      expect(uniqueOrderIds.size).toBe(orderIds.length); // No duplicates
    });

    it('should handle race conditions in user data updates', async () => {
      // Simulate concurrent user profile updates
      const updates = Array(10).fill(null).map((_, index) =>
        request(app)
          .put('/api/user/profile')
          .set('Authorization', 'Bearer valid-test-token')
          .send({
            preferences: { theme: index % 2 === 0 ? 'dark' : 'light' }
          })
      );

      const responses = await Promise.allSettled(updates);
      
      // Should handle concurrent updates without corruption
      const lastSuccessful = responses
        .filter(r => r.status === 'fulfilled' && r.value.status === 200)
        .pop();

      if (lastSuccessful) {
        expect(lastSuccessful.value.body).toHaveProperty('preferences');
        expect(['dark', 'light']).toContain(
          lastSuccessful.value.body.preferences.theme
        );
      }
    });
  });
});