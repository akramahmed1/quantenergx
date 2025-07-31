const request = require('supertest');
const fs = require('fs');
const path = require('path');

describe('Performance Regression Tests', () => {
  let app;
  let performanceBaseline;
  
  beforeAll(() => {
    app = require('../../../src/server');
    
    // Load performance baseline
    const baselinePath = path.join(__dirname, '../../..', 'performance-baseline.json');
    try {
      if (fs.existsSync(baselinePath)) {
        performanceBaseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load performance baseline:', error.message);
    }
  });

  const measureResponseTime = async (requestFn) => {
    const start = process.hrtime.bigint();
    const response = await requestFn();
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1000000; // Convert to milliseconds
    
    return { response, durationMs };
  };

  const endpoints = [
    {
      name: 'health',
      path: '/api/health',
      method: 'GET',
      expectedStatus: 200,
      threshold: 100 // ms
    },
    {
      name: 'user-profile',
      path: '/api/user/profile',
      method: 'GET',
      expectedStatus: 200,
      threshold: 500,
      auth: true
    },
    {
      name: 'market-prices',
      path: '/api/market/prices?symbols=CRUDE_OIL',
      method: 'GET',
      expectedStatus: 200,
      threshold: 1000,
      auth: true
    },
    {
      name: 'trading-instruments',
      path: '/api/trading/instruments',
      method: 'GET',
      expectedStatus: 200,
      threshold: 800,
      auth: true
    },
    {
      name: 'trading-positions',
      path: '/api/trading/positions',
      method: 'GET',
      expectedStatus: 200,
      threshold: 1200,
      auth: true
    }
  ];

  describe('Response Time Regression', () => {
    endpoints.forEach(endpoint => {
      it(`should not regress in response time for ${endpoint.name}`, async () => {
        const makeRequest = () => {
          const req = request(app)[endpoint.method.toLowerCase()](endpoint.path);
          if (endpoint.auth) {
            req.set('Authorization', 'Bearer valid-test-token');
          }
          return req;
        };

        // Warm up
        await makeRequest();

        // Measure multiple runs
        const runs = 5;
        const measurements = [];

        for (let i = 0; i < runs; i++) {
          const { response, durationMs } = await measureResponseTime(makeRequest);
          expect(response.status).toBe(endpoint.expectedStatus);
          measurements.push(durationMs);
        }

        const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const p95ResponseTime = measurements.sort((a, b) => a - b)[Math.ceil(0.95 * measurements.length) - 1];

        console.log(`${endpoint.name}: avg=${avgResponseTime.toFixed(2)}ms, p95=${p95ResponseTime.toFixed(2)}ms`);

        // Check against baseline
        if (performanceBaseline && performanceBaseline[endpoint.name]) {
          const baseline = performanceBaseline[endpoint.name];
          const regressionThreshold = baseline.avgResponseTime * 1.5; // 50% regression threshold
          
          expect(avgResponseTime).toBeLessThan(regressionThreshold);
          
          // Log performance comparison
          const changePercent = ((avgResponseTime - baseline.avgResponseTime) / baseline.avgResponseTime) * 100;
          console.log(`${endpoint.name} performance change: ${changePercent.toFixed(2)}%`);
        } else {
          // Use default thresholds
          expect(avgResponseTime).toBeLessThan(endpoint.threshold);
        }

        // P95 should always be reasonable
        expect(p95ResponseTime).toBeLessThan(endpoint.threshold * 2);
      });
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle concurrent requests without significant performance degradation', async () => {
      const concurrency = 10;
      const endpoint = '/api/market/prices?symbols=CRUDE_OIL';
      
      // Single request baseline
      const { durationMs: singleRequestTime } = await measureResponseTime(() =>
        request(app)
          .get(endpoint)
          .set('Authorization', 'Bearer valid-test-token')
      );

      // Concurrent requests
      const concurrentRequests = Array(concurrency).fill(null).map(() =>
        measureResponseTime(() =>
          request(app)
            .get(endpoint)
            .set('Authorization', 'Bearer valid-test-token')
        )
      );

      const results = await Promise.all(concurrentRequests);
      const concurrentTimes = results.map(r => r.durationMs);
      const avgConcurrentTime = concurrentTimes.reduce((a, b) => a + b, 0) / concurrentTimes.length;

      console.log(`Single request: ${singleRequestTime.toFixed(2)}ms`);
      console.log(`Concurrent avg: ${avgConcurrentTime.toFixed(2)}ms`);
      console.log(`Degradation: ${((avgConcurrentTime / singleRequestTime) - 1) * 100}%`);

      // Concurrent requests should not be more than 3x slower
      expect(avgConcurrentTime).toBeLessThan(singleRequestTime * 3);
      
      // All requests should complete successfully
      results.forEach(({ response }) => {
        expect(response.status).toBe(200);
      });
    });

    it('should maintain performance under sustained load', async () => {
      const duration = 10000; // 10 seconds
      const targetRPS = 5; // 5 requests per second
      const interval = 1000 / targetRPS;
      
      const measurements = [];
      const startTime = Date.now();
      
      while (Date.now() - startTime < duration) {
        const { response, durationMs } = await measureResponseTime(() =>
          request(app)
            .get('/api/health')
        );
        
        expect(response.status).toBe(200);
        measurements.push(durationMs);
        
        await new Promise(resolve => setTimeout(resolve, interval));
      }

      const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const p95ResponseTime = measurements.sort((a, b) => a - b)[Math.ceil(0.95 * measurements.length) - 1];

      console.log(`Sustained load: avg=${avgResponseTime.toFixed(2)}ms, p95=${p95ResponseTime.toFixed(2)}ms`);

      // Performance should remain stable under sustained load
      expect(avgResponseTime).toBeLessThan(200);
      expect(p95ResponseTime).toBeLessThan(500);
    });
  });

  describe('Memory Performance Regression', () => {
    it('should not have memory leaks during repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform repeated operations that could cause memory leaks
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/market/prices?symbols=CRUDE_OIL,NATURAL_GAS')
          .set('Authorization', 'Bearer valid-test-token');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`);

      // Memory growth should be minimal (less than 10MB)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large responses efficiently', async () => {
      const initialMemory = process.memoryUsage();
      
      // Request large dataset
      const response = await request(app)
        .get('/api/market/history/CRUDE_OIL?period=1y&granularity=1h')
        .set('Authorization', 'Bearer valid-test-token');

      expect(response.status).toBe(200);
      
      const afterRequestMemory = process.memoryUsage();
      const memoryIncrease = afterRequestMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Large response memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      // Memory increase should be proportional to response size
      const responseSize = JSON.stringify(response.body).length;
      const memoryEfficiency = memoryIncrease / responseSize;
      
      // Should not use more than 3x the response size in memory
      expect(memoryEfficiency).toBeLessThan(3);
    });
  });

  describe('Database Performance Regression', () => {
    it('should maintain query performance for complex operations', async () => {
      const complexQueries = [
        '/api/analytics/portfolio-performance?period=1y',
        '/api/trading/history?limit=1000&includeDetails=true',
        '/api/market/correlation-analysis?symbols=CRUDE_OIL,NATURAL_GAS,BRENT_OIL'
      ];

      for (const query of complexQueries) {
        const { response, durationMs } = await measureResponseTime(() =>
          request(app)
            .get(query)
            .set('Authorization', 'Bearer valid-test-token')
        );

        expect([200, 404].includes(response.status)).toBe(true); // 404 is acceptable for non-existent endpoints
        
        if (response.status === 200) {
          // Complex queries should complete within reasonable time
          expect(durationMs).toBeLessThan(5000); // 5 seconds max
          
          console.log(`Complex query ${query}: ${durationMs.toFixed(2)}ms`);
        }
      }
    });
  });

  afterAll(async () => {
    // Update performance baseline for future runs
    const newBaseline = {};
    
    for (const endpoint of endpoints) {
      try {
        const makeRequest = () => {
          const req = request(app)[endpoint.method.toLowerCase()](endpoint.path);
          if (endpoint.auth) {
            req.set('Authorization', 'Bearer valid-test-token');
          }
          return req;
        };

        // Measure current performance
        const measurements = [];
        for (let i = 0; i < 3; i++) {
          const { durationMs } = await measureResponseTime(makeRequest);
          measurements.push(durationMs);
        }

        const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        
        newBaseline[endpoint.name] = {
          avgResponseTime,
          threshold: endpoint.threshold,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.warn(`Could not measure baseline for ${endpoint.name}:`, error.message);
      }
    }

    // Save baseline for future runs (in CI/CD this would be stored as an artifact)
    const baselinePath = path.join(__dirname, '../../..', 'performance-baseline.json');
    try {
      fs.writeFileSync(baselinePath, JSON.stringify(newBaseline, null, 2));
      console.log('Performance baseline updated');
    } catch (error) {
      console.warn('Could not save performance baseline:', error.message);
    }
  });
});