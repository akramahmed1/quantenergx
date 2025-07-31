describe('Notifications System', () => {
  beforeEach(() => {
    cy.login()
    
    // Mock notifications API
    cy.intercept('GET', '**/api/v1/notifications', {
      fixture: 'notifications.json'
    }).as('getNotifications')
    
    cy.intercept('POST', '**/api/v1/notifications/mark-read', {
      statusCode: 200,
      body: { success: true }
    }).as('markAsRead')
    
    cy.intercept('DELETE', '**/api/v1/notifications/*', {
      statusCode: 200,
      body: { success: true }
    }).as('deleteNotification')
  })

  it('should display notifications panel', () => {
    cy.visit('/dashboard')
    
    // Click notifications bell icon
    cy.get('[data-testid="notifications-bell"]').click()
    cy.get('[data-testid="notifications-panel"]').should('be.visible')
    
    cy.wait('@getNotifications')
    
    // Verify notifications are displayed
    cy.get('[data-testid="notification-item"]').should('have.length.greaterThan', 0)
    cy.get('[data-testid="notification-count"]').should('be.visible')
  })

  it('should categorize notifications by type', () => {
    cy.visit('/notifications')
    cy.wait('@getNotifications')
    
    // Verify notification categories
    cy.get('[data-testid="trade-notifications"]').should('be.visible')
    cy.get('[data-testid="price-alert-notifications"]').should('be.visible')
    cy.get('[data-testid="system-notifications"]').should('be.visible')
    cy.get('[data-testid="security-notifications"]').should('be.visible')
    
    // Filter by trade notifications
    cy.get('[data-testid="filter-trades"]').click()
    cy.get('[data-testid="notification-item"]').each(($el) => {
      cy.wrap($el).should('have.attr', 'data-notification-type', 'trade')
    })
  })

  it('should mark notifications as read', () => {
    cy.visit('/notifications')
    cy.wait('@getNotifications')
    
    // Mark single notification as read
    cy.get('[data-testid="notification-item"]').first().within(() => {
      cy.get('[data-testid="mark-read-btn"]').click()
    })
    
    cy.wait('@markAsRead')
    
    // Verify notification is marked as read
    cy.get('[data-testid="notification-item"]').first()
      .should('have.class', 'read')
    
    // Mark all as read
    cy.get('[data-testid="mark-all-read-btn"]').click()
    cy.get('[data-testid="notification-item"]').each(($el) => {
      cy.wrap($el).should('have.class', 'read')
    })
  })

  it('should delete notifications', () => {
    cy.visit('/notifications')
    cy.wait('@getNotifications')
    
    // Delete single notification
    cy.get('[data-testid="notification-item"]').first().within(() => {
      cy.get('[data-testid="delete-notification-btn"]').click()
    })
    
    // Confirm deletion
    cy.get('[data-testid="confirm-delete-btn"]').click()
    cy.wait('@deleteNotification')
    
    // Verify notification is removed
    cy.get('[data-testid="success-message"]').should('contain', 'Notification deleted')
  })

  it('should display real-time notifications', () => {
    cy.visit('/dashboard')
    
    // Simulate real-time notification via WebSocket
    cy.window().then((win) => {
      if (win.io && win.io.emit) {
        win.io.emit('notification', {
          id: 'real-time-notif-1',
          type: 'price-alert',
          title: 'Price Alert',
          message: 'Crude oil price crossed $80/barrel',
          timestamp: new Date().toISOString(),
          priority: 'high'
        })
      }
    })
    
    // Verify real-time notification appears
    cy.get('[data-testid="toast-notification"]').should('be.visible')
    cy.get('[data-testid="toast-notification"]').should('contain', 'Price Alert')
    cy.get('[data-testid="notifications-count"]').should('contain', '1')
  })

  it('should handle notification preferences', () => {
    cy.visit('/settings')
    
    cy.get('[data-testid="notification-settings"]').within(() => {
      // Enable desktop notifications
      cy.get('[data-testid="desktop-notifications-toggle"]').check()
      
      // Set notification sound
      cy.get('[data-testid="notification-sound-select"]').select('chime')
      
      // Configure price alert thresholds
      cy.get('[data-testid="price-alert-threshold"]').clear().type('5')
      
      // Enable email notifications for trades
      cy.get('[data-testid="email-trade-notifications"]').check()
      
      cy.get('[data-testid="save-notifications-btn"]').click()
    })
    
    cy.get('[data-testid="success-message"]').should('contain', 'Notification preferences updated')
  })

  it('should filter and search notifications', () => {
    cy.visit('/notifications')
    cy.wait('@getNotifications')
    
    // Search notifications
    cy.get('[data-testid="notification-search"]').type('trade')
    cy.get('[data-testid="notification-item"]').each(($el) => {
      cy.wrap($el).should('contain.text', 'trade')
    })
    
    // Clear search
    cy.get('[data-testid="clear-search-btn"]').click()
    cy.get('[data-testid="notification-search"]').should('have.value', '')
    
    // Filter by date range
    cy.get('[data-testid="date-filter-from"]').type('2024-01-01')
    cy.get('[data-testid="date-filter-to"]').type('2024-12-31')
    cy.get('[data-testid="apply-date-filter-btn"]').click()
    
    // Filter by priority
    cy.get('[data-testid="priority-filter"]').select('high')
    cy.get('[data-testid="notification-item"]').each(($el) => {
      cy.wrap($el).should('have.attr', 'data-priority', 'high')
    })
  })

  it('should display notification details', () => {
    cy.visit('/notifications')
    cy.wait('@getNotifications')
    
    // Click on notification to view details
    cy.get('[data-testid="notification-item"]').first().click()
    
    cy.get('[data-testid="notification-detail-modal"]').should('be.visible')
    cy.get('[data-testid="notification-title"]').should('be.visible')
    cy.get('[data-testid="notification-message"]').should('be.visible')
    cy.get('[data-testid="notification-timestamp"]').should('be.visible')
    cy.get('[data-testid="notification-actions"]').should('be.visible')
    
    // Close modal
    cy.get('[data-testid="close-modal-btn"]').click()
    cy.get('[data-testid="notification-detail-modal"]').should('not.be.visible')
  })

  it('should handle notification actions', () => {
    cy.visit('/notifications')
    cy.wait('@getNotifications')
    
    // Test trade notification action
    cy.get('[data-testid="notification-item"][data-notification-type="trade"]').first().within(() => {
      cy.get('[data-testid="view-trade-btn"]').click()
    })
    
    // Should navigate to trade details
    cy.url().should('include', '/trading/')
    
    // Go back to notifications
    cy.visit('/notifications')
    
    // Test price alert action
    cy.get('[data-testid="notification-item"][data-notification-type="price-alert"]').first().within(() => {
      cy.get('[data-testid="view-market-btn"]').click()
    })
    
    // Should navigate to market data
    cy.url().should('include', '/market-data')
  })

  it('should handle permission requests for browser notifications', () => {
    cy.visit('/settings')
    
    // Mock notification permission request
    cy.window().then((win) => {
      // Override Notification.requestPermission
      cy.stub(win.Notification, 'requestPermission').resolves('granted')
    })
    
    cy.get('[data-testid="enable-browser-notifications-btn"]').click()
    
    cy.get('[data-testid="success-message"]').should('contain', 'Browser notifications enabled')
  })

  it('should be accessible', () => {
    cy.visit('/notifications')
    cy.wait('@getNotifications')
    
    cy.checkAccessibility()
    
    // Test keyboard navigation
    cy.get('[data-testid="notification-item"]').first().focus().should('be.focused')
    cy.focused().type('{enter}')
    cy.get('[data-testid="notification-detail-modal"]').should('be.visible')
    
    // Test escape key to close modal
    cy.focused().type('{esc}')
    cy.get('[data-testid="notification-detail-modal"]').should('not.be.visible')
  })

  it('should work on mobile devices', () => {
    cy.viewport('iphone-x')
    cy.visit('/notifications')
    cy.wait('@getNotifications')
    
    // Verify mobile layout
    cy.get('[data-testid="mobile-notifications-container"]').should('be.visible')
    
    // Test swipe to delete (simulate touch events)
    cy.get('[data-testid="notification-item"]').first()
      .trigger('touchstart', { clientX: 0 })
      .trigger('touchmove', { clientX: -100 })
      .trigger('touchend')
    
    cy.get('[data-testid="swipe-delete-action"]').should('be.visible')
  })
})