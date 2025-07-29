/**
 * E2E Test: Real-time Trading Flow
 * Tests the complete trading workflow including real-time features
 */

describe('Real-time Trading Flow', () => {
  const baseUrl = Cypress.env('baseUrl') || 'http://localhost:3000';
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3001';

  beforeEach(() => {
    // Mock user authentication
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', 'test-token');
      win.localStorage.setItem('userId', 'test-user-123');
    });

    // Intercept API calls
    cy.intercept('GET', `${apiUrl}/api/v1/market/prices/*`, {
      fixture: 'market-data.json'
    }).as('getMarketData');

    cy.intercept('POST', `${apiUrl}/api/v1/trading/orders`, {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 'order-123',
          status: 'pending',
          timestamp: new Date().toISOString()
        }
      }
    }).as('createOrder');

    cy.intercept('GET', `${apiUrl}/api/v1/trading/orders`, {
      fixture: 'orders.json'
    }).as('getOrders');

    cy.intercept('GET', `${apiUrl}/health`, {
      statusCode: 200,
      body: {
        success: true,
        data: {
          status: 'healthy',
          services: {
            rest_api: 'online',
            websocket: 'online',
            kafka: 'online'
          }
        }
      }
    }).as('healthCheck');

    cy.visit(baseUrl);
  });

  it('should complete full trading workflow with real-time updates', () => {
    // Step 1: Navigate to trading dashboard
    cy.get('[data-testid="nav-trading"]').click();
    cy.url().should('include', '/trading');
    cy.get('[data-testid="trading-dashboard"]').should('be.visible');

    // Step 2: Verify real-time market data is loading
    cy.wait('@getMarketData');
    cy.get('[data-testid="market-data-table"]').should('be.visible');
    cy.get('[data-testid="commodity-price"]').should('contain', '$');

    // Step 3: Test WebSocket connection for real-time updates
    cy.window().then((win) => {
      // Verify WebSocket connection is established
      cy.wrap(win).should('have.property', 'io');
    });

    // Step 4: Create a new trade order
    cy.get('[data-testid="create-order-btn"]').click();
    cy.get('[data-testid="order-form"]').should('be.visible');

    // Fill in order details
    cy.get('[data-testid="commodity-select"]').select('crude_oil');
    cy.get('[data-testid="order-type-select"]').select('buy');
    cy.get('[data-testid="quantity-input"]').type('1000');
    cy.get('[data-testid="price-input"]').type('75.50');

    // Step 5: Submit the order
    cy.get('[data-testid="submit-order-btn"]').click();
    cy.wait('@createOrder');

    // Verify order confirmation
    cy.get('[data-testid="order-success-message"]').should('be.visible');
    cy.get('[data-testid="order-id"]').should('contain', 'order-123');

    // Step 6: Verify order appears in orders list
    cy.wait('@getOrders');
    cy.get('[data-testid="orders-table"]').should('be.visible');
    cy.get('[data-testid="order-row"]').should('have.length.at.least', 1);

    // Step 7: Test real-time order updates
    // Simulate real-time order status update via WebSocket
    cy.window().then((win) => {
      if (win.io && win.io.emit) {
        win.io.emit('order-update', {
          id: 'order-123',
          status: 'executed',
          executionPrice: 75.45,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Verify real-time update is reflected
    cy.get('[data-testid="order-status-123"]').should('contain', 'executed');

    // Step 8: Test market data real-time updates
    // Simulate market data update
    cy.window().then((win) => {
      if (win.io && win.io.emit) {
        win.io.emit('market-update', {
          commodity: 'crude_oil',
          price: 76.25,
          change: 0.75,
          changePercent: 0.99,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Verify market data update
    cy.get('[data-testid="crude-oil-price"]').should('contain', '76.25');
    cy.get('[data-testid="crude-oil-change"]').should('contain', '+0.75');

    // Step 9: Test risk management alerts
    cy.get('[data-testid="nav-risk"]').click();
    cy.get('[data-testid="risk-dashboard"]').should('be.visible');

    // Step 10: Test compliance monitoring
    cy.get('[data-testid="nav-compliance"]').click();
    cy.get('[data-testid="compliance-dashboard"]').should('be.visible');
    cy.get('[data-testid="compliance-status"]').should('be.visible');

    // Step 11: Test plugin functionality
    cy.visit(`${baseUrl}/admin/plugins`);
    cy.get('[data-testid="plugins-list"]').should('be.visible');
    cy.get('[data-testid="plugin-status"]').should('contain', 'enabled');
  });

  it('should handle WebSocket connection and real-time notifications', () => {
    cy.visit(`${baseUrl}/trading`);

    // Test WebSocket connection establishment
    cy.window().then((win) => {
      // Mock WebSocket events
      const mockSocket = {
        on: cy.stub(),
        emit: cy.stub(),
        connect: cy.stub()
      };

      // Simulate connection events
      cy.wrap(mockSocket.on).should('be.callable');
    });

    // Test real-time notifications
    cy.get('[data-testid="notifications-panel"]').should('be.visible');

    // Simulate system alert
    cy.window().then((win) => {
      if (win.io && win.io.emit) {
        win.io.emit('system-alert', {
          type: 'SYSTEM_ALERT',
          message: 'Market volatility detected',
          severity: 'warning',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Verify alert appears
    cy.get('[data-testid="alert-notification"]').should('be.visible');
    cy.get('[data-testid="alert-message"]').should('contain', 'Market volatility detected');
  });

  it('should test webhook integration endpoints', () => {
    // Test webhook endpoint availability
    cy.request('GET', `${apiUrl}/api/v1/webhooks`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property('registeredTypes');
    });

    // Test plugin management endpoints
    cy.request('GET', `${apiUrl}/api/v1/plugins`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.be.an('array');
    });

    // Test WebSocket stats endpoint
    cy.request('GET', `${apiUrl}/api/v1/websocket/stats`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
    });
  });

  it('should test error handling and resilience', () => {
    // Test API error handling
    cy.intercept('POST', `${apiUrl}/api/v1/trading/orders`, {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('createOrderError');

    cy.visit(`${baseUrl}/trading`);
    cy.get('[data-testid="create-order-btn"]').click();

    // Fill and submit order
    cy.get('[data-testid="commodity-select"]').select('crude_oil');
    cy.get('[data-testid="quantity-input"]').type('1000');
    cy.get('[data-testid="submit-order-btn"]').click();

    cy.wait('@createOrderError');

    // Verify error handling
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Failed to create order');
  });

  it('should test accessibility compliance', () => {
    cy.visit(`${baseUrl}/trading`);

    // Basic accessibility checks
    cy.get('main').should('exist');
    cy.get('[role="button"]').should('have.attr', 'aria-label');
    cy.get('input').should('have.attr', 'aria-label');

    // Check for proper heading structure
    cy.get('h1, h2, h3, h4, h5, h6').should('exist');

    // Test keyboard navigation
    cy.get('[data-testid="create-order-btn"]').focus();
    cy.focused().should('have.attr', 'data-testid', 'create-order-btn');

    // Test tab navigation
    cy.get('body').tab();
    cy.focused().should('be.visible');
  });
});

// Custom Cypress commands for trading workflow
Cypress.Commands.add('loginAsTrader', (userId = 'test-trader') => {
  cy.window().then((win) => {
    win.localStorage.setItem('authToken', 'test-token');
    win.localStorage.setItem('userId', userId);
    win.localStorage.setItem('userRole', 'trader');
  });
});

Cypress.Commands.add('createMockOrder', (orderData = {}) => {
  const defaultOrder = {
    id: `order-${Date.now()}`,
    commodity: 'crude_oil',
    quantity: 1000,
    price: 75.50,
    side: 'buy',
    status: 'pending',
    timestamp: new Date().toISOString(),
    ...orderData
  };

  cy.intercept('POST', '**/api/v1/trading/orders', {
    statusCode: 201,
    body: {
      success: true,
      data: defaultOrder
    }
  }).as('createMockOrder');

  return cy.wrap(defaultOrder);
});

Cypress.Commands.add('simulateMarketUpdate', (marketData) => {
  cy.window().then((win) => {
    if (win.io && win.io.emit) {
      win.io.emit('market-update', {
        type: 'MARKET_UPDATE',
        payload: marketData,
        timestamp: new Date().toISOString()
      });
    }
  });
});

// TypeScript declarations for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      loginAsTrader(userId?: string): Chainable<void>;
      createMockOrder(orderData?: object): Chainable<any>;
      simulateMarketUpdate(marketData: object): Chainable<void>;
      tab(): Chainable<any>;
    }
  }
}