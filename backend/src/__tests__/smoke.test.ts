/**
 * Smoke Test for QuantEnergx Backend
 * 
 * Basic smoke tests to ensure the application starts correctly
 * and core endpoints are accessible.
 */

const request = require('supertest');
const app = require('../server.js');

describe('Backend Smoke Tests', () => {
  
  describe('Application Startup', () => {
    test('should start without crashing', () => {
      expect(app).toBeDefined();
    });

    test('should be an Express application', () => {
      expect(typeof app).toBe('function');
      expect(app.listen).toBeDefined();
    });
  });

  describe('Health Check Endpoint', () => {
    test('GET /health should return 200 status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('services');
    });

    test('health check should include service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.services).toHaveProperty('rest_api', 'online');
      expect(response.body.services).toHaveProperty('grpc_service', 'online');
    });
  });

  describe('API Routes', () => {
    test('should handle 404 for unknown API routes', async () => {
      await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);
    });

    test('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for some security headers set by helmet
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('JSON Parsing', () => {
    test('should handle valid JSON requests', async () => {
      await request(app)
        .post('/api/v1/test')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json')
        .expect(404); // Expected since route doesn't exist, but JSON should be parsed
    });

    test('should reject invalid JSON', async () => {
      await request(app)
        .post('/api/v1/test')
        .send('{"invalid": json}')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });

  describe('Environment Configuration', () => {
    test('should load environment variables', () => {
      // Test that dotenv is working
      expect(process.env.NODE_ENV).toBeDefined();
    });

    test('should have default port configuration', () => {
      const port = process.env.PORT || 3001;
      expect(typeof port).toBe('string');
    });
  });
});