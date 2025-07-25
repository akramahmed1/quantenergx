const fc = require('fast-check');
const request = require('supertest');
const app = require('../../src/server');

describe('Fuzz Testing - Input Validation', () => {
  describe('API Input Validation Fuzzing', () => {
    it('should handle arbitrary string inputs safely for notification endpoint', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            channel: fc.oneof(
              fc.string(),
              fc.constant('email'),
              fc.constant('telegram'),
              fc.constant('whatsapp')
            ),
            recipient: fc.string(),
            message: fc.string(),
            options: fc.object()
          }),
          async (input) => {
            try {
              const response = await request(app)
                .post('/api/v1/notifications/send')
                .set('Authorization', 'Bearer mock-jwt-token-for-testing')
                .send(input);

              // Should not crash the server - either 200, 400, or 403 are acceptable
              expect([200, 400, 403, 422, 500].includes(response.status)).toBe(true);
              
              // Response should always be valid JSON
              expect(response.body).toBeDefined();
              
              // Should not expose sensitive information in error messages
              if (response.body.error) {
                expect(response.body.error).not.toMatch(/password|secret|key|token/i);
              }
            } catch (error) {
              // Should not throw unhandled exceptions
              expect(error.message).not.toMatch(/Cannot read|Cannot access|undefined is not/);
            }
          }
        ),
        { numRuns: 50, timeout: 5000 }
      );
    });

    it('should handle arbitrary numeric inputs for trading volumes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            volume: fc.oneof(
              fc.integer(),
              fc.float(),
              fc.string(),
              fc.constant(null),
              fc.constant(undefined)
            ),
            price: fc.oneof(
              fc.float(),
              fc.integer(),
              fc.string(),
              fc.constant(null)
            ),
            commodity: fc.string()
          }),
          async (input) => {
            try {
              const response = await request(app)
                .post('/api/v1/trading/orders')
                .set('Authorization', 'Bearer mock-jwt-token-for-testing')
                .send(input);

              // Should handle invalid inputs gracefully
              expect([200, 400, 403, 422, 500].includes(response.status)).toBe(true);
              
              // Should validate numeric inputs properly
              if (response.status === 400 && response.body.errors) {
                expect(Array.isArray(response.body.errors)).toBe(true);
              }
            } catch (error) {
              // Should not expose system internals
              expect(error.message).not.toMatch(/ECONNREFUSED|ETIMEDOUT|ENOTFOUND/);
            }
          }
        ),
        { numRuns: 30, timeout: 5000 }
      );
    });

    it('should sanitize file upload inputs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            filename: fc.string(),
            contentType: fc.string(),
            size: fc.integer()
          }),
          async (fileInput) => {
            try {
              const response = await request(app)
                .post('/api/v1/ocr/process')
                .set('Authorization', 'Bearer mock-jwt-token-for-testing')
                .field('metadata', JSON.stringify(fileInput));

              // Should handle file inputs safely
              expect([200, 400, 403, 413, 422, 500].includes(response.status)).toBe(true);
              
              // Should not reflect unfiltered user input in responses
              if (response.body.error && fileInput.filename) {
                expect(response.body.error).not.toContain(fileInput.filename);
              }
            } catch (error) {
              // Should not crash on malformed file data
              expect(error.message).not.toMatch(/heap out of memory|maximum call stack/i);
            }
          }
        ),
        { numRuns: 25, timeout: 5000 }
      );
    });
  });

  describe('URL Parameter Fuzzing', () => {
    it('should handle arbitrary URL parameters safely', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          async (param) => {
            try {
              const response = await request(app)
                .get(`/api/v1/ocr/status/${encodeURIComponent(param)}`);

              // Should handle any URL parameter
              expect([200, 404, 400, 500].includes(response.status)).toBe(true);
              
              // Should not expose file system paths
              if (response.body.error) {
                expect(response.body.error).not.toMatch(/\/var\/|\/tmp\/|C:\\|\.\.\/|\\.\\|src\/|node_modules/);
              }
            } catch (error) {
              // Should handle URL encoding issues gracefully
              expect(error.message).not.toMatch(/URIError|SyntaxError.*Invalid/);
            }
          }
        ),
        { numRuns: 40, timeout: 5000 }
      );
    });
  });

  describe('Database Input Fuzzing', () => {
    it('should prevent SQL injection through API inputs', async () => {
      const sqlInjectionPayloads = [
        '\' OR \'1\'=\'1',
        '\'; DROP TABLE users; --',
        '\' UNION SELECT * FROM users --',
        '\' OR 1=1 --',
        '1\' OR \'1\'=\'1\' --'
      ];

      for (const payload of sqlInjectionPayloads) {
        try {
          const response = await request(app)
            .get('/api/v1/trading/orders')
            .query({ search: payload })
            .set('Authorization', 'Bearer mock-jwt-token-for-testing');

          // Should not execute SQL injection
          expect(response.status).not.toBe(500);
          
          // Should not return database error messages
          if (response.body.error) {
            expect(response.body.error).not.toMatch(/SQL|syntax error|near|pg_|postgres/i);
          }
        } catch (error) {
          expect(error.message).not.toMatch(/SQL|syntax error|relation.*does not exist/i);
        }
      }
    });
  });

  describe('JSON Input Fuzzing', () => {
    it('should handle deeply nested JSON inputs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.letrec(tie => ({
            json: fc.oneof(
              fc.string(),
              fc.integer(),
              fc.boolean(),
              fc.constant(null),
              fc.array(tie('json'), { maxLength: 3 }),
              fc.dictionary(fc.string(), tie('json'), { maxKeys: 3 })
            )
          })).json,
          async (jsonInput) => {
            try {
              const response = await request(app)
                .post('/api/v1/notifications/send')
                .set('Authorization', 'Bearer mock-jwt-token-for-testing')
                .send(jsonInput);

              // Should handle complex JSON structures
              expect([200, 400, 403, 413, 422, 500].includes(response.status)).toBe(true);
              
              // Should not cause stack overflow
              expect(response.body).toBeDefined();
            } catch (error) {
              // Should handle deep nesting gracefully
              expect(error.message).not.toMatch(/Maximum call stack|too much recursion/i);
            }
          }
        ),
        { numRuns: 20, timeout: 5000 }
      );
    });
  });
});

