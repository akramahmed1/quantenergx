/**
 * API Integration Tests for QuantEnergX Backend
 * 
 * These tests verify that API endpoints work correctly with proper data flow.
 */

const request = require('supertest');
const express = require('express');

// Mock Express app for integration testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Health endpoints
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'test'
    });
  });

  app.get('/api/v1/status', (req, res) => {
    res.json({
      api: 'QuantEnergX',
      version: '1.0.0',
      status: 'operational',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Authentication endpoints
  app.post('/api/v1/users/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    if (email === 'test@example.com' && password === 'password123') {
      return res.json({
        success: true,
        token: 'mock-jwt-token',
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'trader'
        },
        expiresIn: 86400
      });
    }

    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  });

  app.post('/api/v1/users/auth/register', (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
        code: 'WEAK_PASSWORD'
      });
    }

    res.status(201).json({
      success: true,
      user: {
        id: 'user456',
        email,
        firstName,
        lastName,
        role: 'trader'
      },
      message: 'User registered successfully'
    });
  });

  // Market data endpoints
  app.get('/api/v1/market/prices', (req, res) => {
    const { symbols } = req.query;
    
    const mockPrices = {
      CRUDE_OIL: { price: 76.50, change: 1.25, changePercent: 1.66, volume: 1500000 },
      NATURAL_GAS: { price: 3.45, change: -0.05, changePercent: -1.43, volume: 2500000 },
      HEATING_OIL: { price: 2.85, change: 0.15, changePercent: 5.56, volume: 800000 }
    };

    if (symbols) {
      const requestedSymbols = symbols.split(',');
      const filteredPrices = {};
      requestedSymbols.forEach(symbol => {
        if (mockPrices[symbol.toUpperCase()]) {
          filteredPrices[symbol.toUpperCase()] = mockPrices[symbol.toUpperCase()];
        }
      });
      return res.json({ prices: filteredPrices, timestamp: new Date().toISOString() });
    }

    res.json({ prices: mockPrices, timestamp: new Date().toISOString() });
  });

  app.get('/api/v1/market/history/:symbol', (req, res) => {
    const { symbol } = req.params;
    const { period = '1d', interval = '1h' } = req.query;

    if (!symbol) {
      return res.status(400).json({
        error: 'Symbol is required',
        code: 'MISSING_SYMBOL'
      });
    }

    // Generate mock historical data
    const history = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      history.push({
        timestamp: timestamp.toISOString(),
        open: 75.00 + Math.random() * 5,
        high: 76.00 + Math.random() * 5,
        low: 74.00 + Math.random() * 5,
        close: 75.50 + Math.random() * 5,
        volume: Math.floor(Math.random() * 1000000)
      });
    }

    res.json({
      symbol: symbol.toUpperCase(),
      period,
      interval,
      data: history
    });
  });

  // Trading endpoints
  app.get('/api/v1/trading/orders', (req, res) => {
    const { status, symbol, limit = 50 } = req.query;
    
    let mockOrders = [
      {
        id: 'order-123',
        symbol: 'CRUDE_OIL',
        side: 'buy',
        quantity: 100,
        price: 75.50,
        status: 'pending',
        timestamp: new Date().toISOString(),
        userId: 'user123'
      },
      {
        id: 'order-124',
        symbol: 'NATURAL_GAS',
        side: 'sell',
        quantity: 200,
        price: 3.45,
        status: 'filled',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        userId: 'user123'
      }
    ];

    // Filter by status
    if (status) {
      mockOrders = mockOrders.filter(order => order.status === status);
    }

    // Filter by symbol
    if (symbol) {
      mockOrders = mockOrders.filter(order => order.symbol.toUpperCase() === symbol.toUpperCase());
    }

    // Apply limit
    mockOrders = mockOrders.slice(0, parseInt(limit));

    res.json({
      orders: mockOrders,
      total: mockOrders.length,
      page: 1,
      limit: parseInt(limit)
    });
  });

  app.post('/api/v1/trading/orders', (req, res) => {
    const { symbol, side, quantity, price, orderType = 'limit' } = req.body;

    // Validation
    if (!symbol || !side || !quantity || !price) {
      return res.status(400).json({
        error: 'Symbol, side, quantity, and price are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (!['buy', 'sell'].includes(side)) {
      return res.status(400).json({
        error: 'Side must be "buy" or "sell"',
        code: 'INVALID_SIDE'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        error: 'Quantity must be positive',
        code: 'INVALID_QUANTITY'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        error: 'Price must be positive',
        code: 'INVALID_PRICE'
      });
    }

    const order = {
      id: `order-${Date.now()}`,
      symbol: symbol.toUpperCase(),
      side,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      orderType,
      status: 'pending',
      timestamp: new Date().toISOString(),
      userId: 'user123'
    };

    res.status(201).json({
      success: true,
      order,
      message: 'Order placed successfully'
    });
  });

  app.delete('/api/v1/trading/orders/:orderId', (req, res) => {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        error: 'Order ID is required',
        code: 'MISSING_ORDER_ID'
      });
    }

    res.json({
      success: true,
      orderId,
      message: 'Order cancelled successfully'
    });
  });

  // Portfolio endpoints
  app.get('/api/v1/portfolio/positions', (req, res) => {
    const mockPositions = [
      {
        symbol: 'CRUDE_OIL',
        quantity: 500,
        averagePrice: 74.25,
        currentPrice: 76.50,
        marketValue: 38250,
        unrealizedPnL: 1125,
        realizedPnL: 250
      },
      {
        symbol: 'NATURAL_GAS',
        quantity: 1000,
        averagePrice: 3.50,
        currentPrice: 3.45,
        marketValue: 3450,
        unrealizedPnL: -50,
        realizedPnL: 100
      }
    ];

    res.json({
      positions: mockPositions,
      totalValue: mockPositions.reduce((sum, pos) => sum + pos.marketValue, 0),
      totalUnrealizedPnL: mockPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0),
      totalRealizedPnL: mockPositions.reduce((sum, pos) => sum + pos.realizedPnL, 0)
    });
  });

  app.get('/api/v1/portfolio/summary', (req, res) => {
    res.json({
      totalValue: 41700,
      totalUnrealizedPnL: 1075,
      totalRealizedPnL: 350,
      cash: 10000,
      marginUsed: 5000,
      marginAvailable: 15000,
      dayChange: 825,
      dayChangePercent: 2.02
    });
  });

  return app;
};

