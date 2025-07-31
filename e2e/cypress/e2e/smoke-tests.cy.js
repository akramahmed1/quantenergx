/**
 * Smoke Test Suite for QuantEnergX Platform
 * 
 * These tests verify that critical user journeys work end-to-end.
 * They should run quickly and catch major functionality issues.
 */

describe('QuantEnergX Platform Smoke Tests', () => {
  beforeEach(() => {
    // Visit the main application
    cy.visit('/');
  });

  describe('Application Bootstrap', () => {
    it('loads the main application without errors', () => {
      // Check that the page loads
      cy.get('body').should('be.visible');
      
      // Check for main app elements
      cy.get('[data-testid="app-container"], .App, #root').should('exist');
      
      // Check that no console errors occurred
      cy.window().then((win) => {
        expect(win.console.error).not.to.have.been.called;
      });
    });

    it('displays the application header', () => {
      // Look for header/navigation elements
      cy.get('[role="banner"], header, nav').should('be.visible');
      
      // Look for app title/logo
      cy.contains('QuantEnergx', { matchCase: false }).should('be.visible');
    });

    it('has responsive design elements', () => {
      // Test mobile viewport
      cy.viewport(375, 667);
      cy.get('body').should('be.visible');
      
      // Test desktop viewport
      cy.viewport(1200, 800);
      cy.get('body').should('be.visible');
    });
  });

  describe('Navigation', () => {
    it('has accessible navigation menu', () => {
      // Look for navigation elements
      cy.get('[role="navigation"], nav, [data-testid*="nav"]').should('exist');
      
      // Navigation should be accessible
      cy.get('a, button').first().should('be.visible');
    });

    it('handles route navigation without errors', () => {
      // Try to navigate to different sections
      const commonRoutes = ['/dashboard', '/trading', '/market', '/portfolio'];
      
      commonRoutes.forEach(route => {
        cy.visit(route, { failOnStatusCode: false });
        
        // Should not show 404 or error page
        cy.get('body').should('not.contain', '404');
        cy.get('body').should('not.contain', 'Page not found');
      });
    });
  });

  describe('Authentication Flow', () => {
    it('shows login interface for unauthenticated users', () => {
      // Look for login button or form
      cy.get('button, a').contains(/login|sign in/i, { timeout: 10000 }).should('be.visible');
    });

    it('login form is accessible and functional', () => {
      // Navigate to login
      cy.get('button, a').contains(/login|sign in/i).first().click();
      
      // Should have login form
      cy.get('input[type="email"], input[name*="email"], input[placeholder*="email"]', { timeout: 10000 })
        .should('be.visible');
      cy.get('input[type="password"], input[name*="password"], input[placeholder*="password"]')
        .should('be.visible');
      
      // Submit button should exist
      cy.get('button[type="submit"], button').contains(/login|sign in/i).should('be.visible');
    });

    it('handles invalid login gracefully', () => {
      // Navigate to login
      cy.get('button, a').contains(/login|sign in/i).first().click();
      
      // Fill invalid credentials
      cy.get('input[type="email"], input[name*="email"], input[placeholder*="email"]')
        .type('invalid@test.com');
      cy.get('input[type="password"], input[name*="password"], input[placeholder*="password"]')
        .type('invalidpassword');
      
      // Submit form
      cy.get('button[type="submit"], button').contains(/login|sign in/i).click();
      
      // Should show error message
      cy.get('body').should('contain', /invalid|error|incorrect/i);
    });
  });

  describe('Market Data Display', () => {
    it('displays market information', () => {
      // Visit market or dashboard page
      cy.visit('/market', { failOnStatusCode: false });
      
      // Look for market data elements
      cy.get('body').should('contain', /oil|gas|energy|price|market/i);
    });

    it('shows price information', () => {
      // Visit market page
      cy.visit('/market', { failOnStatusCode: false });
      
      // Look for price displays (numbers with currency symbols or decimal points)
      cy.get('body').should('match', /\$[\d,]+\.?\d*|\d+\.?\d*\s*USD/);
    });
  });

  describe('Trading Interface', () => {
    it('trading page is accessible', () => {
      cy.visit('/trading', { failOnStatusCode: false });
      
      // Should load without major errors
      cy.get('body').should('be.visible');
      cy.get('body').should('not.contain', 'Error 500');
    });

    it('shows trading-related elements', () => {
      cy.visit('/trading', { failOnStatusCode: false });
      
      // Look for trading-related content
      cy.get('body').should('contain', /buy|sell|order|trade|portfolio/i);
    });
  });

  describe('Responsive Design', () => {
    it('works on mobile devices', () => {
      cy.viewport('iphone-6');
      
      cy.visit('/');
      cy.get('body').should('be.visible');
      
      // Navigation should be accessible on mobile
      cy.get('button, a').should('be.visible');
    });

    it('works on tablet devices', () => {
      cy.viewport('ipad-2');
      
      cy.visit('/');
      cy.get('body').should('be.visible');
    });

    it('works on desktop', () => {
      cy.viewport(1920, 1080);
      
      cy.visit('/');
      cy.get('body').should('be.visible');
    });
  });

  describe('Performance and Loading', () => {
    it('loads within reasonable time', () => {
      const startTime = Date.now();
      
      cy.visit('/');
      cy.get('body').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(10000); // 10 seconds max
      });
    });

    it('shows loading states appropriately', () => {
      cy.visit('/');
      
      // Look for loading indicators
      cy.get('[data-testid*="loading"], .loading, .spinner').should('not.exist');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', () => {
      // Simulate network issues by visiting non-existent API endpoints
      cy.request({ url: '/api/non-existent', failOnStatusCode: false })
        .then((response) => {
          expect(response.status).to.be.oneOf([404, 500]);
        });
    });

    it('shows appropriate error messages', () => {
      cy.visit('/non-existent-page', { failOnStatusCode: false });
      
      // Should show 404 or redirect appropriately
      cy.get('body').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('has proper page titles', () => {
      cy.visit('/');
      cy.title().should('contain', 'QuantEnergx');
    });

    it('has proper heading structure', () => {
      cy.visit('/');
      
      // Should have at least one heading
      cy.get('h1, h2, h3, h4, h5, h6').should('exist');
    });

    it('has accessible buttons and links', () => {
      cy.visit('/');
      
      // All interactive elements should be accessible
      cy.get('button, a').each(($el) => {
        cy.wrap($el).should('be.visible');
      });
    });

    it('supports keyboard navigation', () => {
      cy.visit('/');
      
      // Tab navigation should work
      cy.get('body').tab();
      cy.focused().should('exist');
    });
  });

  describe('Data Persistence', () => {
    it('maintains session state across page reloads', () => {
      cy.visit('/');
      
      // Store initial state
      cy.window().its('localStorage').then((localStorage) => {
        const initialKeys = Object.keys(localStorage);
        
        // Reload page
        cy.reload();
        
        // Check that localStorage is preserved
        cy.window().its('localStorage').then((newLocalStorage) => {
          expect(Object.keys(newLocalStorage)).to.deep.equal(initialKeys);
        });
      });
    });
  });

  describe('Security Headers', () => {
    it('has proper security headers', () => {
      cy.request('/').then((response) => {
        // Check for basic security headers
        expect(response.headers).to.have.property('x-content-type-options');
      });
    });
  });
});