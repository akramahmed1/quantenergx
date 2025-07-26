describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should redirect to login when not authenticated', () => {
    cy.url().should('include', '/login')
    cy.get('[data-testid="login-form"]').should('be.visible')
  })

  it('should login successfully with valid credentials', () => {
    cy.login()
    cy.url().should('include', '/dashboard')
    cy.get('[data-testid="dashboard-welcome"]').should('be.visible')
  })

  it('should show error with invalid credentials', () => {
    cy.visit('/login')
    cy.get('[data-testid="username-input"]').type('invalid@email.com')
    cy.get('[data-testid="password-input"]').type('wrongpassword')
    cy.get('[data-testid="login-button"]').click()
    
    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials')
    cy.url().should('include', '/login')
  })

  it('should logout successfully', () => {
    cy.login()
    cy.logout()
    cy.url().should('include', '/login')
  })

  it('should handle session expiration', () => {
    cy.login()
    
    // Simulate expired token
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'expired_token')
    })
    
    cy.visit('/dashboard')
    cy.url().should('include', '/login')
    cy.get('[data-testid="session-expired-message"]').should('be.visible')
  })

  it('should be accessible', () => {
    cy.visit('/login')
    cy.checkAccessibility()
  })

  it('should support keyboard navigation', () => {
    cy.visit('/login')
    cy.get('body').tab()
    cy.focused().should('have.attr', 'data-testid', 'username-input')
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-testid', 'password-input')
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-testid', 'login-button')
  })
})