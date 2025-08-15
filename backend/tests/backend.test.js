const request = require('supertest');
const app = require('../src/app');

describe('Backend API', () => {
  describe('Trading endpoints', () => {
    it('should execute a spot trade', async () => {
      const res = await request(app)
        .post('/api/v1/trades')
        .send({ commodity: 'oil', quantity: 10, price: 100, market: 'spot', userId: 1 });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('executed');
    });
  });

  describe('Risk endpoints', () => {
    it('should calculate VaR', async () => {
      const res = await request(app)
        .get('/api/v1/risk/var?userId=1');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('var');
    });
  });

  describe('Compliance endpoints', () => {
    it('should check compliance', async () => {
      const res = await request(app)
        .post('/api/v1/compliance/check')
        .send({ id: 1, market: 'us', quantity: 100, price: 100 });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('compliant');
    });
  });
});
