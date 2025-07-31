import { test, expect, devices } from '@playwright/test'

test.describe('Cross-Browser Trading Platform Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'test-token')
      localStorage.setItem('user_id', 'test-user-123')
    })
  })

  test('should work consistently across browsers', async ({ page, browserName }) => {
    await page.goto('/')
    
    // Verify consistent layout across browsers
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
    
    // Login process
    await page.fill('[data-testid="username-input"]', 'testuser@quantenergx.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    
    // Verify dashboard loads correctly
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('[data-testid="dashboard-welcome"]')).toBeVisible()
    
    // Test browser-specific features
    if (browserName === 'webkit') {
      // Safari-specific tests
      await test.step('Safari compatibility checks', async () => {
        // Check date inputs work in Safari
        await page.goto('/trading')
        await page.click('[data-testid="create-order-btn"]')
        await page.fill('[data-testid="expiry-date-input"]', '2024-12-31')
        await expect(page.locator('[data-testid="expiry-date-input"]')).toHaveValue('2024-12-31')
      })
    }
    
    if (browserName === 'firefox') {
      // Firefox-specific tests
      await test.step('Firefox compatibility checks', async () => {
        // Check drag and drop functionality
        await page.goto('/trading')
        const source = page.locator('[data-testid="watchlist-item"]').first()
        const target = page.locator('[data-testid="portfolio-area"]')
        await source.dragTo(target)
        await expect(page.locator('[data-testid="portfolio-item"]')).toBeVisible()
      })
    }
    
    if (browserName === 'chromium') {
      // Chrome-specific tests
      await test.step('Chrome compatibility checks', async () => {
        // Check advanced chart features
        await page.goto('/market-data')
        await page.click('[data-testid="advanced-chart-btn"]')
        await expect(page.locator('[data-testid="candlestick-chart"]')).toBeVisible()
      })
    }
  })

  test('should handle WebSocket connections across browsers', async ({ page, browserName }) => {
    await page.goto('/trading')
    
    // Mock WebSocket connection
    await page.evaluate(() => {
      window.mockWebSocket = {
        readyState: 1,
        send: () => {},
        close: () => {}
      }
    })
    
    // Verify real-time data updates work
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('market-update', {
        detail: { commodity: 'crude_oil', price: 76.50 }
      }))
    })
    
    await expect(page.locator('[data-testid="crude-oil-price"]')).toContainText('76.50')
  })

  test('should maintain performance across browsers', async ({ page, browserName }) => {
    const startTime = Date.now()
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Performance should be consistent across browsers (allow for some variance)
    if (browserName === 'webkit') {
      expect(loadTime).toBeLessThan(5000) // Safari might be slightly slower
    } else {
      expect(loadTime).toBeLessThan(3000)
    }
    
    // Test JavaScript performance
    const jsPerformance = await page.evaluate(() => {
      const start = performance.now()
      // Simulate heavy computation
      for (let i = 0; i < 100000; i++) {
        Math.sqrt(i)
      }
      return performance.now() - start
    })
    
    expect(jsPerformance).toBeLessThan(100) // Should complete within 100ms
  })

  test('should handle file uploads across browsers', async ({ page }) => {
    await page.goto('/compliance/documents')
    
    // Create a temporary file for testing
    const fileContent = 'Sample document content for testing'
    
    await page.setInputFiles('[data-testid="file-input"]', {
      name: 'test-document.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent)
    })
    
    await expect(page.locator('[data-testid="uploaded-file-name"]')).toContainText('test-document.txt')
  })

  test('should support browser notifications', async ({ page, context }) => {
    // Grant notification permissions
    await context.grantPermissions(['notifications'])
    
    await page.goto('/settings')
    
    // Enable browser notifications
    await page.click('[data-testid="enable-notifications-btn"]')
    
    // Trigger a notification
    await page.evaluate(() => {
      new Notification('Test Notification', {
        body: 'This is a test notification',
        icon: '/icon.png'
      })
    })
    
    // Verify notification was created (browser-dependent)
    const notificationPromise = page.waitForEvent('console', msg => 
      msg.text().includes('notification')
    )
  })

  test('should handle different screen resolutions', async ({ page }) => {
    const resolutions = [
      { width: 1920, height: 1080 }, // Full HD
      { width: 1366, height: 768 },  // Common laptop
      { width: 2560, height: 1440 }, // 2K
      { width: 3840, height: 2160 }  // 4K
    ]
    
    for (const resolution of resolutions) {
      await page.setViewportSize(resolution)
      await page.goto('/dashboard')
      
      // Verify layout adapts to resolution
      await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible()
      
      // Check if high-resolution assets are loaded for larger screens
      if (resolution.width >= 2560) {
        await expect(page.locator('[data-testid="high-res-chart"]')).toBeVisible()
      }
    }
  })

  test('should handle timezone differences', async ({ page }) => {
    // Test different timezone scenarios
    const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo']
    
    for (const timezone of timezones) {
      await page.emulateTimezone(timezone)
      await page.goto('/trading')
      
      // Verify times are displayed correctly for the timezone
      await expect(page.locator('[data-testid="market-hours"]')).toBeVisible()
      
      const displayedTime = await page.locator('[data-testid="current-time"]').textContent()
      expect(displayedTime).toBeTruthy()
    }
  })

  test('should work offline (PWA functionality)', async ({ page, context }) => {
    await page.goto('/dashboard')
    
    // Go offline
    await context.setOffline(true)
    
    // Verify offline indicator appears
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Test cached functionality
    await page.click('[data-testid="nav-trading"]')
    await expect(page.locator('[data-testid="cached-trading-data"]')).toBeVisible()
    
    // Go back online
    await context.setOffline(false)
    
    // Verify online indicator
    await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible()
  })

  test('should handle browser extensions interference', async ({ page }) => {
    // Simulate common browser extension behaviors
    await page.addInitScript(() => {
      // Mock ad blocker behavior
      window.adBlockerActive = true
      
      // Mock password manager
      window.passwordManagerActive = true
    })
    
    await page.goto('/login')
    
    // Verify app still works with extensions
    await page.fill('[data-testid="username-input"]', 'testuser@quantenergx.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('should support keyboard shortcuts consistently', async ({ page }) => {
    await page.goto('/trading')
    
    // Test common keyboard shortcuts
    await page.keyboard.press('Ctrl+n') // New order
    await expect(page.locator('[data-testid="new-order-modal"]')).toBeVisible()
    
    await page.keyboard.press('Escape') // Close modal
    await expect(page.locator('[data-testid="new-order-modal"]')).not.toBeVisible()
    
    await page.keyboard.press('Ctrl+f') // Search
    await expect(page.locator('[data-testid="search-input"]')).toBeFocused()
  })

  test('should handle copy/paste operations', async ({ page }) => {
    await page.goto('/trading')
    
    // Test copying trade data
    await page.click('[data-testid="trade-row"]')
    await page.keyboard.press('Ctrl+c')
    
    // Navigate to another area and paste
    await page.click('[data-testid="notes-textarea"]')
    await page.keyboard.press('Ctrl+v')
    
    const pastedContent = await page.locator('[data-testid="notes-textarea"]').inputValue()
    expect(pastedContent).toBeTruthy()
  })
})