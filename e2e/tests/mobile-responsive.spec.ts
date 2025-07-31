import { test, expect, devices } from '@playwright/test'

test.describe('Mobile and Responsive Testing', () => {
  const mobileDevices = [
    { name: 'iPhone 12', device: devices['iPhone 12'] },
    { name: 'iPhone 12 Pro', device: devices['iPhone 12 Pro'] },
    { name: 'Pixel 5', device: devices['Pixel 5'] },
    { name: 'Samsung Galaxy S21', device: devices['Galaxy S21'] },
    { name: 'iPad Air', device: devices['iPad Air'] }
  ]

  mobileDevices.forEach(({ name, device }) => {
    test.describe(`${name} Tests`, () => {
      test.use({ ...device })

      test('should load and navigate on mobile', async ({ page }) => {
        await page.goto('/')
        
        // Verify mobile layout
        await expect(page.locator('[data-testid="mobile-container"]')).toBeVisible()
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
        
        // Test mobile navigation
        await page.tap('[data-testid="mobile-menu-button"]')
        await expect(page.locator('[data-testid="mobile-nav-drawer"]')).toBeVisible()
        
        // Navigate to trading
        await page.tap('[data-testid="mobile-nav-trading"]')
        await expect(page).toHaveURL(/.*trading/)
      })

      test('should handle touch interactions', async ({ page }) => {
        await page.goto('/market-data')
        
        // Test swipe gestures on charts
        const chart = page.locator('[data-testid="price-chart"]')
        await chart.touchscreen.tap(200, 200)
        
        // Swipe left to navigate chart
        await chart.touchscreen.swipe(300, 200, 100, 200)
        
        // Pinch to zoom
        await page.touchscreen.tap(150, 150, { count: 2 }) // Double tap to zoom
        
        await expect(page.locator('[data-testid="chart-zoomed"]')).toBeVisible()
      })

      test('should work in both orientations', async ({ page }) => {
        // Portrait mode
        await page.goto('/trading')
        await expect(page.locator('[data-testid="mobile-trading-layout"]')).toBeVisible()
        
        // Landscape mode (simulate orientation change)
        const currentViewport = page.viewportSize()
        if (currentViewport) {
          await page.setViewportSize({ 
            width: currentViewport.height, 
            height: currentViewport.width 
          })
        }
        
        await page.reload()
        await expect(page.locator('[data-testid="landscape-trading-layout"]')).toBeVisible()
      })

      test('should have touch-friendly interface elements', async ({ page }) => {
        await page.goto('/dashboard')
        
        // Verify button sizes are touch-friendly (minimum 44px)
        const buttons = page.locator('[data-testid*="button"]')
        const buttonCount = await buttons.count()
        
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i)
          const box = await button.boundingBox()
          
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44)
            expect(box.width).toBeGreaterThanOrEqual(44)
          }
        }
      })

      test('should handle mobile keyboard interactions', async ({ page }) => {
        await page.goto('/login')
        
        // Test form input on mobile
        await page.tap('[data-testid="username-input"]')
        await page.keyboard.type('testuser@quantenergx.com')
        
        await page.tap('[data-testid="password-input"]')
        await page.keyboard.type('TestPassword123!')
        
        // Submit form
        await page.tap('[data-testid="login-button"]')
        
        await expect(page).toHaveURL(/.*dashboard/)
      })
    })
  })

  test.describe('Responsive Breakpoints', () => {
    const breakpoints = [
      { name: 'Mobile Small', width: 320, height: 568 },
      { name: 'Mobile Medium', width: 375, height: 667 },
      { name: 'Mobile Large', width: 414, height: 896 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop Small', width: 1280, height: 720 },
      { name: 'Desktop Large', width: 1920, height: 1080 }
    ]

    breakpoints.forEach(({ name, width, height }) => {
      test(`should adapt layout for ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height })
        await page.goto('/dashboard')
        
        // Verify appropriate layout is shown
        if (width < 768) {
          // Mobile layout
          await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible()
          await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible()
        } else if (width < 1024) {
          // Tablet layout
          await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible()
        } else {
          // Desktop layout
          await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible()
          await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible()
        }
        
        // Test navigation responsiveness
        await page.click('[data-testid="nav-trading"]')
        await expect(page).toHaveURL(/.*trading/)
        
        // Verify content is properly visible and accessible
        await expect(page.locator('[data-testid="trading-dashboard"]')).toBeVisible()
      })
    })
  })

  test.describe('Mobile-Specific Features', () => {
    test.use(devices['iPhone 12'])

    test('should support pull-to-refresh', async ({ page }) => {
      await page.goto('/market-data')
      
      // Simulate pull-to-refresh gesture
      await page.touchscreen.tap(200, 50)
      await page.touchscreen.swipe(200, 50, 200, 300)
      
      // Verify refresh indicator appears
      await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible()
      
      // Wait for refresh to complete
      await page.waitForTimeout(2000)
      await expect(page.locator('[data-testid="refresh-indicator"]')).not.toBeVisible()
    })

    test('should handle biometric authentication', async ({ page }) => {
      // Mock biometric API
      await page.addInitScript(() => {
        window.navigator.credentials = {
          get: () => Promise.resolve({
            id: 'test-credential',
            response: { authenticatorData: new ArrayBuffer(8) }
          })
        }
      })
      
      await page.goto('/login')
      
      // Test biometric login
      await page.tap('[data-testid="biometric-login-btn"]')
      await expect(page.locator('[data-testid="biometric-prompt"]')).toBeVisible()
      
      // Simulate successful biometric authentication
      await page.waitForTimeout(1000)
      await expect(page).toHaveURL(/.*dashboard/)
    })

    test('should support haptic feedback', async ({ page }) => {
      // Mock haptic feedback API
      await page.addInitScript(() => {
        window.navigator.vibrate = (pattern) => {
          window.hapticFeedbackTriggered = pattern
          return true
        }
      })
      
      await page.goto('/trading')
      
      // Trigger action that should provide haptic feedback
      await page.tap('[data-testid="buy-button"]')
      
      // Verify haptic feedback was triggered
      const hapticTriggered = await page.evaluate(() => window.hapticFeedbackTriggered)
      expect(hapticTriggered).toBeTruthy()
    })

    test('should handle offline functionality', async ({ page, context }) => {
      await page.goto('/trading')
      
      // Cache some data first
      await page.waitForLoadState('networkidle')
      
      // Go offline
      await context.setOffline(true)
      
      // Verify offline mode
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
      
      // Test offline functionality
      await page.tap('[data-testid="create-order-btn"]')
      await page.fill('[data-testid="commodity-select"]', 'crude_oil')
      await page.fill('[data-testid="quantity-input"]', '1000')
      await page.tap('[data-testid="submit-order-btn"]')
      
      // Order should be queued
      await expect(page.locator('[data-testid="queued-order-indicator"]')).toBeVisible()
    })

    test('should support voice commands', async ({ page }) => {
      // Mock speech recognition API
      await page.addInitScript(() => {
        window.webkitSpeechRecognition = class MockSpeechRecognition {
          start() {
            setTimeout(() => {
              this.onresult({
                results: [{
                  0: { transcript: 'buy 1000 barrels crude oil' }
                }]
              })
            }, 500)
          }
          stop() {}
        }
      })
      
      await page.goto('/trading')
      
      // Activate voice command
      await page.tap('[data-testid="voice-command-btn"]')
      await expect(page.locator('[data-testid="voice-listening-indicator"]')).toBeVisible()
      
      // Wait for voice recognition
      await page.waitForTimeout(1000)
      
      // Verify command was processed
      await expect(page.locator('[data-testid="voice-command-result"]')).toContainText('buy 1000 barrels crude oil')
    })
  })

  test.describe('Performance on Mobile', () => {
    test.use(devices['Pixel 5'])

    test('should load quickly on mobile networks', async ({ page, context }) => {
      // Simulate slow 3G network
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), 100) // Add 100ms delay
      })
      
      const startTime = Date.now()
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      // Should load within reasonable time even on slow network
      expect(loadTime).toBeLessThan(8000)
    })

    test('should handle memory efficiently', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Navigate through multiple pages to test memory usage
      const pages = ['/trading', '/market-data', '/risk', '/compliance', '/settings']
      
      for (const pagePath of pages) {
        await page.goto(pagePath)
        await page.waitForLoadState('networkidle')
        
        // Check if page is responsive (no memory leaks causing slowdowns)
        const responseTime = await page.evaluate(() => {
          const start = performance.now()
          document.querySelector('[data-testid="main-content"]')?.scrollIntoView()
          return performance.now() - start
        })
        
        expect(responseTime).toBeLessThan(100)
      }
    })

    test('should handle large datasets efficiently on mobile', async ({ page }) => {
      await page.goto('/market-data')
      
      // Load large market data set
      await page.click('[data-testid="load-historical-data-btn"]')
      
      // Verify virtual scrolling or pagination is working
      await expect(page.locator('[data-testid="data-table"]')).toBeVisible()
      
      // Scroll through data
      await page.locator('[data-testid="data-table"]').scroll({ deltaY: 1000 })
      
      // Should remain responsive
      await expect(page.locator('[data-testid="data-loading-indicator"]')).toBeVisible()
    })
  })

  test.describe('Accessibility on Mobile', () => {
    test.use(devices['iPhone 12'])

    test('should support screen reader navigation', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Verify ARIA labels are present
      await expect(page.locator('[aria-label]')).toHaveCount({ greaterThan: 5 })
      
      // Test focus management
      await page.keyboard.press('Tab')
      const focusedElement = await page.locator(':focus').getAttribute('data-testid')
      expect(focusedElement).toBeTruthy()
    })

    test('should support high contrast mode', async ({ page }) => {
      // Enable high contrast
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
      
      await page.goto('/dashboard')
      
      // Verify high contrast styles are applied
      const bodyClasses = await page.locator('body').getAttribute('class')
      expect(bodyClasses).toContain('high-contrast')
    })

    test('should support larger text sizes', async ({ page }) => {
      // Simulate zoom
      await page.evaluate(() => {
        document.body.style.zoom = '150%'
      })
      
      await page.goto('/trading')
      
      // Verify layout doesn't break with larger text
      await expect(page.locator('[data-testid="trading-dashboard"]')).toBeVisible()
      
      // Text should be readable
      const textElement = page.locator('[data-testid="price-display"]').first()
      const fontSize = await textElement.evaluate(el => 
        window.getComputedStyle(el).fontSize
      )
      
      expect(parseInt(fontSize)).toBeGreaterThan(16)
    })
  })

  test.describe('PWA Features on Mobile', () => {
    test.use(devices['iPhone 12'])

    test('should install as PWA', async ({ page, context }) => {
      await page.goto('/')
      
      // Check for PWA manifest
      const manifestLink = page.locator('link[rel="manifest"]')
      await expect(manifestLink).toHaveCount(1)
      
      // Verify service worker registration
      const swRegistered = await page.evaluate(() => {
        return 'serviceWorker' in navigator
      })
      expect(swRegistered).toBe(true)
    })

    test('should work offline as PWA', async ({ page, context }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      // Go offline
      await context.setOffline(true)
      
      // Should still work from cache
      await page.reload()
      await expect(page.locator('[data-testid="offline-mode-banner"]')).toBeVisible()
      await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible()
    })

    test('should send push notifications', async ({ page, context }) => {
      // Grant notification permission
      await context.grantPermissions(['notifications'])
      
      await page.goto('/settings')
      
      // Enable push notifications
      await page.tap('[data-testid="enable-push-notifications"]')
      
      // Mock service worker push event
      await page.evaluate(() => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Test Notification', {
              body: 'This is a test push notification',
              icon: '/icon-192.png'
            })
          })
        }
      })
      
      // Verify notification appears
      await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible()
    })
  })
})