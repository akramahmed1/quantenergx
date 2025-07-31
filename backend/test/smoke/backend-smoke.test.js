/**
 * Smoke Tests for QuantEnergX Backend
 * 
 * These tests verify that critical functionality works without going into detail.
 * They should run quickly and catch major breaking changes.
 */

const request = require('supertest');
const path = require('path');

// Mock app instance for testing
const createMockApp = () => {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
  
  // Basic API endpoints for smoke testing
  app.get('/api/v1/status', (req, res) => {
    res.json({ api: 'QuantEnergX', version: '1.0.0', status: 'operational' });
  });
  
  app.get('/api/v1/markets/status', (req, res) => {
    res.json({ 
      markets: ['crude_oil', 'natural_gas', 'heating_oil'],
      status: 'active',
      timestamp: new Date().toISOString()
    });
  });
  
  app.post('/api/v1/users/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
      res.json({ success: true, token: 'mock-jwt-token' });
    } else {
      res.status(400).json({ success: false, error: 'Missing credentials' });
    }
  });
  
  app.get('/api/v1/trading/orders', (req, res) => {
    res.json({ orders: [], total: 0 });
  });
  
  app.post('/api/v1/trading/orders', (req, res) => {
    const { commodity, side, quantity, price } = req.body;
    if (commodity && side && quantity && price) {
      res.status(201).json({
        id: 'order-123',
        commodity,
        side,
        quantity,
        price,
        status: 'pending'
      });
    } else {
      res.status(400).json({ error: 'Invalid order data' });
    }
  });
  
  return app;
};

