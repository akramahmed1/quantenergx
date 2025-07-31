// Custom commands for QuantEnergx E2E tests

Cypress.Commands.add('login', (username?: string, password?: string) => {
  const user = Cypress.env('testUser') || {
    username: 'testuser@quantenergx.com',
    password: 'TestPassword123!'
  }
  const loginUsername = username || user.username
  const loginPassword = password || user.password

  cy.session([loginUsername, loginPassword], () => {
    cy.visit('/login')
    cy.get('[data-testid="username-input"]').type(loginUsername)
    cy.get('[data-testid="password-input"]').type(loginPassword)
    cy.get('[data-testid="login-button"]').click()
    
    // Wait for successful login
    cy.url().should('not.include', '/login')
    cy.get('[data-testid="user-menu"]').should('be.visible')
  })
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/login')
})

Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe()
  cy.checkA11y(null, {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'focus-management': { enabled: true }
    }
  })
})

Cypress.Commands.add('navigateToTradingDashboard', () => {
  cy.get('[data-testid="nav-trading"]').click()
  cy.url().should('include', '/trading')
  cy.get('[data-testid="trading-dashboard"]').should('be.visible')
})

Cypress.Commands.add('createMockTrade', (tradeData) => {
  const defaultTrade = {
    commodity: 'Crude Oil',
    quantity: 1000,
    price: 75.50,
    type: 'buy',
    ...tradeData
  }

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/trades`,
    body: defaultTrade,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('auth_token')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(201)
    return cy.wrap(response.body)
  })
})

// Enhanced custom commands

Cypress.Commands.add('mockApiResponses', () => {
  // Mock common API endpoints
  cy.intercept('GET', '**/api/v1/user/profile', { fixture: 'user-profile.json' }).as('getUserProfile')
  cy.intercept('GET', '**/api/v1/market/data', { fixture: 'market-data.json' }).as('getMarketData')
  cy.intercept('GET', '**/api/v1/trading/orders', { fixture: 'orders.json' }).as('getOrders')
  cy.intercept('GET', '**/api/v1/notifications', { fixture: 'notifications.json' }).as('getNotifications')
})

Cypress.Commands.add('mockWebSocket', () => {
  cy.window().then((win) => {
    // Mock WebSocket for testing real-time features
    win.WebSocket = class MockWebSocket {
      constructor() {
        this.readyState = 1 // OPEN
        setTimeout(() => {
          if (this.onopen) this.onopen()
        }, 100)
      }
      
      send(data) {
        cy.log('WebSocket send:', data)
      }
      
      close() {
        this.readyState = 3 // CLOSED
        if (this.onclose) this.onclose()
      }
    }
  })
})

Cypress.Commands.add('simulateMarketUpdate', (marketData) => {
  cy.window().then((win) => {
    if (win.io && win.io.emit) {
      win.io.emit('market-update', {
        type: 'MARKET_UPDATE',
        payload: marketData,
        timestamp: new Date().toISOString()
      })
    }
  })
})

Cypress.Commands.add('waitForSpinner', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 1000 }).should('exist')
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist')
})

Cypress.Commands.add('takeScreenshot', (name?: string) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const screenshotName = name || `screenshot-${timestamp}`
  cy.screenshot(screenshotName, {
    capture: 'fullPage',
    onAfterScreenshot: ($el, props) => {
      cy.log(`Screenshot saved: ${props.path}`)
    }
  })
})

Cypress.Commands.add('setMobileViewport', (device: 'iphone-x' | 'iphone-se2' | 'samsung-s10' | 'ipad-2' = 'iphone-x') => {
  cy.viewport(device)
  // Wait for responsive layout to apply
  cy.wait(500)
})

Cypress.Commands.add('testPerformance', (pageName: string) => {
  cy.window().then((win) => {
    const startTime = win.performance.now()
    
    // Wait for page to be fully loaded
    cy.get('[data-testid="main-content"]').should('be.visible')
    
    cy.window().then((win) => {
      const endTime = win.performance.now()
      const loadTime = endTime - startTime
      
      cy.log(`${pageName} load time: ${loadTime}ms`)
      
      // Assert reasonable load time
      expect(loadTime).to.be.lessThan(3000)
      
      // Log to external performance tracking
      cy.task('log', {
        page: pageName,
        loadTime: loadTime,
        timestamp: new Date().toISOString()
      })
    })
  })
})

Cypress.Commands.add('loginAsRole', (role: 'admin' | 'trader' | 'viewer' = 'trader') => {
  const credentials = {
    admin: { username: 'admin@quantenergx.com', password: 'AdminPass123!' },
    trader: { username: 'trader@quantenergx.com', password: 'TraderPass123!' },
    viewer: { username: 'viewer@quantenergx.com', password: 'ViewerPass123!' }
  }
  
  cy.login(credentials[role].username, credentials[role].password)
})

Cypress.Commands.add('clearNotifications', () => {
  cy.visit('/notifications')
  cy.get('[data-testid="mark-all-read-btn"]').click({ force: true })
  cy.get('[data-testid="clear-all-btn"]').click({ force: true })
})

Cypress.Commands.add('fillOrderForm', (orderData = {}) => {
  const defaultOrder = {
    commodity: 'crude_oil',
    type: 'buy',
    quantity: '1000',
    price: '75.50',
    ...orderData
  }
  
  cy.get('[data-testid="commodity-select"]').select(defaultOrder.commodity)
  cy.get('[data-testid="order-type-select"]').select(defaultOrder.type)
  cy.get('[data-testid="quantity-input"]').clear().type(defaultOrder.quantity)
  cy.get('[data-testid="price-input"]').clear().type(defaultOrder.price)
})

Cypress.Commands.add('verifyToast', (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  cy.get(`[data-testid="${type}-toast"]`).should('be.visible')
  cy.get(`[data-testid="${type}-toast"]`).should('contain', message)
  cy.get(`[data-testid="${type}-toast"]`).should('not.exist', { timeout: 10000 })
})

Cypress.Commands.add('testKeyboardNavigation', (startElement: string) => {
  cy.get(startElement).focus()
  
  // Test Tab navigation
  for (let i = 0; i < 5; i++) {
    cy.focused().tab()
    cy.focused().should('be.visible')
  }
  
  // Test Shift+Tab (reverse navigation)
  cy.focused().tab({ shift: true })
  cy.focused().should('be.visible')
})

// Type declarations for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(username?: string, password?: string): Chainable<void>
      logout(): Chainable<void>
      checkAccessibility(): Chainable<void>
      navigateToTradingDashboard(): Chainable<void>
      createMockTrade(tradeData?: object): Chainable<any>
      mockApiResponses(): Chainable<void>
      mockWebSocket(): Chainable<void>
      simulateMarketUpdate(marketData: object): Chainable<void>
      waitForSpinner(): Chainable<void>
      takeScreenshot(name?: string): Chainable<void>
      setMobileViewport(device?: 'iphone-x' | 'iphone-se2' | 'samsung-s10' | 'ipad-2'): Chainable<void>
      testPerformance(pageName: string): Chainable<void>
      loginAsRole(role?: 'admin' | 'trader' | 'viewer'): Chainable<void>
      clearNotifications(): Chainable<void>
      fillOrderForm(orderData?: object): Chainable<void>
      verifyToast(message: string, type?: 'success' | 'error' | 'warning' | 'info'): Chainable<void>
      testKeyboardNavigation(startElement: string): Chainable<void>
      tab(options?: { shift?: boolean }): Chainable<any>
    }
  }
}