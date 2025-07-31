describe('Mobile Components', () => {
  beforeEach(() => {
    cy.login()
    // Set mobile viewport
    cy.viewport('iphone-x')
  })

  describe('Mobile Integration', () => {
    it('should display mobile-specific navigation', () => {
      cy.visit('/dashboard')
      
      // Verify mobile menu button
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
      cy.get('[data-testid="desktop-navigation"]').should('not.be.visible')
      
      // Open mobile menu
      cy.get('[data-testid="mobile-menu-button"]').click()
      cy.get('[data-testid="mobile-nav-drawer"]').should('be.visible')
      
      // Verify navigation items
      cy.get('[data-testid="mobile-nav-dashboard"]').should('be.visible')
      cy.get('[data-testid="mobile-nav-trading"]').should('be.visible')
      cy.get('[data-testid="mobile-nav-market-data"]').should('be.visible')
      cy.get('[data-testid="mobile-nav-settings"]').should('be.visible')
    })

    it('should navigate between pages using mobile menu', () => {
      cy.visit('/dashboard')
      
      // Open mobile menu and navigate to trading
      cy.get('[data-testid="mobile-menu-button"]').click()
      cy.get('[data-testid="mobile-nav-trading"]').click()
      
      cy.url().should('include', '/trading')
      cy.get('[data-testid="mobile-trading-interface"]').should('be.visible')
    })

    it('should support touch gestures', () => {
      cy.visit('/market-data')
      
      // Test swipe navigation for market data tabs
      cy.get('[data-testid="market-data-tabs"]')
        .trigger('touchstart', { clientX: 300 })
        .trigger('touchmove', { clientX: 100 })
        .trigger('touchend')
      
      // Should navigate to next tab
      cy.get('[data-testid="active-tab"]').should('contain', 'Oil')
      
      // Test pinch to zoom on charts
      cy.get('[data-testid="price-chart"]')
        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }, { clientX: 200, clientY: 200 }] })
        .trigger('touchmove', { touches: [{ clientX: 80, clientY: 80 }, { clientX: 220, clientY: 220 }] })
        .trigger('touchend')
      
      cy.get('[data-testid="chart-zoom-level"]').should('contain', 'Zoomed')
    })
  })

  describe('Biometric Authentication', () => {
    it('should offer biometric login option', () => {
      cy.visit('/login')
      
      // Mock biometric API availability
      cy.window().then((win) => {
        cy.stub(win.navigator.credentials, 'get').resolves({
          id: 'test-credential',
          response: { authenticatorData: new ArrayBuffer(8) }
        })
      })
      
      cy.get('[data-testid="biometric-login-btn"]').should('be.visible')
      cy.get('[data-testid="biometric-login-btn"]').click()
      
      // Should attempt biometric authentication
      cy.get('[data-testid="biometric-prompt"]').should('be.visible')
      cy.get('[data-testid="biometric-status"]').should('contain', 'Please use your fingerprint')
    })

    it('should enable biometric authentication in settings', () => {
      cy.visit('/settings')
      
      cy.get('[data-testid="security-settings"]').within(() => {
        cy.get('[data-testid="enable-biometric-btn"]').click()
      })
      
      // Mock successful biometric enrollment
      cy.window().then((win) => {
        cy.stub(win.navigator.credentials, 'create').resolves({
          id: 'new-credential',
          response: { attestationObject: new ArrayBuffer(8) }
        })
      })
      
      cy.get('[data-testid="biometric-enrollment-modal"]').should('be.visible')
      cy.get('[data-testid="start-enrollment-btn"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Biometric authentication enabled')
    })

    it('should handle biometric authentication errors', () => {
      cy.visit('/login')
      
      // Mock biometric error
      cy.window().then((win) => {
        cy.stub(win.navigator.credentials, 'get').rejects(new Error('Biometric not available'))
      })
      
      cy.get('[data-testid="biometric-login-btn"]').click()
      
      cy.get('[data-testid="error-message"]').should('contain', 'Biometric authentication failed')
      cy.get('[data-testid="fallback-login-form"]').should('be.visible')
    })
  })

  describe('Mobile Settings', () => {
    it('should display mobile-optimized settings interface', () => {
      cy.visit('/settings')
      
      // Verify mobile settings layout
      cy.get('[data-testid="mobile-settings-container"]').should('be.visible')
      cy.get('[data-testid="settings-accordion"]').should('be.visible')
      
      // Test expandable sections
      cy.get('[data-testid="profile-section-header"]').click()
      cy.get('[data-testid="profile-settings-content"]').should('be.visible')
      
      cy.get('[data-testid="notifications-section-header"]').click()
      cy.get('[data-testid="notifications-settings-content"]').should('be.visible')
    })

    it('should configure mobile-specific settings', () => {
      cy.visit('/settings')
      
      cy.get('[data-testid="mobile-settings"]').within(() => {
        // Enable haptic feedback
        cy.get('[data-testid="haptic-feedback-toggle"]').check()
        
        // Set app theme for mobile
        cy.get('[data-testid="mobile-theme-select"]').select('dark')
        
        // Configure gesture sensitivity
        cy.get('[data-testid="gesture-sensitivity-slider"]').invoke('val', 8).trigger('change')
        
        // Enable auto-lock
        cy.get('[data-testid="auto-lock-toggle"]').check()
        cy.get('[data-testid="auto-lock-timeout"]').select('5')
        
        cy.get('[data-testid="save-mobile-settings-btn"]').click()
      })
      
      cy.get('[data-testid="success-message"]').should('contain', 'Mobile settings updated')
    })
  })

  describe('Offline Trading', () => {
    it('should detect offline status', () => {
      cy.visit('/trading')
      
      // Simulate going offline
      cy.window().then((win) => {
        win.navigator.onLine = false
        win.dispatchEvent(new Event('offline'))
      })
      
      cy.get('[data-testid="offline-indicator"]').should('be.visible')
      cy.get('[data-testid="offline-mode-banner"]').should('contain', 'Trading in offline mode')
    })

    it('should cache trading data for offline use', () => {
      cy.visit('/trading')
      
      // Verify data is cached
      cy.window().then((win) => {
        const cache = win.localStorage.getItem('trading_cache')
        expect(cache).to.not.be.null
      })
      
      // Go offline
      cy.window().then((win) => {
        win.navigator.onLine = false
        win.dispatchEvent(new Event('offline'))
      })
      
      // Verify cached data is displayed
      cy.get('[data-testid="cached-market-data"]').should('be.visible')
      cy.get('[data-testid="last-update-timestamp"]').should('be.visible')
    })

    it('should queue trades when offline', () => {
      cy.visit('/trading')
      
      // Go offline
      cy.window().then((win) => {
        win.navigator.onLine = false
        win.dispatchEvent(new Event('offline'))
      })
      
      // Create a trade order
      cy.get('[data-testid="create-order-btn"]').click()
      cy.get('[data-testid="commodity-select"]').select('crude_oil')
      cy.get('[data-testid="quantity-input"]').type('1000')
      cy.get('[data-testid="price-input"]').type('75.50')
      cy.get('[data-testid="submit-order-btn"]').click()
      
      // Verify order is queued
      cy.get('[data-testid="queued-orders-count"]').should('contain', '1')
      cy.get('[data-testid="offline-queue-banner"]').should('contain', 'Order queued for when online')
    })

    it('should sync queued trades when back online', () => {
      cy.visit('/trading')
      
      // Queue an order offline (simulate existing queued order)
      cy.window().then((win) => {
        win.localStorage.setItem('queued_orders', JSON.stringify([{
          id: 'queued-1',
          commodity: 'crude_oil',
          quantity: 1000,
          price: 75.50,
          timestamp: new Date().toISOString()
        }]))
      })
      
      // Go back online
      cy.window().then((win) => {
        win.navigator.onLine = true
        win.dispatchEvent(new Event('online'))
      })
      
      // Mock successful sync
      cy.intercept('POST', '**/api/v1/trading/orders/sync', {
        statusCode: 200,
        body: { success: true, synced: 1 }
      }).as('syncOrders')
      
      cy.wait('@syncOrders')
      cy.get('[data-testid="sync-success-message"]').should('contain', '1 order synced successfully')
    })
  })

  describe('Push Notifications', () => {
    it('should request notification permissions', () => {
      cy.visit('/settings')
      
      // Mock notification permission request
      cy.window().then((win) => {
        cy.stub(win.Notification, 'requestPermission').resolves('granted')
      })
      
      cy.get('[data-testid="enable-push-notifications-btn"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Push notifications enabled')
    })

    it('should configure push notification preferences', () => {
      cy.visit('/settings')
      
      cy.get('[data-testid="push-notification-settings"]').within(() => {
        // Enable price alerts
        cy.get('[data-testid="push-price-alerts-toggle"]').check()
        
        // Enable trade confirmations
        cy.get('[data-testid="push-trade-confirmations-toggle"]').check()
        
        // Set quiet hours
        cy.get('[data-testid="quiet-hours-start"]').type('22:00')
        cy.get('[data-testid="quiet-hours-end"]').type('08:00')
        
        // Select notification sound
        cy.get('[data-testid="notification-sound-select"]').select('trading-bell')
        
        cy.get('[data-testid="save-push-settings-btn"]').click()
      })
      
      cy.get('[data-testid="success-message"]').should('contain', 'Push notification preferences updated')
    })

    it('should display push notifications', () => {
      cy.visit('/dashboard')
      
      // Mock receiving a push notification
      cy.window().then((win) => {
        // Simulate service worker message
        if (win.navigator.serviceWorker) {
          win.navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification('Trade Executed', {
              body: 'Your oil trade for 1000 barrels has been executed',
              icon: '/icons/trade-icon.png',
              badge: '/icons/badge.png',
              data: { tradeId: 'trade-123' }
            })
          })
        }
      })
      
      // Verify notification appears in system
      cy.get('[data-testid="notification-badge"]').should('be.visible')
    })
  })

  describe('Responsive Design', () => {
    it('should adapt to different screen sizes', () => {
      // Test on different mobile viewports
      const viewports = ['iphone-se2', 'iphone-x', 'samsung-s10', 'ipad-2']
      
      viewports.forEach((viewport) => {
        cy.viewport(viewport)
        cy.visit('/dashboard')
        
        // Verify responsive layout
        cy.get('[data-testid="mobile-container"]').should('be.visible')
        cy.get('[data-testid="responsive-grid"]').should('have.css', 'display', 'grid')
        
        // Verify touch-friendly button sizes
        cy.get('[data-testid="action-button"]').should('have.css', 'min-height', '44px')
      })
    })

    it('should handle orientation changes', () => {
      cy.visit('/trading')
      
      // Portrait mode
      cy.viewport(375, 667)
      cy.get('[data-testid="portrait-layout"]').should('be.visible')
      
      // Landscape mode
      cy.viewport(667, 375)
      cy.get('[data-testid="landscape-layout"]').should('be.visible')
      cy.get('[data-testid="expanded-chart-view"]').should('be.visible')
    })
  })

  describe('Mobile Performance', () => {
    it('should load efficiently on mobile', () => {
      const startTime = Date.now()
      
      cy.visit('/dashboard')
      cy.get('[data-testid="dashboard-container"]').should('be.visible')
      
      cy.then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(3000) // Should load within 3 seconds
      })
    })

    it('should lazy load non-critical components', () => {
      cy.visit('/trading')
      
      // Verify main trading interface loads first
      cy.get('[data-testid="trading-dashboard"]').should('be.visible')
      
      // Non-critical components should load later
      cy.get('[data-testid="advanced-analytics"]').should('not.exist')
      
      // Scroll to trigger lazy loading
      cy.scrollTo('bottom')
      cy.get('[data-testid="advanced-analytics"]').should('be.visible')
    })
  })

  describe('Accessibility on Mobile', () => {
    it('should support screen readers', () => {
      cy.visit('/dashboard')
      
      // Verify ARIA labels
      cy.get('[data-testid="mobile-menu-button"]').should('have.attr', 'aria-label', 'Open navigation menu')
      cy.get('[data-testid="trading-widget"]').should('have.attr', 'aria-label', 'Trading dashboard widget')
      
      // Test focus management
      cy.get('[data-testid="mobile-menu-button"]').focus().should('be.focused')
      cy.focused().type('{enter}')
      cy.get('[data-testid="mobile-nav-drawer"]').should('be.visible')
      
      // Focus should move to first nav item
      cy.get('[data-testid="mobile-nav-dashboard"]').should('be.focused')
    })

    it('should support high contrast mode', () => {
      cy.visit('/settings')
      
      // Enable high contrast mode
      cy.get('[data-testid="accessibility-settings"]').within(() => {
        cy.get('[data-testid="high-contrast-toggle"]').check()
        cy.get('[data-testid="save-accessibility-btn"]').click()
      })
      
      // Verify high contrast styles are applied
      cy.get('body').should('have.class', 'high-contrast')
      cy.get('[data-testid="trading-button"]').should('have.css', 'border-width', '2px')
    })
  })
})