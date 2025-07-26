// Custom commands for QuantEnergx E2E tests

Cypress.Commands.add('login', (username?: string, password?: string) => {
  const user = Cypress.env('testUser')
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