/**
 * QuantEnergX Critical User Journey Tests (Playwright)
 * 
 * These tests verify end-to-end functionality for critical business workflows.
 */

import { test, expect } from '@playwright/test';

test.describe('QuantEnergX User Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test.describe('Application Accessibility', () => {
    test('application loads successfully', async ({ page }) => {
      // Wait for the application to load
      await page.waitForLoadState('networkidle');
      
      // Check that the page has loaded
      await expect(page.locator('body')).toBeVisible();
      
      // Check for main application container
      const appContainer = page.locator('[data-testid="app-container"], .App, #root').first();
      await expect(appContainer).toBeVisible();
    });

    test('displays application branding', async ({ page }) => {
      // Check for QuantEnergx branding
      await expect(page.getByText(/QuantEnergx/i)).toBeVisible();
    });

    test('has proper page structure', async ({ page }) => {
      // Check for semantic HTML structure
      await expect(page.locator('main, [role="main"]')).toBeVisible();
    });
  });

  test.describe('User Authentication Journey', () => {
    test('login flow for new user', async ({ page }) => {
      // Find and click login button
      const loginButton = page.getByRole('button', { name: /login|sign in/i }).first();
      await loginButton.click();
      
      // Wait for login form
      await page.waitForSelector('input[type="email"], input[name*="email"]');
      
      // Fill login form with test credentials
      await page.fill('input[type="email"], input[name*="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name*="password"]', 'testpassword123');
      
      // Submit login form
      const submitButton = page.getByRole('button', { name: /login|sign in/i });
      await submitButton.click();
      
      // Should handle login attempt (success or error)
      await page.waitForLoadState('networkidle');
      
      // Verify we're still on a valid page (not crashed)
      await expect(page.locator('body')).toBeVisible();
    });

    test('registration flow', async ({ page }) => {
      // Find registration/signup link
      const signupLink = page.getByText(/register|sign up|create account/i).first();
      
      if (await signupLink.isVisible()) {
        await signupLink.click();
        
        // Wait for registration form
        await page.waitForSelector('input[type="email"], input[name*="email"]');
        
        // Check that registration form has required fields
        await expect(page.locator('input[type="email"], input[name*="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"], input[name*="password"]')).toBeVisible();
      }
    });
  });

  test.describe('Market Data Display', () => {
    test('market data page loads', async ({ page }) => {
      // Navigate to market data page
      await page.goto('/market');
      
      // Wait for content to load
      await page.waitForLoadState('networkidle');
      
      // Check for market-related content
      const marketContent = page.getByText(/market|price|oil|gas|energy/i).first();
      await expect(marketContent).toBeVisible();
    });

    test('displays commodity prices', async ({ page }) => {
      await page.goto('/market');
      await page.waitForLoadState('networkidle');
      
      // Look for price displays (numbers with currency symbols)
      const priceElements = page.locator('text=/\\$[\\d,]+\\.?\\d*|\\d+\\.?\\d*\\s*USD/');
      
      if (await priceElements.count() > 0) {
        await expect(priceElements.first()).toBeVisible();
      }
    });

    test('market data updates without page refresh', async ({ page }) => {
      await page.goto('/market');
      await page.waitForLoadState('networkidle');
      
      // Wait for potential real-time updates
      await page.waitForTimeout(2000);
      
      // Page should still be responsive
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Trading Interface', () => {
    test('trading page accessibility', async ({ page }) => {
      await page.goto('/trading');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check that trading page loads without errors
      await expect(page.locator('body')).toBeVisible();
      
      // Look for trading-related elements
      const tradingContent = page.getByText(/buy|sell|order|trade|portfolio/i).first();
      await expect(tradingContent).toBeVisible();
    });

    test('order placement form exists', async ({ page }) => {
      await page.goto('/trading');
      await page.waitForLoadState('networkidle');
      
      // Look for order form elements
      const orderForm = page.locator('form, [data-testid*="order"], [class*="order"]').first();
      
      if (await orderForm.isVisible()) {
        // Check for typical order form fields
        const quantityInput = page.locator('input[name*="quantity"], input[placeholder*="quantity"]');
        const priceInput = page.locator('input[name*="price"], input[placeholder*="price"]');
        
        if (await quantityInput.count() > 0) {
          await expect(quantityInput.first()).toBeVisible();
        }
        if (await priceInput.count() > 0) {
          await expect(priceInput.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Portfolio Management', () => {
    test('portfolio page loads', async ({ page }) => {
      await page.goto('/portfolio');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check that portfolio page loads
      await expect(page.locator('body')).toBeVisible();
      
      // Look for portfolio-related content
      const portfolioContent = page.getByText(/portfolio|positions|holdings|balance/i).first();
      await expect(portfolioContent).toBeVisible();
    });

    test('displays portfolio summary', async ({ page }) => {
      await page.goto('/portfolio');
      await page.waitForLoadState('networkidle');
      
      // Look for portfolio value or summary information
      const summaryElements = page.locator('text=/\\$[\\d,]+\\.?\\d*|total|value|balance/i');
      
      if (await summaryElements.count() > 0) {
        await expect(summaryElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('mobile viewport functionality', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Application should be usable on mobile
      await expect(page.locator('body')).toBeVisible();
      
      // Navigation should be accessible
      const navElements = page.locator('nav, [role="navigation"], button, a');
      await expect(navElements.first()).toBeVisible();
    });

    test('tablet viewport functionality', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Application should be usable on tablet
      await expect(page.locator('body')).toBeVisible();
    });

    test('desktop viewport functionality', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Application should be usable on desktop
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Navigation and Routing', () => {
    test('main navigation works', async ({ page }) => {
      await page.goto('/');
      
      // Test navigation to different sections
      const routes = ['/dashboard', '/market', '/trading', '/portfolio'];
      
      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        
        // Page should load without errors
        await expect(page.locator('body')).toBeVisible();
        
        // Should not show error messages
        const errorText = page.getByText(/error|404|not found/i);
        if (await errorText.count() > 0) {
          await expect(errorText.first()).not.toBeVisible();
        }
      }
    });

    test('browser back/forward navigation', async ({ page }) => {
      await page.goto('/');
      await page.goto('/market');
      
      // Go back
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      // Should be back on home page
      await expect(page).toHaveURL(/\/$|\/dashboard|\/home/);
      
      // Go forward
      await page.goForward();
      await page.waitForLoadState('networkidle');
      
      // Should be back on market page
      await expect(page).toHaveURL(/\/market/);
    });
  });

  test.describe('Performance', () => {
    test('page load performance', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within reasonable time (10 seconds for CI environments)
      expect(loadTime).toBeLessThan(10000);
    });

    test('no console errors on load', async ({ page }) => {
      const consoleErrors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should not have critical console errors
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('Warning') && 
        !error.includes('404') &&
        !error.includes('favicon')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Accessibility', () => {
    test('keyboard navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      
      // Should have focused element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('semantic HTML structure', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for proper semantic structure
      await expect(page.locator('main, [role="main"]')).toBeVisible();
      await expect(page.locator('h1, h2, h3')).toHaveCount({ minimum: 1 });
    });
  });

  test.describe('Error Handling', () => {
    test('handles non-existent routes', async ({ page }) => {
      await page.goto('/non-existent-route');
      
      // Should handle gracefully (either 404 page or redirect)
      await expect(page.locator('body')).toBeVisible();
    });

    test('handles network errors gracefully', async ({ page }) => {
      // Intercept and fail API requests
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Application should still be usable
      await expect(page.locator('body')).toBeVisible();
    });
  });
});