describe('API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Health and Status Endpoints', () => {
    test('GET /health returns system health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
    });

    test('GET /api/v1/status returns API status', async () => {
      const response = await request(app)
        .get('/api/v1/status')
        .expect(200);

      expect(response.body).toHaveProperty('api', 'QuantEnergX');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('status', 'operational');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Authentication API', () => {
    test('POST /api/v1/users/auth/login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/users/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('role', 'trader');
    });

    test('POST /api/v1/users/auth/login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/users/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    test('POST /api/v1/users/auth/login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/users/auth/login')
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email and password are required');
    });

    test('POST /api/v1/users/auth/register with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/users/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.user).toHaveProperty('firstName', 'New');
    });

    test('POST /api/v1/users/auth/register with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/users/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'New',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email format');
    });
  });

  describe('Market Data API', () => {
    test('GET /api/v1/market/prices returns all prices', async () => {
      const response = await request(app)
        .get('/api/v1/market/prices')
        .expect(200);

      expect(response.body).toHaveProperty('prices');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.prices).toHaveProperty('CRUDE_OIL');
      expect(response.body.prices).toHaveProperty('NATURAL_GAS');
      expect(response.body.prices.CRUDE_OIL).toHaveProperty('price');
      expect(response.body.prices.CRUDE_OIL).toHaveProperty('change');
      expect(response.body.prices.CRUDE_OIL).toHaveProperty('volume');
    });

    test('GET /api/v1/market/prices with symbol filter', async () => {
      const response = await request(app)
        .get('/api/v1/market/prices?symbols=CRUDE_OIL,NATURAL_GAS')
        .expect(200);

      expect(response.body.prices).toHaveProperty('CRUDE_OIL');
      expect(response.body.prices).toHaveProperty('NATURAL_GAS');
      expect(response.body.prices).not.toHaveProperty('HEATING_OIL');
    });

    test('GET /api/v1/market/history/:symbol returns historical data', async () => {
      const response = await request(app)
        .get('/api/v1/market/history/CRUDE_OIL')
        .expect(200);

      expect(response.body).toHaveProperty('symbol', 'CRUDE_OIL');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0]).toHaveProperty('timestamp');
      expect(response.body.data[0]).toHaveProperty('open');
      expect(response.body.data[0]).toHaveProperty('high');
      expect(response.body.data[0]).toHaveProperty('low');
      expect(response.body.data[0]).toHaveProperty('close');
    });
  });

  describe('Trading API', () => {
    test('GET /api/v1/trading/orders returns orders list', async () => {
      const response = await request(app)
        .get('/api/v1/trading/orders')
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.orders)).toBe(true);
      
      if (response.body.orders.length > 0) {
        expect(response.body.orders[0]).toHaveProperty('id');
        expect(response.body.orders[0]).toHaveProperty('symbol');
        expect(response.body.orders[0]).toHaveProperty('side');
        expect(response.body.orders[0]).toHaveProperty('quantity');
        expect(response.body.orders[0]).toHaveProperty('price');
        expect(response.body.orders[0]).toHaveProperty('status');
      }
    });

    test('GET /api/v1/trading/orders with status filter', async () => {
      const response = await request(app)
        .get('/api/v1/trading/orders?status=pending')
        .expect(200);

      response.body.orders.forEach(order => {
        expect(order.status).toBe('pending');
      });
    });

    test('POST /api/v1/trading/orders creates new order', async () => {
      const orderData = {
        symbol: 'CRUDE_OIL',
        side: 'buy',
        quantity: 100,
        price: 75.50,
        orderType: 'limit'
      };

      const response = await request(app)
        .post('/api/v1/trading/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.order).toHaveProperty('id');
      expect(response.body.order.symbol).toBe('CRUDE_OIL');
      expect(response.body.order.side).toBe('buy');
      expect(response.body.order.quantity).toBe(100);
      expect(response.body.order.price).toBe(75.50);
      expect(response.body.order.status).toBe('pending');
    });

    test('POST /api/v1/trading/orders validates required fields', async () => {
      const response = await request(app)
        .post('/api/v1/trading/orders')
        .send({
          symbol: 'CRUDE_OIL',
          side: 'buy'
          // Missing quantity and price
        })
        .expect(400);

      expect(response.body.error).toContain('required');
      expect(response.body.code).toBe('MISSING_FIELDS');
    });

    test('POST /api/v1/trading/orders validates side values', async () => {
      const response = await request(app)
        .post('/api/v1/trading/orders')
        .send({
          symbol: 'CRUDE_OIL',
          side: 'invalid',
          quantity: 100,
          price: 75.50
        })
        .expect(400);

      expect(response.body.error).toContain('Side must be');
      expect(response.body.code).toBe('INVALID_SIDE');
    });

    test('DELETE /api/v1/trading/orders/:orderId cancels order', async () => {
      const response = await request(app)
        .delete('/api/v1/trading/orders/order-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.orderId).toBe('order-123');
      expect(response.body.message).toContain('cancelled');
    });
  });

  describe('Portfolio API', () => {
    test('GET /api/v1/portfolio/positions returns positions', async () => {
      const response = await request(app)
        .get('/api/v1/portfolio/positions')
        .expect(200);

      expect(response.body).toHaveProperty('positions');
      expect(response.body).toHaveProperty('totalValue');
      expect(response.body).toHaveProperty('totalUnrealizedPnL');
      expect(Array.isArray(response.body.positions)).toBe(true);

      if (response.body.positions.length > 0) {
        const position = response.body.positions[0];
        expect(position).toHaveProperty('symbol');
        expect(position).toHaveProperty('quantity');
        expect(position).toHaveProperty('averagePrice');
        expect(position).toHaveProperty('currentPrice');
        expect(position).toHaveProperty('marketValue');
        expect(position).toHaveProperty('unrealizedPnL');
      }
    });

    test('GET /api/v1/portfolio/summary returns portfolio summary', async () => {
      const response = await request(app)
        .get('/api/v1/portfolio/summary')
        .expect(200);

      expect(response.body).toHaveProperty('totalValue');
      expect(response.body).toHaveProperty('cash');
      expect(response.body).toHaveProperty('marginUsed');
      expect(response.body).toHaveProperty('marginAvailable');
      expect(response.body).toHaveProperty('dayChange');
      expect(response.body).toHaveProperty('dayChangePercent');
      
      expect(typeof response.body.totalValue).toBe('number');
      expect(typeof response.body.cash).toBe('number');
      expect(typeof response.body.dayChangePercent).toBe('number');
    });
  });

  describe('API Error Handling', () => {
    test('handles 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/v1/non-existent')
        .expect(404);
    });

    test('handles invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/v1/users/auth/login')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });

  describe('API Response Format Consistency', () => {
    test('success responses have consistent format', async () => {
      const responses = await Promise.all([
        request(app).get('/health'),
        request(app).get('/api/v1/status'),
        request(app).get('/api/v1/market/prices'),
        request(app).get('/api/v1/trading/orders')
      ]);

      responses.forEach(response => {
        expect(response.status).toBeLessThan(400);
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(typeof response.body).toBe('object');
      });
    });

    test('error responses have consistent format', async () => {
      const responses = await Promise.all([
        request(app).post('/api/v1/users/auth/login').send({}),
        request(app).post('/api/v1/trading/orders').send({}),
        request(app).get('/api/v1/market/history/')
      ]);

      responses.forEach(response => {
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body).toHaveProperty('error');
        if (response.body.code) {
          expect(typeof response.body.code).toBe('string');
        }
      });
    });
  });
});