const request = require('supertest');
const app = require('../../src/server');

describe('Contract Testing - Basic API Contract Validation', () => {
  describe('Health Check Contract', () => {
    it('should maintain health endpoint contract', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Validate contract compliance
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('services');
      expect(typeof response.body.status).toBe('string');
      expect(typeof response.body.services).toBe('object');
      
      // Ensure backward compatibility
      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toHaveProperty('rest_api');
    });
  });

  describe('API Info Contract', () => {
    it('should maintain API info endpoint contract', async () => {
      const response = await request(app)
        .get('/api/v1/')
        .expect(200);

      // Validate contract structure
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.name).toBe('QuantEnergx API');
      expect(response.body.endpoints).toHaveProperty('ocr');
    });
  });

  describe('Error Response Contract', () => {
    it('should maintain consistent error response format', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent-endpoint')
        .expect(404);

      // Validate error contract
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error).toBe('Route not found');
    });
  });
});