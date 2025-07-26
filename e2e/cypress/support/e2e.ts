// ***********************************************************
// This file is processed and loaded automatically before
// your test files. This is a great place to put global
// configuration and behavior that modifies Cypress.
// ***********************************************************

import '@cypress/code-coverage/support'
import 'cypress-axe'
import 'cypress-real-events'

// Import commands
import './commands'

// Set up global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test
  console.error('Uncaught exception:', err)
  return false
})

// Set up accessibility testing
beforeEach(() => {
  cy.injectAxe()
})

// Common data for tests
Cypress.env('testUser', {
  username: 'testuser@quantenergx.com',
  password: 'TestPassword123!',
  role: 'trader'
})

Cypress.env('apiUrl', 'http://localhost:3001/api/v1')

// Custom commands for common operations
declare global {
  namespace Cypress {
    interface Chainable {
      login(username?: string, password?: string): Chainable<void>
      logout(): Chainable<void>
      checkAccessibility(): Chainable<void>
      navigateToTradingDashboard(): Chainable<void>
      createMockTrade(tradeData: any): Chainable<void>
    }
  }
}