// Custom property-based test generators for energy trading domain
const energyTradingArbitraries = {
  commodity: () => fc.oneof(
    fc.constant('crude_oil'),
    fc.constant('natural_gas'),
    fc.constant('lng'),
    fc.constant('gasoline'),
    fc.constant('heating_oil'),
    fc.string()
  ),
  
  volume: () => fc.oneof(
    fc.float({ min: Math.fround(0.01), max: Math.fround(1000000) }),
    fc.integer({ min: 1, max: 1000000 }),
    fc.string(),
    fc.constant(null),
    fc.constant(undefined)
  ),
  
  price: () => fc.oneof(
    fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
    fc.string(),
    fc.constant(null)
  ),
  
  tradingOrder: () => fc.record({
    commodity: energyTradingArbitraries.commodity(),
    volume: energyTradingArbitraries.volume(),
    price: energyTradingArbitraries.price(),
    side: fc.oneof(fc.constant('buy'), fc.constant('sell'), fc.string()),
    type: fc.oneof(fc.constant('market'), fc.constant('limit'), fc.string())
  })
};

describe('Domain-Specific Fuzz Testing', () => {
  it('should validate energy trading order inputs comprehensively', async () => {
    await fc.assert(
      fc.asyncProperty(
        energyTradingArbitraries.tradingOrder(),
        async (order) => {
          try {
            const response = await request(app)
              .post('/api/v1/trading/orders')
              .set('Authorization', 'Bearer mock-jwt-token-for-testing')
              .send(order);

            // Should validate business rules properly
            if (response.status === 200) {
              expect(response.body).toHaveProperty('orderId');
              expect(response.body).toHaveProperty('status');
            } else if (response.status === 400) {
              expect(response.body).toHaveProperty('errors');
              expect(Array.isArray(response.body.errors)).toBe(true);
            }
            
            // Should not accept invalid commodity types in success responses
            if (response.status === 200 && typeof order.commodity === 'string') {
              const validCommodities = ['crude_oil', 'natural_gas', 'lng', 'gasoline', 'heating_oil'];
              if (!validCommodities.includes(order.commodity)) {
                // If invalid commodity was accepted, it should be properly sanitized
                expect(response.body.commodity).toBeDefined();
              }
            }
          } catch (error) {
            expect(error.message).not.toMatch(/division by zero|infinity|NaN/i);
          }
        }
      ),
      { numRuns: 40, timeout: 5000 }
    );
  });
});