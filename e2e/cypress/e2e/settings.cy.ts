describe('Settings Page', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/settings')
  })

  it('should load settings page with all sections', () => {
    cy.get('[data-testid="settings-container"]').should('be.visible')
    
    // Verify main settings sections
    cy.get('[data-testid="profile-settings"]').should('be.visible')
    cy.get('[data-testid="notification-settings"]').should('be.visible')
    cy.get('[data-testid="security-settings"]').should('be.visible')
    cy.get('[data-testid="trading-preferences"]').should('be.visible')
  })

  it('should update profile information', () => {
    cy.get('[data-testid="profile-settings"]').within(() => {
      // Update display name
      cy.get('[data-testid="display-name-input"]').clear().type('Updated Name')
      
      // Update email notifications preference
      cy.get('[data-testid="email-notifications-checkbox"]').check()
      
      // Save changes
      cy.get('[data-testid="save-profile-btn"]').click()
    })

    // Verify success message
    cy.get('[data-testid="success-message"]').should('be.visible')
    cy.get('[data-testid="success-message"]').should('contain', 'Profile updated successfully')
  })

  it('should configure notification preferences', () => {
    cy.get('[data-testid="notification-settings"]').within(() => {
      // Enable price alerts
      cy.get('[data-testid="price-alerts-toggle"]').check()
      
      // Set price threshold
      cy.get('[data-testid="price-threshold-input"]').clear().type('5.0')
      
      // Enable SMS notifications
      cy.get('[data-testid="sms-notifications-toggle"]').check()
      
      // Update phone number
      cy.get('[data-testid="phone-number-input"]').clear().type('+1234567890')
      
      // Save notification settings
      cy.get('[data-testid="save-notifications-btn"]').click()
    })

    cy.get('[data-testid="success-message"]').should('contain', 'Notification preferences updated')
  })

  it('should update security settings', () => {
    cy.get('[data-testid="security-settings"]').within(() => {
      // Enable two-factor authentication
      cy.get('[data-testid="2fa-toggle"]').check()
      
      // Set session timeout
      cy.get('[data-testid="session-timeout-select"]').select('30')
      
      // Enable login notifications
      cy.get('[data-testid="login-notifications-toggle"]').check()
      
      // Save security settings
      cy.get('[data-testid="save-security-btn"]').click()
    })

    cy.get('[data-testid="success-message"]').should('contain', 'Security settings updated')
  })

  it('should configure trading preferences', () => {
    cy.get('[data-testid="trading-preferences"]').within(() => {
      // Set default commodity
      cy.get('[data-testid="default-commodity-select"]').select('crude_oil')
      
      // Set risk tolerance
      cy.get('[data-testid="risk-tolerance-slider"]').invoke('val', 7).trigger('change')
      
      // Enable auto-execute trades
      cy.get('[data-testid="auto-execute-toggle"]').check()
      
      // Set position size limits
      cy.get('[data-testid="max-position-size-input"]').clear().type('10000')
      
      // Save trading preferences
      cy.get('[data-testid="save-trading-btn"]').click()
    })

    cy.get('[data-testid="success-message"]').should('contain', 'Trading preferences updated')
  })

  it('should change password', () => {
    cy.get('[data-testid="security-settings"]').within(() => {
      cy.get('[data-testid="change-password-btn"]').click()
    })

    // Fill password change form
    cy.get('[data-testid="current-password-input"]').type('currentPassword123!')
    cy.get('[data-testid="new-password-input"]').type('newPassword123!')
    cy.get('[data-testid="confirm-password-input"]').type('newPassword123!')
    
    cy.get('[data-testid="update-password-btn"]').click()

    cy.get('[data-testid="success-message"]').should('contain', 'Password updated successfully')
  })

  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('PUT', '**/api/v1/user/profile', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('updateProfileError')

    cy.get('[data-testid="profile-settings"]').within(() => {
      cy.get('[data-testid="display-name-input"]').clear().type('Test Name')
      cy.get('[data-testid="save-profile-btn"]').click()
    })

    cy.wait('@updateProfileError')
    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.get('[data-testid="error-message"]').should('contain', 'Failed to update profile')
  })

  it('should validate form inputs', () => {
    cy.get('[data-testid="profile-settings"]').within(() => {
      // Clear required field
      cy.get('[data-testid="display-name-input"]').clear()
      cy.get('[data-testid="save-profile-btn"]').click()
      
      // Should show validation error
      cy.get('[data-testid="display-name-error"]').should('be.visible')
      cy.get('[data-testid="display-name-error"]').should('contain', 'Display name is required')
    })

    cy.get('[data-testid="notification-settings"]').within(() => {
      // Invalid phone number
      cy.get('[data-testid="phone-number-input"]').clear().type('invalid-phone')
      cy.get('[data-testid="save-notifications-btn"]').click()
      
      cy.get('[data-testid="phone-number-error"]').should('be.visible')
      cy.get('[data-testid="phone-number-error"]').should('contain', 'Invalid phone number format')
    })
  })

  it('should be accessible', () => {
    cy.checkAccessibility()
    
    // Test keyboard navigation
    cy.get('[data-testid="display-name-input"]').focus().should('be.focused')
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-testid', 'email-notifications-checkbox')
  })

  it('should work on mobile devices', () => {
    cy.viewport('iphone-x')
    
    // Verify responsive layout
    cy.get('[data-testid="settings-container"]').should('be.visible')
    cy.get('[data-testid="mobile-settings-menu"]').should('be.visible')
    
    // Test mobile navigation
    cy.get('[data-testid="mobile-settings-menu"]').click()
    cy.get('[data-testid="settings-nav-drawer"]').should('be.visible')
  })
})