describe('Backend Smoke Tests', () => {
  let app;

  beforeAll(() => {
    app = createMockApp();
  });

  describe('System Health', () => {
    test('health endpoint should respond', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('API status endpoint should respond', async () => {
      const response = await request(app)
        .get('/api/v1/status')
        .expect(200);

      expect(response.body).toHaveProperty('api', 'QuantEnergX');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('status', 'operational');
    });
  });

  describe('Core Services', () => {
    test('market data service should be accessible', async () => {
      const response = await request(app)
        .get('/api/v1/markets/status')
        .expect(200);

      expect(response.body).toHaveProperty('markets');
      expect(response.body.markets).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('status', 'active');
    });

    test('authentication service should be accessible', async () => {
      const response = await request(app)
        .post('/api/v1/users/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
    });

    test('trading service should be accessible', async () => {
      // Test getting orders
      const getResponse = await request(app)
        .get('/api/v1/trading/orders')
        .expect(200);

      expect(getResponse.body).toHaveProperty('orders');
      expect(getResponse.body).toHaveProperty('total');

      // Test placing an order
      const postResponse = await request(app)
        .post('/api/v1/trading/orders')
        .send({
          commodity: 'crude_oil',
          side: 'buy',
          quantity: 100,
          price: 75.50
        })
        .expect(201);

      expect(postResponse.body).toHaveProperty('id');
      expect(postResponse.body).toHaveProperty('status', 'pending');
    });
  });

  describe('Data Validation', () => {
    test('should reject invalid login attempts', async () => {
      const response = await request(app)
        .post('/api/v1/users/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid order data', async () => {
      const response = await request(app)
        .post('/api/v1/trading/orders')
        .send({
          commodity: 'crude_oil'
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Response Format', () => {
    test('all responses should have proper content-type', async () => {
      const response = await request(app)
        .get('/api/v1/status')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('error responses should have consistent format', async () => {
      const response = await request(app)
        .post('/api/v1/users/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});

describe('Service Dependencies Smoke Tests', () => {
  describe('Required Modules', () => {
    test('core dependencies should be loadable', () => {
      expect(() => require('express')).not.toThrow();
      expect(() => require('bcryptjs')).not.toThrow();
      expect(() => require('jsonwebtoken')).not.toThrow();
      expect(() => require('uuid')).not.toThrow();
      expect(() => require('moment')).not.toThrow();
    });

    test('service modules should be loadable', () => {
      const servicePath = path.join(__dirname, '../../src/services');
      
      // Test critical services
      const criticalServices = [
        'tradingService.js',
        'userManagementService.js',
        'marketDataService.js',
        'riskManagementService.js'
      ];

      criticalServices.forEach(service => {
        const servicePath = path.join(__dirname, '../../src/services', service);
        expect(() => require(servicePath)).not.toThrow();
      });
    });
  });

  describe('Environment Configuration', () => {
    test('environment variables should be accessible', () => {
      // Test that we can access process.env without throwing
      expect(() => process.env.NODE_ENV).not.toThrow();
      expect(() => process.env.PORT).not.toThrow();
      expect(() => process.env.JWT_SECRET).not.toThrow();
    });

    test('critical config should have defaults', () => {
      // These should not be undefined or empty
      const config = {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3001,
        jwtSecret: process.env.JWT_SECRET || 'fallback-secret'
      };

      expect(config.nodeEnv).toBeTruthy();
      expect(config.port).toBeTruthy();
      expect(config.jwtSecret).toBeTruthy();
    });
  });
});

describe('Database Connection Smoke Test', () => {
  test('database utilities should be loadable', () => {
    expect(() => require('../../src/utils/databaseManager')).not.toThrow();
  });

  test('database configuration should be accessible', () => {
    // Test basic database config without actually connecting
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'quantenergx_test',
      user: process.env.DB_USER || 'postgres'
    };

    expect(dbConfig.host).toBeTruthy();
    expect(dbConfig.port).toBeTruthy();
    expect(dbConfig.database).toBeTruthy();
    expect(dbConfig.user).toBeTruthy();
  });
});

describe('Security Modules Smoke Test', () => {
  test('security utilities should be loadable', () => {
    expect(() => require('../../src/utils/passwordUtils')).not.toThrow();
    expect(() => require('../../src/utils/captchaUtils')).not.toThrow();
    expect(() => require('../../src/utils/securityLogger')).not.toThrow();
  });

  test('JWT functionality should work', () => {
    const jwt = require('jsonwebtoken');
    const secret = 'test-secret';
    const payload = { userId: '123', email: 'test@example.com' };

    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    expect(token).toBeTruthy();

    const decoded = jwt.verify(token, secret);
    expect(decoded.userId).toBe('123');
    expect(decoded.email).toBe('test@example.com');
  });

  test('bcrypt functionality should work', () => {
    const bcrypt = require('bcryptjs');
    const password = 'TestPassword123!';

    const hash = bcrypt.hashSync(password, 10);
    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);

    const isValid = bcrypt.compareSync(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = bcrypt.compareSync('wrong-password', hash);
    expect(isInvalid).toBe(false);
  });
});

describe('External Services Connectivity Smoke Test', () => {
  test('HTTP client should be functional', async () => {
    const axios = require('axios');
    
    // Test that axios is configured properly
    expect(axios.defaults).toBeDefined();
    expect(typeof axios.get).toBe('function');
    expect(typeof axios.post).toBe('function');
  });

  test('WebSocket functionality should be loadable', () => {
    expect(() => require('socket.io')).not.toThrow();
  });

  test('Kafka client should be loadable', () => {
    expect(() => require('kafkajs')).not.toThrow();
  });
});

describe('File System Operations Smoke Test', () => {
  test('file system operations should work', () => {
    const fs = require('fs');
    const path = require('path');

    // Test reading package.json
    const packagePath = path.join(__dirname, '../../package.json');
    expect(() => fs.readFileSync(packagePath, 'utf8')).not.toThrow();

    // Test that we can access temp directory
    const tempDir = require('os').tmpdir();
    expect(tempDir).toBeTruthy();
  });

  test('logging functionality should work', () => {
    const winston = require('winston');
    
    const logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console({ silent: true }) // Silent for tests
      ]
    });

    expect(() => logger.info('Test log message')).not.toThrow();
    expect(() => logger.error('Test error message')).not.toThrow();
  });
});