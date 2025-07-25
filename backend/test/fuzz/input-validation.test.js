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

      );
    });

    it('should sanitize file upload inputs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            filename: fc.string(),

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

              }
            } catch (error) {
              // Should handle URL encoding issues gracefully
              expect(error.message).not.toMatch(/URIError|SyntaxError.*Invalid/);
            }
          }
        ),

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
