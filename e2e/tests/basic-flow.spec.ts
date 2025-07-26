import { test, expect } from '@playwright/test'

test.describe('QuantEnergx Trading Platform', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load homepage and navigate to login', async ({ page }) => {
    // Check if redirected to login
    await expect(page).toHaveURL(/.*login/)
    
    // Verify login form elements
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="username-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
  })

  test('should login and access dashboard', async ({ page }) => {
    // Navigate to login if not already there
    await page.goto('/login')
    
    // Fill login form
    await page.fill('[data-testid="username-input"]', 'testuser@quantenergx.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    
    // Submit form
    await page.click('[data-testid="login-button"]')
    
    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('[data-testid="dashboard-welcome"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should navigate to trading dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'testuser@quantenergx.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    
    // Navigate to trading
    await page.click('[data-testid="nav-trading"]')
    await expect(page).toHaveURL(/.*trading/)
    await expect(page.locator('[data-testid="trading-dashboard"]')).toBeVisible()
  })

  test('should handle responsive design', async ({ page, browserName }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
  })

  test('should meet performance benchmarks', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const endTime = Date.now()
    const loadTime = endTime - startTime
    
    // Assert page loads within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should handle network failures gracefully', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true)
    
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-button"]')
    
    // Should show network error
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible()
    
    // Restore network
    await page.context().setOffline(false)
  })
})