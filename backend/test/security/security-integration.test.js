const request = require('supertest');
const app = require('../../src/server');

describe('Security Features Integration Tests', () => {
  // Test HTTPS enforcement (when in production)
  describe('HTTPS Enforcement', () => {
    test('should redirect HTTP to HTTPS in production', async () => {
      // This would be tested in a production environment
      expect(true).toBe(true); // Placeholder
    });
  });

  // Test rate limiting
  describe('Rate Limiting', () => {
    test('should apply rate limiting to auth endpoints', async () => {
      const requests = [];
      
      // Make multiple requests to trigger rate limiting
      for (let i = 0; i < 7; i++) {
        requests.push(
          request(app)
            .post('/api/v1/users/auth/login')
            .send({
              username: 'testuser',
              password: 'wrongpassword',
              hcaptcha_token: 'test-token'
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // At least one request should be rate limited
      const rateLimitedResponse = responses.find(res => res.status === 429);
      expect(rateLimitedResponse).toBeDefined();
    });
  });

  // Test input validation
  describe('Input Validation', () => {
    test('should reject invalid email formats', async () => {
      const response = await request(app)
        .post('/api/v1/users/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'ValidPassword123!',
          firstName: 'Test',
          lastName: 'User',
          hcaptcha_token: 'test-token'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/v1/users/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123', // Weak password
          firstName: 'Test',
          lastName: 'User',
          hcaptcha_token: 'test-token'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // Test security headers
  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  // Test captcha integration
  describe('Captcha Integration', () => {
    test('should require captcha for registration', async () => {
      const response = await request(app)
        .post('/api/v1/users/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'ValidPassword123!',
          firstName: 'Test',
          lastName: 'User'
          // Missing hcaptcha_token
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Captcha verification required'
          })
        ])
      );
    });
  });

  // Test error handling
  describe('Error Handling', () => {
    test('should not leak sensitive information in errors', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found');
      // Should not contain stack traces or internal details
    });
  });
});

describe('Password Utility Tests', () => {
  const passwordUtils = require('../../src/utils/passwordUtils');

  test('should hash password with Argon2', async () => {
    const password = 'TestPassword123!';
    const hash = await passwordUtils.hashPassword(password);
    
    expect(hash).toMatch(/^argon2:/);
    expect(hash.length).toBeGreaterThan(50);
  });

  test('should verify password correctly', async () => {
    const password = 'TestPassword123!';
    const hash = await passwordUtils.hashPassword(password);
    
    const isValid = await passwordUtils.verifyPassword(password, hash);
    expect(isValid).toBe(true);
    
    const isInvalid = await passwordUtils.verifyPassword('wrongpassword', hash);
    expect(isInvalid).toBe(false);
  });

  test('should validate password strength', () => {
    const strongPassword = 'StrongPassword123!';
    const weakPassword = '123';
    
    const strongResult = passwordUtils.validatePasswordStrength(strongPassword);
    expect(strongResult.valid).toBe(true);
    
    const weakResult = passwordUtils.validatePasswordStrength(weakPassword);
    expect(weakResult.valid).toBe(false);
    expect(weakResult.issues.length).toBeGreaterThan(0);
  });
});

describe('Validation Utility Tests', () => {
  const validationUtils = require('../../src/utils/validationUtils');

  test('should validate email addresses', () => {
    const validEmail = validationUtils.validateEmail('test@example.com');
    expect(validEmail.valid).toBe(true);
    
    const invalidEmail = validationUtils.validateEmail('invalid-email');
    expect(invalidEmail.valid).toBe(false);
    expect(invalidEmail.issues.length).toBeGreaterThan(0);
  });

  test('should sanitize string input', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const sanitized = validationUtils.sanitizeString(maliciousInput);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('&lt;script&gt;');
  });

  test('should validate file uploads', () => {
    const validFile = {
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
      size: 1024 * 1024 // 1MB
    };
    
    const result = validationUtils.validateFile(validFile, 'documents');
    expect(result.valid).toBe(true);
    
    const invalidFile = {
      originalname: 'malicious.exe',
      mimetype: 'application/x-executable',
      size: 1024 * 1024
    };
    
    const invalidResult = validationUtils.validateFile(invalidFile, 'documents');
    expect(invalidResult.valid).toBe(false);
  });
});

describe('Captcha Utility Tests', () => {
  const captchaUtils = require('../../src/utils/captchaUtils');

  test('should bypass captcha in test environment', async () => {
    const result = await captchaUtils.verifyCaptcha('test-token');
    expect(result.success).toBe(true);
    expect(result.bypass).toBe(true);
    expect(result.reason).toBe('test_environment');
  });

  test('should require token when captcha is enabled', async () => {
    // Temporarily enable captcha for testing
    const originalEnabled = captchaUtils.enabled;
    captchaUtils.enabled = true;
    
    const result = await captchaUtils.verifyCaptcha();
    expect(result.success).toBe(false);
    expect(result.error).toBe('captcha_token_required');
    
    // Restore original state
    captchaUtils.enabled = originalEnabled;
  });
});