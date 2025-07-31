import { test, expect } from '@playwright/test'

test.describe('Performance and Accessibility Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for performance tests
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'test-token')
      localStorage.setItem('user_id', 'test-user-123')
    })
  })

  test.describe('Performance Testing', () => {
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' })
      
      // Measure Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {}
          
          // First Contentful Paint (FCP)
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry) => {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime
              }
            })
          }).observe({ entryTypes: ['paint'] })
          
          // Largest Contentful Paint (LCP)
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            vitals.lcp = lastEntry.startTime
          }).observe({ entryTypes: ['largest-contentful-paint'] })
          
          // Cumulative Layout Shift (CLS)
          let clsValue = 0
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value
              }
            }
            vitals.cls = clsValue
          }).observe({ entryTypes: ['layout-shift'] })
          
          // First Input Delay (FID) - simulate
          document.addEventListener('click', function measureFID() {
            vitals.fid = performance.now()
            document.removeEventListener('click', measureFID)
            
            setTimeout(() => resolve(vitals), 100)
          }, { once: true })
          
          // Trigger click to measure FID
          setTimeout(() => {
            document.querySelector('[data-testid="dashboard-welcome"]')?.click()
          }, 500)
        })
      })
      
      // Assert Core Web Vitals thresholds
      expect(webVitals.fcp).toBeLessThan(1800) // FCP < 1.8s (good)
      expect(webVitals.lcp).toBeLessThan(2500) // LCP < 2.5s (good)
      expect(webVitals.cls).toBeLessThan(0.1)  // CLS < 0.1 (good)
    })

    test('should load resources efficiently', async ({ page }) => {
      // Monitor network requests
      const requests = []
      page.on('request', request => {
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType()
        })
      })
      
      const responses = []
      page.on('response', response => {
        responses.push({
          url: response.url(),
          status: response.status(),
          size: response.headers()['content-length']
        })
      })
      
      await page.goto('/trading')
      await page.waitForLoadState('networkidle')
      
      // Verify reasonable number of requests
      expect(requests.length).toBeLessThan(50)
      
      // Check for successful responses
      const failedRequests = responses.filter(r => r.status >= 400)
      expect(failedRequests).toHaveLength(0)
      
      // Check for large resources that could be optimized
      const largeResources = responses.filter(r => 
        parseInt(r.size) > 1000000 // > 1MB
      )
      expect(largeResources.length).toBeLessThan(3)
    })

    test('should handle concurrent users efficiently', async ({ browser }) => {
      // Simulate multiple concurrent users
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ])
      
      const pages = await Promise.all(
        contexts.map(context => context.newPage())
      )
      
      // All users navigate to different pages simultaneously
      const navigationPromises = pages.map((page, index) => {
        const routes = ['/dashboard', '/trading', '/market-data', '/risk', '/compliance']
        return page.goto(routes[index])
      })
      
      const startTime = Date.now()
      await Promise.all(navigationPromises)
      const endTime = Date.now()
      
      // Should handle concurrent load efficiently
      expect(endTime - startTime).toBeLessThan(5000)
      
      // Clean up
      await Promise.all(contexts.map(context => context.close()))
    })

    test('should maintain performance with large datasets', async ({ page }) => {
      await page.goto('/market-data')
      
      // Load large dataset
      await page.click('[data-testid="load-all-historical-data"]')
      
      const startTime = Date.now()
      await page.waitForSelector('[data-testid="data-table-loaded"]')
      const loadTime = Date.now() - startTime
      
      // Should load large dataset within reasonable time
      expect(loadTime).toBeLessThan(3000)
      
      // Test scrolling performance with large dataset
      const scrollStartTime = Date.now()
      await page.locator('[data-testid="data-table"]').scroll({ deltaY: 5000 })
      await page.waitForTimeout(100)
      const scrollTime = Date.now() - scrollStartTime
      
      expect(scrollTime).toBeLessThan(500)
    })

    test('should handle memory efficiently during extended use', async ({ page }) => {
      // Simulate extended usage session
      const pages_to_visit = [
        '/dashboard', '/trading', '/market-data', '/risk', 
        '/compliance', '/settings', '/ai-dashboard', '/esg-dashboard'
      ]
      
      for (let cycle = 0; cycle < 3; cycle++) {
        for (const pagePath of pages_to_visit) {
          await page.goto(pagePath)
          await page.waitForLoadState('networkidle')
          
          // Simulate user interaction
          await page.mouse.move(100, 100)
          await page.mouse.click(100, 100)
          await page.waitForTimeout(100)
        }
      }
      
      // Check if page is still responsive after extended use
      const responseTime = await page.evaluate(() => {
        const start = performance.now()
        document.querySelector('[data-testid="main-content"]')?.scrollTop
        return performance.now() - start
      })
      
      expect(responseTime).toBeLessThan(50)
    })

    test('should optimize image loading', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Check for lazy loading implementation
      const images = page.locator('img')
      const imageCount = await images.count()
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i)
        const loading = await img.getAttribute('loading')
        const src = await img.getAttribute('src')
        
        // Images below the fold should be lazy loaded
        if (src && !src.includes('logo')) {
          expect(loading).toBe('lazy')
        }
      }
    })
  })

  test.describe('Accessibility Testing', () => {
    test('should meet WCAG 2.1 AA standards', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Check for proper heading structure
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
        elements.map(el => ({
          tag: el.tagName,
          text: el.textContent,
          level: parseInt(el.tagName.charAt(1))
        }))
      )
      
      // Should have h1
      expect(headings.some(h => h.level === 1)).toBe(true)
      
      // Heading levels should be logical
      let previousLevel = 0
      headings.forEach(heading => {
        expect(heading.level - previousLevel).toBeLessThanOrEqual(1)
        previousLevel = heading.level
      })
    })

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto('/trading')
      
      // Check for ARIA landmarks
      await expect(page.locator('[role="main"]')).toBeVisible()
      await expect(page.locator('[role="navigation"]')).toBeVisible()
      
      // Check for ARIA labels on interactive elements
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i)
        const ariaLabel = await button.getAttribute('aria-label')
        const text = await button.textContent()
        
        // Button should have either aria-label or visible text
        expect(ariaLabel || text?.trim()).toBeTruthy()
      }
      
      // Check form inputs have labels
      const inputs = page.locator('input')
      const inputCount = await inputs.count()
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i)
        const ariaLabel = await input.getAttribute('aria-label')
        const ariaLabelledBy = await input.getAttribute('aria-labelledby')
        const id = await input.getAttribute('id')
        
        // Input should have label association
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).count()
          expect(ariaLabel || ariaLabelledBy || label > 0).toBeTruthy()
        }
      }
    })

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Test Tab navigation
      let focusableElements = []
      let currentElement = await page.locator(':focus').first()
      
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        currentElement = await page.locator(':focus').first()
        const testId = await currentElement.getAttribute('data-testid')
        if (testId) {
          focusableElements.push(testId)
        }
      }
      
      // Should be able to navigate through multiple elements
      expect(focusableElements.length).toBeGreaterThan(3)
      
      // Test Shift+Tab (reverse navigation)
      await page.keyboard.press('Shift+Tab')
      const previousElement = await page.locator(':focus').getAttribute('data-testid')
      expect(focusableElements).toContain(previousElement)
    })

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Check contrast for text elements
      const textElements = await page.$$eval('[data-testid*="text"], p, span, div', elements => 
        elements.map(el => {
          const style = window.getComputedStyle(el)
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
            fontSize: style.fontSize
          }
        })
      )
      
      // Basic contrast check (simplified)
      textElements.forEach(element => {
        expect(element.color).not.toBe(element.backgroundColor)
        expect(element.color).not.toBe('rgba(0, 0, 0, 0)')
      })
    })

    test('should support screen readers', async ({ page }) => {
      await page.goto('/trading')
      
      // Check for screen reader specific content
      const srOnlyElements = page.locator('.sr-only, .visually-hidden')
      const srOnlyCount = await srOnlyElements.count()
      
      // Should have some screen reader only content for context
      expect(srOnlyCount).toBeGreaterThan(0)
      
      // Check for proper table structure for screen readers
      const tables = page.locator('table')
      const tableCount = await tables.count()
      
      for (let i = 0; i < tableCount; i++) {
        const table = tables.nth(i)
        const headers = await table.locator('th').count()
        const caption = await table.locator('caption').count()
        
        // Tables should have headers or caption
        expect(headers > 0 || caption > 0).toBe(true)
      }
    })

    test('should handle focus management in modals', async ({ page }) => {
      await page.goto('/trading')
      
      // Open modal
      await page.click('[data-testid="create-order-btn"]')
      await expect(page.locator('[data-testid="order-modal"]')).toBeVisible()
      
      // Focus should be trapped in modal
      const modalFocusableElements = []
      let currentElement
      
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        currentElement = await page.locator(':focus')
        const testId = await currentElement.getAttribute('data-testid')
        if (testId) {
          modalFocusableElements.push(testId)
        }
      }
      
      // All focused elements should be within the modal
      for (const elementId of modalFocusableElements) {
        const elementInModal = await page.locator(`[data-testid="order-modal"] [data-testid="${elementId}"]`).count()
        expect(elementInModal).toBeGreaterThan(0)
      }
      
      // Close modal with Escape
      await page.keyboard.press('Escape')
      await expect(page.locator('[data-testid="order-modal"]')).not.toBeVisible()
      
      // Focus should return to trigger button
      const focusedElement = await page.locator(':focus').getAttribute('data-testid')
      expect(focusedElement).toBe('create-order-btn')
    })

    test('should support reduced motion preferences', async ({ page }) => {
      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' })
      
      await page.goto('/dashboard')
      
      // Check that animations are disabled or reduced
      const animatedElements = await page.$$eval('[class*="animate"], [class*="transition"]', elements =>
        elements.map(el => window.getComputedStyle(el).animationDuration)
      )
      
      // Should respect reduced motion preference
      animatedElements.forEach(duration => {
        expect(duration === 'none' || duration === '0s').toBe(true)
      })
    })

    test('should provide alternative text for images', async ({ page }) => {
      await page.goto('/dashboard')
      
      const images = page.locator('img')
      const imageCount = await images.count()
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i)
        const alt = await img.getAttribute('alt')
        const role = await img.getAttribute('role')
        
        // Images should have alt text or be marked as decorative
        expect(alt !== null || role === 'presentation').toBe(true)
      }
    })

    test('should handle form validation accessibly', async ({ page }) => {
      await page.goto('/trading')
      
      // Open order form
      await page.click('[data-testid="create-order-btn"]')
      
      // Submit form with errors
      await page.click('[data-testid="submit-order-btn"]')
      
      // Check for accessible error messages
      const errorMessages = page.locator('[role="alert"], .error-message')
      const errorCount = await errorMessages.count()
      expect(errorCount).toBeGreaterThan(0)
      
      // Error messages should be associated with form fields
      const firstError = errorMessages.first()
      const ariaDescribedBy = await page.locator('input[aria-describedby]').count()
      expect(ariaDescribedBy).toBeGreaterThan(0)
    })
  })

  test.describe('Security and Privacy Testing', () => {
    test('should handle XSS prevention', async ({ page }) => {
      await page.goto('/trading')
      
      // Try to inject script via form input
      const maliciousScript = '<script>alert("XSS")</script>'
      
      await page.click('[data-testid="create-order-btn"]')
      await page.fill('[data-testid="order-notes-input"]', maliciousScript)
      await page.click('[data-testid="submit-order-btn"]')
      
      // Script should not execute
      const alertTriggered = await page.evaluate(() => window.alertTriggered)
      expect(alertTriggered).toBeFalsy()
      
      // Content should be escaped
      const notesValue = await page.locator('[data-testid="order-notes-display"]').textContent()
      expect(notesValue).toContain('&lt;script&gt;')
    })

    test('should handle CSRF protection', async ({ page }) => {
      await page.goto('/trading')
      
      // Check for CSRF token in forms
      const forms = page.locator('form')
      const formCount = await forms.count()
      
      if (formCount > 0) {
        const csrfTokens = await page.locator('[name="csrf_token"], [name="_token"]').count()
        expect(csrfTokens).toBeGreaterThan(0)
      }
    })

    test('should not expose sensitive data in client-side', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Check localStorage for sensitive data
      const localStorageKeys = await page.evaluate(() => Object.keys(localStorage))
      
      const sensitivePatterns = ['password', 'secret', 'private_key', 'api_key']
      const exposedSensitiveData = localStorageKeys.filter(key => 
        sensitivePatterns.some(pattern => key.toLowerCase().includes(pattern))
      )
      
      expect(exposedSensitiveData).toHaveLength(0)
      
      // Check for sensitive data in page source
      const pageContent = await page.content()
      const hasSensitiveData = sensitivePatterns.some(pattern => 
        pageContent.toLowerCase().includes(pattern + '=')
      )
      
      expect(hasSensitiveData).toBe(false)
    })
  })
})